"""Report catalog, generation, scheduling, history, download and dashboard endpoints.

Mounted by main.py at /api/reports. Every route is gated with the RBAC codes
seed.py already creates for this module (no new permission vocabulary):

    reports.view    read templates / schedules / history / dashboards, download
    reports.create  generate, schedule, preview, retry, cancel
    reports.edit    edit / pause / resume schedules, archive / unarchive history
    reports.delete  delete schedules and history rows

Non-admins only ever see and touch their own schedules and history (a row that
belongs to someone else answers 404, never 403, so ids are not enumerable), and
templates can additionally be restricted to named roles (BR-RM-001).

  Catalog
    GET    /templates                       active templates the caller may use (?search=&category=)
    GET    /templates/top                   most-used templates (dashboard)
    GET    /templates/{id}                  one template
    GET    /templates/{id}/preview          first rows of the report, no file written
  Generate / schedule
    POST   /generate                        run now, or create a schedule (scheduled=true)
    GET    /scheduled                       schedules: search, filters, sort, pagination
    GET    /scheduled/{id}                  one schedule
    PATCH  /scheduled/{id}                  edit
    POST   /scheduled/{id}/pause | /resume
    DELETE /scheduled/{id}
  History
    GET    /history                         runs: search, filters, sort, pagination
    GET    /history/export                  the same listing as CSV
    GET    /history/{id}                    one run (use it to poll status / progress)
    POST   /history/{id}/retry | /cancel | /archive | /unarchive
    DELETE /history/{id}
    GET    /download/{id}                   the generated file (audited)
  Dashboard
    GET    /summary                         KPI cards (?range=7d|30d|90d|6m|12m or date_from/date_to)
    GET    /analytics/type-distribution
    GET    /analytics/status-distribution

Generation runs as a FastAPI BackgroundTask (no queue exists in this backend) and
writes into services.report_generator.REPORT_DIR ("generated_reports/",
git-ignored). The stored path is never returned to clients and is re-validated
against REPORT_DIR before a file is served, so /download is the only way out.
Every state change is written to the append-only report_audit_logs table in the
same transaction (services/report_audit.py).

Command-line companions, one per concern:
    seed_reports.py               template catalog (required by /generate)
    services/superstore_etl.py    import the Superstore workbook behind the data
    services/report_scheduler.py  run due schedules (cron, or REPORT_SCHEDULER_ENABLED=true)
    services/report_maintenance.py  stuck-run recovery + retention (cron, nightly)
"""
import json
import logging
import re
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request
from fastapi.responses import FileResponse, Response
from pydantic import ValidationError
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, selectinload

from database import get_db
from models.reports import (
    IN_PROGRESS_STATUSES, TEMPLATE_APPROVED, TERMINAL_STATUSES, ReportFileFormat, ReportFrequency, ReportGenerationStatus,
    ReportHistory, ReportTemplate, ReportTriggerType, ScheduledReport, ScheduledReportStatus,
)
from models.user import User
from schemas.reports import (
    BulkDeleteIn, BulkDeleteOut, CategoryOut, MessageOut, PaginatedResponse, ReportGenerateIn, ReportGenerateOut, ReportHistoryOut, ReportParameters,
    ReportSummaryOut, ReportTemplateOut, ScheduledReportOut, ScheduledReportUpdateIn, SortOrder,
    StatusDistributionOut, TemplatePreviewOut, TopTemplateOut, TypeDistributionOut,
)
from services import report_analytics, report_settings
from services.report_audit import log_report_action
from services.report_generator import (
    FILE_SUFFIX, MEDIA_TYPES, REPORT_DIR, generate_report, load_json, render_report_file,
)
from services.report_maintenance import delete_report_file
from services.report_notifications import notify_schedule_event_task
from services.report_providers import (
    ReportDataProvider, ReportParameterError, supported_parameters, validate_parameters,
)
from services.report_schedule import next_occurrence, resolve_timezone, to_local_iso, to_utc_naive, utc_now
from utils.auth import get_current_user, require_permission

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/reports", tags=["Reports"])

_SEARCH = re.compile(r"^[A-Za-z0-9 ._-]{2,100}$")
_CATEGORY_LABELS = {"kpi": "KPI", "hr": "HR"}
_INVALID_SCHEDULE = "Please select a valid schedule."
_NOT_FOUND = "Requested report could not be found."

view_permission = Depends(require_permission("reports.view"))
create_permission = Depends(require_permission("reports.create"))
edit_permission = Depends(require_permission("reports.edit"))
delete_permission = Depends(require_permission("reports.delete"))


# --- small helpers ----------------------------------------------------------------
def _is_admin(user) -> bool:
    return bool(user.role and user.role.name == "admin")


def _owner_scope(user) -> int | None:
    """None = no restriction (admin); otherwise the only owner id the caller may see."""
    return None if _is_admin(user) else user.id


def _ip(request: Request) -> str | None:
    return request.client.host if request.client else None


def _clean_search(search: str | None) -> str | None:
    if search is None or not search.strip():
        return None
    search = search.strip()
    if search.isdigit() and len(search) <= 10:
        return search                       # a report id: always searchable, even a single digit
    if not _SEARCH.match(search):
        raise HTTPException(
            status_code=422,
            detail="Search must be 2-100 characters: letters, numbers, spaces, hyphen, underscore or period.",
        )
    return search


def _like(term: str) -> str:
    return "%" + term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"


def _matching(enum_cls, term: str) -> list:
    term = term.lower()
    return [member for member in enum_cls if term in member.value.replace("_", " ") or term in member.value]


def _check_dates(date_from: date | None, date_to: date | None) -> None:
    if date_from and date_to and date_from > date_to:
        raise HTTPException(status_code=422, detail="date_from must not be after date_to")


def _day_start(value: date) -> datetime:
    return datetime.combine(value, datetime.min.time())


