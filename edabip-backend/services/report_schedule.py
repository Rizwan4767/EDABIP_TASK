"""Time-zone and recurrence arithmetic for report schedules.

Schedules store `next_run_time` as naive UTC (the column has always held naive
UTC) plus an IANA `timezone`. Recurrence is evaluated on the wall clock in that
zone, so a 09:00 Asia/Kolkata report stays at 09:00 local across DST changes
elsewhere, and "monthly" means the same calendar day each month rather than a
fixed 30 days.
"""
import calendar
from datetime import datetime, timedelta, timezone as dt_timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from models.reports import ReportFrequency

_MONTH_STEP = {ReportFrequency.MONTHLY: 1, ReportFrequency.QUARTERLY: 3}
_MAX_STEPS = 200_000


def resolve_timezone(name: str | None) -> ZoneInfo:
    """Return the zone for an IANA name; ValueError (not KeyError) when unknown."""
    try:
        return ZoneInfo((name or "UTC").strip() or "UTC")
    except (ZoneInfoNotFoundError, ValueError, OSError) as exc:
        raise ValueError(f"Unknown time zone: {name!r}") from exc


def utc_now() -> datetime:
    return datetime.now(dt_timezone.utc).replace(tzinfo=None)


def to_utc_naive(value: datetime, tz_name: str | None) -> datetime:
    """Interpret `value` in `tz_name` (when naive) and return naive UTC."""
    if value.tzinfo is not None:
        return value.astimezone(dt_timezone.utc).replace(tzinfo=None)
    zone = resolve_timezone(tz_name)
    return value.replace(tzinfo=zone).astimezone(dt_timezone.utc).replace(tzinfo=None)


def to_local_iso(value: datetime | None, tz_name: str | None) -> str | None:
    """Naive-UTC datetime -> ISO-8601 string with the schedule zone's offset."""
    if value is None:
        return None
    try:
        zone = resolve_timezone(tz_name)
    except ValueError:
        zone = ZoneInfo("UTC")
    return value.replace(tzinfo=dt_timezone.utc).astimezone(zone).isoformat()


def add_months(value: datetime, months: int) -> datetime:
    """Add calendar months, clamping the day (Jan 31 + 1 month -> Feb 28/29)."""
    month_index = value.month - 1 + months
    year = value.year + month_index // 12
    month = month_index % 12 + 1
    day = min(value.day, calendar.monthrange(year, month)[1])
    return value.replace(year=year, month=month, day=day)


def _nth_local(anchor_local: datetime, frequency: ReportFrequency, interval_days: int | None, k: int) -> datetime:
    # Always derived from the anchor (not from the previous result) so a Jan 31
    # monthly schedule goes Feb 28 -> Mar 31, instead of drifting to the 28th.
    if frequency == ReportFrequency.DAILY:
        return anchor_local + timedelta(days=k)
    if frequency == ReportFrequency.WEEKLY:
        return anchor_local + timedelta(weeks=k)
    if frequency == ReportFrequency.CUSTOM:
        return anchor_local + timedelta(days=(interval_days or 1) * k)
    return add_months(anchor_local, _MONTH_STEP[frequency] * k)


def next_occurrence(
    previous_utc: datetime,
    frequency: ReportFrequency,
    tz_name: str | None,
    interval_days: int | None = None,
    *,
    after: datetime | None = None,
) -> datetime | None:
    """First run strictly later than `after` (default: now), in naive UTC.

    Missed periods are skipped rather than replayed one per cron pass, so a
    scheduler that was down for a week does not emit seven backlog reports.
    Returns None for a ONE_TIME schedule (it has no next run).
    """
    if frequency == ReportFrequency.ONE_TIME:
        return None
    after = after or utc_now()
    try:
        zone = resolve_timezone(tz_name)
    except ValueError:
        zone = ZoneInfo("UTC")
    anchor_local = previous_utc.replace(tzinfo=dt_timezone.utc).astimezone(zone).replace(tzinfo=None)
    for k in range(1, _MAX_STEPS):
        candidate_local = _nth_local(anchor_local, frequency, interval_days, k)
        candidate_utc = (
            candidate_local.replace(tzinfo=zone).astimezone(dt_timezone.utc).replace(tzinfo=None)
        )
        if candidate_utc > after:
            return candidate_utc
    raise ValueError("Could not compute the next run time for this schedule.")
