from datetime import date, datetime, timedelta

from fastapi import FastAPI
from fastapi.testclient import TestClient

from tests.test_reports import (
    _report_session,
    _user,
    report_env,
)
from models import analytics as dashboard_models
from models import reports as report_models
from models.user import User
from routers import analytics as analytics_api
from routers import dashboard as dashboard_api
import utils.auth


def _dashboard_client(user):
    app = FastAPI()
    app.include_router(analytics_api.router)
    app.include_router(dashboard_api.router)
    app.dependency_overrides[utils.auth.get_current_user] = lambda: user
    return TestClient(app)


def _add_activity(db, *, ref, action, occurred_at):
    db.add(dashboard_models.RecentActivityLog(
        activity_ref=ref,
        user_name="Dashboard Test",
        module="Reports",
        action=action,
        occurred_at=occurred_at,
        status="Active",
    ))


def test_dashboard_reads_real_report_data_and_latest_100_activity(report_env):
    with _report_session() as db:
        template = report_models.ReportTemplate(name="Monthly Report", category="sales")
        db.add(template)
        db.flush()
        db.add_all([
            dashboard_models.RevenueTrend(
                month="Sep", year=2026, value_usd=81000
            ),
            dashboard_models.ActiveUserStat(
                day_of_week="Mon",
                day_order=1,
                user_count=69749,
                week_start=date(2026, 9, 7),
            ),
        ])
        db.add_all([
            report_models.ReportHistory(
                template_id=template.id,
                report_name="Completed Report",
                generated_by=1,
                status=report_models.ReportGenerationStatus.COMPLETED,
                file_format=report_models.ReportFileFormat.CSV,
            ),
            report_models.ReportHistory(
                template_id=template.id,
                report_name="Queued Report",
                generated_by=1,
                status=report_models.ReportGenerationStatus.QUEUED,
                file_format=report_models.ReportFileFormat.CSV,
            ),
            report_models.ScheduledReport(
                template_id=template.id,
                name="Monthly Report",
                frequency=report_models.ReportFrequency.MONTHLY,
                file_format=report_models.ReportFileFormat.CSV,
                next_run_time=datetime(2026, 1, 1, 6, 0),
                timezone="Asia/Kolkata",
                owner_id=1,
                status=report_models.ScheduledReportStatus.ACTIVE,
            ),
            dashboard_models.KpiSnapshot(
                metric="reports",
                period_label="2026-09",
                current_value=999,
                snapshot_date=date(2026, 9, 1),
            ),
        ])
        for index in range(101):
            _add_activity(
                db,
                ref=f"ACT-{index}",
                action=f"Action {index}",
                occurred_at=datetime(2026, 1, 1) + timedelta(minutes=index),
            )
        db.commit()

    response = _dashboard_client(_user(1, "admin")).get("/dashboard/")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {
        "kpis",
        "userStats",
        "sourceStats",
        "dataSources",
        "scheduledReports",
        "recentActivity",
        "revenueTrend",
        "activeUsers",
    }
    assert body["kpis"]["reports"]["value"] == "1"
    assert body["kpis"]["reports"]["rows"] == [
        {"id": "scheduled", "label": "Scheduled Reports", "value": "1"},
        {"id": "pending", "label": "Pending Reports", "value": "1"},
    ]
    assert body["scheduledReports"][0]["title"] == "Monthly Report"
    assert body["scheduledReports"][0]["when"] == "Jan 1 2026 at 11 : 30 Am"
    assert body["revenueTrend"] == [{"month": "Sep", "value": 81000.0}]
    assert body["activeUsers"] == [{"day": "Mon", "value": 69749}]
    assert len(body["recentActivity"]) == 100
    assert body["recentActivity"][0]["id"] == "ACT-100"


def test_dashboard_supports_both_route_paths(report_env):
    client = _dashboard_client(_user(1, "admin"))

    slash_response = client.get("/dashboard/")
    no_slash_response = client.get("/dashboard", follow_redirects=False)

    assert slash_response.status_code == 200
    assert no_slash_response.status_code == 200
    assert no_slash_response.json() == slash_response.json()


def test_revenue_trend_returns_latest_months_in_order_and_filters_dates(report_env):
    with _report_session() as db:
        for month, year, value in [
            ("Dec", 2025, 12),
            ("Jan", 2026, 1),
            ("Feb", 2026, 2),
            ("Mar", 2026, 3),
        ]:
            db.add(dashboard_models.RevenueTrend(month=month, year=year, value_usd=value))
        db.commit()

    client = _dashboard_client(_user(1, "admin"))
    latest = client.get("/analytics/charts/revenue-trend", params={"months": 2})
    filtered = client.get(
        "/analytics/charts/revenue-trend",
        params={"date_from": "2026-02-01", "date_to": "2026-03-31"},
    )

    assert latest.status_code == 200
    assert latest.json()["points"] == [
        {"month": "Feb", "value": 2.0},
        {"month": "Mar", "value": 3.0},
    ]
    assert filtered.status_code == 200
    assert [point["month"] for point in filtered.json()["points"]] == ["Feb", "Mar"]
    assert client.get(
        "/analytics/charts/revenue-trend",
        params={"date_from": "2026-04-01", "date_to": "2026-03-01"},
    ).status_code == 422