# --- templates ---------------------------------------------------------------------
def _template_visible(template: ReportTemplate, user) -> bool:
    if _is_admin(user):
        return True
    roles = load_json(template.allowed_roles_json, [])
    return not roles or (user.role is not None and user.role.name in roles)


def _available(template: ReportTemplate) -> bool:
    """Active AND approved: the only templates that can be listed, previewed or run."""
    return bool(template.is_active) and template.approval_status == TEMPLATE_APPROVED


def _template_out(template: ReportTemplate) -> ReportTemplateOut:
    return ReportTemplateOut(
        id=template.id, name=template.name, category=template.category, description=template.description,
        is_active=template.is_active, default_format=template.default_format or ReportFileFormat.CSV,
        default_parameters=load_json(template.default_parameters_json, {}),
        supported_parameters=supported_parameters(template.category),
        is_restricted=bool(load_json(template.allowed_roles_json, [])), version=template.version or 1,
        approval_status=template.approval_status, updated_at=template.updated_at,
    )


def _usable_template(db: Session, template_id: int, user) -> ReportTemplate:
    template = db.get(ReportTemplate, template_id)
    if template is None or not _available(template):
        raise HTTPException(status_code=404, detail="Selected report template is unavailable.")
    if not _template_visible(template, user):
        raise HTTPException(status_code=403, detail="You do not have permission to use this report template.")
    return template


def _effective_parameters(template: ReportTemplate, provided: dict | None) -> dict:
    """Template defaults overlaid with what the caller sent, validated for the category."""
    merged = {**load_json(template.default_parameters_json, {}), **(provided or {})}
    try:
        return validate_parameters(template.category, merged)
    except ReportParameterError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


def _dump_parameters(parameters: ReportParameters | None) -> dict:
    return parameters.model_dump(exclude_none=True, mode="json") if parameters else {}


@router.get("/templates", response_model=list[ReportTemplateOut], dependencies=[view_permission])
def list_templates(
    search: str | None = Query(None, max_length=100), category: str | None = Query(None, max_length=80),
    db: Session = Depends(get_db), current_user=Depends(get_current_user),
):
    term = _clean_search(search)
    query = db.query(ReportTemplate).filter(ReportTemplate.is_active.is_(True),
                                            ReportTemplate.approval_status == TEMPLATE_APPROVED)
    if category:
        query = query.filter(func.lower(ReportTemplate.category) == category.lower())
    if term:
        query = query.filter(or_(ReportTemplate.name.ilike(_like(term), escape="\\"),
                                 ReportTemplate.description.ilike(_like(term), escape="\\"),
                                 ReportTemplate.category.ilike(_like(term), escape="\\")))
    templates = query.order_by(ReportTemplate.name).all()
    return [_template_out(t) for t in templates if _template_visible(t, current_user)]


@router.get("/templates/top", response_model=list[TopTemplateOut], dependencies=[view_permission])
def top_templates(
    range_key: str | None = Query("30d", alias="range", max_length=30), date_from: date | None = None,
    date_to: date | None = None, limit: int = Query(5, ge=1, le=100),
    include_unused: bool = Query(False, description="also list templates not used in the period (View All)"),
    db: Session = Depends(get_db), current_user=Depends(get_current_user),
):
    window = _window(range_key, date_from, date_to)
    unused = None
    if include_unused:
        unused = db.query(ReportTemplate).filter(ReportTemplate.is_active.is_(True),
                                                 ReportTemplate.approval_status == TEMPLATE_APPROVED).all()
    return report_analytics.top_templates(
        db, window, _owner_scope(current_user), limit=limit, include_unused=unused,
        visible=lambda t: _available(t) and _template_visible(t, current_user))


