"""Generate report files and record the run (status, timing, failure reason, audit).

The data itself comes from services.report_providers behind a replaceable
boundary; this module owns the file writers and the lifecycle of one run:

    QUEUED -> RUNNING -> COMPLETED | FAILED        (CANCELLED while queued or running)
"""
import csv
import io
import json
import logging
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape

from sqlalchemy import update

from database import SessionLocal
from models.reports import (
    IN_PROGRESS_STATUSES, TEMPLATE_APPROVED, TERMINAL_STATUSES, ReportFileFormat, ReportGenerationStatus, ReportHistory,
    ReportTemplate, ScheduledReport,
)
from services.report_audit import log_report_action
from services.report_providers import ReportDataProvider, ReportParameterError  # noqa: F401  (ReportDataProvider re-exported)

logger = logging.getLogger(__name__)

REPORT_DIR = Path(__file__).resolve().parent.parent / "generated_reports"

GENERIC_FAILURE = "Report generation failed. Please try again later."

FILE_SUFFIX = {ReportFileFormat.CSV: "csv", ReportFileFormat.EXCEL: "xlsx", ReportFileFormat.PDF: "pdf"}
MEDIA_TYPES = {
    ReportFileFormat.CSV: "text/csv",
    ReportFileFormat.EXCEL: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ReportFileFormat.PDF: "application/pdf",
}

_PLAIN_NUMBER = re.compile(r"^[+-]?[\d.,]+%?$")


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def load_json(raw: str | None, default):
    """Tolerant JSON loader for the *_json text columns."""
    if not raw:
        return default
    try:
        value = json.loads(raw)
    except (TypeError, ValueError):
        return default
    return value if isinstance(value, type(default)) else default


def _metadata(history: ReportHistory, params: dict) -> list[tuple[str, str]]:
    """What a file records about itself, so it is traceable to its filters."""
    filters = ", ".join(f"{key}={value}" for key, value in sorted(params.items())) or "none"
    return [("Report", history.report_name), ("Generated (UTC)", _utcnow().strftime("%Y-%m-%d %H:%M")),
            ("Filters", filters)]


def neutralise(value) -> str:
    """Stop a cell from being interpreted as a spreadsheet formula (CSV/Excel injection).

    Plain numbers such as "-10.00" or "12.5%" are left alone; anything else that
    starts with a formula character gets a leading apostrophe.
    """
    text = "" if value is None else str(value)
    if text[:1] in ("=", "@", "\t", "\r") or (text[:1] in ("+", "-") and not _PLAIN_NUMBER.match(text)):
        return "'" + text
    return text


def _sections(rows: list[list[str]]) -> list[list[list[str]]]:
    """Split rows on blank lines; each section's first row is its header."""
    sections, current = [], []
    for row in rows:
        if row:
            current.append(row)
        elif current:
            sections.append(current)
            current = []
    if current:
        sections.append(current)
    return sections


# --- writers: (rows, meta) -> bytes ---------------------------------------------------
def _csv_bytes(rows: list[list[str]], meta=None) -> bytes:
    # CSV stays pure data: no metadata block, so it loads cleanly into other tools.
    output = io.StringIO(newline="")
    csv.writer(output).writerows([[neutralise(v) for v in row] for row in rows])
    return output.getvalue().encode("utf-8")


def _xlsx_bytes(rows: list[list[str]], meta=None) -> bytes:
    """A real workbook via openpyxl (already a declared dependency).

    The hand-built package this replaces labelled the worksheet relationship
    "officeDocument" instead of "worksheet", so Microsoft Excel discarded the
    sheet and the report opened empty.
    """
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font, PatternFill

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Report"
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill("solid", fgColor="1F4D45")
    widths: dict[int, int] = {}

    def put(row_number: int, values: list[str], *, header=False, bold=False):
        for column, value in enumerate(values, start=1):
            cell = sheet.cell(row=row_number, column=column)
            cell.value = neutralise(value)
            cell.data_type = "s"                                          # always text, never a formula
            cell.alignment = Alignment(vertical="top", wrap_text=False)
            if header:
                cell.font, cell.fill = header_font, header_fill
            elif bold:
                cell.font = Font(bold=True)
            widths[column] = max(widths.get(column, 0), len(str(value)))

    row_number = 1
    for label, value in meta or []:
        put(row_number, [label, value], bold=False)
        sheet.cell(row=row_number, column=1).font = Font(bold=True)
        row_number += 1
    if meta:
        row_number += 1
    for index, section in enumerate(_sections(rows)):
        if index:
            row_number += 1
        for position, row in enumerate(section):
            put(row_number, row, header=position == 0)
            row_number += 1
    for column, width in widths.items():
        sheet.column_dimensions[sheet.cell(row=1, column=column).column_letter].width = min(max(width + 2, 10), 60)
    buffer = io.BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()