def test_activity_search_pagination_filtering_and_validation(report_env):
    with _report_session() as db:
        for index, (action, module) in enumerate([
            ("Literal 100% complete", "Reports"),
            ("Other", "Billing"),
            ("Literal 100% complete", "Reports"),
        ]):
            db.add(dashboard_models.RecentActivityLog(
                activity_ref=f"ACT-{index}",
                user_name="Test User",
                module=module,
                action=action,
                occurred_at=datetime(2026, 1, 1) + timedelta(days=index),
                status="Active",
            ))
        db.commit()

    client = _dashboard_client(_user(1, "admin"))
    response = client.get(
        "/analytics/activity",
        params={"search": "%", "page": 2, "page_size": 1, "module": "Reports"},
    )

    assert response.status_code == 200
    assert response.json()["total"] == 2
    assert response.json()["page"] == 2
    assert response.json()["items"][0]["id"] == "ACT-0"
    assert client.get(
        "/analytics/activity",
        params={"date_from": "2026-02-01", "date_to": "2026-01-01"},
    ).status_code == 422
    assert client.get(
        "/analytics/activity",
        params={"search": "x" * 101},
    ).status_code == 422


def test_dashboard_search_is_permission_scoped_and_tracks_recent_queries(report_env):
    with _report_session() as db:
        db.add(dashboard_models.KpiSnapshot(
            metric="revenue",
            period_label="2026-09",
            current_value=1200,
            snapshot_date=date(2026, 9, 1),
        ))
        db.add(dashboard_models.MlModel(
            name="Revenue Model",
            model_type="Forecast",
            accuracy="98%",
            status="Active",
        ))
        db.add(report_models.ReportTemplate(
            name="Revenue Report",
            category="sales",
            is_active=True,
            approval_status="approved",
        ))
        db.add(User(
            role_id=1,
            full_name="Revenue User",
            email="revenue.user@example.com",
            password_hash="not-used",
        ))
        db.commit()

    client = _dashboard_client(_user(7, "analyst", ["dashboard.view"]))
    first = client.get("/analytics/search", params={"q": "  Rev  "})
    second = client.get("/analytics/search", params={"q": "rev"})
    advanced = _dashboard_client(
        _user(8, "analyst", ["dashboard.view", "analytics.advanced"])
    ).get("/analytics/search", params={"q": "Revenue Model"})

    assert first.status_code == 200
    assert {item["type"] for item in first.json()["results"]} == {"kpi"}
    assert first.json()["suggestions"] == ["Revenue"]
    assert "Revenue Report" not in [item["title"] for item in first.json()["results"]]
    assert "Revenue User" not in [item["title"] for item in first.json()["results"]]
    assert "Revenue Model" not in [item["title"] for item in first.json()["results"]]
    assert second.json()["recentSearches"] == ["rev"]
    assert [item["type"] for item in advanced.json()["results"]] == ["analytics_model"]
    assert client.get("/analytics/search", params={"q": "a" * 101}).status_code == 422


def test_dashboard_endpoints_require_dashboard_permission(report_env):
    client = _dashboard_client(_user(8, "analyst", []))

    assert client.get("/dashboard/").status_code == 403
    assert client.get("/dashboard").status_code == 403
    assert client.get("/analytics/dashboard").status_code == 403
    assert client.get("/analytics/search", params={"q": "revenue"}).status_code == 403


def test_dashboard_report_data_requires_reports_permission(report_env):
    with _report_session() as db:
        template = report_models.ReportTemplate(name="Private Report", category="sales")
        db.add(template)
        db.flush()
        db.add(report_models.ReportHistory(
            template_id=template.id,
            report_name="Private Report",
            generated_by=1,
            status=report_models.ReportGenerationStatus.COMPLETED,
            file_format=report_models.ReportFileFormat.CSV,
        ))
        db.commit()

    client = _dashboard_client(_user(8, "analyst", ["dashboard.view"]))
    response = client.get("/dashboard")

    assert response.status_code == 200
    assert response.json()["kpis"]["reports"]["value"] == "0"
    assert response.json()["kpis"]["reports"]["rows"] == [
        {"id": "scheduled", "label": "Scheduled Reports", "value": "0"},
        {"id": "pending", "label": "Pending Reports", "value": "0"},
    ]
    assert response.json()["scheduledReports"] == []


def test_dashboard_empty_analytics_data_has_explicit_empty_and_zero_values(report_env):
    response = _dashboard_client(_user(1, "admin")).get("/analytics/dashboard")

    assert response.status_code == 200
    body = response.json()
    assert body["kpis"]["revenue"]["value"] == "$0"
    assert body["kpis"]["reports"]["value"] == "0"
    assert body["dataSources"] == []
    assert body["scheduledReports"] == []
    assert body["recentActivity"] == []
    assert body["revenueTrend"] == []
    assert body["activeUsers"] == []


def test_malformed_kpi_snapshot_returns_safe_service_error(report_env):
    with _report_session() as db:
        db.add(dashboard_models.KpiSnapshot(
            metric="customers",
            period_label="2026-09",
            current_value=20,
            extra_json="{invalid-json",
            snapshot_date=date(2026, 9, 1),
        ))
        db.commit()

    response = _dashboard_client(_user(1, "admin")).get("/analytics/kpis")

    assert response.status_code == 503
    assert response.json() == {"detail": "Analytics data temporarily unavailable."}
