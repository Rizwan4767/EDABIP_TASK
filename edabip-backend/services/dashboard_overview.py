"""Database-backed response assembly for the signed-in Dashboard."""

import json
from datetime import datetime, timezone

from sqlalchemy import case, func
from sqlalchemy.orm import Session

from models.analytics import (
    ActiveUserStat,
    DataSource,
    KpiSnapshot,
    RecentActivityLog,
    RevenueTrend,
)
from models.reports import (
    IN_PROGRESS_STATUSES,
    ReportGenerationStatus,
    ReportHistory,
    ReportTemplate,
    ScheduledReport,
    ScheduledReportStatus,
)
from models.user import User
from schemas.dashboard import DashboardOverview
from services.report_schedule import to_local_iso


def _is_admin(user: User) -> bool:
    return bool(user.role and user.role.name == "admin")


def _has_permission(user: User, permission: str) -> bool:
    if _is_admin(user):
        return True
    return bool(
        user.role
        and any(item.name == permission for item in user.role.permissions)
    )


def _format_sync(value: datetime | None) -> str:
    if value is None:
        return "Never"
    now = (
        datetime.now(value.tzinfo)
        if value.tzinfo
        else datetime.now(timezone.utc).replace(tzinfo=None)
    )
    elapsed_minutes = int((now - value).total_seconds() // 60)
    if elapsed_minutes < 2:
        return "Just now"
    if elapsed_minutes < 60:
        return f"{elapsed_minutes} mins ago"
    hours = elapsed_minutes // 60
    if hours < 24:
        return f"{hours} hr{'s' if hours > 1 else ''} ago"
    days = elapsed_minutes // (60 * 24)
    return f"{days} day{'s' if days > 1 else ''} ago"


def _format_currency(value: float) -> str:
    if abs(value) >= 1_000_000:
        return f"${value / 1_000_000:.2f}M"
    if abs(value) >= 1_000:
        return f"${value / 1_000:.0f}K"
    return f"${value:.0f}"


def _latest_kpis(db: Session) -> dict[str, KpiSnapshot]:
    latest_dates = (
        db.query(
            KpiSnapshot.metric.label("metric"),
            func.max(KpiSnapshot.snapshot_date).label("snapshot_date"),
        )
        .group_by(KpiSnapshot.metric)
        .subquery()
    )
    latest_ids = (
        db.query(
            KpiSnapshot.metric.label("metric"),
            func.max(KpiSnapshot.id).label("snapshot_id"),
        )
        .join(
            latest_dates,
            (KpiSnapshot.metric == latest_dates.c.metric)
            & (KpiSnapshot.snapshot_date == latest_dates.c.snapshot_date),
        )
        .group_by(KpiSnapshot.metric)
        .subquery()
    )
    rows = (
        db.query(KpiSnapshot)
        .join(latest_ids, KpiSnapshot.id == latest_ids.c.snapshot_id)
        .all()
    )
    return {row.metric: row for row in rows}


def _latest_revenue_trend(db: Session, months: int = 9) -> list[RevenueTrend]:
    month_order = case(
        {
            "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
            "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12,
        },
        value=RevenueTrend.month,
        else_=13,
    )
    rows = (
        db.query(RevenueTrend)
        .order_by(
            RevenueTrend.year.desc(),
            month_order.desc(),
            RevenueTrend.id.desc(),
        )
        .limit(months)
        .all()
    )
    return list(reversed(rows))


def _latest_active_users(db: Session) -> list[ActiveUserStat]:
    latest_week = db.query(func.max(ActiveUserStat.week_start)).scalar()
    query = db.query(ActiveUserStat)
    if latest_week is None:
        query = query.filter(ActiveUserStat.week_start.is_(None))
    else:
        query = query.filter(ActiveUserStat.week_start == latest_week)
    return query.order_by(ActiveUserStat.day_order.asc(), ActiveUserStat.id.asc()).all()


def _report_data(
    db: Session, user: User
) -> tuple[
    int,
    int,
    int,
    list[tuple[ScheduledReport, str]],
    list[RecentActivityLog],
]:
    if not _has_permission(user, "reports.view"):
        return 0, 0, 0, [], []

    history = db.query(ReportHistory).filter(ReportHistory.is_archived.is_(False))
    schedules = db.query(ScheduledReport, ReportTemplate.name).join(
        ReportTemplate, ReportTemplate.id == ScheduledReport.template_id
    )
    if not _is_admin(user):
        history = history.filter(ReportHistory.generated_by == user.id)
        schedules = schedules.filter(ScheduledReport.owner_id == user.id)

    completed = history.filter(
        ReportHistory.status == ReportGenerationStatus.COMPLETED
    ).count()
    pending = history.filter(
        ReportHistory.status.in_(IN_PROGRESS_STATUSES)
    ).count()
    scheduled_count = schedules.filter(
        ScheduledReport.status == ScheduledReportStatus.ACTIVE
    ).count()
    scheduled_rows = (
        schedules
        .order_by(ScheduledReport.next_run_time.asc(), ScheduledReport.id.desc())
        .limit(10)
        .all()
    )
    recent_activity = (
        db.query(RecentActivityLog)
        .order_by(RecentActivityLog.occurred_at.desc(), RecentActivityLog.id.desc())
        .limit(100)
        .all()
    )
    return completed, scheduled_count, pending, scheduled_rows, recent_activity


def _build_kpis(
    snapshots: dict[str, KpiSnapshot],
    reports_completed: int,
    reports_scheduled: int,
    reports_pending: int,
) -> dict:
    revenue = snapshots.get("revenue")
    revenue_current = revenue.current_value if revenue else 0
    revenue_change = "N/A"
    if revenue and revenue.previous_value not in (None, 0):
        revenue_change = (
            f"{((revenue_current - revenue.previous_value) / revenue.previous_value) * 100:+.1f} %"
        )

    customers = snapshots.get("customers")
    customer_current = customers.current_value if customers else 0
    customer_change = "N/A"
    active_pct = 0.0
    if customers:
        if customers.previous_value not in (None, 0):
            customer_change = (
                f"{((customer_current - customers.previous_value) / customers.previous_value) * 100:+.1f}%"
            )
        extra = json.loads(customers.extra_json) if customers.extra_json else {}
        active_pct = float(extra.get("active_pct", 0))
        if not 0 <= active_pct <= 100:
            raise ValueError("customers.active_pct must be between 0 and 100")

    health = snapshots.get("system_health")
    health_value = health.current_value if health else 0
    health_badge = (
        "Healthy" if health_value >= 99
        else "Degraded" if health_value >= 90
        else "Critical" if health is not None
        else "Unknown"
    )

    return {
        "revenue": {
            "value": _format_currency(revenue_current),
            "label": "Total Revenue",
            "change": revenue_change,
            "changeNote": "vs last month",
        },
        "customers": {
            "value": f"{int(customer_current):,}",
            "label": "Total Customer",
            "change": customer_change,
            "changeNote": "vs last month",
            "activeLabel": f"{active_pct:g}%",
            "activeNote": "Active Clients",
            "activeProgress": round(active_pct),
        },
        "reports": {
            "value": str(reports_completed),
            "label": "Generated Reports",
            "badge": f"{reports_scheduled} Scheduled",
            "rows": [
                {"id": "scheduled", "label": "Scheduled Reports", "value": str(reports_scheduled)},
                {"id": "pending", "label": "Pending Reports", "value": str(reports_pending)},
            ],
        },
        "systemHealth": {
            "value": f"{health_value:.1f}%",
            "label": "All Systems Operational",
            "badge": health_badge,
        },
    }


def build_dashboard_overview(db: Session, user: User) -> DashboardOverview:
    """Assemble the current GitHub Dashboard response from database records."""
    snapshots = _latest_kpis(db)
    active_users = _latest_active_users(db)
    data_sources = db.query(DataSource).order_by(DataSource.id.asc()).all()
    report_data = _report_data(db, user)
    reports_completed, reports_scheduled, reports_pending, scheduled_rows, activity_rows = report_data

    active_counts = [row.user_count for row in active_users]
    average_users = int(sum(active_counts) / len(active_counts)) if active_counts else None
    peak_user_day = max(active_users, key=lambda row: row.user_count) if active_users else None
    latest_update = max(
        (row.created_at for row in active_users if row.created_at),
        default=None,
    )

    healthy = sum(
        row.status == "Active" and row.health_pct >= 90 for row in data_sources
    )
    inactive = sum(row.status == "Inactive" for row in data_sources)
    active = sum(row.status == "Active" for row in data_sources)

    schedule_output = []
    for schedule, template_name in scheduled_rows:
        local_time = to_local_iso(schedule.next_run_time, schedule.timezone)
        if local_time is None:
            raise ValueError(f"Schedule {schedule.id} has no next run time")
        scheduled_at = datetime.fromisoformat(local_time)
        hour = scheduled_at.hour % 12 or 12
        am_pm = "Am" if scheduled_at.hour < 12 else "Pm"
        status = (
            "Active" if schedule.status == ScheduledReportStatus.ACTIVE
            else "Inactive" if schedule.status == ScheduledReportStatus.PAUSED
            else "Completed"
        )
        schedule_output.append({
            "id": f"sr-{schedule.id}",
            "title": schedule.name or template_name,
            "when": f"{scheduled_at.strftime('%b')} {scheduled_at.day} "
                    f"{scheduled_at.year} at {hour} : {scheduled_at.strftime('%M')} {am_pm}",
            "status": status,
        })

    response = {
        "kpis": _build_kpis(
            snapshots,
            reports_completed,
            reports_scheduled,
            reports_pending,
        ),
        "userStats": [
            {"id": "growth", "label": "Total Growth", "value": "N/A", "tone": "green"},
            {
                "id": "peak",
                "label": "Peak Day",
                "value": peak_user_day.day_of_week if peak_user_day else "N/A",
            },
            {
                "id": "average",
                "label": "Daily Average",
                "value": f"{average_users:,}" if average_users is not None else "N/A",
            },
            {
                "id": "updated",
                "label": "Updated",
                "value": _format_sync(latest_update) if latest_update else "N/A",
            },
        ],
        "sourceStats": [
            {"id": "total", "label": "Total Source", "value": str(len(data_sources))},
            {"id": "healthy", "label": "Healthy", "value": str(healthy)},
            {"id": "warning", "label": "Warning", "value": str(max(active - healthy, 0))},
            {"id": "inactive", "label": "Inactive", "value": str(inactive)},
        ],
        "dataSources": [
            {
                "source": source.name,
                "status": source.status,
                "health": source.health_pct,
                "sync": _format_sync(source.last_sync_at),
                "latency": f"{source.latency_ms} ms",
            }
            for source in data_sources
        ],
        "scheduledReports": schedule_output,
        "recentActivity": [
            {
                "id": row.activity_ref,
                "user": row.user_name,
                "module": row.module,
                "action": row.action,
                "time": row.occurred_at.strftime("%H:%M"),
                "date": row.occurred_at.strftime("%d-%m-%Y"),
                "status": row.status,
            }
            for row in activity_rows
        ],
        "revenueTrend": [
            {"month": row.month, "value": int(round(row.value_usd))}
            for row in _latest_revenue_trend(db)
        ],
        "activeUsers": [
            {"day": row.day_of_week, "value": row.user_count}
            for row in active_users
        ],
    }
    return DashboardOverview.model_validate(response)