def _pdf_bytes(rows: list[list[str]], meta=None) -> bytes:
    """A formatted PDF: title, metadata, and each section as a styled table."""
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    def clean(value) -> str:
        # The built-in PDF fonts are Latin-1 only; anything else prints as "?".
        text = str(value).encode("latin-1", "replace").decode("latin-1")
        return escape(text)

    sections = _sections(rows)
    widest = max((len(row) for section in sections for row in section), default=1)
    page = landscape(A4) if widest > 6 else A4
    margin = 36
    available = page[0] - 2 * margin
    styles = getSampleStyleSheet()
    cell_style = ParagraphStyle("cell", parent=styles["BodyText"], fontSize=8.5, leading=10.5)
    head_style = ParagraphStyle("head", parent=cell_style, textColor=colors.white, fontName="Helvetica-Bold")
    title = next((value for label, value in (meta or []) if label == "Report"), "Report")

    story = [Paragraph(clean(title), styles["Title"])]
    for label, value in meta or []:
        if label != "Report":
            story.append(Paragraph(f"<b>{clean(label)}:</b> {clean(value)}", styles["Normal"]))
    story.append(Spacer(1, 12))
    for section in sections:
        columns = max(len(row) for row in section)
        padded = [list(row) + [""] * (columns - len(row)) for row in section]
        data = [[Paragraph(clean(v), head_style if r == 0 else cell_style) for v in row] for r, row in enumerate(padded)]
        table = Table(data, colWidths=[available / columns] * columns, repeatRows=1)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1F4D45")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F1F5F4")]),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#C9D3D0")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story += [table, Spacer(1, 14)]
    if not sections:
        story.append(Paragraph("No data.", styles["Normal"]))

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.HexColor("#6B7280"))
        canvas.drawRightString(page[0] - margin, 20, f"Page {doc.page}")
        canvas.drawString(margin, 20, "EDABIP")
        canvas.restoreState()

    buffer = io.BytesIO()
    # pageCompression=0 keeps the text searchable in the raw bytes (tests, grep, audits);
    # report PDFs are small, so the size cost is negligible.
    SimpleDocTemplate(buffer, pagesize=page, leftMargin=margin, rightMargin=margin, topMargin=margin,
                      bottomMargin=40, title=clean(title), pageCompression=0).build(
        story, onFirstPage=footer, onLaterPages=footer)
    return buffer.getvalue()


_WRITERS = {ReportFileFormat.CSV: _csv_bytes, ReportFileFormat.EXCEL: _xlsx_bytes, ReportFileFormat.PDF: _pdf_bytes}


def render_report_file(file_format: ReportFileFormat, rows: list[list[str]], meta=None) -> bytes:
    """Render rows as a CSV / XLSX / PDF file (also used by the history export)."""
    return _WRITERS[file_format](rows, meta)


# --- one run ---------------------------------------------------------------------------
def _is_cancelled(db, history: ReportHistory) -> bool:
    db.refresh(history)             # pick up a cancel committed by the API in another session
    return history.status == ReportGenerationStatus.CANCELLED


def _claim_report(db, history_id: int) -> ReportHistory | None:
    """Atomically claim a queued run without overwriting a concurrent cancellation."""
    claimable = (
        ReportGenerationStatus.QUEUED,
        ReportGenerationStatus.PENDING,
        ReportGenerationStatus.PROCESSING,
    )
    result = db.execute(
        update(ReportHistory)
        .where(ReportHistory.id == history_id, ReportHistory.status.in_(claimable))
        .values(status=ReportGenerationStatus.RUNNING, started_at=_utcnow(), progress_percent=10)
    )
    if result.rowcount != 1:
        db.rollback()
        return None
    db.commit()
    history = db.get(ReportHistory, history_id)
    if history is not None:
        db.refresh(history)
    return history


