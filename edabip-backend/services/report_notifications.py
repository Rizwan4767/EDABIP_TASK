"""Email notifications for the Reports module (BR-RM-012, AC-RM-031).

Email via utils.email.send_email is the one configured channel in this backend,
so it is the only one used here. Everything is best-effort: a mail failure is
logged and never changes the outcome of a report or a schedule operation, and
nothing in this module raises (BackgroundTasks / BaseHTTPMiddleware would turn a
raised error into an HTTP 500).

The mails announce and link to the Reports screen; they do not attach the file,
because downloads must go through /api/reports/download/{id} so ownership and
download auditing are enforced.
"""
import html
import json
import logging

from sqlalchemy.orm import Session

from config import settings
from models.reports import (
    ReportGenerationStatus, ReportHistory, ReportTemplate, ReportTriggerType, ScheduledReport,
)
from utils.email import send_email

logger = logging.getLogger(__name__)

_EVENT_TEXT = {
    "created": "was created",
    "updated": "was updated",
    "paused": "was paused",
    "resumed": "was resumed",
    "deleted": "was deleted",
}


def _reports_url() -> str:
    return f"{settings.frontend_url.rstrip('/')}/reports"


def _send(to: str, subject: str, body_html: str, body_text: str) -> None:
    try:
        send_email(to, subject, body_html, body_text)
    except Exception:  # noqa: BLE001
        logger.exception("Report notification to %s failed", to)


def _owner_email(db: Session, user_id: int) -> tuple[str | None, str]:
    from models.user import User

    user = db.get(User, user_id)
    if user is None or not user.email or not getattr(user, "email_notifications", True):
        return None, ""
    return user.email, user.full_name or ""


def _wrap(title: str, message: str) -> str:
    return (
        '<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#fff;'
        'border-radius:12px;border:1px solid #e4e4e7">'
        f'<h2 style="color:#1c1917;margin:0 0 8px">{html.escape(title)}</h2>'
        f'<p style="color:#52525b">{message}</p>'
        f'<p><a href="{html.escape(_reports_url())}">Open Reports</a></p></div>'
    )


def notify_schedule_event(db: Session, schedule: ScheduledReport, event: str) -> None:
    """Tell the schedule's owner it was created / updated / paused / resumed / deleted."""
    try:
        to, name = _owner_email(db, schedule.owner_id)
        if not to:
            return
        label = schedule.name or (schedule.template.name if schedule.template else "Report")
        text = f"Your scheduled report \"{label}\" {_EVENT_TEXT.get(event, event)}."
        _send(to, f"Scheduled report {event}: {label}", _wrap("Scheduled report " + event, html.escape(text)), text)
    except Exception:  # noqa: BLE001
        logger.exception("Schedule notification failed")


def notify_schedule_event_task(schedule_id: int, event: str) -> None:
    """BackgroundTask entry point: the request's session is already closed, so open one."""
    from database import SessionLocal

    db = SessionLocal()
    try:
        schedule = db.get(ScheduledReport, schedule_id)
        if schedule is not None:
            notify_schedule_event(db, schedule, event)
    except Exception:  # noqa: BLE001
        logger.exception("Schedule notification failed")
    finally:
        db.close()


def notify_run_finished(db: Session, history: ReportHistory) -> None:
    """Email the owner and the schedule's recipients when a *scheduled* run ends."""
    try:
        if history.trigger_type != ReportTriggerType.SCHEDULED or history.schedule_id is None:
            return
        if history.status not in (ReportGenerationStatus.COMPLETED, ReportGenerationStatus.FAILED):
            return
        schedule = db.get(ScheduledReport, history.schedule_id)
        recipients: list[str] = []
        if schedule is not None and schedule.recipients_json:
            try:
                recipients = [str(item) for item in json.loads(schedule.recipients_json)]
            except (TypeError, ValueError):
                recipients = []
        owner_email, _ = _owner_email(db, history.generated_by)
        if owner_email:
            recipients.append(owner_email)
        recipients = list(dict.fromkeys(r.lower() for r in recipients))
        if not recipients:
            return
        ok = history.status == ReportGenerationStatus.COMPLETED
        template = db.get(ReportTemplate, history.template_id) if history.template_id else None
        label = history.report_name or (template.name if template else "Report")
        if ok:
            text = f"Your scheduled report \"{label}\" is ready. Sign in and open Reports to download it."
        else:
            text = (f"Your scheduled report \"{label}\" could not be generated "
                    f"({history.failure_reason or 'unknown error'}). You can retry it from Reports.")
        subject = f"Report {'ready' if ok else 'failed'}: {label}"
        for address in recipients:
            _send(address, subject, _wrap(subject, html.escape(text)), text)
    except Exception:  # noqa: BLE001
        logger.exception("Run notification failed")
