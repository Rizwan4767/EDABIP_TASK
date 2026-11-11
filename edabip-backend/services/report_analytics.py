"""Aggregations behind the Reports dashboard (summary cards, charts, top templates).

Every function takes `owner_id`: None for admins (all rows) or a user id for
everyone else, mirroring the per-user scoping of /history and /scheduled. All
datetimes are naive UTC like the rest of the module.
"""
import re
from dataclasses import dataclass
from datetime import date, datetime, timedelta

from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from models.reports import (
    IN_PROGRESS_STATUSES, ReportGenerationStatus, ReportHistory, ReportTemplate, ReportTriggerType,
    ScheduledReport, ScheduledReportStatus,
)
from services.report_schedule import add_months, utc_now

# The order the dashboard chart shows the four types in.
TRIGGER_ORDER = (ReportTriggerType.SCHEDULED, ReportTriggerType.ON_DEMAND,
                 ReportTriggerType.SYSTEM, ReportTriggerType.AD_HOC)
TRIGGER_LABELS = {
    ReportTriggerType.SCHEDULED: "Scheduled",
    ReportTriggerType.ON_DEMAND: "On Demand",
    ReportTriggerType.SYSTEM: "System Generated",
    ReportTriggerType.AD_HOC: "Ad-hoc",
}
RANGE_HELP = "range must be like 30d, 3m, 'Last 6 Months' or 'all' (1-365 days or 1-36 months)"
_RANGE = re.compile(r"^(?:last_)?(\d{1,3})_?(d|day|days|m|month|months)$")
_ALL_KEYS = {"all", "all_time", "alltime"}
_ALL_TIME_START = datetime(2000, 1, 1)
_QUEUED = (ReportGenerationStatus.QUEUED, ReportGenerationStatus.PENDING)
_RUNNING = (ReportGenerationStatus.RUNNING, ReportGenerationStatus.PROCESSING)


def status_label(status: ReportGenerationStatus) -> str:
    """The three indicators the UI shows (+ cancelled): all in-progress states are 'Processing'."""
    if status in IN_PROGRESS_STATUSES:
        return "Processing"
    return status.value.capitalize()


def format_duration(seconds: float | None) -> str | None:
    """Human label for a run time: '350 ms', '4.2 sec' or '02 : 35 mins'.

    Reports usually finish in well under a second, so a plain mm:ss label would
    read 00 : 00; sub-minute values are shown in finer units instead.
    """
    if seconds is None:
        return None
    millis = round(seconds * 1000)
    if millis < 1000:
        return f"{millis} ms"
    if seconds < 59.95:                         # 59.96 would otherwise print as "60.0 sec"
        return f"{seconds:.1f} sec"
    total = round(seconds)
    return f"{total // 60:02d} : {total % 60:02d} mins"


@dataclass(frozen=True)
class RangeWindow:
    key: str
    start: datetime
    end: datetime
    previous_start: datetime
    previous_end: datetime

    def as_dict(self) -> dict:
        return {"key": self.key, "start": self.start, "end": self.end}


def resolve_range(key: str | None, date_from: date | None = None, date_to: date | None = None,
                  *, now: datetime | None = None) -> RangeWindow:
    """Turn a period into the window + the one before it (for the "vs previous" figures).

    Accepts 30d / 3m / all, the UI labels ("Last 3 Months", "Last 30 Days", "All Time"),
    or an explicit date_from/date_to.
    """
    now = now or utc_now()
    if date_from is not None or date_to is not None:
        end_day = date_to or now.date()
        start_day = date_from or (end_day - timedelta(days=30))
        if start_day > end_day:
            raise ValueError("date_from must not be after date_to")
        start = datetime.combine(start_day, datetime.min.time())
        end = datetime.combine(end_day, datetime.min.time()) + timedelta(days=1)
        length = end - start
        return RangeWindow("custom", start, end, start - length, start)
    normalised = re.sub(r"[\s\-]+", "_", (key or "30d").strip().lower())
    if normalised in _ALL_KEYS:
        return RangeWindow("all", _ALL_TIME_START, now, _ALL_TIME_START, _ALL_TIME_START)   # nothing "before" all time
    match = _RANGE.match(normalised)
    if not match:
        raise ValueError(RANGE_HELP)
    amount, unit = int(match.group(1)), match.group(2)
    if unit.startswith("d"):
        if not 1 <= amount <= 365:
            raise ValueError(RANGE_HELP)
        length = timedelta(days=amount)
        start = now - length
        return RangeWindow(f"{amount}d", start, now, start - length, start)
    if not 1 <= amount <= 36:
        raise ValueError(RANGE_HELP)
    start = add_months(now.replace(day=1, hour=0, minute=0, second=0, microsecond=0), -(amount - 1))
    return RangeWindow(f"{amount}m", start, now, add_months(start, -amount), start)


