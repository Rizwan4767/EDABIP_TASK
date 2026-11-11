"""
models/analytics.py

Processed-data interface tables for the Dashboard & Analytics module.

These tables act as the boundary between the ETL/data-warehouse layer and the
analytics API layer.  Once the ETL developer populates them from real sources
the analytics APIs will automatically serve live data — only the seed script
needs to be replaced, no API or service code changes are required.

Tables
------
- RevenueTrend         — monthly revenue figures used by the Revenue Trend chart
- ActiveUserStat       — day-of-week active-user counts used by the Active Users chart
- DataSource           — connected data-source status and health
- KpiSnapshot          — point-in-time KPI values (Revenue, Customers, etc.)
- ScheduledReport      — scheduled report entries shown on the dashboard card
- RecentActivityLog    — audit/activity events shown in the Recent Activity table
- AnalyticsMetric      — ML model performance metrics (Accuracy, Precision, Recall, F1)
- RevenueForecast      — monthly revenue forecast data for the Analytics page
- DemandPrediction     — day-of-week demand forecast for the Analytics page
- MlModel              — ML model registry entries
"""

from sqlalchemy import (
    Boolean, Column, Date, DateTime, Float, ForeignKey, Index, Integer, SmallInteger,
    String, Text, UniqueConstraint,
)
from sqlalchemy.sql import func
from database import Base


# ── Dashboard ──────────────────────────────────────────────────────────────

class RevenueTrend(Base):
    """Monthly revenue actuals — drives the Revenue Trend line chart."""
    __tablename__ = "analytics_revenue_trend"

    id           = Column(Integer, primary_key=True, index=True)
    month        = Column(String(10), nullable=False)   # e.g. "Jan", "Feb"
    year         = Column(Integer,    nullable=False)
    value_usd    = Column(Float,      nullable=False, default=0.0)
    created_at   = Column(DateTime,   server_default=func.now())


class ActiveUserStat(Base):
    """Weekly day-of-week active-user counts — drives the Active Users bar chart."""
    __tablename__ = "analytics_active_user_stats"

    id           = Column(Integer, primary_key=True, index=True)
    day_of_week  = Column(String(10), nullable=False)   # "Sun", "Mon", …
    day_order    = Column(SmallInteger, nullable=False)  # 0-6 for correct ordering
    user_count   = Column(Integer,    nullable=False, default=0)
    week_start   = Column(Date,       nullable=True)    # ISO date of Monday
    created_at   = Column(DateTime,   server_default=func.now())


class DataSource(Base):
    """Connected data-source health — drives the Active Data Source table."""
    __tablename__ = "analytics_data_sources"

    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String(120), nullable=False)
    status       = Column(String(20),  nullable=False, default="Active")   # Active | Inactive
    health_pct   = Column(Integer,     nullable=False, default=100)        # 0-100
    last_sync_at = Column(DateTime,    nullable=True)
    latency_ms   = Column(Integer,     nullable=False, default=0)
    created_at   = Column(DateTime,    server_default=func.now())


class KpiSnapshot(Base):
    """Point-in-time KPI values — drives the four KPI cards on the dashboard."""
    __tablename__ = "analytics_kpi_snapshots"

    id             = Column(Integer, primary_key=True, index=True)
    metric         = Column(String(60), nullable=False)   # "revenue", "customers", "reports", "system_health"
    period_label   = Column(String(40), nullable=False)   # "2026-08", "2026-07"  (YYYY-MM)
    current_value  = Column(Float,  nullable=False, default=0.0)
    previous_value = Column(Float,  nullable=True)
    extra_json     = Column(Text,   nullable=True)        # JSON for complex KPIs (rows, badge, etc.)
    snapshot_date  = Column(Date,   nullable=False)
    created_at     = Column(DateTime, server_default=func.now())


class DashboardScheduledReport(Base):
    """Scheduled reports — drives the Recent Activity / scheduled card."""
    __tablename__ = "analytics_scheduled_reports"

    id           = Column(Integer, primary_key=True, index=True)
    title        = Column(String(200), nullable=False)
    scheduled_at = Column(DateTime,    nullable=False)
    status       = Column(String(20),  nullable=False, default="Active")  # Active | Inactive
    created_at   = Column(DateTime,    server_default=func.now())


