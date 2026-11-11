"""
seed_analytics.py

Populates the Dashboard & Analytics interface tables with realistic example
data that mirrors the current frontend mock values.

This script seeds example values only into empty analytics tables. It refuses
to overwrite existing data. Use it only with a disposable development database.

Usage:
    python seed_analytics.py

Run AFTER the database is created and migrated (main.py / init_db() must have
been called at least once to create the tables).
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, date, timedelta
import json

from database import SessionLocal, engine, Base
from models import analytics as a_mod  # ensure tables are registered

# Create tables if they don't exist yet
Base.metadata.create_all(bind=engine)

db = SessionLocal()

seed_models = (
    a_mod.RevenueTrend,
    a_mod.ActiveUserStat,
    a_mod.DataSource,
    a_mod.KpiSnapshot,
    a_mod.DashboardScheduledReport,
    a_mod.RecentActivityLog,
    a_mod.AnalyticsMetric,
    a_mod.RevenueForecast,
    a_mod.DemandPrediction,
    a_mod.MlModel,
)
populated_tables = [
    model.__tablename__
    for model in seed_models
    if db.query(model.id).first() is not None
]
if populated_tables:
    db.close()
    raise RuntimeError(
        "Refusing to seed analytics data because these tables are not empty: "
        + ", ".join(populated_tables)
    )


# ============================================================
# 1  Revenue Trend  (matches REVENUE_POINTS in DashboardCharts.jsx)
#     values are in USD thousands  stored as raw USD
# ============================================================
print("Seeding analytics_revenue_trend ")

REVENUE_TREND_DATA = [
    ("Jan", 2026,  28_000),
    ("Feb", 2026,  35_000),
    ("Mar", 2026,  31_000),
    ("Apr", 2026,  48_000),
    ("May", 2026,  55_000),
    ("Jun", 2026,  51_000),
    ("Jul", 2026,  63_000),
    ("Aug", 2026,  75_000),
    ("Sep", 2026,  81_000),
]
for month, year, value in REVENUE_TREND_DATA:
    db.add(a_mod.RevenueTrend(month=month, year=year, value_usd=value))
db.commit()
print(f"  [OK] {len(REVENUE_TREND_DATA)} revenue trend rows")


# ============================================================
# 2  Active User Stats  (matches ACTIVE_USERS in DashboardCharts.jsx)
# ============================================================
print("Seeding analytics_active_user_stats ")

ACTIVE_USERS_DATA = [
    ("Sun",   0,  50_000),
    ("Mon",   1,  69_749),
    ("Tues",  2,  34_910),
    ("Wedn",  3,  59_101),
    ("Thu",   4,  85_811),
    ("Fri",   5,  71_311),
    ("Sat",   6,  47_590),
]
week_start = date(2026, 8, 31)  # most recent Monday
for day, order, count in ACTIVE_USERS_DATA:
    db.add(a_mod.ActiveUserStat(
        day_of_week=day,
        day_order=order,
        user_count=count,
        week_start=week_start,
    ))
db.commit()
print(f"   {len(ACTIVE_USERS_DATA)} active user stat rows")


# ============================================================
# 3  Data Sources  (matches DATA_SOURCES in dashboardApi.js)
# ============================================================
print("Seeding analytics_data_sources ")

now = datetime.utcnow()
DATA_SOURCES = [
    ("ERP System",    "Active",   95, now - timedelta(minutes=2),  81),
    ("CRM",           "Active",   95, now - timedelta(minutes=2),  81),
    ("HRMS",          "Active",   95, now - timedelta(minutes=2),  81),
    ("APIs",          "Inactive", 72, now - timedelta(minutes=2),  81),
    ("Cloud Systems", "Active",   95, now - timedelta(minutes=2),  81),
]
for name, status, health, last_sync, latency in DATA_SOURCES:
    db.add(a_mod.DataSource(
        name=name,
        status=status,
        health_pct=health,
        last_sync_at=last_sync,
        latency_ms=latency,
    ))
db.commit()
print(f"   {len(DATA_SOURCES)} data source rows")


# ============================================================
# 4  KPI Snapshots  (matches KPIS in dashboardApi.js)
#
#     Revenue:     current $2.84M (+12.4% vs $2.53M prev month)
#     Customers:   current 18240  (+5.2% vs 17337 prev month), 94% active
#     Reports:     240 total, 45 scheduled, 45 pending
#     SystemHealth: 99.6%
# ============================================================
print("Seeding analytics_kpi_snapshots ")

today      = date(2026, 9, 1)
prev_month = date(2026, 8, 1)

kpi_seeds = [
    # metric, period_label, current, previous, extra_json, snapshot_date
    ("revenue",       "2026-09", 2_840_000, 2_529_753, None,
     today),
    ("customers",     "2026-09", 18_240,    17_337,
     json.dumps({"active_pct": 94}),
     today),
    ("reports",       "2026-09", 240,       None,
     json.dumps({"scheduled": 45, "pending": 45}),
     today),
    ("system_health", "2026-09", 99.6,      None, None, today),
]
for metric, period, cur, prev, extra, snap_date in kpi_seeds:
    db.add(a_mod.KpiSnapshot(
        metric=metric,
        period_label=period,
        current_value=cur,
        previous_value=prev,
        extra_json=extra,
        snapshot_date=snap_date,
    ))
db.commit()
print(f"   {len(kpi_seeds)} KPI snapshot rows")


# ============================================================
# 5  Scheduled Reports  (matches SCHEDULED_REPORTS in dashboardApi.js)
# ============================================================
print("Seeding analytics_scheduled_reports ")

SCHEDULED = [
    ("Monthly Finance Report", datetime(2026, 5, 1, 6, 0),  "Active"),
    ("Monthly Finance Report", datetime(2026, 5, 1, 6, 0),  "Active"),
    ("Monthly Finance Report", datetime(2026, 5, 1, 6, 0),  "Inactive"),
    ("Monthly Finance Report", datetime(2026, 5, 1, 6, 0),  "Active"),
]
for title, sched_at, status in SCHEDULED:
    db.add(a_mod.DashboardScheduledReport(title=title, scheduled_at=sched_at, status=status))
db.commit()
print(f"   {len(SCHEDULED)} scheduled report rows")


# ============================================================
# 6  Recent Activity Log  (matches RECENT_ACTIVITY in dashboardApi.js)
# ============================================================
print("Seeding analytics_recent_activity ")

ACTIVITY = [
    ("EDABIP-838", "John Doe",   "Billing",             "Invoice Generated",    datetime(2026, 5,  5, 14, 32), "Active"),
    ("EDABIP-839", "Sarah Wong", "Users",               "Permissions Updated",  datetime(2026, 6,  6, 15, 12), "Inactive"),
    ("EDABIP-840", "John Doe",   "Data Source (HRMS)",  "Sync Attempt",         datetime(2026, 7,  7, 16, 52), "Active"),
    ("EDABIP-841", "Sarah Wong", "Billing",             "Exported CSV (Large)", datetime(2026, 8,  8, 17, 42), "Active"),
    ("EDABIP-842", "John Doe",   "Data Source (HRMS)",  "Invoice Generated",    datetime(2026, 9,  9, 18, 19), "Active"),
]
for ref, user, module, action, occurred_at, status in ACTIVITY:
    db.add(a_mod.RecentActivityLog(
        activity_ref=ref,
        user_name=user,
        module=module,
        action=action,
        occurred_at=occurred_at,
        status=status,
    ))
db.commit()
print(f"   {len(ACTIVITY)} recent activity rows")


# ============================================================
# 7  Analytics Metrics  (matches METRIC_CARDS in Analyticspage.jsx)
# ============================================================
print("Seeding analytics_metrics ")

METRICS = [
    # metric_name, label, value_display, change_label, is_positive, badge_class
    ("accuracy",  "Model Accuracy", "98.4%", "+12% vs last month",    True,  None),
    ("precision", "Precision",      "0.97",  "+0.3% vs last month",   False, None),
    ("recall",    "Recall",         "0.96",  "+45 new this week",      True,  "an-kpi-card__change--recall"),
    ("f1",        "F1 Score",       "0.96",  "+8.1% vs last quarter",  True,  None),
]
snap_date = date(2026, 9, 1)
for metric_name, label, value, change_label, is_positive, badge_class in METRICS:
    for period in ["Last 3 Months", "Last 6 Months", "Last 9 Months", "Last 12 Months"]:
        db.add(a_mod.AnalyticsMetric(
            metric_name=metric_name,
            display_label=label,
            value_display=value,
            change_label=change_label,
            is_positive=is_positive,
            badge_class=badge_class,
            period=period,
            snapshot_date=snap_date,
        ))
db.commit()
print(f"   {len(METRICS) * 4} analytics metric rows (4 periods  4 metrics)")


# ============================================================
# 8  Revenue Forecast  (matches REVENUE_FORECAST_DATA in AnalyticsCharts.jsx)
# ============================================================
print("Seeding analytics_revenue_forecast ")

FORECAST_DATA = [
    ("Jan", 2026, 1,  26_000),
    ("Feb", 2026, 2,  32_000),
    ("Mar", 2026, 3,  29_000),
    ("Apr", 2026, 4,  48_000),
    ("May", 2026, 5,  54_000),
    ("Jun", 2026, 6,  50_000),
    ("Jul", 2026, 7,  60_000),
    ("Aug", 2026, 8,  72_000),
    ("Sep", 2026, 9,  80_000),
]
for month, year, month_order, forecast in FORECAST_DATA:
    db.add(a_mod.RevenueForecast(
        month=month,
        year=year,
        month_order=month_order,
        forecast_usd=forecast,
    ))
db.commit()
print(f"   {len(FORECAST_DATA)} revenue forecast rows")


# ============================================================
# 9  Demand Prediction  (matches DEMAND_PREDICTION_DATA in AnalyticsCharts.jsx)
# ============================================================
print("Seeding analytics_demand_predictions ")

DEMAND_DATA = [
    ("Mon", 0, 23_000, "#ABF2E8"),
    ("Tue", 1, 35_000, "#D8BFF2"),
    ("Wed", 2, 65_000, "#C8D8F9"),
    ("Thu", 3, 95_000, "#446665"),
    ("Fri", 4, 55_000, "#134B4A80"),
    ("Sat", 5, 45_000, "#70A9A8B2"),
    ("Sun", 6, 60_000, "#EFB2B3"),
]
week_start = date(2026, 9, 1)
for day, order, demand, color in DEMAND_DATA:
    db.add(a_mod.DemandPrediction(
        day_of_week=day,
        day_order=order,
        predicted_demand=demand,
        bar_color=color,
        week_start=week_start,
    ))
db.commit()
print(f"   {len(DEMAND_DATA)} demand prediction rows")


# ============================================================
# 10  ML Model Registry  (matches MODEL_REGISTRY in Analyticspage.jsx)
# ============================================================
print("Seeding analytics_ml_models ")

ML_MODELS = [
    ("Sales Forecasting",       "Regression",     "98.4%", "Training 75%", 0),
    ("Demand Prediction",       "Random Forest",  "94.2%", "Active",        1),
    ("Customer Churn",          "Classification", "91.8%", "Active",        2),
    ("Inventory Optimization",  "Optimization",   "-",     "Pending",       3),
]
for name, model_type, accuracy, status, display_order in ML_MODELS:
    db.add(a_mod.MlModel(
        name=name,
        model_type=model_type,
        accuracy=accuracy,
        status=status,
        display_order=display_order,
    ))
db.commit()
print(f"   {len(ML_MODELS)} ML model rows")


db.close()
print("\n Analytics seed complete! Tables populated and ready.")
print("   Start the server with: python main.py")