def _history(db: Session, start: datetime, end: datetime, owner_id: int | None, category: str | None):
    query = db.query(ReportHistory).filter(ReportHistory.created_at >= start, ReportHistory.created_at < end)
    if owner_id is not None:
        query = query.filter(ReportHistory.generated_by == owner_id)
    if category:
        query = (query.join(ReportTemplate, ReportTemplate.id == ReportHistory.template_id)
                 .filter(func.lower(ReportTemplate.category) == category.lower()))
    return query


def _change(current: float | None, previous: float | None) -> float | None:
    if not previous or current is None:
        return None
    return round((current - previous) / previous * 100, 1)


def _metric(value, previous, label: str | None = None) -> dict:
    return {"value": value, "previous": previous, "change_percent": _change(value, previous), "label": label}


def _status_counts(db, start, end, owner_id, category) -> dict:
    rows = (_history(db, start, end, owner_id, category)
            .with_entities(ReportHistory.status, func.count(ReportHistory.id))
            .group_by(ReportHistory.status).all())
    return {status: count for status, count in rows}


def _avg_duration(db, start, end, owner_id, category) -> float | None:
    value = (_history(db, start, end, owner_id, category)
             .filter(ReportHistory.status == ReportGenerationStatus.COMPLETED, ReportHistory.duration_seconds.isnot(None))
             .with_entities(func.avg(ReportHistory.duration_seconds)).scalar())
    return round(float(value), 3) if value is not None else None


def _schedules(db, owner_id, category):
    query = db.query(ScheduledReport.id).filter(ScheduledReport.status == ScheduledReportStatus.ACTIVE)
    if owner_id is not None:
        query = query.filter(ScheduledReport.owner_id == owner_id)
    if category:
        query = (query.join(ReportTemplate, ReportTemplate.id == ScheduledReport.template_id)
                 .filter(func.lower(ReportTemplate.category) == category.lower()))
    return query


def _active_schedules(db, owner_id, category, *, created_before: datetime | None = None) -> int:
    query = _schedules(db, owner_id, category)
    if created_before is not None:
        query = query.filter(ScheduledReport.created_at < created_before)
    return query.count()


# --- sparkline series ----------------------------------------------------------------
def _bucket_plan(db, window: RangeWindow, owner_id, category):
    """Pick day or month buckets for the window and list them (oldest first)."""
    start = window.start
    if window.key == "all":
        earliest = (_history(db, _ALL_TIME_START, window.end, owner_id, category)
                    .with_entities(func.min(ReportHistory.created_at)).scalar())
        start = earliest or (window.end - timedelta(days=30))
    granularity = "day" if (window.end - start).days <= 92 else "month"
    buckets: list[str] = []
    if granularity == "day":
        cursor = start.replace(hour=0, minute=0, second=0, microsecond=0)
        while cursor <= window.end:
            buckets.append(cursor.strftime("%Y-%m-%d"))
            cursor += timedelta(days=1)
    else:
        cursor = start.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        while cursor <= window.end:
            buckets.append(f"{cursor.year:04d}-{cursor.month:02d}")
            cursor = add_months(cursor, 1)
    return granularity, start, buckets


def _bucket_columns(column, granularity: str):
    parts = [extract("year", column), extract("month", column)]
    if granularity == "day":
        parts.append(extract("day", column))
    return parts


def _bucket_key(parts, granularity: str) -> str:
    year, month = int(parts[0]), int(parts[1])
    return f"{year:04d}-{month:02d}-{int(parts[2]):02d}" if granularity == "day" else f"{year:04d}-{month:02d}"