class RecentActivityLog(Base):
    """Activity log entries — drives the searchable Recent Activity table."""
    __tablename__ = "analytics_recent_activity"

    id            = Column(Integer, primary_key=True, index=True)
    activity_ref  = Column(String(40),  nullable=False)  # e.g. "EDABIP-842"
    user_name     = Column(String(160), nullable=False)
    module        = Column(String(100), nullable=False)
    action        = Column(String(200), nullable=False)
    occurred_at   = Column(DateTime,    nullable=False)
    status        = Column(String(20),  nullable=False, default="Active")
    created_at    = Column(DateTime,    server_default=func.now())


class DashboardSearchHistory(Base):
    """The most recent distinct Dashboard searches for each user."""
    __tablename__ = "analytics_dashboard_search_history"
    __table_args__ = (
        UniqueConstraint("user_id", "term_key", name="uq_dashboard_search_user_term"),
        Index("ix_dashboard_search_user_recent", "user_id", "last_searched_at"),
    )

    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    term             = Column(String(100), nullable=False)
    term_key         = Column(String(100), nullable=False)
    last_searched_at = Column(DateTime, nullable=False, server_default=func.now())


# ── Analytics page ─────────────────────────────────────────────────────────

class AnalyticsMetric(Base):
    """ML model performance metrics — drives the KPI cards on the Analytics page."""
    __tablename__ = "analytics_metrics"

    id            = Column(Integer, primary_key=True, index=True)
    metric_name   = Column(String(60), nullable=False)   # "accuracy", "precision", "recall", "f1"
    display_label = Column(String(80), nullable=False)
    value_display = Column(String(30), nullable=False)   # formatted string, e.g. "98.4%" or "0.97"
    change_pct    = Column(Float,      nullable=True)
    change_label  = Column(String(100), nullable=True)   # e.g. "+12% vs last month"
    is_positive   = Column(Boolean,    nullable=False, default=True)
    badge_class   = Column(String(60), nullable=True)
    period        = Column(String(40), nullable=False, default="Last 6 Months")
    snapshot_date = Column(Date,       nullable=False)
    created_at    = Column(DateTime,   server_default=func.now())


class RevenueForecast(Base):
    """Monthly revenue forecast — drives the Revenue Forecast line chart on Analytics page."""
    __tablename__ = "analytics_revenue_forecast"

    id           = Column(Integer, primary_key=True, index=True)
    month        = Column(String(10), nullable=False)
    year         = Column(Integer,    nullable=False)
    month_order  = Column(SmallInteger, nullable=False)  # 1-12 for correct ordering
    forecast_usd = Column(Float,      nullable=False, default=0.0)
    created_at   = Column(DateTime,   server_default=func.now())


class DemandPrediction(Base):
    """Day-of-week demand forecast — drives the Demand Prediction bar chart on Analytics page."""
    __tablename__ = "analytics_demand_predictions"

    id               = Column(Integer, primary_key=True, index=True)
    day_of_week      = Column(String(10),  nullable=False)  # "Mon", "Tue", …
    day_order        = Column(SmallInteger, nullable=False)  # 0-6
    predicted_demand = Column(Float,       nullable=False, default=0.0)
    bar_color        = Column(String(20),  nullable=False, default="#ABF2E8")
    week_start       = Column(Date,        nullable=True)
    created_at       = Column(DateTime,    server_default=func.now())


class MlModel(Base):
    """ML model registry — drives the ML Model Registry table on the Analytics page."""
    __tablename__ = "analytics_ml_models"

    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String(120), nullable=False)
    model_type   = Column(String(80),  nullable=False)
    accuracy     = Column(String(20),  nullable=False, default="-")  # formatted string
    status       = Column(String(40),  nullable=False, default="Active")  # Active | Pending | Training X%
    display_order = Column(SmallInteger, nullable=False, default=0)
    created_at   = Column(DateTime,    server_default=func.now())