def _complete_report(db, history: ReportHistory, target: Path, clock: float) -> bool:
    """Commit completion only if cancellation/recovery has not already ended the run."""
    completed_at = _utcnow()
    result = db.execute(
        update(ReportHistory)
        .where(
            ReportHistory.id == history.id,
            ReportHistory.status == ReportGenerationStatus.RUNNING,
        )
        .values(
            file_path=str(target),
            status=ReportGenerationStatus.COMPLETED,
            progress_percent=100,
            completed_at=completed_at,
            duration_seconds=round(time.monotonic() - clock, 3),
            failure_reason=None,
        )
    )
    if result.rowcount != 1:
        db.rollback()
        return False
    db.refresh(history)
    _touch_schedule(db, history)
    log_report_action(
        db, actor_user_id=None, action="report.completed", entity_type="report", entity_id=history.id,
        details={"format": history.file_format.value, "duration_seconds": history.duration_seconds,
                 "trigger": history.trigger_type.value},
    )
    db.commit()
    return True


def generate_report(history_id: int) -> None:
    """Run one queued report. Never raises: it is a BackgroundTask / scheduler worker."""
    db = SessionLocal()
    clock = time.monotonic()
    target: Path | None = None
    try:
        history = _claim_report(db, history_id)
        if history is None:
            return   # unknown, already claimed/finished, or cancelled while it waited

        template = db.get(ReportTemplate, history.template_id) if history.template_id else None
        if template is None or not template.is_active or template.approval_status != TEMPLATE_APPROVED:
            raise ReportParameterError("The report template is no longer available.")
        params = load_json(history.parameters_json, {})
        rows = ReportDataProvider(db).rows(template.category, params)
        if _is_cancelled(db, history):
            return
        history.progress_percent = 60
        db.commit()

        meta = _metadata(history, params) if history.file_format != ReportFileFormat.CSV else None
        REPORT_DIR.mkdir(parents=True, exist_ok=True)
        target = REPORT_DIR / f"report-{history.id}.{FILE_SUFFIX[history.file_format]}"
        target.write_bytes(render_report_file(history.file_format, rows, meta))
        if _is_cancelled(db, history):          # cancelled while the file was being written
            target.unlink(missing_ok=True)
            return

        if not _complete_report(db, history, target, clock):
            target.unlink(missing_ok=True)
    except Exception as exc:  # noqa: BLE001 - every failure must end as a FAILED row, not an exception
        db.rollback()
        if target is not None:
            target.unlink(missing_ok=True)
        _record_failure(db, history_id, exc, clock)
    finally:
        _notify_finished(db, history_id)
        db.close()


def _touch_schedule(db, history: ReportHistory) -> None:
    """Mirror the run's outcome onto its schedule (Last Run Status column)."""
    if history.schedule_id is None:
        return
    schedule = db.get(ScheduledReport, history.schedule_id)
    if schedule is not None:
        schedule.last_run_at = history.completed_at or _utcnow()
        schedule.last_run_status = history.status


def _record_failure(db, history_id: int, exc: Exception, clock: float) -> None:
    safe = isinstance(exc, ReportParameterError)
    # Full detail goes to the logs (and the server-only error_detail column); users
    # only ever see a reason that is safe to show.
    logger.exception("Report %s generation failed", history_id)
    try:
        result = db.execute(
            update(ReportHistory)
            .where(ReportHistory.id == history_id, ReportHistory.status.in_(IN_PROGRESS_STATUSES))
            .values(
                status=ReportGenerationStatus.FAILED,
                completed_at=_utcnow(),
                duration_seconds=round(time.monotonic() - clock, 3),
                failure_reason=str(exc)[:500] if safe else GENERIC_FAILURE,
                error_detail=f"{type(exc).__name__}: {exc}"[:4000],
            )
        )
        if result.rowcount != 1:
            db.rollback()
            return
        history = db.get(ReportHistory, history_id)
        if history is None:
            db.rollback()
            return
        db.refresh(history)
        _touch_schedule(db, history)
        log_report_action(
            db, actor_user_id=None, action="report.failed", entity_type="report", entity_id=history.id,
            details={"reason": history.failure_reason, "error": history.error_detail[:500]},
        )
        db.commit()
    except Exception:  # noqa: BLE001
        db.rollback()
        logger.exception("Could not record the failure of report %s", history_id)


def _notify_finished(db, history_id: int) -> None:
    """Email owner/recipients of a *scheduled* run. Imported lazily; best-effort."""
    try:
        from services.report_notifications import notify_run_finished

        history = db.get(ReportHistory, history_id)
        if history is not None and history.status in TERMINAL_STATUSES:
            notify_run_finished(db, history)
    except Exception:  # noqa: BLE001
        logger.exception("Report %s notification failed", history_id)