def trend(db: Session, window: RangeWindow, owner_id: int | None, category: str | None = None) -> dict:
    """Per-bucket series for the mini graphs inside the five KPI cards."""
    granularity, start, buckets = _bucket_plan(db, window, owner_id, category)
    index = {key: i for i, key in enumerate(buckets)}
    size = len(buckets)
    total, completed, failed, created = [0] * size, [0] * size, [0] * size, [0] * size
    avg: list[float | None] = [None] * size
    history_cols = _bucket_columns(ReportHistory.created_at, granularity)

    for *parts, status, count in (_history(db, start, window.end, owner_id, category)
                                  .with_entities(*history_cols, ReportHistory.status, func.count(ReportHistory.id))
                                  .group_by(*history_cols, ReportHistory.status).all()):
        i = index.get(_bucket_key(parts, granularity))
        if i is None:
            continue
        total[i] += count
        if status == ReportGenerationStatus.COMPLETED:
            completed[i] += count
        elif status == ReportGenerationStatus.FAILED:
            failed[i] += count

    for *parts, average in (_history(db, start, window.end, owner_id, category)
                            .filter(ReportHistory.status == ReportGenerationStatus.COMPLETED,
                                    ReportHistory.duration_seconds.isnot(None))
                            .with_entities(*history_cols, func.avg(ReportHistory.duration_seconds))
                            .group_by(*history_cols).all()):
        i = index.get(_bucket_key(parts, granularity))
        if i is not None and average is not None:
            avg[i] = round(float(average), 3)

    schedule_cols = _bucket_columns(ScheduledReport.created_at, granularity)
    sched_query = (db.query(*schedule_cols, func.count(ScheduledReport.id))
                   .filter(ScheduledReport.status == ScheduledReportStatus.ACTIVE,
                           ScheduledReport.created_at >= start, ScheduledReport.created_at < window.end))
    if owner_id is not None:
        sched_query = sched_query.filter(ScheduledReport.owner_id == owner_id)
    if category:
        sched_query = (sched_query.join(ReportTemplate, ReportTemplate.id == ScheduledReport.template_id)
                       .filter(func.lower(ReportTemplate.category) == category.lower()))
    for *parts, count in sched_query.group_by(*schedule_cols).all():
        i = index.get(_bucket_key(parts, granularity))
        if i is not None:
            created[i] += count

    return {"granularity": granularity, "buckets": buckets, "total_reports": total, "completed": completed,
            "failed": failed, "scheduled": created, "avg_run_time_seconds": avg}


# --- dashboard payloads --------------------------------------------------------------
def summary(db: Session, window: RangeWindow, owner_id: int | None, category: str | None = None) -> dict:
    """The five KPI cards (+ their mini-graph series) for the selected period/category."""
    now_counts = _status_counts(db, window.start, window.end, owner_id, category)
    before_counts = _status_counts(db, window.previous_start, window.previous_end, owner_id, category)
    average = _avg_duration(db, window.start, window.end, owner_id, category)
    return {
        "generated_at": utc_now(),                   # the UI's "Last Refreshed"
        "range": window.as_dict(),
        "category": category,
        "total_reports": _metric(sum(now_counts.values()), sum(before_counts.values())),
        "completed": _metric(now_counts.get(ReportGenerationStatus.COMPLETED, 0),
                             before_counts.get(ReportGenerationStatus.COMPLETED, 0)),
        "failed": _metric(now_counts.get(ReportGenerationStatus.FAILED, 0),
                          before_counts.get(ReportGenerationStatus.FAILED, 0)),
        "in_progress": sum(count for status, count in now_counts.items() if status in IN_PROGRESS_STATUSES),
        # "Scheduled" is the number of active schedules (a different entity from runs,
        # so the cards deliberately do not add up to Total). The comparison figure is
        # how many of them already existed when the period began.
        "scheduled": _metric(_active_schedules(db, owner_id, category),
                             _active_schedules(db, owner_id, category, created_before=window.start)),
        "avg_run_time_seconds": _metric(
            average, _avg_duration(db, window.previous_start, window.previous_end, owner_id, category),
            format_duration(average)),
        "trend": trend(db, window, owner_id, category),
    }


