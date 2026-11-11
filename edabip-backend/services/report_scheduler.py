"""Worker helpers for due scheduled reports.

The API never generates a scheduled report on a timer - POST /api/reports/generate
only stores the schedule row. Turning due rows into history rows/files is this
module's job. Two ways to run it:

* cron (recommended, works with any number of API workers):
      python -m services.report_scheduler
* in-process loop for a single-instance deployment: set REPORT_SCHEDULER_ENABLED=true
  and main.py starts `run_scheduler_loop` in a daemon thread at startup.

Both are plain callables so a cron job, an admin script or a test can drive them
without a queue: no Celery/Redis exists in this backend. Concurrent runners are
safe because due rows are claimed with SELECT ... FOR UPDATE and advanced before
the lock is released.
"""
import argparse
import logging
import threading

from models.reports import (
    ReportGenerationStatus, ReportHistory, ReportTriggerType, ScheduledReport, ScheduledReportStatus,
)
from services import report_settings
from services.report_audit import log_report_action
from services.report_generator import generate_report
from services.report_schedule import next_occurrence, utc_now

logger = logging.getLogger(__name__)


def process_due_reports(db, *, now=None, limit: int = 50) -> int:
    """Create + run a report for every active schedule whose time has come."""
    current_time = now or utc_now()
    schedules = (db.query(ScheduledReport)
        .filter(ScheduledReport.status == ScheduledReportStatus.ACTIVE, ScheduledReport.next_run_time <= current_time)
        .order_by(ScheduledReport.next_run_time, ScheduledReport.id)
        .with_for_update().limit(limit).all())
    history_ids = []
    for schedule in schedules:
        try:
            upcoming = next_occurrence(
                schedule.next_run_time, schedule.frequency, schedule.timezone,
                schedule.interval_days, after=current_time,
            )
        except Exception as exc:  # noqa: BLE001 - one broken schedule must not block the rest
            logger.exception("Schedule %s has an unusable recurrence; pausing it", schedule.id)
            schedule.status = ScheduledReportStatus.PAUSED
            log_report_action(db, actor_user_id=None, action="schedule.paused_on_error", entity_type="schedule",
                              entity_id=schedule.id, details={"error": f"{type(exc).__name__}: {exc}"})
            continue
        history = ReportHistory(
            template_id=schedule.template_id, report_name=schedule.name or schedule.template.name,
            generated_by=schedule.owner_id, status=ReportGenerationStatus.QUEUED,
            trigger_type=ReportTriggerType.SCHEDULED, schedule_id=schedule.id,
            file_format=schedule.file_format, parameters_json=schedule.parameters_json,
        )
        db.add(history)
        if upcoming is None:                       # ONE_TIME: it has now run
            schedule.status = ScheduledReportStatus.COMPLETED
        else:
            schedule.next_run_time = upcoming
        schedule.last_run_at = current_time
        schedule.last_run_status = ReportGenerationStatus.QUEUED
        db.flush()
        log_report_action(db, actor_user_id=None, action="schedule.executed", entity_type="schedule",
                          entity_id=schedule.id, details={"history_id": history.id,
                                                          "next_run_time": upcoming.isoformat() if upcoming else None})
        history_ids.append(history.id)
    db.commit()
    for history_id in history_ids:
        generate_report(history_id)
    return len(history_ids)


def run_scheduler_loop(stop: threading.Event, poll_seconds: int | None = None) -> None:
    """Poll forever (until `stop` is set): run due schedules, then recover stuck runs."""
    from database import SessionLocal
    from services.report_maintenance import recover_stuck_reports

    poll = poll_seconds or report_settings.SCHEDULER_POLL_SECONDS
    while not stop.is_set():
        try:
            with SessionLocal() as db:
                process_due_reports(db)
            with SessionLocal() as db:
                recover_stuck_reports(db)
        except Exception:  # noqa: BLE001
            logger.exception("Report scheduler pass failed")
        stop.wait(poll)


def start_background_scheduler():
    """Start the in-process loop when REPORT_SCHEDULER_ENABLED is true.

    Returns a (thread, stop_event) pair, or None when disabled (the default).
    """
    if not report_settings.SCHEDULER_ENABLED:
        return None
    stop = threading.Event()
    thread = threading.Thread(target=run_scheduler_loop, args=(stop,), name="report-scheduler", daemon=True)
    thread.start()
    logger.info("Report scheduler started (poll every %ss)", report_settings.SCHEDULER_POLL_SECONDS)
    return thread, stop


if __name__ == "__main__":
    from database import SessionLocal

    parser = argparse.ArgumentParser(description="Run due report schedules.")
    parser.add_argument("--loop", action="store_true", help="keep running instead of a single pass")
    args = parser.parse_args()
    if args.loop:
        run_scheduler_loop(threading.Event())
    else:
        from services.report_maintenance import recover_stuck_reports

        with SessionLocal() as session:
            print(f"Processed {process_due_reports(session)} due report schedule(s).")
        with SessionLocal() as session:
            print(f"Marked {recover_stuck_reports(session)} stuck run(s) as failed.")
