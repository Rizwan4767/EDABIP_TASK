"""Environment-driven settings for the Reports module.

Same approach as billing/config.py: plain os.environ reads with safe defaults, so
nothing here needs a change to the shared config.Settings class. Every value can
be overridden from .env (see .env.example).
"""
import os


def _int(name: str, default: int, minimum: int = 1) -> int:
    try:
        return max(minimum, int(os.environ.get(name, default)))
    except (TypeError, ValueError):
        return default


def _flag(name: str, default: bool = False) -> bool:
    return os.environ.get(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


# Retention (BR-RM-006). Completed reports are archived after ARCHIVE_AFTER_DAYS
# (hidden from the default history view, still downloadable) and their files are
# deleted after PURGE_FILES_AFTER_DAYS. The history row is always kept.
ARCHIVE_AFTER_DAYS = _int("REPORT_ARCHIVE_AFTER_DAYS", 90)
PURGE_FILES_AFTER_DAYS = _int("REPORT_PURGE_FILES_AFTER_DAYS", 365)

# A run still queued/running after this long lost its worker (e.g. the process
# restarted mid-run) and is marked failed by services.report_maintenance.
STUCK_AFTER_MINUTES = _int("REPORT_STUCK_AFTER_MINUTES", 30)

# Optional in-process scheduler for single-instance deployments. Off by default;
# the supported alternative is cron: `python -m services.report_scheduler`.
SCHEDULER_ENABLED = _flag("REPORT_SCHEDULER_ENABLED", False)
SCHEDULER_POLL_SECONDS = _int("REPORT_SCHEDULER_POLL_SECONDS", 60, minimum=5)

PREVIEW_ROWS = _int("REPORT_PREVIEW_ROWS", 10)
EXPORT_MAX_ROWS = _int("REPORT_EXPORT_MAX_ROWS", 10000)
MAX_RECIPIENTS = _int("REPORT_MAX_RECIPIENTS", 20)