def type_distribution(db: Session, window: RangeWindow, owner_id: int | None, category: str | None = None) -> dict:
    """Runs per trigger type: overall totals plus a month-by-month breakdown."""
    _granularity, start, _buckets = _bucket_plan(db, window, owner_id, category)
    rows = (_history(db, start, window.end, owner_id, category)
            .with_entities(extract("year", ReportHistory.created_at), extract("month", ReportHistory.created_at),
                           ReportHistory.trigger_type, func.count(ReportHistory.id))
            .group_by(extract("year", ReportHistory.created_at), extract("month", ReportHistory.created_at),
                      ReportHistory.trigger_type).all())
    months: list[str] = []
    cursor = start.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    while cursor <= window.end:
        months.append(f"{cursor.year:04d}-{cursor.month:02d}")
        cursor = add_months(cursor, 1)
    monthly = {m: {t.value: 0 for t in ReportTriggerType} for m in months}
    totals = {t: 0 for t in ReportTriggerType}
    for year, month, trigger, count in rows:
        monthly.setdefault(f"{int(year):04d}-{int(month):02d}", {t.value: 0 for t in ReportTriggerType})[trigger.value] += count
        totals[trigger] += count
    return {
        "range": window.as_dict(),
        "category": category,
        "totals": [{"type": t.value, "label": TRIGGER_LABELS[t], "count": totals[t]} for t in TRIGGER_ORDER],
        "monthly": [{"month": m, **counts} for m, counts in sorted(monthly.items())],
    }


def status_distribution(db: Session, window: RangeWindow, owner_id: int | None, category: str | None = None) -> dict:
    """Donut data: every run in the period falls in exactly one slice, so the slices add up.

    Everything here counts runs and respects the period and category filters.
    "Scheduled" is runs that are waiting to start (queued); the number of active
    schedules lives on the KPI card instead.
    """
    counts = _status_counts(db, window.start, window.end, owner_id, category)
    items = [
        ("completed", "Completed", counts.get(ReportGenerationStatus.COMPLETED, 0)),
        ("scheduled", "Scheduled", sum(counts.get(s, 0) for s in _QUEUED)),
        ("failed", "Failed", counts.get(ReportGenerationStatus.FAILED, 0)),
        ("in_progress", "Processing", sum(counts.get(s, 0) for s in _RUNNING)),
        ("cancelled", "Cancelled", counts.get(ReportGenerationStatus.CANCELLED, 0)),
    ]
    total = sum(count for _k, _l, count in items)
    return {
        "range": window.as_dict(),
        "category": category,
        "total": total,
        "items": [{"key": k, "label": label, "count": c, "percent": round(c / total * 100, 1) if total else 0.0}
                  for k, label, c in items],
    }


def top_templates(db: Session, window: RangeWindow, owner_id: int | None, *, limit: int = 5, visible=None,
                  include_unused=None) -> list[dict]:
    """Most-used templates in the window. `visible(template)` hides role-restricted ones.

    `include_unused` (an iterable of templates) appends the templates nobody used in the
    window, with a count of 0, which is what a "View All" list needs.
    """
    # Aggregate on the history table alone, then load the templates: selecting whole
    # template rows while grouping by id is rejected by MariaDB / ONLY_FULL_GROUP_BY.
    query = (db.query(ReportHistory.template_id, func.count(ReportHistory.id), func.max(ReportHistory.created_at))
             .filter(ReportHistory.template_id.isnot(None), ReportHistory.created_at >= window.start,
                     ReportHistory.created_at < window.end))
    if owner_id is not None:
        query = query.filter(ReportHistory.generated_by == owner_id)
    stats = query.group_by(ReportHistory.template_id).all()
    ranked = []
    if stats:
        templates = {t.id: t for t in db.query(ReportTemplate).filter(ReportTemplate.id.in_([row[0] for row in stats]))}
        ranked = sorted(((templates[tid], count, last) for tid, count, last in stats if tid in templates),
                        key=lambda item: (-item[1], item[0].name))
    if include_unused is not None:
        used = {t.id for t, _c, _l in ranked}
        ranked += [(t, 0, None) for t in sorted(include_unused, key=lambda t: t.name) if t.id not in used]
    result = []
    for template, count, last_used in ranked:
        if visible is not None and not visible(template):
            continue
        result.append({"template_id": template.id, "name": template.name, "category": template.category,
                       "is_active": template.is_active, "usage_count": count, "last_used_at": last_used})
        if len(result) >= limit:
            break
    return result
