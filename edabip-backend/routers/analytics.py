"""
routers/analytics.py

Dashboard & Analytics REST API — M3 + M4
=========================================

Architecture:
    Router (FastAPI endpoint)
        ↓
    Schema / Pydantic validation
        ↓
    Service  (business logic, formatting)
        ↓
    Repository (DB queries — GROUP BY / aggregations stay in the database)
        ↓
    Processed data tables  (models/analytics.py)

All endpoints require a valid JWT Bearer token (existing get_current_user dependency).
"""

from __future__ import annotations

import json
import logging
from datetime import date, datetime, timedelta, timezone
from typing import Any, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import case, func, or_
from sqlalchemy.orm import Session

from database import get_db
from utils.auth import get_current_user, require_permission
from models.user import User
from models.analytics import (
    RevenueTrend,
    ActiveUserStat,
    DataSource,
    KpiSnapshot,
    DashboardSearchHistory,
    RecentActivityLog,
    AnalyticsMetric,
    RevenueForecast,
    DemandPrediction,
    MlModel,
)
from models.reports import (
    IN_PROGRESS_STATUSES,
    ReportGenerationStatus,
    ReportHistory,
    ReportTemplate,
    ScheduledReport,
    ScheduledReportStatus,
)
from services.report_schedule import to_local_iso

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def _utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


# ============================================================
# §1 — Pydantic Schemas (response shapes consumed by frontend)
# ============================================================

# ── Dashboard ────────────────────────────────────────────────

class KpiRevenueSchema(BaseModel):
    value: str
    label: str
    change: str
    changeNote: str


class KpiReportRow(BaseModel):
    id: str
    label: str
    value: str


class KpiCustomersSchema(BaseModel):
    value: str
    label: str
    change: str
    changeNote: str
    activeLabel: str
    activeNote: str
    activeProgress: float


class KpiReportsSchema(BaseModel):
    value: str
    label: str
    badge: str
    rows: list[KpiReportRow]


class KpiSystemHealthSchema(BaseModel):
    value: str
    label: str
    badge: str


class KpisSchema(BaseModel):
    revenue: KpiRevenueSchema
    customers: KpiCustomersSchema
    reports: KpiReportsSchema
    systemHealth: KpiSystemHealthSchema


class UserStatSchema(BaseModel):
    id: str
    label: str
    value: str
    tone: Optional[str] = None


class SourceStatSchema(BaseModel):
    id: str
    label: str
    value: str


class DataSourceSchema(BaseModel):
    source: str
    status: str
    health: int
    sync: str
    latency: str


class ScheduledReportSchema(BaseModel):
    id: str
    title: str
    when: str
    status: str


class DashboardReportSchema(BaseModel):
    id: int
    title: str
    status: str
    createdAt: Optional[str] = None


class RecentActivitySchema(BaseModel):
    id: str
    user: str
    module: str
    action: str
    time: str
    date: str
    status: str


class RevenueTrendPointSchema(BaseModel):
    month: str
    value: float


class ActiveUserPointSchema(BaseModel):
    day: str
    value: int


class DashboardChartsSchema(BaseModel):
    revenueTrend: list[RevenueTrendPointSchema]
    activeUsers: list[ActiveUserPointSchema]


class DashboardResponseSchema(BaseModel):
    kpis: KpisSchema
    userStats: list[UserStatSchema]
    sourceStats: list[SourceStatSchema]
    dataSources: list[DataSourceSchema]
    scheduledReports: list[ScheduledReportSchema]
    recentReports: list[DashboardReportSchema]
    recentActivity: list[RecentActivitySchema]
    revenueTrend: list[RevenueTrendPointSchema]
    activeUsers: list[ActiveUserPointSchema]


class DashboardSearchResultSchema(BaseModel):
    type: str
    id: str
    title: str
    description: Optional[str] = None
    module: str


class DashboardSearchResponseSchema(BaseModel):
    query: str
    results: list[DashboardSearchResultSchema]
    suggestions: list[str]
    recentSearches: list[str]


# ── Analytics page ───────────────────────────────────────────

class MetricCardSchema(BaseModel):
    id: str
    label: str
    value: str
    change: str
    positive: bool
    badgeClass: Optional[str] = None


class RevenueForecastPointSchema(BaseModel):
    month: str
    value: float


class DemandPredictionPointSchema(BaseModel):
    day: str
    value: float
    color: str


class MlModelSchema(BaseModel):
    name: str
    type: str
    accuracy: str
    status: str


class AnalyticsResponseSchema(BaseModel):
    metricCards: list[MetricCardSchema]
    revenueForecast: list[RevenueForecastPointSchema]
    demandPrediction: list[DemandPredictionPointSchema]
    mlModels: list[MlModelSchema]


# ============================================================
# §2 — Repository Layer (all DB aggregation happens here)
# ============================================================

