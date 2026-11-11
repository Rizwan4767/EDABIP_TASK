"""Housekeeping for report runs: stuck-run recovery and retention (BR-RM-006).

    python -m services.report_maintenance      # run from cron, e.g. nightly

* recover_stuck_reports - a run still queued/running after STUCK_AFTER_MINUTES lost
  its worker (BackgroundTasks die with the process); mark it FAILED so the user can
  retry it instead of watching "Processing" forever.
* archive_old_reports   - hide old finished runs from the default history view.
* purge_old_files       - delete the files of very old runs; the history row stays.

Each pass writes one audit row summarising what it did.
"""
import logging
from datetime import timedelta
from pathlib import Path

from sqlalchemy import and_, or_, update

from models.reports import (
    IN_PROGRESS_STATUSES, TERMINAL_STATUSES, ReportGenerationStatus, ReportHistory,
)
from services import report_generator, report_settings
from services.report_audit import log_report_action
from services.report_schedule import utc_now

logger = logging.getLogger(__name__)


def recover_stuck_reports(db, *, now=None) -> int:
    current = now or utc_now()
    cutoff = current - timedelta(minutes=report_settings.STUCK_AFTER_MINUTES)
    stuck_ids = [
        row.id for row in db.query(ReportHistory.id)
        .filter(
            ReportHistory.status.in_(IN_PROGRESS_STATUSES),
            or_(
                ReportHistory.started_at <= cutoff,
                and_(ReportHistory.started_at.is_(None), ReportHistory.created_at <= cutoff),
            ),
        )
    ]
    recovered_ids = []
    for history_id in stuck_ids:
        result = db.execute(
            update(ReportHistory)
            .where(
                ReportHistory.id == history_id,
                ReportHistory.status.in_(IN_PROGRESS_STATUSES),
                or_(
                    ReportHistory.started_at <= cutoff,
                    and_(ReportHistory.started_at.is_(None), ReportHistory.created_at <= cutoff),
                ),
            )
            .values(
                status=ReportGenerationStatus.FAILED,
                completed_at=current,
                failure_reason="Report generation timed out. Please retry.",
                error_detail="Marked failed by services.report_maintenance: no worker finished this run.",
            )
        )
        if result.rowcount == 1:
            recovered_ids.append(history_id)
    if recovered_ids:
        log_report_action(db, actor_user_id=None, action="report.recovered_stuck", entity_type="report",
                          details={"count": len(recovered_ids), "ids": recovered_ids[:50]})
        db.commit()
    else:
        db.rollback()
    return len(recovered_ids)


def archive_old_reports(db, *, now=None) -> int:
    current = now or utc_now()
    cutoff = current - timedelta(days=report_settings.ARCHIVE_AFTER_DAYS)
    rows = (db.query(ReportHistory)
            .filter(ReportHistory.is_archived.is_(False), ReportHistory.status.in_(TERMINAL_STATUSES),
                    ReportHistory.created_at < cutoff).all())
    for row in rows:
        row.is_archived = True
        row.archived_at = current
    if rows:
        log_report_action(db, actor_user_id=None, action="report.archived_by_retention", entity_type="report",
                          details={"count": len(rows), "older_than_days": report_settings.ARCHIVE_AFTER_DAYS,
                                   "ids": [row.id for row in rows][:50]})
        db.commit()
    return len(rows)


def delete_report_file(file_path: str | None) -> bool:
    """Delete a generated file, but only if it really lives inside REPORT_DIR."""
    if not file_path:
        return False
    path = Path(file_path).resolve()
    if report_generator.REPORT_DIR.resolve() not in path.parents or not path.is_file():
        return False
    path.unlink()
    return True


def purge_old_files(db, *, now=None) -> int:
    current = now or utc_now()
    cutoff = current - timedelta(days=report_settings.PURGE_FILES_AFTER_DAYS)
    rows = (db.query(ReportHistory)
            .filter(ReportHistory.file_path.isnot(None), ReportHistory.created_at < cutoff).all())
    purged = 0
    for row in rows:
        delete_report_file(row.file_path)
        row.file_path = None            # the row (and its audit trail) is kept
        purged += 1
    if purged:
        log_report_action(db, actor_user_id=None, action="report.files_purged", entity_type="report",
                          details={"count": purged, "older_than_days": report_settings.PURGE_FILES_AFTER_DAYS})
        db.commit()
    return purged


def run_maintenance(db, *, now=None) -> dict:
    return {
        "recovered_stuck": recover_stuck_reports(db, now=now),
        "archived": archive_old_reports(db, now=now),
        "files_purged": purge_old_files(db, now=now),
    }


if __name__ == "__main__":
    from database import SessionLocal

    with SessionLocal() as session:
        for key, value in run_maintenance(session).items():
            print(f"{key}: {value}")