@router.get("/categories", response_model=list[CategoryOut], dependencies=[view_permission])
def list_categories(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Categories the caller can pick in the "All Categories" filter."""
    counts: dict[str, int] = {}
    for template in db.query(ReportTemplate).filter(ReportTemplate.is_active.is_(True),
                                                    ReportTemplate.approval_status == TEMPLATE_APPROVED):
        if _template_visible(template, current_user):
            key = template.category.lower()
            counts[key] = counts.get(key, 0) + 1
    return [CategoryOut(category=c, label=_CATEGORY_LABELS.get(c, c.replace("_", " ").title()), templates=n)
            for c, n in sorted(counts.items())]


@router.get("/templates/{template_id}", response_model=ReportTemplateOut, dependencies=[view_permission])
def get_template(template_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    template = db.get(ReportTemplate, template_id)
    if template is None or not _available(template) or not _template_visible(template, current_user):
        raise HTTPException(status_code=404, detail="Selected report template is unavailable.")
    return _template_out(template)


@router.get("/templates/{template_id}/preview", response_model=TemplatePreviewOut, dependencies=[create_permission])
def preview_template(
    template_id: int, date_from: date | None = None, date_to: date | None = None,
    region: str | None = Query(None, max_length=60), segment: str | None = Query(None, max_length=60),
    product_category: str | None = Query(None, max_length=60), forecast_months: int | None = Query(None, ge=1, le=12),
    db: Session = Depends(get_db), current_user=Depends(get_current_user),
):
    """The first rows of what /generate would produce - nothing is stored or written."""
    template = _usable_template(db, template_id, current_user)
    try:
        given = _dump_parameters(ReportParameters(
            date_from=date_from, date_to=date_to, region=region, segment=segment,
            product_category=product_category, forecast_months=forecast_months))
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors()[0]["msg"]) from exc
    params = _effective_parameters(template, given)
    try:
        rows = ReportDataProvider(db).rows(template.category, params)
    except ReportParameterError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    limit = report_settings.PREVIEW_ROWS + 1          # header + N data rows
    return TemplatePreviewOut(
        template_id=template.id, name=template.name, parameters=params,
        columns=rows[0] if rows else [], rows=rows[1:limit], truncated=len(rows) > limit)


# --- schedule validation ------------------------------------------------------------
def _validate_schedule(frequency, interval_days, next_run_time, tz_name, *, require_future: bool) -> datetime | None:
    if frequency == ReportFrequency.CUSTOM:
        if interval_days is None:
            raise HTTPException(status_code=422, detail=f"{_INVALID_SCHEDULE} A custom schedule needs interval_days.")
    elif interval_days is not None:
        raise HTTPException(status_code=422, detail=f"{_INVALID_SCHEDULE} interval_days only applies to custom schedules.")
    try:
        resolve_timezone(tz_name)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="Please select a valid time zone.") from exc
    if next_run_time is None:
        return None
    run_utc = to_utc_naive(next_run_time, tz_name)
    if require_future and run_utc < utc_now() - timedelta(minutes=1):
        raise HTTPException(status_code=422, detail=f"{_INVALID_SCHEDULE} The run time must be in the future.")
    return run_utc


def _canonical(params: dict) -> str:
    return json.dumps(params, sort_keys=True)


def _assert_no_conflict(db: Session, *, owner_id: int, template_id: int, frequency, interval_days, next_run_utc,
                        file_format, parameters_json: str, exclude_id: int | None = None) -> None:
    query = db.query(ScheduledReport).filter(
        ScheduledReport.owner_id == owner_id, ScheduledReport.template_id == template_id,
        ScheduledReport.frequency == frequency, ScheduledReport.next_run_time == next_run_utc,
        ScheduledReport.file_format == file_format, ScheduledReport.status != ScheduledReportStatus.COMPLETED)
    if exclude_id is not None:
        query = query.filter(ScheduledReport.id != exclude_id)
    for other in query.all():
        if (other.interval_days == interval_days
                and _canonical(load_json(other.parameters_json, {})) == parameters_json):
            raise HTTPException(status_code=409, detail="Report schedule conflicts with an existing job.")


def _default_timezone(user) -> str:
    candidate = getattr(user, "timezone", None) or "UTC"
    try:
        resolve_timezone(candidate)
        return candidate
    except ValueError:
        return "UTC"


def _clean_recipients(recipients) -> list[str]:
    return list(dict.fromkeys(str(r).strip().lower() for r in recipients or []))


# --- generate -----------------------------------------------------------------------
@router.post("/generate", response_model=ReportGenerateOut, dependencies=[create_permission])
def generate(payload: ReportGenerateIn, request: Request, background_tasks: BackgroundTasks,
             db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if payload.template_id is None:
        raise HTTPException(status_code=422, detail="Please select a report template.")
    template = _usable_template(db, payload.template_id, current_user)
    if payload.scheduled and (payload.frequency is None or payload.next_run_time is None):
        raise HTTPException(status_code=422, detail="frequency and next_run_time are required for scheduled reports")
    schedule_only = (payload.frequency, payload.next_run_time, payload.interval_days, payload.timezone)
    if not payload.scheduled and (any(v is not None for v in schedule_only) or payload.recipients):
        raise HTTPException(status_code=422, detail="frequency and next_run_time only apply to scheduled reports")

    given = _dump_parameters(payload.parameters)
    parameters = _effective_parameters(template, given)
    file_format = payload.file_format or template.default_format or ReportFileFormat.CSV

    if payload.scheduled:
        tz_name = (payload.timezone or _default_timezone(current_user)).strip()
        run_utc = _validate_schedule(payload.frequency, payload.interval_days, payload.next_run_time, tz_name,
                                     require_future=True)
        parameters_json = _canonical(parameters)
        _assert_no_conflict(db, owner_id=current_user.id, template_id=template.id, frequency=payload.frequency,
                            interval_days=payload.interval_days, next_run_utc=run_utc, file_format=file_format,
                            parameters_json=parameters_json)
        scheduled = ScheduledReport(
            template_id=template.id, name=payload.report_name, frequency=payload.frequency,
            interval_days=payload.interval_days, file_format=file_format, next_run_time=run_utc,
            timezone=tz_name, recipients_json=json.dumps(_clean_recipients(payload.recipients)),
            parameters_json=parameters_json, owner_id=current_user.id,
        )
        db.add(scheduled)
        db.flush()
        log_report_action(db, actor_user_id=current_user.id, action="schedule.created", entity_type="schedule",
                          entity_id=scheduled.id, ip_address=_ip(request),
                          details={"template_id": template.id, "frequency": payload.frequency.value,
                                   "next_run_time": run_utc.isoformat(), "timezone": tz_name,
                                   "format": file_format.value})
        db.commit()
        db.refresh(scheduled)
        background_tasks.add_task(notify_schedule_event_task, scheduled.id, "created")
        return ReportGenerateOut(
            scheduled_report_id=scheduled.id, status="scheduled", message="Report schedule created",
            next_run_time=scheduled.next_run_time, next_run_time_local=to_local_iso(scheduled.next_run_time, tz_name))

    history = ReportHistory(
        template_id=template.id, report_name=payload.report_name or template.name, generated_by=current_user.id,
        status=ReportGenerationStatus.QUEUED, file_format=file_format, parameters_json=_canonical(parameters),
        trigger_type=ReportTriggerType.AD_HOC if given else ReportTriggerType.ON_DEMAND,
    )
    db.add(history)
    db.flush()
    log_report_action(db, actor_user_id=current_user.id, action="report.requested", entity_type="report",
                      entity_id=history.id, ip_address=_ip(request),
                      details={"template_id": template.id, "format": file_format.value, "parameters": parameters})
    db.commit()
    db.refresh(history)
    background_tasks.add_task(generate_report, history.id)
    # "processing" is the umbrella status the UI shows from now until it completes;
    # GET /history/{id} reports the exact stage (queued -> running -> completed).
    return ReportGenerateOut(history_id=history.id, status="processing", message="Report generation started")


# --- history -------------------------------------------------------------------------
def _history_out(row: ReportHistory) -> ReportHistoryOut:
    return ReportHistoryOut(
        id=row.id, template_id=row.template_id, report_name=row.report_name,
        report_type=row.template.category if row.template else None, trigger_type=row.trigger_type,
        trigger_label=report_analytics.TRIGGER_LABELS[row.trigger_type], generated_by=row.generated_by,
        generated_by_name=row.generator.full_name if row.generator else None, status=row.status,
        status_label=report_analytics.status_label(row.status), progress_percent=row.progress_percent or 0,
        file_format=row.file_format, created_at=row.created_at, started_at=row.started_at,
        completed_at=row.completed_at, duration_seconds=row.duration_seconds, failure_reason=row.failure_reason,
        can_download=row.status == ReportGenerationStatus.COMPLETED and bool(row.file_path),
        can_retry=row.status in (ReportGenerationStatus.FAILED, ReportGenerationStatus.CANCELLED),
        can_cancel=row.status in IN_PROGRESS_STATUSES,
        schedule_id=row.schedule_id, retry_of_id=row.retry_of_id, is_archived=bool(row.is_archived),
        parameters=load_json(row.parameters_json, {}),
    )


def _history_filters(
    status: ReportGenerationStatus | None = None, trigger_type: ReportTriggerType | None = None,
    report_type: str | None = Query(None, max_length=80), owner_id: int | None = None,
    date_from: date | None = None, date_to: date | None = None,
    archived: Literal["exclude", "only", "include"] = "exclude", search: str | None = Query(None, max_length=100),
) -> dict:
    _check_dates(date_from, date_to)
    return {"status": status, "trigger_type": trigger_type, "report_type": report_type, "owner_id": owner_id,
            "date_from": date_from, "date_to": date_to, "archived": archived, "search": _clean_search(search)}


_HISTORY_SORT = {
    "created_at": ReportHistory.created_at, "name": ReportHistory.report_name, "status": ReportHistory.status,
    "duration": ReportHistory.duration_seconds, "trigger": ReportHistory.trigger_type,
    "type": ReportTemplate.category, "owner": User.full_name,
}


def _history_query(db: Session, user, f: dict):
    query = (db.query(ReportHistory)
             .outerjoin(ReportTemplate, ReportTemplate.id == ReportHistory.template_id)
             .outerjoin(User, User.id == ReportHistory.generated_by))
    if not _is_admin(user):
        query = query.filter(ReportHistory.generated_by == user.id)
    if f["status"] is not None:
        # The umbrella "processing" matches every in-progress stage.
        wanted = IN_PROGRESS_STATUSES if f["status"] == ReportGenerationStatus.PROCESSING else {f["status"]}
        query = query.filter(ReportHistory.status.in_(wanted))
    if f["trigger_type"] is not None:
        query = query.filter(ReportHistory.trigger_type == f["trigger_type"])
    if f["report_type"]:
        query = query.filter(func.lower(ReportTemplate.category) == f["report_type"].lower())
    if f["owner_id"] is not None:
        query = query.filter(ReportHistory.generated_by == f["owner_id"])
    if f["date_from"]:
        query = query.filter(ReportHistory.created_at >= _day_start(f["date_from"]))
    if f["date_to"]:
        query = query.filter(ReportHistory.created_at < _day_start(f["date_to"]) + timedelta(days=1))
    if f["archived"] == "exclude":
        query = query.filter(ReportHistory.is_archived.is_(False))
    elif f["archived"] == "only":
        query = query.filter(ReportHistory.is_archived.is_(True))
    if f["search"]:
        term, pattern = f["search"], _like(f["search"])
        clauses = [ReportHistory.report_name.ilike(pattern, escape="\\"), ReportTemplate.category.ilike(pattern, escape="\\"),
                   ReportTemplate.description.ilike(pattern, escape="\\"), User.full_name.ilike(pattern, escape="\\")]
        statuses = _matching(ReportGenerationStatus, term)
        if statuses:
            clauses.append(ReportHistory.status.in_(statuses))
        triggers = _matching(ReportTriggerType, term)
        if triggers:
            clauses.append(ReportHistory.trigger_type.in_(triggers))
        if term.isdigit():
            clauses.append(ReportHistory.id == int(term))
        query = query.filter(or_(*clauses))
    return query


def _sorted(query, column, order: str, tiebreaker):
    return query.order_by(column.desc() if order == "desc" else column.asc(), tiebreaker.desc())


@router.get("/history", response_model=PaginatedResponse, dependencies=[view_permission])
def list_history(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    sort_by: Literal["created_at", "name", "status", "duration", "trigger", "type", "owner"] = "created_at",
    order: SortOrder = "desc", filters: dict = Depends(_history_filters),
    db: Session = Depends(get_db), current_user=Depends(get_current_user),
):
    query = _history_query(db, current_user, filters)
    total = query.count()
    rows = (_sorted(query, _HISTORY_SORT[sort_by], order, ReportHistory.id)
            .options(selectinload(ReportHistory.template), selectinload(ReportHistory.generator))
            .offset((page - 1) * page_size).limit(page_size).all())
    return PaginatedResponse(items=[_history_out(r) for r in rows], page=page, page_size=page_size, total=total,
                             message="No matching reports found." if total == 0 else None)


_EXPORT_HEADER = ["Report ID", "Report Name", "Report Type", "Trigger", "Generated By", "Generated At (UTC)",
                  "Status", "Format", "Duration (s)", "Failure Reason"]
_EXPORT_FORMATS = {"csv": ReportFileFormat.CSV, "excel": ReportFileFormat.EXCEL, "pdf": ReportFileFormat.PDF}
_PDF_EXPORT_MAX_ROWS = 2000      # a PDF of more than a few thousand rows is slow and unreadable


@router.get("/history/export", dependencies=[view_permission])
def export_history(
    request: Request, ids: list[int] | None = Query(None, max_length=500, description="export only these runs (selected rows)"),
    format: Literal["csv", "excel", "pdf"] = "csv", filters: dict = Depends(_history_filters),
    db: Session = Depends(get_db), current_user=Depends(get_current_user),
):
    """The history listing as a file: the same filters as GET /history, optionally only `ids`."""
    query = _history_query(db, current_user, filters)
    if ids:
        query = query.filter(ReportHistory.id.in_(ids))
    cap = report_settings.EXPORT_MAX_ROWS if format != "pdf" else min(report_settings.EXPORT_MAX_ROWS, _PDF_EXPORT_MAX_ROWS)
    rows = (query.order_by(ReportHistory.created_at.desc(), ReportHistory.id.desc())
            .options(selectinload(ReportHistory.template), selectinload(ReportHistory.generator)).limit(cap).all())
    table = [_EXPORT_HEADER]
    for row in rows:
        out = _history_out(row)
        table.append([out.id, out.report_name, out.report_type, out.trigger_label, out.generated_by_name or out.generated_by,
                      out.created_at.isoformat(sep=" ", timespec="seconds"), out.status_label, out.file_format.value,
                      out.duration_seconds, out.failure_reason])
    table = [[("" if cell is None else cell) for cell in line] for line in table]
    applied = ", ".join(f"{k}={getattr(v, 'value', v)}" for k, v in sorted(filters.items())
                        if v not in (None, "") and not (k == "archived" and v == "exclude")) or "none"
    if ids:
        applied += f", selected={len(ids)} rows"
    file_format = _EXPORT_FORMATS[format]
    meta = [("Report", "Report history"), ("Generated (UTC)", utc_now().strftime("%Y-%m-%d %H:%M")), ("Filters", applied)]
    body = render_report_file(file_format, table, meta)
    log_report_action(db, actor_user_id=current_user.id, action="history.exported", entity_type="report",
                      ip_address=_ip(request), details={"rows": len(rows), "format": format, "selected": len(ids or [])})
    db.commit()
    return Response(content=body, media_type=MEDIA_TYPES[file_format],
                    headers={"Content-Disposition": f'attachment; filename="report-history.{FILE_SUFFIX[file_format]}"'})


def _history_or_404(db: Session, user, report_id: int) -> ReportHistory:
    row = db.get(ReportHistory, report_id)
    if row is None or (not _is_admin(user) and row.generated_by != user.id):
        raise HTTPException(status_code=404, detail=_NOT_FOUND)
    return row


@router.get("/history/{report_id}", response_model=ReportHistoryOut, dependencies=[view_permission])
def get_history(report_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return _history_out(_history_or_404(db, current_user, report_id))


@router.post("/history/{report_id}/retry", response_model=ReportGenerateOut, dependencies=[create_permission])
def retry_report(report_id: int, request: Request, background_tasks: BackgroundTasks,
                 db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    original = _history_or_404(db, current_user, report_id)
    if original.status not in (ReportGenerationStatus.FAILED, ReportGenerationStatus.CANCELLED):
        raise HTTPException(status_code=409, detail="Only failed or cancelled reports can be retried.")
    template = db.get(ReportTemplate, original.template_id) if original.template_id else None
    if template is None or not _available(template):
        raise HTTPException(status_code=409, detail="Selected report template is unavailable.")
    if not _template_visible(template, current_user):
        raise HTTPException(status_code=403, detail="You do not have permission to use this report template.")
    retry = ReportHistory(
        template_id=template.id, report_name=original.report_name, generated_by=original.generated_by,
        status=ReportGenerationStatus.QUEUED, trigger_type=original.trigger_type, schedule_id=original.schedule_id,
        file_format=original.file_format, parameters_json=original.parameters_json, retry_of_id=original.id,
    )
    db.add(retry)
    db.flush()
    log_report_action(db, actor_user_id=current_user.id, action="report.retried", entity_type="report",
                      entity_id=retry.id, ip_address=_ip(request), details={"retry_of": original.id})
    db.commit()
    background_tasks.add_task(generate_report, retry.id)
    return ReportGenerateOut(history_id=retry.id, status="processing", message="Report generation restarted")


@router.post("/history/{report_id}/cancel", response_model=MessageOut, dependencies=[create_permission])
def cancel_report(report_id: int, request: Request, db: Session = Depends(get_db),
                  current_user=Depends(get_current_user)):
    """Cancel a report that is queued or already running.

    A running report stops at its next checkpoint (after the data is read, and again
    after the file is written) and never ends up as 'completed'.
    """
    row = _history_or_404(db, current_user, report_id)
    if row.status not in IN_PROGRESS_STATUSES:
        raise HTTPException(status_code=409, detail="Only a report that is queued or running can be cancelled.")
    was_running = row.status in (ReportGenerationStatus.RUNNING, ReportGenerationStatus.PROCESSING)
    now = utc_now()
    row.status = ReportGenerationStatus.CANCELLED
    row.completed_at = now
    row.failure_reason = "Cancelled by user."
    if row.started_at:
        row.duration_seconds = round((now - row.started_at).total_seconds(), 3)
    log_report_action(db, actor_user_id=current_user.id, action="report.cancelled", entity_type="report",
                      entity_id=row.id, ip_address=_ip(request), details={"was_running": was_running})
    db.commit()
    return MessageOut(message="Report cancelled")


def _set_archived(db: Session, user, report_id: int, request: Request, archived: bool) -> MessageOut:
    row = _history_or_404(db, user, report_id)
    if row.status not in TERMINAL_STATUSES:
        raise HTTPException(status_code=409, detail="Only finished reports can be archived.")
    row.is_archived = archived
    row.archived_at = utc_now() if archived else None
    log_report_action(db, actor_user_id=user.id, action="report.archived" if archived else "report.unarchived",
                      entity_type="report", entity_id=row.id, ip_address=_ip(request))
    db.commit()
    return MessageOut(message="Report archived" if archived else "Report restored from the archive")


@router.post("/history/{report_id}/archive", response_model=MessageOut, dependencies=[edit_permission])
def archive_report(report_id: int, request: Request, db: Session = Depends(get_db),
                   current_user=Depends(get_current_user)):
    return _set_archived(db, current_user, report_id, request, True)


@router.post("/history/{report_id}/unarchive", response_model=MessageOut, dependencies=[edit_permission])
def unarchive_report(report_id: int, request: Request, db: Session = Depends(get_db),
                     current_user=Depends(get_current_user)):
    return _set_archived(db, current_user, report_id, request, False)


@router.post("/history/bulk-delete", response_model=BulkDeleteOut, dependencies=[delete_permission])
def bulk_delete_reports(payload: BulkDeleteIn, request: Request, db: Session = Depends(get_db),
                        current_user=Depends(get_current_user)):
    """Delete the selected runs. Rows that cannot be deleted are reported, not fatal."""
    ids = list(dict.fromkeys(payload.ids))
    rows = {row.id: row for row in db.query(ReportHistory).filter(ReportHistory.id.in_(ids))}
    deleted: list[int] = []
    skipped: list[dict] = []
    files: list[str | None] = []
    for report_id in ids:
        row = rows.get(report_id)
        if row is None or (not _is_admin(current_user) and row.generated_by != current_user.id):
            skipped.append({"id": report_id, "reason": _NOT_FOUND})
        elif row.status in IN_PROGRESS_STATUSES:
            skipped.append({"id": report_id, "reason": "A report that is still in progress cannot be deleted."})
        else:
            log_report_action(db, actor_user_id=current_user.id, action="report.deleted", entity_type="report",
                              entity_id=row.id, ip_address=_ip(request),
                              details={"name": row.report_name, "status": row.status.value, "owner": row.generated_by,
                                       "bulk": True})
            files.append(row.file_path)
            db.delete(row)
            deleted.append(report_id)
    db.commit()
    for file_path in files:
        delete_report_file(file_path)       # after the commit, as in the single delete
    message = f"{len(deleted)} report(s) deleted" + (f", {len(skipped)} skipped" if skipped else "")
    return BulkDeleteOut(deleted=deleted, skipped=skipped, message=message)


@router.delete("/history/{report_id}", response_model=MessageOut, dependencies=[delete_permission])
def delete_report(report_id: int, request: Request, db: Session = Depends(get_db),
                  current_user=Depends(get_current_user)):
    row = _history_or_404(db, current_user, report_id)
    if row.status in IN_PROGRESS_STATUSES:
        raise HTTPException(status_code=409, detail="A report that is still in progress cannot be deleted.")
    log_report_action(db, actor_user_id=current_user.id, action="report.deleted", entity_type="report",
                      entity_id=row.id, ip_address=_ip(request),
                      details={"name": row.report_name, "status": row.status.value, "owner": row.generated_by})
    file_path = row.file_path
    db.delete(row)
    db.commit()
    delete_report_file(file_path)       # after the commit: a failed commit must not orphan the row
    return MessageOut(message="Report deleted")


@router.get("/download/{report_id}", dependencies=[view_permission])
def download_report(report_id: int, request: Request, db: Session = Depends(get_db),
                    current_user=Depends(get_current_user)):
    history = _history_or_404(db, current_user, report_id)
    if history.status != ReportGenerationStatus.COMPLETED:
        raise HTTPException(status_code=409, detail="Report is not ready for download")
    if not history.file_path:
        raise HTTPException(status_code=404, detail="Report file is unavailable")
    path = Path(history.file_path).resolve()
    if REPORT_DIR.resolve() not in path.parents or not path.is_file():
        raise HTTPException(status_code=404, detail="Report file is unavailable")
    log_report_action(db, actor_user_id=current_user.id, action="report.downloaded", entity_type="report",
                      entity_id=history.id, ip_address=_ip(request), details={"format": history.file_format.value})
    db.commit()
    return FileResponse(path, media_type=MEDIA_TYPES[history.file_format], filename=path.name)


# --- schedules ------------------------------------------------------------------------
_SCHEDULE_SORT = {
    "next_run_time": ScheduledReport.next_run_time, "name": func.coalesce(ScheduledReport.name, ReportTemplate.name),
    "frequency": ScheduledReport.frequency, "status": ScheduledReport.status,
    "last_run_at": ScheduledReport.last_run_at, "owner": User.full_name, "type": ReportTemplate.category,
}


def _schedule_query(db: Session, user):
    query = (db.query(ScheduledReport)
             .join(ReportTemplate, ReportTemplate.id == ScheduledReport.template_id)
             .outerjoin(User, User.id == ScheduledReport.owner_id))
    if not _is_admin(user):
        query = query.filter(ScheduledReport.owner_id == user.id)
    return query


def _schedule_or_404(db: Session, user, schedule_id: int) -> ScheduledReport:
    row = db.get(ScheduledReport, schedule_id)
    if row is None or (not _is_admin(user) and row.owner_id != user.id):
        raise HTTPException(status_code=404, detail=_NOT_FOUND)
    return row


def _schedule_outs(db: Session, rows: list[ScheduledReport]) -> list[ScheduledReportOut]:
    ids = [r.id for r in rows]
    in_progress: set[int] = set()
    latest_done: dict[int, int] = {}
    if ids:
        in_progress = {sid for (sid,) in db.query(ReportHistory.schedule_id)
                       .filter(ReportHistory.schedule_id.in_(ids), ReportHistory.status.in_(IN_PROGRESS_STATUSES)).distinct()}
        latest_done = dict(db.query(ReportHistory.schedule_id, func.max(ReportHistory.id))
                           .filter(ReportHistory.schedule_id.in_(ids), ReportHistory.status == ReportGenerationStatus.COMPLETED,
                                   ReportHistory.file_path.isnot(None)).group_by(ReportHistory.schedule_id).all())
    owners = {uid: name for uid, name in db.query(User.id, User.full_name).filter(User.id.in_({r.owner_id for r in rows}))} if rows else {}
    out = []
    for r in rows:
        if r.status == ScheduledReportStatus.PAUSED:
            display = "paused"
        elif r.id in in_progress:
            display = "processing"
        elif r.last_run_status == ReportGenerationStatus.COMPLETED:
            display = "completed"
        elif r.last_run_status == ReportGenerationStatus.FAILED:
            display = "failed"
        else:
            display = "scheduled"
        out.append(ScheduledReportOut(
            id=r.id, template_id=r.template_id, name=r.name, report_name=r.name or r.template.name,
            report_type=r.template.category, frequency=r.frequency, interval_days=r.interval_days,
            file_format=r.file_format, next_run_time=r.next_run_time,
            next_run_time_local=to_local_iso(r.next_run_time, r.timezone), timezone=r.timezone or "UTC",
            owner_id=r.owner_id, owner_name=owners.get(r.owner_id), status=r.status, display_status=display,
            last_run_at=r.last_run_at, last_run_status=r.last_run_status,
            last_completed_history_id=latest_done.get(r.id), recipients=load_json(r.recipients_json, []),
            parameters=load_json(r.parameters_json, {}), created_at=r.created_at))
    return out


@router.get("/scheduled", response_model=PaginatedResponse, dependencies=[view_permission])
def list_scheduled(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), status: str | None = None,
    report_type: str | None = Query(None, max_length=80), frequency: ReportFrequency | None = None,
    owner_id: int | None = None, date_from: date | None = None, date_to: date | None = None,
    search: str | None = Query(None, max_length=100),
    sort_by: Literal["next_run_time", "name", "frequency", "status", "last_run_at", "owner", "type"] = "next_run_time",
    order: SortOrder = "asc", db: Session = Depends(get_db), current_user=Depends(get_current_user),
):
    _check_dates(date_from, date_to)
    term = _clean_search(search)
    query = _schedule_query(db, current_user)
    if status:
        try:
            query = query.filter(ScheduledReport.status == ScheduledReportStatus(status.lower()))
        except ValueError as exc:
            raise HTTPException(status_code=422, detail="status must be active, paused or completed") from exc
    if report_type:
        query = query.filter(func.lower(ReportTemplate.category) == report_type.lower())
    if frequency is not None:
        query = query.filter(ScheduledReport.frequency == frequency)
    if owner_id is not None:
        query = query.filter(ScheduledReport.owner_id == owner_id)
    if date_from:
        query = query.filter(ScheduledReport.next_run_time >= _day_start(date_from))
    if date_to:
        query = query.filter(ScheduledReport.next_run_time < _day_start(date_to) + timedelta(days=1))
    if term:
        pattern = _like(term)
        clauses = [ScheduledReport.name.ilike(pattern, escape="\\"), ReportTemplate.name.ilike(pattern, escape="\\"),
                   ReportTemplate.category.ilike(pattern, escape="\\"), ReportTemplate.description.ilike(pattern, escape="\\"),
                   User.full_name.ilike(pattern, escape="\\")]
        if frequencies := _matching(ReportFrequency, term):
            clauses.append(ScheduledReport.frequency.in_(frequencies))
        if term.isdigit():
            clauses.append(ScheduledReport.id == int(term))
        query = query.filter(or_(*clauses))
    total = query.count()
    rows = (_sorted(query, _SCHEDULE_SORT[sort_by], order, ScheduledReport.id)
            .options(selectinload(ScheduledReport.template)).offset((page - 1) * page_size).limit(page_size).all())
    return PaginatedResponse(items=_schedule_outs(db, rows), page=page, page_size=page_size, total=total,
                             message="No matching scheduled reports found." if total == 0 else None)


@router.get("/scheduled/{schedule_id}", response_model=ScheduledReportOut, dependencies=[view_permission])
def get_scheduled(schedule_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return _schedule_outs(db, [_schedule_or_404(db, current_user, schedule_id)])[0]


@router.patch("/scheduled/{schedule_id}", response_model=ScheduledReportOut, dependencies=[edit_permission])
def update_scheduled(schedule_id: int, payload: ScheduledReportUpdateIn, request: Request,
                     background_tasks: BackgroundTasks, db: Session = Depends(get_db),
                     current_user=Depends(get_current_user)):
    schedule = _schedule_or_404(db, current_user, schedule_id)
    sent = payload.model_fields_set
    template = schedule.template
    if "parameters" in sent:
        parameters = _effective_parameters(template, _dump_parameters(payload.parameters))
    else:
        parameters = load_json(schedule.parameters_json, {})
    frequency = payload.frequency if payload.frequency is not None else schedule.frequency
    if "interval_days" in sent:
        interval_days = payload.interval_days
    elif payload.frequency is not None and frequency != ReportFrequency.CUSTOM:
        interval_days = None            # leaving 'custom' drops its interval
    else:
        interval_days = schedule.interval_days
    tz_name = payload.timezone.strip() if payload.timezone else (schedule.timezone or "UTC")
    file_format = payload.file_format if payload.file_format is not None else schedule.file_format

    run_utc = _validate_schedule(frequency, interval_days, payload.next_run_time if "next_run_time" in sent else None,
                                 tz_name, require_future=True)
    if schedule.status == ScheduledReportStatus.COMPLETED and run_utc is None:
        raise HTTPException(status_code=409, detail="A completed one-time schedule needs a new run time to be edited.")
    next_run = run_utc or schedule.next_run_time
    parameters_json = _canonical(parameters)
    _assert_no_conflict(db, owner_id=schedule.owner_id, template_id=schedule.template_id, frequency=frequency,
                        interval_days=interval_days, next_run_utc=next_run, file_format=file_format,
                        parameters_json=parameters_json, exclude_id=schedule.id)

    changes = {}
    for field, new in (("frequency", frequency), ("interval_days", interval_days), ("timezone", tz_name),
                       ("file_format", file_format), ("next_run_time", next_run), ("parameters_json", parameters_json)):
        old = getattr(schedule, field)
        if old != new:
            changes[field] = {"from": getattr(old, "value", old), "to": getattr(new, "value", new)}
            setattr(schedule, field, new)
    if "report_name" in sent and payload.report_name != schedule.name:
        changes["name"] = {"from": schedule.name, "to": payload.report_name}
        schedule.name = payload.report_name
    if "recipients" in sent:
        recipients = _clean_recipients(payload.recipients)
        if recipients != load_json(schedule.recipients_json, []):
            changes["recipients"] = {"count": len(recipients)}
            schedule.recipients_json = json.dumps(recipients)
    if schedule.status == ScheduledReportStatus.COMPLETED and run_utc is not None:
        schedule.status = ScheduledReportStatus.ACTIVE
        changes["status"] = {"from": "completed", "to": "active"}
    if changes:
        log_report_action(db, actor_user_id=current_user.id, action="schedule.updated", entity_type="schedule",
                          entity_id=schedule.id, ip_address=_ip(request), details=changes)
    db.commit()
    db.refresh(schedule)
    if changes:
        background_tasks.add_task(notify_schedule_event_task, schedule.id, "updated")
    return _schedule_outs(db, [schedule])[0]


@router.post("/scheduled/{schedule_id}/pause", response_model=ScheduledReportOut, dependencies=[edit_permission])
def pause_scheduled(schedule_id: int, request: Request, background_tasks: BackgroundTasks,
                    db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    schedule = _schedule_or_404(db, current_user, schedule_id)
    if schedule.status != ScheduledReportStatus.ACTIVE:
        raise HTTPException(status_code=409, detail="Only an active schedule can be paused.")
    schedule.status = ScheduledReportStatus.PAUSED
    log_report_action(db, actor_user_id=current_user.id, action="schedule.paused", entity_type="schedule",
                      entity_id=schedule.id, ip_address=_ip(request))
    db.commit()
    db.refresh(schedule)
    background_tasks.add_task(notify_schedule_event_task, schedule.id, "paused")
    return _schedule_outs(db, [schedule])[0]


@router.post("/scheduled/{schedule_id}/resume", response_model=ScheduledReportOut, dependencies=[edit_permission])
def resume_scheduled(schedule_id: int, request: Request, background_tasks: BackgroundTasks,
                     db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    schedule = _schedule_or_404(db, current_user, schedule_id)
    if schedule.status != ScheduledReportStatus.PAUSED:
        raise HTTPException(status_code=409, detail="Only a paused schedule can be resumed.")
    if schedule.next_run_time <= utc_now():
        # Don't fire a backlog the moment it resumes: jump to the next future slot.
        upcoming = next_occurrence(schedule.next_run_time, schedule.frequency, schedule.timezone, schedule.interval_days)
        if upcoming is None:
            raise HTTPException(status_code=409, detail=(
                "This one-time schedule's run time has passed. Edit the schedule with a new run time."))
        schedule.next_run_time = upcoming
    schedule.status = ScheduledReportStatus.ACTIVE
    log_report_action(db, actor_user_id=current_user.id, action="schedule.resumed", entity_type="schedule",
                      entity_id=schedule.id, ip_address=_ip(request),
                      details={"next_run_time": schedule.next_run_time.isoformat()})
    db.commit()
    db.refresh(schedule)
    background_tasks.add_task(notify_schedule_event_task, schedule.id, "resumed")
    return _schedule_outs(db, [schedule])[0]


@router.delete("/scheduled/{schedule_id}", response_model=MessageOut, dependencies=[delete_permission])
def delete_scheduled(schedule_id: int, request: Request, db: Session = Depends(get_db),
                     current_user=Depends(get_current_user)):
    schedule = _schedule_or_404(db, current_user, schedule_id)
    log_report_action(db, actor_user_id=current_user.id, action="schedule.deleted", entity_type="schedule",
                      entity_id=schedule.id, ip_address=_ip(request),
                      details={"name": schedule.name or schedule.template.name, "owner": schedule.owner_id})
    # History is kept (it is the audit-friendly record of what ran); it just loses the link.
    db.query(ReportHistory).filter(ReportHistory.schedule_id == schedule.id).update(
        {ReportHistory.schedule_id: None}, synchronize_session=False)
    db.delete(schedule)
    db.commit()
    return MessageOut(message="Scheduled report deleted")


# --- dashboard -------------------------------------------------------------------------
def _window(range_key: str | None, date_from: date | None, date_to: date | None):
    try:
        return report_analytics.resolve_range(range_key, date_from, date_to)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/summary", response_model=ReportSummaryOut, dependencies=[view_permission])
def report_summary(range_key: str | None = Query("30d", alias="range", max_length=30), date_from: date | None = None,
                   date_to: date | None = None, category: str | None = Query(None, max_length=80),
                   db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return report_analytics.summary(db, _window(range_key, date_from, date_to), _owner_scope(current_user), category)


@router.get("/analytics/type-distribution", response_model=TypeDistributionOut, dependencies=[view_permission])
def report_type_distribution(range_key: str | None = Query("6m", alias="range", max_length=30), date_from: date | None = None,
                             date_to: date | None = None, category: str | None = Query(None, max_length=80),
                             db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return report_analytics.type_distribution(
        db, _window(range_key, date_from, date_to), _owner_scope(current_user), category)


@router.get("/analytics/status-distribution", response_model=StatusDistributionOut, dependencies=[view_permission])
def report_status_distribution(range_key: str | None = Query("6m", alias="range", max_length=30), date_from: date | None = None,
                               date_to: date | None = None, category: str | None = Query(None, max_length=80),
                               db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return report_analytics.status_distribution(
        db, _window(range_key, date_from, date_to), _owner_scope(current_user), category)