def _fmt_sync(dt: Optional[datetime]) -> str:
    """Return a human-readable 'last sync' label from a datetime."""
    if dt is None:
        return "Never"
    now = datetime.now(dt.tzinfo) if dt.tzinfo else _utcnow_naive()
    delta = now - dt
    minutes = int(delta.total_seconds() // 60)
    if minutes < 2:
        return "Just now"
    if minutes < 60:
        return f"{minutes} mins ago"
    hours = minutes // 60
    if hours < 24:
        return f"{hours} hr{'s' if hours > 1 else ''} ago"
    return f"{delta.days} day{'s' if delta.days > 1 else ''} ago"


def repo_get_kpis(db: Session) -> list[KpiSnapshot]:
    """Return the most recent KPI snapshot per metric."""
    # Subquery: latest snapshot_date per metric
    subq = (
        db.query(
            KpiSnapshot.metric,
            func.max(KpiSnapshot.snapshot_date).label("max_date"),
        )
        .group_by(KpiSnapshot.metric)
        .subquery()
    )
    rows = (
        db.query(KpiSnapshot)
        .join(
            subq,
            (KpiSnapshot.metric == subq.c.metric)
            & (KpiSnapshot.snapshot_date == subq.c.max_date),
        )
        .all()
    )
    return rows


def repo_get_revenue_trend(
    db: Session,
    months: int = 9,
    date_from: date | None = None,
    date_to: date | None = None,
) -> list[RevenueTrend]:
    """Return the N most recent monthly revenue rows ordered by year/month."""
    month_order = case(
        {
            "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
            "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12,
        },
        value=RevenueTrend.month,
        else_=13,
    )
    query = db.query(RevenueTrend)
    if date_from:
        query = query.filter(or_(
            RevenueTrend.year > date_from.year,
            (RevenueTrend.year == date_from.year) & (month_order >= date_from.month),
        ))
    if date_to:
        query = query.filter(or_(
            RevenueTrend.year < date_to.year,
            (RevenueTrend.year == date_to.year) & (month_order <= date_to.month),
        ))
    rows = (
        query
        .order_by(RevenueTrend.year.desc(), month_order.desc(), RevenueTrend.id.desc())
        .limit(months)
        .all()
    )
    return list(reversed(rows))


def repo_get_active_users(
    db: Session, week_start: date | None = None
) -> list[ActiveUserStat]:
    """Return one week's active-user stats ordered by weekday."""
    latest_week = week_start or db.query(func.max(ActiveUserStat.week_start)).scalar()
    query = db.query(ActiveUserStat)
    if latest_week is None:
        query = query.filter(ActiveUserStat.week_start.is_(None))
    else:
        query = query.filter(ActiveUserStat.week_start == latest_week)
    return query.order_by(ActiveUserStat.day_order.asc(), ActiveUserStat.id.asc()).all()


def repo_get_data_sources(db: Session) -> list[DataSource]:
    """Return all data-source records ordered by id."""
    return db.query(DataSource).order_by(DataSource.id.asc()).all()


def repo_get_source_stats(db: Session) -> dict[str, Any]:
    """Aggregate data-source counts: total, healthy, warning, inactive."""
    total    = db.query(func.count(DataSource.id)).scalar() or 0
    active   = db.query(func.count(DataSource.id)).filter(DataSource.status == "Active").scalar() or 0
    inactive = db.query(func.count(DataSource.id)).filter(DataSource.status == "Inactive").scalar() or 0
    # Healthy = active with health >= 90, warning = active with health < 90
    healthy  = db.query(func.count(DataSource.id)).filter(
        DataSource.status == "Active", DataSource.health_pct >= 90
    ).scalar() or 0
    warning  = active - healthy
    return {"total": total, "healthy": healthy, "warning": max(warning, 0), "inactive": inactive}


def _is_admin(user: User) -> bool:
    return bool(user.role and user.role.name == "admin")


def _has_permission(user: User, permission: str) -> bool:
    if _is_admin(user):
        return True
    return bool(
        user.role
        and any(item.name == permission for item in user.role.permissions)
    )


def repo_get_report_data(db: Session, user: User) -> dict[str, Any]:
    """Read Dashboard report counts and rows from the Reports module tables."""
    if not _has_permission(user, "reports.view"):
        return {
            "completed": 0,
            "scheduled": 0,
            "pending": 0,
            "schedules": [],
            "recent": [],
        }

    history_query = db.query(ReportHistory).filter(ReportHistory.is_archived.is_(False))
    schedules_query = db.query(ScheduledReport, ReportTemplate.name).join(
        ReportTemplate, ReportTemplate.id == ScheduledReport.template_id
    )
    if not _is_admin(user):
        history_query = history_query.filter(ReportHistory.generated_by == user.id)
        schedules_query = schedules_query.filter(ScheduledReport.owner_id == user.id)

    completed = history_query.filter(
        ReportHistory.status == ReportGenerationStatus.COMPLETED
    ).count()
    pending = history_query.filter(
        ReportHistory.status.in_(IN_PROGRESS_STATUSES)
    ).count()
    schedules = (
        schedules_query
        .order_by(ScheduledReport.next_run_time.asc(), ScheduledReport.id.desc())
        .limit(10)
        .all()
    )
    active_scheduled = schedules_query.filter(
        ScheduledReport.status == ScheduledReportStatus.ACTIVE
    ).count()
    recent = (
        history_query
        .order_by(ReportHistory.created_at.desc(), ReportHistory.id.desc())
        .limit(10)
        .all()
    )
    return {
        "completed": completed,
        "scheduled": active_scheduled,
        "pending": pending,
        "schedules": schedules,
        "recent": recent,
    }


def repo_get_recent_activity(
    db: Session,
    *,
    page: int = 1,
    page_size: int = 100,
    search: str | None = None,
    module: str | None = None,
    status: str | None = None,
    user: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    sort_by: str = "occurred_at",
    order: str = "desc",
) -> tuple[list[RecentActivityLog], int]:
    """Return a filtered and paginated activity result with deterministic ordering."""
    query = db.query(RecentActivityLog)
    if search:
        escaped = search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        pattern = f"%{escaped}%"
        query = query.filter(or_(
            RecentActivityLog.activity_ref.ilike(pattern, escape="\\"),
            RecentActivityLog.user_name.ilike(pattern, escape="\\"),
            RecentActivityLog.module.ilike(pattern, escape="\\"),
            RecentActivityLog.action.ilike(pattern, escape="\\"),
            RecentActivityLog.status.ilike(pattern, escape="\\"),
        ))
    if module:
        escaped_module = module.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        query = query.filter(
            RecentActivityLog.module.ilike(escaped_module, escape="\\")
        )
    if status:
        escaped_status = status.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        query = query.filter(
            RecentActivityLog.status.ilike(escaped_status, escape="\\")
        )
    if user:
        escaped_user = user.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        query = query.filter(
            RecentActivityLog.user_name.ilike(f"%{escaped_user}%", escape="\\")
        )
    if date_from:
        query = query.filter(RecentActivityLog.occurred_at >= datetime.combine(date_from, datetime.min.time()))
    if date_to and date_to < date.max:
        query = query.filter(
            RecentActivityLog.occurred_at < datetime.combine(
                date_to + timedelta(days=1), datetime.min.time()
            )
        )

    total = query.count()
    sort_columns = {
        "occurred_at": RecentActivityLog.occurred_at,
        "id": RecentActivityLog.id,
        "user": RecentActivityLog.user_name,
        "module": RecentActivityLog.module,
        "action": RecentActivityLog.action,
        "status": RecentActivityLog.status,
    }
    column = sort_columns[sort_by]
    sort_column = column.desc() if order == "desc" else column.asc()
    rows = (
        query.order_by(sort_column, RecentActivityLog.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return rows, total


def _search_pattern(term: str) -> str:
    escaped = term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


def _search_result(
    result_type: str,
    result_id: str | int,
    title: str,
    module: str,
    description: str | None = None,
) -> DashboardSearchResultSchema:
    return DashboardSearchResultSchema(
        type=result_type,
        id=str(result_id),
        title=title,
        description=description,
        module=module,
    )


def repo_search_dashboard(
    db: Session, user: User, term: str
) -> list[DashboardSearchResultSchema]:
    """Search only datasets the caller is permitted to see."""
    pattern = _search_pattern(term)
    results: list[DashboardSearchResultSchema] = []

    if _has_permission(user, "dashboard.view"):
        for row in (
            db.query(KpiSnapshot)
            .filter(KpiSnapshot.metric.ilike(pattern, escape="\\"))
            .order_by(KpiSnapshot.snapshot_date.desc(), KpiSnapshot.id.desc())
            .limit(5)
        ):
            results.append(_search_result(
                "kpi", row.metric, row.metric.replace("_", " ").title(), "Dashboard",
                row.period_label,
            ))
        for row in (
            db.query(DataSource)
            .filter(DataSource.name.ilike(pattern, escape="\\"))
            .order_by(DataSource.name.asc(), DataSource.id.asc())
            .limit(5)
        ):
            results.append(_search_result(
                "data_source", row.id, row.name, "Dashboard", row.status,
            ))
    if _has_permission(user, "analytics.advanced"):
        for row in (
            db.query(AnalyticsMetric)
            .filter(AnalyticsMetric.display_label.ilike(pattern, escape="\\"))
            .order_by(AnalyticsMetric.snapshot_date.desc(), AnalyticsMetric.id.desc())
            .limit(5)
        ):
            results.append(_search_result(
                "analytics", row.metric_name, row.display_label, "Analytics",
                row.value_display,
            ))
        for row in (
            db.query(MlModel)
            .filter(MlModel.name.ilike(pattern, escape="\\"))
            .order_by(MlModel.display_order.asc(), MlModel.id.asc())
            .limit(5)
        ):
            results.append(_search_result(
                "analytics_model", row.id, row.name, "Analytics", row.model_type,
            ))

    if _has_permission(user, "reports.view"):
        report_templates = (
            db.query(ReportTemplate)
            .filter(
                ReportTemplate.is_active.is_(True),
                ReportTemplate.approval_status == "approved",
                or_(
                    ReportTemplate.name.ilike(pattern, escape="\\"),
                    ReportTemplate.category.ilike(pattern, escape="\\"),
                    ReportTemplate.description.ilike(pattern, escape="\\"),
                ),
            )
            .order_by(ReportTemplate.name.asc(), ReportTemplate.id.asc())
            .limit(10)
            .all()
        )
        for template in report_templates:
            allowed_roles = json.loads(template.allowed_roles_json) if template.allowed_roles_json else []
            if (
                allowed_roles
                and not _is_admin(user)
                and (not user.role or user.role.name not in allowed_roles)
            ):
                continue
            results.append(_search_result(
                "report_template", template.id, template.name, "Reports",
                template.category,
            ))

        history_query = db.query(ReportHistory).filter(
            ReportHistory.is_archived.is_(False),
            ReportHistory.report_name.ilike(pattern, escape="\\"),
        )
        schedules_query = (
            db.query(ScheduledReport, ReportTemplate.name)
            .join(ReportTemplate, ReportTemplate.id == ScheduledReport.template_id)
            .filter(or_(
                ScheduledReport.name.ilike(pattern, escape="\\"),
                ReportTemplate.name.ilike(pattern, escape="\\"),
            ))
        )
        if not _is_admin(user):
            history_query = history_query.filter(ReportHistory.generated_by == user.id)
            schedules_query = schedules_query.filter(ScheduledReport.owner_id == user.id)
        for report in history_query.order_by(
            ReportHistory.created_at.desc(), ReportHistory.id.desc()
        ).limit(5):
            results.append(_search_result(
                "report", report.id, report.report_name, "Reports",
                report.status.value,
            ))
        for schedule, template_name in schedules_query.order_by(
            ScheduledReport.next_run_time.asc(), ScheduledReport.id.desc()
        ).limit(5):
            results.append(_search_result(
                "scheduled_report", schedule.id, schedule.name or template_name,
                "Reports", schedule.status.value,
            ))

    if _has_permission(user, "users.view"):
        users = (
            db.query(User)
            .filter(or_(
                User.full_name.ilike(pattern, escape="\\"),
                User.email.ilike(pattern, escape="\\"),
            ))
            .order_by(User.full_name.asc(), User.id.asc())
            .limit(5)
            .all()
        )
        for matched_user in users:
            results.append(_search_result(
                "user", matched_user.id, matched_user.full_name, "Users",
                matched_user.email,
            ))

    return results[:25]


def repo_get_recent_searches(db: Session, user_id: int) -> list[str]:
    return [
        row.term
        for row in (
            db.query(DashboardSearchHistory)
            .filter(DashboardSearchHistory.user_id == user_id)
            .order_by(
                DashboardSearchHistory.last_searched_at.desc(),
                DashboardSearchHistory.id.desc(),
            )
            .limit(10)
        )
    ]


def repo_record_search(db: Session, user_id: int, term: str) -> None:
    term_key = term.casefold()
    row = (
        db.query(DashboardSearchHistory)
        .filter(
            DashboardSearchHistory.user_id == user_id,
            DashboardSearchHistory.term_key == term_key,
        )
        .first()
    )
    if row:
        row.term = term
        row.last_searched_at = _utcnow_naive()
    else:
        db.add(DashboardSearchHistory(
            user_id=user_id,
            term=term,
            term_key=term_key,
            last_searched_at=_utcnow_naive(),
        ))
    db.flush()
    old_ids = (
        db.query(DashboardSearchHistory.id)
        .filter(DashboardSearchHistory.user_id == user_id)
        .order_by(
            DashboardSearchHistory.last_searched_at.desc(),
            DashboardSearchHistory.id.desc(),
        )
        .offset(10)
        .all()
    )
    if old_ids:
        db.query(DashboardSearchHistory).filter(
            DashboardSearchHistory.id.in_([row_id for (row_id,) in old_ids])
        ).delete(synchronize_session=False)
    db.commit()


# ── Analytics page repositories ──────────────────────────────

def repo_get_analytics_metrics(db: Session, period: str = "Last 6 Months") -> list[AnalyticsMetric]:
    """Return ML metric cards for the given period, latest snapshot per metric."""
    subq = (
        db.query(
            AnalyticsMetric.metric_name,
            func.max(AnalyticsMetric.snapshot_date).label("max_date"),
        )
        .filter(AnalyticsMetric.period == period)
        .group_by(AnalyticsMetric.metric_name)
        .subquery()
    )
    rows = (
        db.query(AnalyticsMetric)
        .join(
            subq,
            (AnalyticsMetric.metric_name == subq.c.metric_name)
            & (AnalyticsMetric.snapshot_date == subq.c.max_date),
        )
        .filter(AnalyticsMetric.period == period)
        .all()
    )
    return rows


def repo_get_revenue_forecast(db: Session, months: int = 9) -> list[RevenueForecast]:
    """Return monthly revenue forecast rows ordered chronologically."""
    return (
        db.query(RevenueForecast)
        .order_by(RevenueForecast.year.asc(), RevenueForecast.month_order.asc())
        .limit(months)
        .all()
    )


def repo_get_demand_prediction(db: Session) -> list[DemandPrediction]:
    """Return day-of-week demand prediction ordered by day_order."""
    return (
        db.query(DemandPrediction)
        .order_by(DemandPrediction.day_order.asc())
        .all()
    )


def repo_get_ml_models(db: Session) -> list[MlModel]:
    """Return all ML model registry entries ordered by display_order."""
    return db.query(MlModel).order_by(MlModel.display_order.asc()).all()


# ============================================================
# §3 — Service Layer (business logic, formatting, assembly)
# ============================================================

def _pct_change(current: float, previous: Optional[float]) -> Optional[float]:
    """Compute percentage change, guarding against zero-division."""
    if previous is None or previous == 0:
        return None
    return ((current - previous) / previous) * 100


def _fmt_currency(value: float) -> str:
    """Format a USD float to a compact string like '$2.84M' or '$284K'."""
    if value >= 1_000_000:
        return f"${value / 1_000_000:.2f}M"
    if value >= 1_000:
        return f"${value / 1_000:.0f}K"
    return f"${value:.0f}"


def _fmt_number(value: float) -> str:
    """Format a number with comma separators."""
    return f"{int(value):,}"


def svc_build_kpis(
    rows: list[KpiSnapshot],
    report_data: dict[str, Any] | None = None,
) -> KpisSchema:
    """Assemble KpisSchema from snapshot rows."""
    idx: dict[str, KpiSnapshot] = {r.metric: r for r in rows}

    # ── Revenue ──────────────────────────────────────────────
    rev = idx.get("revenue")
    if rev:
        rev_current  = rev.current_value
        rev_previous = rev.previous_value
        rev_pct      = _pct_change(rev_current, rev_previous)
        rev_change   = f"{rev_pct:+.1f} %" if rev_pct is not None else "N/A"
        revenue_schema = KpiRevenueSchema(
            value=_fmt_currency(rev_current),
            label="Total Revenue",
            change=rev_change,
            changeNote="vs last month",
        )
    else:
        revenue_schema = KpiRevenueSchema(
            value="$0", label="Total Revenue", change="N/A", changeNote="vs last month"
        )

    # ── Customers ────────────────────────────────────────────
    cust = idx.get("customers")
    if cust:
        cust_current  = cust.current_value
        cust_previous = cust.previous_value
        cust_pct      = _pct_change(cust_current, cust_previous)
        cust_change   = f"{cust_pct:+.1f}%" if cust_pct is not None else "N/A"
        extra = json.loads(cust.extra_json) if cust.extra_json else {}
        active_pct    = float(extra.get("active_pct", 0))
        if not 0 <= active_pct <= 100:
            raise ValueError("customers.active_pct must be between 0 and 100")
        customers_schema = KpiCustomersSchema(
            value=_fmt_number(cust_current),
            label="Total Customer",
            change=cust_change,
            changeNote="vs last month",
            activeLabel=f"{active_pct}%",
            activeNote="Active Clients",
            activeProgress=float(active_pct),
        )
    else:
        customers_schema = KpiCustomersSchema(
            value="0", label="Total Customer", change="N/A", changeNote="vs last month",
            activeLabel="0%", activeNote="Active Clients", activeProgress=0.0,
        )

    # ── Reports ──────────────────────────────────────────────
    rep = idx.get("reports")
    if report_data is not None:
        scheduled_count = report_data["scheduled"]
        pending_count = report_data["pending"]
        reports_schema = KpiReportsSchema(
            value=str(report_data["completed"]),
            label="Generated Reports",
            badge=f"{scheduled_count} Scheduled",
            rows=[
                KpiReportRow(id="scheduled", label="Scheduled Reports", value=str(scheduled_count)),
                KpiReportRow(id="pending", label="Pending Reports", value=str(pending_count)),
            ],
        )
    elif rep:
        extra = json.loads(rep.extra_json) if rep.extra_json else {}
        scheduled_count = extra.get("scheduled", 0)
        pending_count   = extra.get("pending", 0)
        reports_schema = KpiReportsSchema(
            value=str(int(rep.current_value)),
            label="Generated Reports",
            badge=f"{scheduled_count} Scheduled",
            rows=[
                KpiReportRow(id="scheduled", label="Scheduled Reports", value=str(scheduled_count)),
                KpiReportRow(id="pending",   label="Pending Reports",   value=str(pending_count)),
            ],
        )
    else:
        reports_schema = KpiReportsSchema(
            value="0", label="Generated Reports", badge="0 Scheduled",
            rows=[
                KpiReportRow(id="scheduled", label="Scheduled Reports", value="0"),
                KpiReportRow(id="pending",   label="Pending Reports",   value="0"),
            ],
        )

    # ── System Health ────────────────────────────────────────
    health = idx.get("system_health")
    if health:
        pct   = health.current_value
        badge = "Healthy" if pct >= 99 else ("Degraded" if pct >= 90 else "Critical")
        system_health_schema = KpiSystemHealthSchema(
            value=f"{pct:.1f}%",
            label="All Systems Operational",
            badge=badge,
        )
    else:
        system_health_schema = KpiSystemHealthSchema(
            value="0%", label="All Systems Operational", badge="Unknown"
        )

    return KpisSchema(
        revenue=revenue_schema,
        customers=customers_schema,
        reports=reports_schema,
        systemHealth=system_health_schema,
    )


def svc_build_user_stats(active_users: list[ActiveUserStat]) -> list[UserStatSchema]:
    """Derive user statistics from the active-user weekly data."""
    if not active_users:
        return [
            UserStatSchema(id="growth",  label="Total Growth",  value="N/A", tone="green"),
            UserStatSchema(id="peak",    label="Peak Day",      value="N/A"),
            UserStatSchema(id="average", label="Daily Average", value="N/A"),
            UserStatSchema(id="updated", label="Updated",       value="N/A"),
        ]

    counts = [u.user_count for u in active_users]
    avg    = int(sum(counts) / len(counts))
    peak   = max(active_users, key=lambda u: u.user_count)
    latest_update = max((u.created_at for u in active_users if u.created_at), default=None)

    return [
        UserStatSchema(id="growth",  label="Total Growth",  value="N/A", tone="green"),
        UserStatSchema(id="peak",    label="Peak Day",      value=peak.day_of_week),
        UserStatSchema(id="average", label="Daily Average", value=f"{avg:,}"),
        UserStatSchema(
            id="updated",
            label="Updated",
            value=_fmt_sync(latest_update) if latest_update else "N/A",
        ),
    ]


def svc_build_source_stats(counts: dict[str, Any]) -> list[SourceStatSchema]:
    return [
        SourceStatSchema(id="total",    label="Total Source", value=str(counts["total"])),
        SourceStatSchema(id="healthy",  label="Healthy",      value=str(counts["healthy"])),
        SourceStatSchema(id="warning",  label="Warning",      value=str(counts["warning"])),
        SourceStatSchema(id="inactive", label="Inactive",     value=str(counts["inactive"])),
    ]


def svc_build_data_sources(rows: list[DataSource]) -> list[DataSourceSchema]:
    return [
        DataSourceSchema(
            source=ds.name,
            status=ds.status,
            health=ds.health_pct,
            sync=_fmt_sync(ds.last_sync_at),
            latency=f"{ds.latency_ms} ms",
        )
        for ds in rows
    ]


def svc_build_scheduled_reports(
    rows: list[tuple[ScheduledReport, str]],
) -> list[ScheduledReportSchema]:
    def _fmt_scheduled(report: ScheduledReport) -> str:
        """Format the stored schedule time as a human-readable label."""
        local_value = to_local_iso(report.next_run_time, report.timezone)
        if local_value is None:
            raise ValueError(f"Schedule {report.id} has no next run time")
        dt = datetime.fromisoformat(local_value)
        hour = dt.hour % 12 or 12
        minute = dt.strftime("%M")
        ampm = "Am" if dt.hour < 12 else "Pm"
        return f"{dt.strftime('%b')} {dt.day} {dt.year} at {hour} : {minute} {ampm}"

    def _display_status(status: ScheduledReportStatus) -> str:
        if status == ScheduledReportStatus.ACTIVE:
            return "Active"
        if status == ScheduledReportStatus.PAUSED:
            return "Inactive"
        return "Completed"

    return [
        ScheduledReportSchema(
            id=f"sr-{report.id}",
            title=report.name or template_name,
            when=_fmt_scheduled(report),
            status=_display_status(report.status),
        )
        for report, template_name in rows
    ]


def svc_build_recent_reports(rows: list[ReportHistory]) -> list[DashboardReportSchema]:
    return [
        DashboardReportSchema(
            id=report.id,
            title=report.report_name,
            status=report.status.value,
            createdAt=report.created_at.isoformat() if report.created_at else None,
        )
        for report in rows
    ]


def svc_build_recent_activity(rows: list[RecentActivityLog]) -> list[RecentActivitySchema]:
    return [
        RecentActivitySchema(
            id=r.activity_ref,
            user=r.user_name,
            module=r.module,
            action=r.action,
            time=r.occurred_at.strftime("%H:%M") if r.occurred_at else "",
            date=r.occurred_at.strftime("%d-%m-%Y") if r.occurred_at else "",
            status=r.status,
        )
        for r in rows
    ]


def svc_build_analytics_metrics(rows: list[AnalyticsMetric]) -> list[MetricCardSchema]:
    return [
        MetricCardSchema(
            id=m.metric_name,
            label=m.display_label,
            value=m.value_display,
            change=m.change_label or "",
            positive=m.is_positive,
            badgeClass=m.badge_class,
        )
        for m in rows
    ]


def svc_build_revenue_forecast(rows: list[RevenueForecast]) -> list[RevenueForecastPointSchema]:
    return [RevenueForecastPointSchema(month=r.month, value=r.forecast_usd) for r in rows]


def svc_build_demand_prediction(rows: list[DemandPrediction]) -> list[DemandPredictionPointSchema]:
    return [
        DemandPredictionPointSchema(day=r.day_of_week, value=r.predicted_demand, color=r.bar_color)
        for r in rows
    ]


def svc_build_ml_models(rows: list[MlModel]) -> list[MlModelSchema]:
    return [
        MlModelSchema(name=m.name, type=m.model_type, accuracy=m.accuracy, status=m.status)
        for m in rows
    ]


# ============================================================
# §4 — Router Endpoints
# ============================================================

def _db_guard(func_name: str, exc: Exception) -> None:
    """Log and re-raise database errors as 503 so stack traces are not exposed."""
    logger.exception("[analytics] %s failed: %s", func_name, exc)
    raise HTTPException(status_code=503, detail="Analytics data temporarily unavailable.")


# ── GET /analytics/dashboard ─────────────────────────────────

@router.get("/dashboard", response_model=DashboardResponseSchema, dependencies=[Depends(require_permission("dashboard.view"))])
def get_dashboard(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """
    Return the full dashboard payload consumed by useDashboardData.js.

    Response shape matches the DASHBOARD_DATA constant in dashboardApi.js:
    {kpis, userStats, sourceStats, dataSources, scheduledReports, recentActivity}
    """
    try:
        kpi_rows      = repo_get_kpis(db)
        revenue_trend = repo_get_revenue_trend(db)
        active_users  = repo_get_active_users(db)
        source_counts = repo_get_source_stats(db)
        data_sources  = repo_get_data_sources(db)
        report_data   = repo_get_report_data(db, _current_user)
        activity, _   = repo_get_recent_activity(db, page_size=100)
        response = DashboardResponseSchema(
            kpis=svc_build_kpis(kpi_rows, report_data=report_data),
            userStats=svc_build_user_stats(active_users),
            sourceStats=svc_build_source_stats(source_counts),
            dataSources=svc_build_data_sources(data_sources),
            scheduledReports=svc_build_scheduled_reports(report_data["schedules"]),
            recentReports=svc_build_recent_reports(report_data["recent"]),
            recentActivity=svc_build_recent_activity(activity),
            revenueTrend=[
                RevenueTrendPointSchema(month=row.month, value=row.value_usd)
                for row in revenue_trend
            ],
            activeUsers=[
                ActiveUserPointSchema(day=row.day_of_week, value=row.user_count)
                for row in active_users
            ],
        )
        return response
    except HTTPException:
        raise
    except Exception as exc:
        _db_guard("get_dashboard", exc)


# ── GET /analytics/kpis ──────────────────────────────────────

@router.get("/kpis", response_model=KpisSchema, dependencies=[Depends(require_permission("dashboard.view"))])
def get_kpis(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Return just the KPI cards (revenue, customers, reports, system health)."""
    try:
        rows = repo_get_kpis(db)
        report_data = repo_get_report_data(db, _current_user)
        return svc_build_kpis(rows, report_data=report_data)
    except HTTPException:
        raise
    except Exception as exc:
        _db_guard("get_kpis", exc)


# ── GET /analytics/charts/revenue-trend ──────────────────────

@router.get("/charts/revenue-trend", response_model=dict, dependencies=[Depends(require_permission("dashboard.view"))])
def get_revenue_trend(
    months: int = Query(default=9, ge=1, le=24, description="Number of months to return"),
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """
    Return monthly revenue trend data.
    Frontend shape: { "points": [{"month": "Jan", "value": 28000}, ...] }
    """
    if date_from and date_to and date_from > date_to:
        raise HTTPException(status_code=422, detail="date_from must not be after date_to")
    try:
        rows = repo_get_revenue_trend(
            db, months=months, date_from=date_from, date_to=date_to
        )
    except Exception as exc:
        _db_guard("get_revenue_trend", exc)
    points = [{"month": r.month, "value": r.value_usd} for r in rows]
    return {"points": points}


# ── GET /analytics/charts/active-users ───────────────────────

@router.get("/charts/active-users", response_model=dict, dependencies=[Depends(require_permission("dashboard.view"))])
def get_active_users(
    week_start: date | None = Query(default=None, description="Monday date for the selected week"),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """
    Return current-week day-of-week active user counts.
    Frontend shape: { "points": [{"day": "Sun", "value": 50000}, ...] }
    """
    try:
        rows = repo_get_active_users(db, week_start=week_start)
    except Exception as exc:
        _db_guard("get_active_users", exc)
    points = [{"day": r.day_of_week, "value": r.user_count} for r in rows]
    selected_week = rows[0].week_start.isoformat() if rows and rows[0].week_start else None
    return {"weekStart": selected_week, "points": points}


# ── GET /analytics/activity ──────────────────────────────────

@router.get("/activity", response_model=dict, dependencies=[Depends(require_permission("dashboard.view"))])
def get_activity(
    page: int = Query(default=1, ge=1, le=1_000_000),
    page_size: int = Query(default=100, ge=1, le=100),
    limit: int | None = Query(default=None, ge=1, le=100, description="Deprecated alias for page_size"),
    search: Optional[str] = Query(default=None, max_length=100),
    module: str | None = Query(default=None, max_length=100),
    status: str | None = Query(default=None, max_length=20),
    user: str | None = Query(default=None, max_length=160),
    date_from: date | None = None,
    date_to: date | None = None,
    sort_by: Literal["occurred_at", "id", "user", "module", "action", "status"] = "occurred_at",
    order: Literal["asc", "desc"] = "desc",
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """
    Return recent activity log entries (searchable).
    Frontend shape: { "items": [RecentActivitySchema, ...] }
    """
    if date_from and date_to and date_from > date_to:
        raise HTTPException(status_code=422, detail="date_from must not be after date_to")
    normalized_search = search.strip() if search and search.strip() else None
    try:
        rows, total = repo_get_recent_activity(
            db,
            page=page,
            page_size=limit or page_size,
            search=normalized_search,
            module=module.strip() if module and module.strip() else None,
            status=status.strip() if status and status.strip() else None,
            user=user.strip() if user and user.strip() else None,
            date_from=date_from,
            date_to=date_to,
            sort_by=sort_by,
            order=order,
        )
        items = svc_build_recent_activity(rows)
    except Exception as exc:
        _db_guard("get_activity", exc)
    return {
        "items": items,
        "page": page,
        "page_size": limit or page_size,
        "total": total,
    }


@router.get(
    "/search",
    response_model=DashboardSearchResponseSchema,
    dependencies=[Depends(require_permission("dashboard.view"))],
)
def search_dashboard(
    q: str = Query(default="", max_length=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search dashboard data and other modules available to the signed-in user."""
    term = q.strip()
    if len(term) > 100:
        raise HTTPException(status_code=422, detail="Search must be at most 100 characters.")
    try:
        results = repo_search_dashboard(db, current_user, term) if term else []
        if term:
            repo_record_search(db, current_user.id, term)
        recent_searches = repo_get_recent_searches(db, current_user.id)
    except Exception as exc:
        _db_guard("search_dashboard", exc)
    suggestions = list(dict.fromkeys(result.title for result in results))[:5] if len(term) >= 3 else []
    return DashboardSearchResponseSchema(
        query=term,
        results=results,
        suggestions=suggestions,
        recentSearches=recent_searches,
    )


# ── GET /analytics/metrics ───────────────────────────────────

@router.get("/metrics", response_model=AnalyticsResponseSchema, dependencies=[Depends(require_permission("analytics.advanced"))])
def get_analytics(
    period: str = Query(default="Last 6 Months", description="Time period filter"),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """
    Return the full Analytics page payload:
    metricCards, revenueForecast, demandPrediction, mlModels.
    """
    try:
        metric_rows  = repo_get_analytics_metrics(db, period=period)
        forecast     = repo_get_revenue_forecast(db)
        demand       = repo_get_demand_prediction(db)
        ml_models    = repo_get_ml_models(db)
    except Exception as exc:
        _db_guard("get_analytics", exc)

    return AnalyticsResponseSchema(
        metricCards=svc_build_analytics_metrics(metric_rows),
        revenueForecast=svc_build_revenue_forecast(forecast),
        demandPrediction=svc_build_demand_prediction(demand),
        mlModels=svc_build_ml_models(ml_models),
    )


# ── GET /analytics/charts/revenue-forecast ───────────────────

@router.get("/charts/revenue-forecast", response_model=dict, dependencies=[Depends(require_permission("analytics.advanced"))])
def get_revenue_forecast(
    months: int = Query(default=9, ge=1, le=24),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """
    Return revenue forecast points for the Analytics page chart.
    Frontend shape: { "points": [{"month": "Jan", "value": 26000}, ...] }
    """
    try:
        rows = repo_get_revenue_forecast(db, months=months)
    except Exception as exc:
        _db_guard("get_revenue_forecast", exc)
    points = [{"month": r.month, "value": r.forecast_usd} for r in rows]
    return {"points": points}


# ── GET /analytics/charts/demand-prediction ──────────────────

@router.get("/charts/demand-prediction", response_model=dict, dependencies=[Depends(require_permission("analytics.advanced"))])
def get_demand_prediction(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """
    Return demand prediction bar chart data for the Analytics page.
    Frontend shape: { "points": [{"day": "Mon", "value": 23000, "color": "#ABF2E8"}, ...] }
    """
    try:
        rows = repo_get_demand_prediction(db)
    except Exception as exc:
        _db_guard("get_demand_prediction", exc)
    points = [{"day": r.day_of_week, "value": r.predicted_demand, "color": r.bar_color} for r in rows]
    return {"points": points}


# ── GET /analytics/ml-models ─────────────────────────────────

@router.get("/ml-models", response_model=dict, dependencies=[Depends(require_permission("analytics.advanced"))])
def get_ml_models(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """
    Return ML model registry entries for the Analytics page table.
    Frontend shape: { "models": [MlModelSchema, ...] }
    """
    try:
        rows = repo_get_ml_models(db)
    except Exception as exc:
        _db_guard("get_ml_models", exc)
    return {"models": svc_build_ml_models(rows)}
