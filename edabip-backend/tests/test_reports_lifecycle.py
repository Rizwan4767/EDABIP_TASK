"""Tests for the Reports module features added on top of test_reports.py.

Covers: the full template catalog and filters, run lifecycle (status, timing,
safe failure reasons, retry/cancel/archive/delete), schedules (frequencies, time
zones, edit/pause/resume/delete, conflicts), the scheduler and maintenance jobs,
the dashboard endpoints, notifications and the immutable audit trail.

It reuses the stubbed database, fixtures and helpers from test_reports.py (that
module swaps `database` for in-memory SQLite at import time, so the two files
must share one copy of it rather than each doing their own swap).
"""
import io
import json
from datetime import datetime, timedelta, timezone

import pytest

from tests.test_reports import (  # noqa: F401  (fixtures are used by name)
    ADMIN_ID, ANALYST_ID, OWNER_ID, _client, _report_session, _seed_order, _seed_templates, _user,
    admin_client, analyst_client, no_permission_client, report_env, report_generator, report_models,
    report_scheduler,
)
import services.report_maintenance as report_maintenance
import services.report_notifications as report_notifications
from services.reports_migration import parse_enum_values

M = report_models
def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


NOW = _utcnow()


def _iso(delta: timedelta) -> str:
    return (_utcnow() + delta).isoformat(timespec="seconds")


def _all_templates(db) -> dict:
    """The eight templates seed_reports.py installs, keyed by category."""
    ids = {}
    for name, category, extra in (
        ("Executive Summary", "executive", {}), ("Sales Performance", "sales", {}),
        ("Financial Report", "financial", {}), ("HR Report", "hr", {"allowed_roles_json": json.dumps(["admin", "business_analyst"])}),
        ("Operations Report", "operations", {}), ("KPI Report", "kpi", {}),
        ("Forecast Report", "forecast", {"default_parameters_json": json.dumps({"forecast_months": 3})}),
        ("Data Quality", "data", {}),
    ):
        template = M.ReportTemplate(name=name, category=category, is_active=True, **extra)
        db.add(template)
        db.flush()
        ids[category] = template.id
    db.commit()
    return ids


def _order(db, n=1, *, when=datetime(2026, 1, 5), ship_days=2, region="East", category="Furniture",
           sales=100.0, profit=20.0, segment="Consumer"):
    db.add(M.SuperstoreOrder(
        import_id=1, source_row=n + 1, row_id=str(n), order_id=f"CA-{n}", order_date=when,
        ship_date=when + timedelta(days=ship_days), ship_mode="Standard Class", customer_id=f"C{n}",
        customer_name="Alice", segment=segment, country_region="US", city="NYC", state_province="NY",
        postal_code="10001", region=region, product_id=f"P{n}", category=category, sub_category="Chairs",
        product_name="Chair", sales=sales, quantity=2, discount=0.1, profit=profit))
    db.commit()


def _csv(client, template_id, **body):
    response = client.post("/api/reports/generate", json={"template_id": template_id, "file_format": "csv", **body})
    assert response.status_code == 200, response.text
    history_id = response.json()["history_id"]
    download = client.get(f"/api/reports/download/{history_id}")
    assert download.status_code == 200, download.text
    return download.text, history_id


def _history_row(db, **kw):
    defaults = dict(report_name="R", generated_by=ADMIN_ID, status=M.ReportGenerationStatus.COMPLETED,
                    file_format=M.ReportFileFormat.CSV)
    defaults.update(kw)
    row = M.ReportHistory(**defaults)
    db.add(row)
    db.commit()
    return row.id


def _audit_actions():
    with _report_session() as db:
        return [a.action for a in db.query(M.ReportAuditLog).order_by(M.ReportAuditLog.id)]


def _editor_client():
    return _client(_user(ANALYST_ID, "Analyst", ["reports.view", "reports.create", "reports.edit"]))


def _deleter_client():
    return _client(_user(ANALYST_ID, "Analyst", ["reports.view", "reports.create", "reports.edit", "reports.delete"]))


# --- the template catalog ------------------------------------------------------------


def test_every_wireframe_template_generates_a_report(admin_client, report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        _order(db, 1)
        _order(db, 2, when=datetime(2026, 2, 5), sales=200, profit=-10)

    expected = {
        "financial": "Total sales", "operations": "Avg days to ship", "kpi": "Average order value",
        "hr": "Total accounts", "executive": "Validated order lines", "sales": "Profit margin",
    }
    for category, marker in expected.items():
        text, _ = _csv(admin_client, ids[category])
        assert marker in text, category


def test_financial_report_reports_loss_lines_and_yearly_rows(admin_client, report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        _order(db, 1, sales=100, profit=20)
        _order(db, 2, sales=200, profit=-10, when=datetime(2027, 3, 1))
    text, _ = _csv(admin_client, ids["financial"])
    assert "Loss-making order lines,1" in text
    assert "2026,100.00,20.00,20.00%" in text
    assert "2027,200.00,-10.00,-5.00%" in text


def test_operations_report_averages_days_to_ship(admin_client, report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        _order(db, 1, ship_days=2)
        _order(db, 2, ship_days=4)
    text, _ = _csv(admin_client, ids["operations"])
    assert "Standard Class,2,2,3.0" in text


def test_forecast_projects_from_a_linear_trend(admin_client, report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        for i, month in enumerate((1, 2, 3, 4), start=1):
            _order(db, i, when=datetime(2026, month, 10), sales=100.0 * i)    # +100 a month
    text, _ = _csv(admin_client, ids["forecast"])
    assert "2026-04,400.00,Actual" in text
    assert "2026-05,500.00,Forecast (linear trend)" in text      # the template default of 3 months
    assert "2026-07,700.00,Forecast (linear trend)" in text
    assert "2026-08" not in text
    text, _ = _csv(admin_client, ids["forecast"], parameters={"forecast_months": 1})
    assert "2026-05" in text and "2026-06" not in text


def test_forecast_needs_three_months_of_history(admin_client, report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        _order(db, 1)
    text, _ = _csv(admin_client, ids["forecast"])
    assert "At least 3 months" in text


def test_hr_report_is_aggregate_only(admin_client, report_env):
    from models.user import Role, User

    with _report_session() as db:
        ids = _all_templates(db)
        role = Role(name="business_analyst")
        db.add(role)
        db.flush()
        db.add(User(role_id=role.id, full_name="Secret Person", email="secret@example.com",
                    password_hash="x", is_active=True, is_verified=True))
        db.commit()
    text, _ = _csv(admin_client, ids["hr"])
    assert "Total accounts,1" in text and "business_analyst,1" in text
    assert "Secret Person" not in text and "secret@example.com" not in text


def test_filters_narrow_the_data(admin_client, report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        _order(db, 1, region="East", category="Furniture", when=datetime(2026, 1, 5))
        _order(db, 2, region="West", category="Technology", when=datetime(2026, 6, 5))
    text, _ = _csv(admin_client, ids["sales"], parameters={"region": "West"})
    assert "Technology" in text and "Furniture" not in text
    text, _ = _csv(admin_client, ids["sales"], parameters={"date_from": "2026-03-01"})
    assert "Technology" in text and "Furniture" not in text
    text, _ = _csv(admin_client, ids["sales"], parameters={"date_to": "2026-03-01"})
    assert "Furniture" in text and "Technology" not in text
    text, _ = _csv(admin_client, ids["sales"], parameters={"region": "Nowhere"})
    assert "No validated Superstore orders match" in text


def test_parameters_are_validated(admin_client, report_env):
    with _report_session() as db:
        ids = _all_templates(db)

    def post(template, params):
        return admin_client.post("/api/reports/generate", json={"template_id": ids[template], "parameters": params})

    assert post("sales", {"date_from": "2026-05-01", "date_to": "2026-01-01"}).status_code == 422   # reversed
    assert post("sales", {"date_from": "not-a-date"}).status_code == 422
    assert post("sales", {"region": "<script>"}).status_code == 422
    assert post("sales", {"surprise": 1}).status_code == 422                                          # unknown key
    assert post("sales", {"forecast_months": 3}).status_code == 422                                   # not supported by sales
    assert post("hr", {"region": "East"}).status_code == 422                                          # no filters at all
    assert post("forecast", {"forecast_months": 13}).status_code == 422


def test_filtered_runs_are_ad_hoc_and_plain_runs_are_on_demand(admin_client, report_env):
    with _report_session() as db:
        ids = _all_templates(db)
    _, plain = _csv(admin_client, ids["sales"])
    _, custom = _csv(admin_client, ids["sales"], parameters={"region": "East"})
    assert admin_client.get(f"/api/reports/history/{plain}").json()["trigger_type"] == "on_demand"
    body = admin_client.get(f"/api/reports/history/{custom}").json()
    assert body["trigger_type"] == "ad_hoc" and body["parameters"] == {"region": "East"}


def test_template_list_search_category_and_role_restriction(admin_client, report_env):
    with _report_session() as db:
        _all_templates(db)
    analyst = _client(_user(ANALYST_ID, "Analyst", ["reports.view", "reports.create"]))
    bi = _client(_user(ANALYST_ID, "business_analyst", ["reports.view", "reports.create"]))

    assert "HR Report" in [t["name"] for t in admin_client.get("/api/reports/templates").json()]
    assert "HR Report" not in [t["name"] for t in analyst.get("/api/reports/templates").json()]
    assert "HR Report" in [t["name"] for t in bi.get("/api/reports/templates").json()]
    hr_id = next(t["id"] for t in admin_client.get("/api/reports/templates").json() if t["name"] == "HR Report")
    assert analyst.post("/api/reports/generate", json={"template_id": hr_id}).status_code == 403
    assert analyst.get(f"/api/reports/templates/{hr_id}").status_code == 404

    found = admin_client.get("/api/reports/templates", params={"search": "forecast"}).json()
    assert [t["name"] for t in found] == ["Forecast Report"]
    assert found[0]["default_parameters"] == {"forecast_months": 3}
    assert "forecast_months" in found[0]["supported_parameters"] and found[0]["is_restricted"] is False
    assert [t["name"] for t in admin_client.get("/api/reports/templates", params={"category": "KPI"}).json()] == ["KPI Report"]
    assert admin_client.get("/api/reports/templates", params={"search": "x$"}).status_code == 422


def test_preview_returns_a_few_rows_and_writes_nothing(analyst_client, report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        for i in range(1, 15):
            _order(db, i)
    body = analyst_client.get(f"/api/reports/templates/{ids['sales']}/preview", params={"region": "East"}).json()
    assert body["columns"][0] == "Category" and body["rows"] and body["truncated"] is False
    assert body["parameters"] == {"region": "East"}
    assert analyst_client.get(f"/api/reports/templates/{ids['sales']}/preview", params={"region": "<b>"}).status_code == 422
    with _report_session() as db:
        assert db.query(M.ReportHistory).count() == 0


def test_preview_needs_the_create_permission(report_env):
    with _report_session() as db:
        ids = _all_templates(db)
    viewer = _client(_user(ANALYST_ID, "Analyst", ["reports.view"]))
    assert viewer.get(f"/api/reports/templates/{ids['sales']}/preview").status_code == 403


# --- run lifecycle --------------------------------------------------------------------


def test_a_completed_run_records_timing_progress_and_labels(admin_client, report_env):
    with _report_session() as db:
        ids = _all_templates(db)
    _, history_id = _csv(admin_client, ids["executive"])
    body = admin_client.get(f"/api/reports/history/{history_id}").json()
    assert body["status"] == "completed" and body["status_label"] == "Completed"
    assert body["progress_percent"] == 100 and body["can_download"] is True
    assert body["started_at"] and body["completed_at"] and body["duration_seconds"] >= 0
    assert body["report_type"] == "executive" and body["trigger_label"] == "On Demand"
    assert body["failure_reason"] is None and "error_detail" not in body and "file_path" not in body


def test_excel_and_pdf_carry_a_metadata_block_but_csv_stays_pure(admin_client, report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        _order(db, 1)
    text, _ = _csv(admin_client, ids["sales"], parameters={"region": "East"})
    assert text.startswith("Category,Sales")                       # CSV: data only
    started = admin_client.post("/api/reports/generate", json={
        "template_id": ids["sales"], "file_format": "pdf", "parameters": {"region": "East"}, "report_name": "Q1 Sales"})
    pdf = admin_client.get(f"/api/reports/download/{started.json()['history_id']}").content
    assert b"Q1 Sales" in pdf and b"region=East" in pdf


def test_an_unexpected_failure_hides_the_cause_from_the_api(admin_client, report_env, monkeypatch):
    with _report_session() as db:
        ids = _all_templates(db)

    def boom(self, category, params=None):
        raise RuntimeError("secret internal detail")

    monkeypatch.setattr(report_generator.ReportDataProvider, "rows", boom)
    started = admin_client.post("/api/reports/generate", json={"template_id": ids["kpi"]})
    history_id = started.json()["history_id"]
    body = admin_client.get(f"/api/reports/history/{history_id}").json()
    assert body["status"] == "failed" and body["status_label"] == "Failed"
    assert body["failure_reason"] == report_generator.GENERIC_FAILURE
    assert "secret" not in json.dumps(body)
    assert body["can_retry"] is True and body["can_download"] is False
    with _report_session() as db:
        assert "secret internal detail" in db.get(M.ReportHistory, history_id).error_detail
    assert admin_client.get(f"/api/reports/download/{history_id}").status_code == 409
    assert "report.failed" in _audit_actions()


def test_a_known_problem_shows_a_safe_reason(report_env):
    with _report_session() as db:
        db.add(M.ReportTemplate(name="Mystery", category="mystery", is_active=True))
        db.commit()
        history_id = _history_row(db, template_id=1, status=M.ReportGenerationStatus.QUEUED)
    report_generator.generate_report(history_id)
    with _report_session() as db:
        row = db.get(M.ReportHistory, history_id)
        assert row.status == M.ReportGenerationStatus.FAILED
        assert "No data source is configured" in row.failure_reason


def test_retry_creates_a_linked_run_and_only_for_failed_reports(analyst_client, report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        failed = _history_row(db, generated_by=ANALYST_ID, template_id=ids["executive"],
                              status=M.ReportGenerationStatus.FAILED, failure_reason="x")
        done = _history_row(db, generated_by=ANALYST_ID, template_id=ids["executive"])
        foreign = _history_row(db, generated_by=OWNER_ID, template_id=ids["executive"],
                               status=M.ReportGenerationStatus.FAILED)

    assert analyst_client.post(f"/api/reports/history/{done}/retry").status_code == 409
    assert analyst_client.post(f"/api/reports/history/{foreign}/retry").status_code == 404
    retried = analyst_client.post(f"/api/reports/history/{failed}/retry")
    assert retried.status_code == 200
    new = analyst_client.get(f"/api/reports/history/{retried.json()['history_id']}").json()
    assert new["retry_of_id"] == failed and new["status"] == "completed"
    assert "report.retried" in _audit_actions()


def test_retry_refuses_when_the_template_is_gone(admin_client, report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        failed = _history_row(db, template_id=ids["executive"], status=M.ReportGenerationStatus.FAILED)
        db.get(M.ReportTemplate, ids["executive"]).is_active = False
        db.commit()
    assert admin_client.post(f"/api/reports/history/{failed}/retry").status_code == 409


def test_cancel_only_applies_to_queued_runs_and_a_cancelled_run_never_executes(analyst_client, report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        queued = _history_row(db, generated_by=ANALYST_ID, template_id=ids["executive"],
                              status=M.ReportGenerationStatus.QUEUED)
        done = _history_row(db, generated_by=ANALYST_ID, template_id=ids["executive"])
    assert analyst_client.post(f"/api/reports/history/{done}/cancel").status_code == 409
    assert analyst_client.post(f"/api/reports/history/{queued}/cancel").status_code == 200
    body = analyst_client.get(f"/api/reports/history/{queued}").json()
    assert body["status"] == "cancelled" and body["can_retry"] is True
    report_generator.generate_report(queued)             # a late worker must not resurrect it
    assert analyst_client.get(f"/api/reports/history/{queued}").json()["status"] == "cancelled"


def test_history_polling_is_owner_scoped(analyst_client, report_env):
    with _report_session() as db:
        foreign = _history_row(db, generated_by=OWNER_ID)
    assert analyst_client.get(f"/api/reports/history/{foreign}").status_code == 404
    assert analyst_client.get("/api/reports/history/99999").status_code == 404


def test_archive_hides_a_run_from_the_default_view_and_restores_it(report_env):
    editor = _editor_client()
    with _report_session() as db:
        ids = _all_templates(db)
        done = _history_row(db, generated_by=ANALYST_ID, template_id=ids["executive"])
        running = _history_row(db, generated_by=ANALYST_ID, status=M.ReportGenerationStatus.RUNNING)

    assert editor.post(f"/api/reports/history/{running}/archive").status_code == 409
    assert editor.post(f"/api/reports/history/{done}/archive").status_code == 200
    assert [i["id"] for i in editor.get("/api/reports/history").json()["items"]] == [running]
    only = editor.get("/api/reports/history", params={"archived": "only"}).json()["items"]
    assert [i["id"] for i in only] == [done] and only[0]["is_archived"] is True
    assert editor.get("/api/reports/history", params={"archived": "include"}).json()["total"] == 2
    assert editor.post(f"/api/reports/history/{done}/unarchive").status_code == 200
    assert editor.get("/api/reports/history").json()["total"] == 2


def test_archive_needs_the_edit_permission(analyst_client, report_env):
    with _report_session() as db:
        done = _history_row(db, generated_by=ANALYST_ID)
    assert analyst_client.post(f"/api/reports/history/{done}/archive").status_code == 403


def test_deleting_a_run_needs_the_delete_permission_and_removes_the_file(report_env, admin_client):
    with _report_session() as db:
        ids = _all_templates(db)
    started = admin_client.post("/api/reports/generate", json={"template_id": ids["executive"]})
    history_id = started.json()["history_id"]
    with _report_session() as db:
        path = db.get(M.ReportHistory, history_id).file_path
    assert path and report_env.joinpath(path).exists()

    editor = _editor_client()                       # edit but not delete
    assert editor.delete(f"/api/reports/history/{history_id}").status_code == 403
    assert admin_client.delete(f"/api/reports/history/{history_id}").status_code == 200
    assert not report_env.joinpath(path).exists()
    assert admin_client.get(f"/api/reports/history/{history_id}").status_code == 404
    assert "report.deleted" in _audit_actions()


def test_a_run_in_progress_cannot_be_deleted(admin_client, report_env):
    with _report_session() as db:
        running = _history_row(db, status=M.ReportGenerationStatus.RUNNING)
    assert admin_client.delete(f"/api/reports/history/{running}").status_code == 409


def test_a_purged_file_answers_404_not_409(admin_client, report_env):
    with _report_session() as db:
        done = _history_row(db, file_path=None)
    assert admin_client.get(f"/api/reports/download/{done}").status_code == 404


def test_history_search_filters_and_sorting(admin_client, report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        a = _history_row(db, report_name="Alpha Sales", template_id=ids["sales"], duration_seconds=5,
                         created_at=NOW - timedelta(days=3), trigger_type=M.ReportTriggerType.SCHEDULED)
        b = _history_row(db, report_name="Beta Finance", template_id=ids["financial"], duration_seconds=50,
                         created_at=NOW - timedelta(days=1), status=M.ReportGenerationStatus.FAILED)
        c = _history_row(db, report_name="Gamma Ops", template_id=ids["operations"], duration_seconds=20,
                         created_at=NOW - timedelta(days=20), status=M.ReportGenerationStatus.QUEUED)

    def ids_of(**params):
        return [i["id"] for i in admin_client.get("/api/reports/history", params=params).json()["items"]]

    assert ids_of(search="alpha") == [a]
    assert ids_of(search="finance") == [b]
    assert ids_of(search="financial") == [b]                       # template category
    assert ids_of(search=str(c)) == [c]                             # by report id
    assert ids_of(search="failed") == [b]                           # by status text
    assert ids_of(report_type="sales") == [a]
    assert ids_of(status="failed") == [b]
    assert ids_of(status="processing") == [c]                       # umbrella for queued/running/...
    assert ids_of(trigger_type="scheduled") == [a]
    assert ids_of(date_from=(NOW - timedelta(days=5)).date().isoformat()) == [b, a]
    assert ids_of(date_to=(NOW - timedelta(days=10)).date().isoformat()) == [c]
    assert ids_of(sort_by="duration", order="desc") == [b, c, a]
    assert ids_of(sort_by="name", order="asc") == [a, b, c]
    assert admin_client.get("/api/reports/history", params={"search": "a"}).status_code == 422        # too short
    assert admin_client.get("/api/reports/history", params={"search": "7"}).status_code == 200        # a report id
    assert admin_client.get("/api/reports/history", params={"search": "x;drop"}).status_code == 422
    assert admin_client.get("/api/reports/history", params={"search": "%%"}).status_code == 422
    assert admin_client.get("/api/reports/history", params={"date_from": "2026-05-01", "date_to": "2026-01-01"}).status_code == 422
    assert admin_client.get("/api/reports/history", params={"sort_by": "nonsense"}).status_code == 422


def test_search_treats_underscore_literally(admin_client, report_env):
    with _report_session() as db:
        match = _history_row(db, report_name="Q1_Sales")
        _history_row(db, report_name="Q1 Sales")
    found = [i["id"] for i in admin_client.get("/api/reports/history", params={"search": "Q1_Sales"}).json()["items"]]
    assert found == [match]


def test_history_export_is_csv_scoped_filtered_and_formula_safe(admin_client, analyst_client, report_env):
    with _report_session() as db:
        _history_row(db, report_name="=HYPERLINK(1)", generated_by=ANALYST_ID)
        _history_row(db, report_name="Other", generated_by=OWNER_ID)
    csv_text = admin_client.get("/api/reports/history/export").text
    assert csv_text.splitlines()[0].startswith("Report ID,Report Name")
    assert "'=HYPERLINK(1)" in csv_text
    mine = analyst_client.get("/api/reports/history/export").text
    assert "HYPERLINK" in mine and "Other" not in mine
    assert admin_client.get("/api/reports/history/export", params={"search": "other"}).text.count("\n") == 2
    assert "history.exported" in _audit_actions()


def test_downloads_are_audited(admin_client, report_env):
    with _report_session() as db:
        ids = _all_templates(db)
    _, history_id = _csv(admin_client, ids["executive"])
    with _report_session() as db:
        entry = db.query(M.ReportAuditLog).filter_by(action="report.downloaded").one()
        assert entry.entity_id == history_id and entry.actor_user_id == ADMIN_ID


# --- scheduling -----------------------------------------------------------------------


def _schedule(client, template_id, **body):
    payload = {"template_id": template_id, "scheduled": True, "frequency": "daily",
               "next_run_time": _iso(timedelta(days=2)), **body}
    return client.post("/api/reports/generate", json=payload)


def test_every_frequency_can_be_scheduled(admin_client, report_env):
    with _report_session() as db:
        ids = _all_templates(db)
    for frequency, extra in (("daily", {}), ("weekly", {}), ("monthly", {}), ("quarterly", {}),
                             ("one_time", {}), ("custom", {"interval_days": 10})):
        response = _schedule(admin_client, ids["sales"], frequency=frequency,
                             report_name=f"{frequency} sales", **extra)
        assert response.status_code == 200, (frequency, response.text)
    listing = admin_client.get("/api/reports/scheduled").json()
    assert listing["total"] == 6
    assert {i["frequency"] for i in listing["items"]} == {"daily", "weekly", "monthly", "quarterly", "one_time", "custom"}


def test_schedule_validation(admin_client, report_env):
    with _report_session() as db:
        ids = _all_templates(db)
    t = ids["sales"]
    assert _schedule(admin_client, t, frequency="custom").status_code == 422                      # needs interval
    assert _schedule(admin_client, t, interval_days=5).status_code == 422                         # interval needs custom
    assert _schedule(admin_client, t, next_run_time="2020-01-01T00:00:00").status_code == 422     # in the past
    assert _schedule(admin_client, t, timezone="Mars/Olympus").status_code == 422
    assert _schedule(admin_client, t, recipients=["not-an-email"]).status_code == 422
    assert admin_client.post("/api/reports/generate", json={"template_id": t, "timezone": "UTC"}).status_code == 422
    assert admin_client.post("/api/reports/generate", json={"template_id": t, "recipients": ["a@b.co"]}).status_code == 422
    assert _schedule(admin_client, t, parameters={"region": "<x>"}).status_code == 422


def test_schedule_times_are_converted_from_the_chosen_time_zone(admin_client, report_env):
    with _report_session() as db:
        ids = _all_templates(db)
    run = (_utcnow() + timedelta(days=30)).replace(hour=9, minute=0, second=0, microsecond=0)
    created = _schedule(admin_client, ids["sales"], next_run_time=run.isoformat(), timezone="Asia/Kolkata").json()
    stored = datetime.fromisoformat(created["next_run_time"])
    assert stored == run - timedelta(hours=5, minutes=30)
    assert created["next_run_time_local"] == run.isoformat() + "+05:30"
    item = admin_client.get(f"/api/reports/scheduled/{created['scheduled_report_id']}").json()
    assert item["timezone"] == "Asia/Kolkata"


def test_a_duplicate_schedule_conflicts(admin_client, report_env):
    with _report_session() as db:
        ids = _all_templates(db)
    when = _iso(timedelta(days=5))
    assert _schedule(admin_client, ids["kpi"], next_run_time=when).status_code == 200
    again = _schedule(admin_client, ids["kpi"], next_run_time=when)
    assert again.status_code == 409 and "conflicts" in again.json()["detail"]
    assert _schedule(admin_client, ids["kpi"], next_run_time=when, parameters={"region": "East"}).status_code == 200


def test_schedule_edit_pause_resume_and_delete(report_env):
    editor, deleter = _editor_client(), _deleter_client()
    with _report_session() as db:
        ids = _all_templates(db)
    sid = _schedule(editor, ids["sales"], report_name="Weekly KPIs", recipients=["Boss@Example.com", "boss@example.com"]
                    ).json()["scheduled_report_id"]
    item = editor.get(f"/api/reports/scheduled/{sid}").json()
    assert item["recipients"] == ["boss@example.com"] and item["name"] == "Weekly KPIs"

    edited = editor.patch(f"/api/reports/scheduled/{sid}", json={
        "frequency": "custom", "interval_days": 14, "report_name": "Fortnightly", "file_format": "excel",
        "recipients": [], "parameters": {"region": "West"}})
    assert edited.status_code == 200, edited.text
    body = edited.json()
    assert (body["frequency"], body["interval_days"], body["name"], body["file_format"]) == ("custom", 14, "Fortnightly", "excel")
    assert body["recipients"] == [] and body["parameters"] == {"region": "West"}
    back = editor.patch(f"/api/reports/scheduled/{sid}", json={"frequency": "weekly"}).json()
    assert back["frequency"] == "weekly" and back["interval_days"] is None            # leaving custom drops it
    assert editor.patch(f"/api/reports/scheduled/{sid}", json={"frequency": "custom"}).status_code == 422
    assert editor.patch(f"/api/reports/scheduled/{sid}", json={"next_run_time": "2020-01-01T00:00:00"}).status_code == 422
    assert editor.patch(f"/api/reports/scheduled/{sid}", json={"bogus": 1}).status_code == 422
    assert editor.patch(f"/api/reports/scheduled/{sid}", json={"parameters": {"forecast_months": 2}}).status_code == 422

    paused = editor.post(f"/api/reports/scheduled/{sid}/pause")
    assert paused.json()["status"] == "paused" and paused.json()["display_status"] == "paused"
    assert editor.post(f"/api/reports/scheduled/{sid}/pause").status_code == 409
    assert editor.post(f"/api/reports/scheduled/{sid}/resume").json()["status"] == "active"
    assert editor.post(f"/api/reports/scheduled/{sid}/resume").status_code == 409

    assert editor.delete(f"/api/reports/scheduled/{sid}").status_code == 403           # no delete permission
    assert deleter.delete(f"/api/reports/scheduled/{sid}").status_code == 200
    assert deleter.get(f"/api/reports/scheduled/{sid}").status_code == 404
    actions = _audit_actions()
    for expected in ("schedule.created", "schedule.updated", "schedule.paused", "schedule.resumed", "schedule.deleted"):
        assert expected in actions


def test_resuming_a_long_paused_schedule_skips_the_missed_runs(admin_client, report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        db.add(M.ScheduledReport(template_id=ids["sales"], frequency=M.ReportFrequency.DAILY,
                                 file_format=M.ReportFileFormat.CSV, next_run_time=NOW - timedelta(days=10),
                                 owner_id=ADMIN_ID, status=M.ScheduledReportStatus.PAUSED))
        db.add(M.ScheduledReport(template_id=ids["sales"], frequency=M.ReportFrequency.ONE_TIME,
                                 file_format=M.ReportFileFormat.CSV, next_run_time=NOW - timedelta(days=10),
                                 owner_id=ADMIN_ID, status=M.ScheduledReportStatus.PAUSED))
        db.commit()
    daily, one_time = [s["id"] for s in admin_client.get("/api/reports/scheduled", params={"sort_by": "frequency"}).json()["items"]]
    resumed = admin_client.post(f"/api/reports/scheduled/{daily}/resume").json()
    assert datetime.fromisoformat(resumed["next_run_time"]) > NOW
    assert admin_client.post(f"/api/reports/scheduled/{one_time}/resume").status_code == 409


def test_non_owners_cannot_touch_a_schedule(report_env):
    deleter = _deleter_client()
    with _report_session() as db:
        ids = _all_templates(db)
        db.add(M.ScheduledReport(template_id=ids["sales"], frequency=M.ReportFrequency.DAILY,
                                 file_format=M.ReportFileFormat.CSV, next_run_time=NOW + timedelta(days=1), owner_id=OWNER_ID))
        db.commit()
        sid = db.query(M.ScheduledReport).one().id
    assert deleter.get(f"/api/reports/scheduled/{sid}").status_code == 404
    assert deleter.patch(f"/api/reports/scheduled/{sid}", json={"report_name": "x"}).status_code == 404
    assert deleter.post(f"/api/reports/scheduled/{sid}/pause").status_code == 404
    assert deleter.delete(f"/api/reports/scheduled/{sid}").status_code == 404


def test_scheduled_list_search_filters_sort_and_display_status(admin_client, report_env):
    with _report_session() as db:
        ids = _all_templates(db)
    s1 = _schedule(admin_client, ids["sales"], report_name="Zulu report", frequency="weekly",
                   next_run_time=_iso(timedelta(days=3))).json()["scheduled_report_id"]
    s2 = _schedule(admin_client, ids["financial"], report_name="Alpha report", frequency="monthly",
                   next_run_time=_iso(timedelta(days=1))).json()["scheduled_report_id"]

    def ids_of(**params):
        return [i["id"] for i in admin_client.get("/api/reports/scheduled", params=params).json()["items"]]

    assert ids_of() == [s2, s1]                                                      # default: next run, soonest first
    assert ids_of(sort_by="name", order="asc") == [s2, s1]
    assert ids_of(sort_by="name", order="desc") == [s1, s2]
    assert ids_of(search="zulu") == [s1] and ids_of(search="monthly") == [s2]
    assert ids_of(report_type="financial") == [s2] and ids_of(frequency="weekly") == [s1]
    assert ids_of(status="paused") == []
    assert admin_client.get("/api/reports/scheduled", params={"status": "nope"}).status_code == 422
    first = admin_client.get(f"/api/reports/scheduled/{s1}").json()
    assert first["display_status"] == "scheduled" and first["report_name"] == "Zulu report"
    assert first["report_type"] == "sales" and first["owner_id"] == ADMIN_ID


# --- scheduler worker -----------------------------------------------------------------


def _due(db, template_id, frequency, when, **kw):
    schedule = M.ScheduledReport(template_id=template_id, frequency=frequency, file_format=M.ReportFileFormat.CSV,
                                 next_run_time=when, owner_id=OWNER_ID, **kw)
    db.add(schedule)
    db.commit()
    return schedule.id


def test_scheduler_advances_quarterly_and_monthly_by_calendar(report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        q = _due(db, ids["executive"], M.ReportFrequency.QUARTERLY, datetime(2026, 1, 31, 9, 0))
        m = _due(db, ids["executive"], M.ReportFrequency.MONTHLY, datetime(2026, 1, 31, 9, 0))
        assert report_scheduler.process_due_reports(db, now=datetime(2026, 2, 1)) == 2
        assert db.get(M.ScheduledReport, q).next_run_time == datetime(2026, 4, 30, 9, 0)
        assert db.get(M.ScheduledReport, m).next_run_time == datetime(2026, 2, 28, 9, 0)


def test_scheduler_applies_the_schedule_time_zone(report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        sid = _due(db, ids["executive"], M.ReportFrequency.DAILY, datetime(2026, 1, 1, 3, 30), timezone="Asia/Kolkata")
        report_scheduler.process_due_reports(db, now=datetime(2026, 1, 1, 4, 0))
        assert db.get(M.ScheduledReport, sid).next_run_time == datetime(2026, 1, 2, 3, 30)     # still 09:00 IST


def test_scheduler_skips_missed_periods_instead_of_replaying_them(report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        sid = _due(db, ids["executive"], M.ReportFrequency.DAILY, datetime(2026, 1, 1, 9, 0))
        assert report_scheduler.process_due_reports(db, now=datetime(2026, 1, 10, 12, 0)) == 1
        assert db.get(M.ScheduledReport, sid).next_run_time == datetime(2026, 1, 11, 9, 0)
        assert db.query(M.ReportHistory).count() == 1


def test_one_time_schedules_run_once_and_complete(report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        sid = _due(db, ids["executive"], M.ReportFrequency.ONE_TIME, datetime(2026, 1, 1))
        assert report_scheduler.process_due_reports(db, now=datetime(2026, 1, 2)) == 1
        assert db.get(M.ScheduledReport, sid).status == M.ScheduledReportStatus.COMPLETED
        assert report_scheduler.process_due_reports(db, now=datetime(2026, 12, 1)) == 0


def test_paused_schedules_do_not_run(report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        _due(db, ids["executive"], M.ReportFrequency.DAILY, datetime(2026, 1, 1), status=M.ScheduledReportStatus.PAUSED)
        assert report_scheduler.process_due_reports(db, now=datetime(2026, 1, 2)) == 0


def test_a_scheduled_run_is_linked_typed_and_mirrored_onto_its_schedule(admin_client, report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        sid = _due(db, ids["kpi"], M.ReportFrequency.WEEKLY, datetime(2026, 1, 1), name="Weekly KPIs",
                   parameters_json=json.dumps({"region": "East"}))
        report_scheduler.process_due_reports(db, now=datetime(2026, 1, 2))
        history = db.query(M.ReportHistory).one()
        assert (history.trigger_type, history.schedule_id, history.report_name) == (
            M.ReportTriggerType.SCHEDULED, sid, "Weekly KPIs")
        assert history.parameters_json == json.dumps({"region": "East"})
        schedule = db.get(M.ScheduledReport, sid)
        assert schedule.last_run_status == M.ReportGenerationStatus.COMPLETED and schedule.last_run_at
        hid = history.id
    item = admin_client.get(f"/api/reports/scheduled/{sid}").json()
    assert item["display_status"] == "completed" and item["last_completed_history_id"] == hid
    assert admin_client.get(f"/api/reports/download/{hid}").status_code == 200
    actions = _audit_actions()
    assert "schedule.executed" in actions and "report.completed" in actions


def test_a_failed_scheduled_run_shows_as_failed(admin_client, report_env):
    with _report_session() as db:
        db.add(M.ReportTemplate(name="Mystery", category="mystery", is_active=True))
        db.commit()
        sid = _due(db, 1, M.ReportFrequency.DAILY, datetime(2026, 1, 1))
        report_scheduler.process_due_reports(db, now=datetime(2026, 1, 2))
    assert admin_client.get(f"/api/reports/scheduled/{sid}").json()["display_status"] == "failed"


def test_a_broken_schedule_is_paused_without_blocking_the_others(report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        bad = _due(db, ids["executive"], M.ReportFrequency.DAILY, datetime(2026, 1, 1), timezone="Mars/Olympus")
        good = _due(db, ids["executive"], M.ReportFrequency.DAILY, datetime(2026, 1, 1))
        # An unknown zone falls back to UTC rather than breaking, so force a real failure instead:
        original = report_scheduler.next_occurrence

        def picky(previous, frequency, tz, *a, **kw):
            if tz == "Mars/Olympus":
                raise ValueError("bad zone")
            return original(previous, frequency, tz, *a, **kw)

        report_scheduler.next_occurrence = picky
        try:
            assert report_scheduler.process_due_reports(db, now=datetime(2026, 1, 2)) == 1
        finally:
            report_scheduler.next_occurrence = original
        assert db.get(M.ScheduledReport, bad).status == M.ScheduledReportStatus.PAUSED
        assert db.get(M.ScheduledReport, good).next_run_time == datetime(2026, 1, 2, 0, 0) + timedelta(days=1)
    assert "schedule.paused_on_error" in _audit_actions()


def test_background_scheduler_is_off_unless_enabled(monkeypatch):
    from services import report_settings

    monkeypatch.setattr(report_settings, "SCHEDULER_ENABLED", False)
    assert report_scheduler.start_background_scheduler() is None


# --- maintenance ------------------------------------------------------------------------


def test_stuck_runs_are_failed_and_fresh_ones_left_alone(report_env):
    with _report_session() as db:
        old = _history_row(db, status=M.ReportGenerationStatus.RUNNING, created_at=NOW - timedelta(hours=3),
                           started_at=NOW - timedelta(hours=3))
        queued_old = _history_row(db, status=M.ReportGenerationStatus.QUEUED, created_at=NOW - timedelta(hours=3))
        fresh = _history_row(db, status=M.ReportGenerationStatus.RUNNING, created_at=NOW, started_at=NOW)
        assert report_maintenance.recover_stuck_reports(db) == 2
        assert db.get(M.ReportHistory, old).status == M.ReportGenerationStatus.FAILED
        assert "timed out" in db.get(M.ReportHistory, queued_old).failure_reason
        assert db.get(M.ReportHistory, fresh).status == M.ReportGenerationStatus.RUNNING


def test_retention_archives_then_purges_files(report_env):
    old_file = report_env / "report-old.csv"
    old_file.write_text("x")
    with _report_session() as db:
        old = _history_row(db, created_at=NOW - timedelta(days=400), file_path=str(old_file))
        recent = _history_row(db, created_at=NOW - timedelta(days=5))
        assert report_maintenance.archive_old_reports(db) == 1
        assert db.get(M.ReportHistory, old).is_archived and not db.get(M.ReportHistory, recent).is_archived
        assert report_maintenance.purge_old_files(db) == 1
        assert not old_file.exists() and db.get(M.ReportHistory, old).file_path is None
        assert db.get(M.ReportHistory, old).status == M.ReportGenerationStatus.COMPLETED     # row kept


def test_purge_never_deletes_outside_the_report_directory(report_env):
    outside = report_env.parent / "keep-me.csv"
    outside.write_text("important")
    assert report_maintenance.delete_report_file(str(outside)) is False
    assert outside.exists()


# --- dashboard --------------------------------------------------------------------------


def _dashboard_data(db, ids):
    day = lambda n: NOW - timedelta(days=n)       # noqa: E731
    for n, (status, trigger, duration, tpl) in enumerate((
        (M.ReportGenerationStatus.COMPLETED, M.ReportTriggerType.SCHEDULED, 10, "sales"),
        (M.ReportGenerationStatus.COMPLETED, M.ReportTriggerType.ON_DEMAND, 20, "sales"),
        (M.ReportGenerationStatus.COMPLETED, M.ReportTriggerType.ON_DEMAND, 30, "kpi"),
        (M.ReportGenerationStatus.FAILED, M.ReportTriggerType.AD_HOC, None, "kpi"),
        (M.ReportGenerationStatus.QUEUED, M.ReportTriggerType.SYSTEM, None, "sales"),
    ), start=1):
        _history_row(db, status=status, trigger_type=trigger, duration_seconds=duration, template_id=ids[tpl],
                     created_at=day(n), report_name=f"r{n}")
    _history_row(db, status=M.ReportGenerationStatus.COMPLETED, duration_seconds=40,
                 created_at=day(40), template_id=ids["sales"])            # previous 30-day window
    _history_row(db, generated_by=OWNER_ID, created_at=day(1), template_id=ids["sales"])   # someone else's
    db.add(M.ScheduledReport(template_id=ids["sales"], frequency=M.ReportFrequency.DAILY, file_format=M.ReportFileFormat.CSV,
                             next_run_time=NOW + timedelta(days=1), owner_id=ADMIN_ID))
    db.add(M.ScheduledReport(template_id=ids["sales"], frequency=M.ReportFrequency.DAILY, file_format=M.ReportFileFormat.CSV,
                             next_run_time=NOW + timedelta(days=1), owner_id=ADMIN_ID, status=M.ScheduledReportStatus.PAUSED))
    db.commit()


def test_summary_cards(report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        _dashboard_data(db, ids)
    admin = _client(_user(ADMIN_ID, "admin"))
    body = admin.get("/api/reports/summary").json()
    assert body["range"]["key"] == "30d"
    assert body["total_reports"]["value"] == 6                      # 5 own + 1 owned by someone else (admin sees all)
    assert body["completed"]["value"] == 4 and body["completed"]["previous"] == 1
    assert body["completed"]["change_percent"] == 300.0
    assert body["failed"]["value"] == 1 and body["failed"]["change_percent"] is None
    assert body["in_progress"] == 1
    assert body["scheduled"]["value"] == 1                          # only the ACTIVE schedule
    assert body["avg_run_time_seconds"]["value"] == 20.0 and body["avg_run_time_seconds"]["previous"] == 40.0
    assert body["avg_run_time_seconds"]["change_percent"] == -50.0
    assert body["generated_at"]


def test_summary_category_filter_and_custom_range(report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        _dashboard_data(db, ids)
    admin = _client(_user(ADMIN_ID, "admin"))
    kpi = admin.get("/api/reports/summary", params={"category": "KPI"}).json()
    assert kpi["total_reports"]["value"] == 2 and kpi["failed"]["value"] == 1 and kpi["scheduled"]["value"] == 0
    day = (NOW - timedelta(days=1)).date().isoformat()
    custom = admin.get("/api/reports/summary", params={"date_from": day, "date_to": day}).json()
    assert custom["range"]["key"] == "custom" and custom["total_reports"]["value"] == 2
    assert admin.get("/api/reports/summary", params={"range": "5y"}).status_code == 422
    assert admin.get("/api/reports/summary", params={"date_from": "2026-05-01", "date_to": "2026-01-01"}).status_code == 422


def test_dashboard_is_scoped_to_the_callers_own_runs(report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        _dashboard_data(db, ids)
    analyst = _client(_user(ANALYST_ID, "Analyst", ["reports.view"]))
    assert analyst.get("/api/reports/summary").json()["total_reports"]["value"] == 0
    assert analyst.get("/api/reports/analytics/status-distribution").json()["total"] == 0
    assert analyst.get("/api/reports/templates/top").json() == []


def test_type_distribution(report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        _dashboard_data(db, ids)
    body = _client(_user(ADMIN_ID, "admin")).get("/api/reports/analytics/type-distribution", params={"range": "6m"}).json()
    totals = {t["type"]: t["count"] for t in body["totals"]}
    assert totals == {"scheduled": 1, "on_demand": 4, "system": 1, "ad_hoc": 1}      # 6m window also holds the day-40 run
    assert [t["label"] for t in body["totals"]] == ["Scheduled", "On Demand", "System Generated", "Ad-hoc"]
    assert len(body["monthly"]) == 6
    assert sum(sum(v for k, v in m.items() if k != "month") for m in body["monthly"]) == sum(totals.values()) == 7
    assert all(set(m) == {"month", "scheduled", "on_demand", "system", "ad_hoc"} for m in body["monthly"])


def test_status_distribution_percentages(report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        _dashboard_data(db, ids)
    body = _client(_user(ADMIN_ID, "admin")).get("/api/reports/analytics/status-distribution", params={"range": "30d"}).json()
    by_key = {i["key"]: i for i in body["items"]}
    assert by_key["completed"]["count"] == 4 and by_key["failed"]["count"] == 1 and by_key["scheduled"]["count"] == 1
    assert body["total"] == sum(i["count"] for i in body["items"])
    assert abs(sum(i["percent"] for i in body["items"]) - 100) < 0.5


def test_top_templates(report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        _dashboard_data(db, ids)
    admin = _client(_user(ADMIN_ID, "admin"))
    top = admin.get("/api/reports/templates/top", params={"limit": 2}).json()
    assert [(t["name"], t["usage_count"]) for t in top] == [("Sales Performance", 4), ("KPI Report", 2)]
    assert top[0]["last_used_at"]
    assert admin.get("/api/reports/templates/top", params={"limit": 0}).status_code == 422


def test_top_templates_hides_role_restricted_ones(report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        for n in range(3):
            _history_row(db, generated_by=ANALYST_ID, template_id=ids["hr"], created_at=NOW - timedelta(days=1))
    analyst = _client(_user(ANALYST_ID, "Analyst", ["reports.view"]))
    assert analyst.get("/api/reports/templates/top").json() == []


# --- notifications ----------------------------------------------------------------------


def test_scheduled_runs_email_the_recipients_but_on_demand_runs_do_not(admin_client, report_env, monkeypatch):
    sent = []
    monkeypatch.setattr(report_notifications, "send_email", lambda to, subject, html, text="": sent.append((to, subject)) or True)
    with _report_session() as db:
        ids = _all_templates(db)
        _due(db, ids["executive"], M.ReportFrequency.DAILY, datetime(2026, 1, 1), name="Daily Exec",
             recipients_json=json.dumps(["ceo@example.com", "cfo@example.com"]))
        report_scheduler.process_due_reports(db, now=datetime(2026, 1, 2))
    assert sorted(to for to, _s in sent) == ["ceo@example.com", "cfo@example.com"]
    assert all("Daily Exec" in subject and "ready" in subject for _to, subject in sent)
    sent.clear()
    _csv(admin_client, ids["executive"])
    assert sent == []


def test_a_failed_scheduled_run_emails_a_failure_notice(report_env, monkeypatch):
    sent = []
    monkeypatch.setattr(report_notifications, "send_email", lambda to, subject, html, text="": sent.append((to, subject, text)) or True)
    with _report_session() as db:
        db.add(M.ReportTemplate(name="Mystery", category="mystery", is_active=True))
        db.commit()
        _due(db, 1, M.ReportFrequency.DAILY, datetime(2026, 1, 1), recipients_json=json.dumps(["ops@example.com"]))
        report_scheduler.process_due_reports(db, now=datetime(2026, 1, 2))
    assert len(sent) == 1 and "failed" in sent[0][1] and "retry" in sent[0][2]


def test_a_mail_outage_never_breaks_a_run(report_env, monkeypatch):
    def down(*_a, **_k):
        raise ConnectionError("smtp down")

    monkeypatch.setattr(report_notifications, "send_email", down)
    with _report_session() as db:
        ids = _all_templates(db)
        _due(db, ids["executive"], M.ReportFrequency.DAILY, datetime(2026, 1, 1),
             recipients_json=json.dumps(["ceo@example.com"]))
        assert report_scheduler.process_due_reports(db, now=datetime(2026, 1, 2)) == 1
        assert db.query(M.ReportHistory).one().status == M.ReportGenerationStatus.COMPLETED


# --- audit trail ------------------------------------------------------------------------


def test_audit_rows_cannot_be_updated_or_deleted(admin_client, report_env):
    with _report_session() as db:
        ids = _all_templates(db)
    _csv(admin_client, ids["executive"])
    with _report_session() as db:
        row = db.query(M.ReportAuditLog).first()
        row.action = "tampered"
        with pytest.raises(RuntimeError, match="immutable"):
            db.commit()
        db.rollback()
        db.delete(db.query(M.ReportAuditLog).first())
        with pytest.raises(RuntimeError, match="immutable"):
            db.commit()
        db.rollback()
        assert db.query(M.ReportAuditLog).filter_by(action="tampered").count() == 0


def test_the_whole_report_journey_is_audited_with_actor_and_ip(admin_client, report_env):
    with _report_session() as db:
        ids = _all_templates(db)
    _, history_id = _csv(admin_client, ids["executive"])
    with _report_session() as db:
        rows = db.query(M.ReportAuditLog).filter_by(entity_type="report", entity_id=history_id).order_by(M.ReportAuditLog.id).all()
        assert [r.action for r in rows] == ["report.requested", "report.completed", "report.downloaded"]
        assert rows[0].actor_user_id == ADMIN_ID and rows[0].ip_address
        assert rows[1].actor_user_id is None                                  # the worker, not a person
        assert json.loads(rows[0].details)["template_id"] == ids["executive"]


def test_a_rolled_back_change_leaves_no_audit_row(report_env):
    from services.report_audit import log_report_action

    with _report_session() as db:
        log_report_action(db, actor_user_id=1, action="x.y", entity_type="report", entity_id=1)
        db.rollback()
        assert db.query(M.ReportAuditLog).count() == 0


# --- misc -------------------------------------------------------------------------------


def test_permissions_cover_every_new_route(no_permission_client, report_env):
    c = no_permission_client
    for method, url in (
        ("get", "/api/reports/summary"), ("get", "/api/reports/templates/top"), ("get", "/api/reports/history/1"),
        ("get", "/api/reports/history/export"), ("get", "/api/reports/scheduled/1"),
        ("get", "/api/reports/analytics/type-distribution"), ("get", "/api/reports/analytics/status-distribution"),
        ("post", "/api/reports/history/1/retry"), ("post", "/api/reports/history/1/cancel"),
        ("post", "/api/reports/history/1/archive"), ("post", "/api/reports/scheduled/1/pause"),
        ("delete", "/api/reports/history/1"), ("delete", "/api/reports/scheduled/1"),
    ):
        assert getattr(c, method)(url).status_code == 403, (method, url)
    assert c.patch("/api/reports/scheduled/1", json={}).status_code == 403


def test_parse_enum_values_reads_mysql_column_types():
    assert parse_enum_values("enum('PROCESSING','COMPLETED','FAILED')") == ["PROCESSING", "COMPLETED", "FAILED"]
    assert parse_enum_values("enum('A','it''s')") == ["A", "it's"]
    assert parse_enum_values("varchar(20)") == []


# === round 2: Excel/PDF writers, periods, dashboard series, export, bulk delete, cancel, approval ===
from services import report_analytics  # noqa: E402
from services.report_generator import neutralise  # noqa: E402


def test_neutralise_blocks_formulas_but_keeps_plain_numbers():
    assert neutralise("=1+1") == "'=1+1" and neutralise("@SUM(A1)") == "'@SUM(A1)"
    assert neutralise("+cmd") == "'+cmd" and neutralise("-cmd") == "'-cmd"
    for safe in ("-10.00", "+5", "12.5%", "1,234.50", "Furniture", ""):
        assert neutralise(safe) == safe
    assert neutralise(None) == ""


def test_excel_is_formatted_and_formula_safe(admin_client, report_env):
    from openpyxl import load_workbook

    with _report_session() as db:
        ids = _all_templates(db)
        _order(db, 1, category="=cmd|' /C calc'!A0")
    started = admin_client.post("/api/reports/generate", json={
        "template_id": ids["sales"], "file_format": "excel", "report_name": "=HYPERLINK(1)"})
    sheet = load_workbook(io.BytesIO(admin_client.get(f"/api/reports/download/{started.json()['history_id']}").content)).active
    values = {cell.value for row in sheet.iter_rows() for cell in row}
    assert "'=HYPERLINK(1)" in values and "'=cmd|' /C calc'!A0" in values
    assert all(cell.data_type != "f" for row in sheet.iter_rows() for cell in row)      # no formulas anywhere
    assert sheet["A1"].value == "Report" and sheet["A1"].font.bold
    header = next(row for row in sheet.iter_rows() if row[0].value == "Category")
    assert header[0].font.bold and header[0].fill.fgColor.rgb.endswith("1F4D45")
    assert sheet.column_dimensions["A"].width >= 10


def test_pdf_is_a_formatted_table_with_title_and_footer(admin_client, report_env):
    pypdf = pytest.importorskip("pypdf")
    with _report_session() as db:
        ids = _all_templates(db)
        _order(db, 1)
    started = admin_client.post("/api/reports/generate", json={
        "template_id": ids["sales"], "file_format": "pdf", "report_name": "Q1 Sales", "parameters": {"region": "East"}})
    content = admin_client.get(f"/api/reports/download/{started.json()['history_id']}").content
    text = "".join(page.extract_text() for page in pypdf.PdfReader(io.BytesIO(content)).pages)
    assert "Q1 Sales" in text and "region=East" in text and "Page 1" in text
    assert "Category" in text and "Furniture" in text
    assert " | " not in text                                      # no longer values joined with pipes


def test_pdf_handles_wide_empty_and_non_latin_reports(report_env):
    from services.report_generator import _pdf_bytes

    wide = _pdf_bytes([[f"h{i}" for i in range(9)], [f"v{i}" for i in range(9)], [], ["Solo", "₹100"]], [("Report", "Wide")])
    assert wide.startswith(b"%PDF") and b"Solo" in wide
    assert _pdf_bytes([], [("Report", "Empty")]).startswith(b"%PDF")


# --- periods ------------------------------------------------------------------------------


@pytest.mark.parametrize("label,key", [
    ("Last 3 Months", "3m"), ("Last 6 Months", "6m"), ("Last 9 Months", "9m"), ("Last 12 Months", "12m"),
    ("Last 30 Days", "30d"), ("last_9_months", "9m"), ("3m", "3m"), ("30d", "30d"), ("90 days", "90d"),
    ("All Time", "all"), ("all", "all"), ("ALL_TIME", "all"),
])
def test_period_labels_from_the_ui_are_accepted(label, key):
    assert report_analytics.resolve_range(label).key == key


@pytest.mark.parametrize("bad", ["0d", "0m", "366d", "37m", "5y", "forever", "Last Month", "", "m3"])
def test_unusable_periods_are_rejected(bad):
    if bad == "":
        assert report_analytics.resolve_range(bad).key == "30d"           # blank = the default
        return
    with pytest.raises(ValueError):
        report_analytics.resolve_range(bad)


def test_every_dashboard_endpoint_takes_the_ui_period_labels(admin_client, report_env):
    for url in ("/api/reports/summary", "/api/reports/analytics/type-distribution",
                "/api/reports/analytics/status-distribution", "/api/reports/templates/top"):
        for label in ("Last 3 Months", "Last 9 Months", "Last 12 Months", "Last 30 Days", "All Time"):
            assert admin_client.get(url, params={"range": label}).status_code == 200, (url, label)
        assert admin_client.get(url, params={"range": "Last 5 Years"}).status_code == 422


def test_all_time_covers_old_runs_and_starts_buckets_at_the_first_run(report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        _dashboard_data(db, ids)
    admin = _client(_user(ADMIN_ID, "admin"))
    body = admin.get("/api/reports/summary", params={"range": "all"}).json()
    assert body["range"]["key"] == "all" and body["total_reports"]["value"] == 7        # incl. the day-40 run
    assert body["total_reports"]["previous"] == 0 and body["total_reports"]["change_percent"] is None
    kinds = admin.get("/api/reports/analytics/type-distribution", params={"range": "all"}).json()
    assert 1 <= len(kinds["monthly"]) <= 3                                                # not 300 months back to 2000
    assert sum(t["count"] for t in kinds["totals"]) == 7


# --- dashboard cards ----------------------------------------------------------------------


def test_summary_carries_mini_graph_series_that_add_up(report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        _dashboard_data(db, ids)
    admin = _client(_user(ADMIN_ID, "admin"))
    body = admin.get("/api/reports/summary", params={"range": "30d"}).json()
    t = body["trend"]
    assert t["granularity"] == "day" and 30 <= len(t["buckets"]) <= 32
    for key in ("total_reports", "completed", "failed", "scheduled", "avg_run_time_seconds"):
        assert len(t[key]) == len(t["buckets"]), key
    assert sum(t["total_reports"]) == body["total_reports"]["value"] == 6
    assert sum(t["completed"]) == body["completed"]["value"] == 4
    assert sum(t["failed"]) == body["failed"]["value"] == 1
    assert sum(t["scheduled"]) == 1                                  # the one ACTIVE schedule created in the period
    assert [v for v in t["avg_run_time_seconds"] if v is not None]
    year = admin.get("/api/reports/summary", params={"range": "12m"}).json()["trend"]
    assert year["granularity"] == "month" and len(year["buckets"]) in (12, 13)
    assert sum(year["total_reports"]) == admin.get("/api/reports/summary", params={"range": "12m"}).json()["total_reports"]["value"]


def test_summary_trend_respects_the_category_filter(report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        _dashboard_data(db, ids)
    admin = _client(_user(ADMIN_ID, "admin"))
    body = admin.get("/api/reports/summary", params={"category": "kpi"}).json()
    assert sum(body["trend"]["total_reports"]) == body["total_reports"]["value"] == 2


@pytest.mark.parametrize("seconds,label", [
    (None, None), (0.0, "0 ms"), (0.25, "250 ms"), (0.9996, "1.0 sec"), (1.0, "1.0 sec"), (4.24, "4.2 sec"),
    (59.9, "59.9 sec"), (59.96, "01 : 00 mins"), (60, "01 : 00 mins"), (155, "02 : 35 mins"),
])
def test_run_time_label_never_collapses_to_zero(seconds, label):
    assert report_analytics.format_duration(seconds) == label


def test_a_sub_second_average_run_time_is_visible(report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        _history_row(db, template_id=ids["sales"], duration_seconds=0.2, created_at=NOW - timedelta(days=1))
        _history_row(db, template_id=ids["sales"], duration_seconds=0.4, created_at=NOW - timedelta(days=1))
    body = _client(_user(ADMIN_ID, "admin")).get("/api/reports/summary").json()["avg_run_time_seconds"]
    assert body["value"] == 0.3 and body["label"] == "300 ms"


def test_donut_slices_are_runs_in_the_period_and_add_up(report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        _dashboard_data(db, ids)
        for n in range(5):      # active schedules must not leak into the run-based donut
            db.add(M.ScheduledReport(template_id=ids["sales"], frequency=M.ReportFrequency.DAILY,
                                     file_format=M.ReportFileFormat.CSV, next_run_time=NOW + timedelta(days=1), owner_id=ADMIN_ID))
        db.commit()
    admin = _client(_user(ADMIN_ID, "admin"))
    body = admin.get("/api/reports/analytics/status-distribution", params={"range": "30d"}).json()
    by_key = {i["key"]: i["count"] for i in body["items"]}
    assert by_key == {"completed": 4, "scheduled": 1, "failed": 1, "in_progress": 0, "cancelled": 0}
    assert body["total"] == 6                                       # == total_reports of the same period
    wide = admin.get("/api/reports/analytics/status-distribution", params={"range": "all"}).json()
    assert wide["total"] == 7                                       # the day-40 run only appears when the period allows it
    kpi = admin.get("/api/reports/analytics/status-distribution", params={"category": "kpi"}).json()
    assert kpi["total"] == 2


def test_top_templates_view_all_lists_unused_ones_after_used_ones(report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        _dashboard_data(db, ids)
    admin = _client(_user(ADMIN_ID, "admin"))
    top = admin.get("/api/reports/templates/top", params={"limit": 100, "include_unused": "true"}).json()
    assert len(top) == 8
    assert [t["name"] for t in top[:2]] == ["Sales Performance", "KPI Report"]
    assert all(t["usage_count"] == 0 and t["last_used_at"] is None for t in top[2:])
    assert len(admin.get("/api/reports/templates/top", params={"limit": 100}).json()) == 2
    assert admin.get("/api/reports/templates/top", params={"limit": 101}).status_code == 422


def test_categories_for_the_all_categories_filter(admin_client, report_env):
    with _report_session() as db:
        _all_templates(db)
    cats = {c["category"]: c for c in admin_client.get("/api/reports/categories").json()}
    assert set(cats) == {"executive", "sales", "financial", "hr", "operations", "kpi", "forecast", "data"}
    assert cats["kpi"]["label"] == "KPI" and cats["hr"]["label"] == "HR" and cats["sales"]["label"] == "Sales"
    assert cats["sales"]["templates"] == 1
    analyst = _client(_user(ANALYST_ID, "Analyst", ["reports.view"]))
    assert "hr" not in {c["category"] for c in analyst.get("/api/reports/categories").json()}


# --- export of the selection ----------------------------------------------------------------


def test_export_only_the_selected_rows_and_keeps_the_filters(admin_client, report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        a = _history_row(db, report_name="Alpha Sales", template_id=ids["sales"])
        b = _history_row(db, report_name="Beta Sales", template_id=ids["sales"])
        c = _history_row(db, report_name="Gamma Ops", template_id=ids["operations"])
    everything = admin_client.get("/api/reports/history/export").text
    assert all(name in everything for name in ("Alpha", "Beta", "Gamma"))
    picked = admin_client.get("/api/reports/history/export", params=[("ids", a), ("ids", c)]).text
    assert "Alpha" in picked and "Gamma" in picked and "Beta" not in picked
    filtered = admin_client.get("/api/reports/history/export", params={"report_type": "sales"}).text
    assert "Alpha" in filtered and "Beta" in filtered and "Gamma" not in filtered
    both = admin_client.get("/api/reports/history/export", params=[("ids", a), ("ids", c), ("report_type", "sales")]).text
    assert "Alpha" in both and "Beta" not in both and "Gamma" not in both
    assert admin_client.get("/api/reports/history/export", params={"search": "beta"}).text.count("Beta") == 1


def test_export_selection_cannot_reach_other_peoples_rows(analyst_client, report_env):
    with _report_session() as db:
        mine = _history_row(db, report_name="Mine", generated_by=ANALYST_ID)
        theirs = _history_row(db, report_name="Theirs", generated_by=OWNER_ID)
    text = analyst_client.get("/api/reports/history/export", params=[("ids", mine), ("ids", theirs)]).text
    assert "Mine" in text and "Theirs" not in text


def test_export_formats(admin_client, report_env):
    from openpyxl import load_workbook

    with _report_session() as db:
        _history_row(db, report_name="Alpha Sales")
    xlsx = admin_client.get("/api/reports/history/export", params={"format": "excel", "search": "alpha"})
    assert xlsx.headers["content-type"].startswith("application/vnd.openxmlformats")
    assert xlsx.headers["content-disposition"].endswith('report-history.xlsx"')
    values = {c.value for row in load_workbook(io.BytesIO(xlsx.content)).active.iter_rows() for c in row}
    assert "Alpha Sales" in values and any("search=alpha" in str(v) for v in values)
    pdf = admin_client.get("/api/reports/history/export", params={"format": "pdf"})
    assert pdf.content.startswith(b"%PDF") and b"Alpha Sales" in pdf.content
    assert admin_client.get("/api/reports/history/export", params={"format": "word"}).status_code == 422


# --- bulk delete ------------------------------------------------------------------------------


def test_bulk_delete_removes_the_selection_and_reports_what_it_skipped(report_env):
    deleter = _deleter_client()
    f1, f2 = report_env / "a.csv", report_env / "b.csv"
    f1.write_text("x")
    f2.write_text("y")
    with _report_session() as db:
        one = _history_row(db, generated_by=ANALYST_ID, file_path=str(f1))
        two = _history_row(db, generated_by=ANALYST_ID, file_path=str(f2))
        running = _history_row(db, generated_by=ANALYST_ID, status=M.ReportGenerationStatus.RUNNING)
        foreign = _history_row(db, generated_by=OWNER_ID)
    result = deleter.post("/api/reports/history/bulk-delete", json={"ids": [one, two, running, foreign, 99999, one]}).json()
    assert result["deleted"] == [one, two]
    assert {(s["id"]) for s in result["skipped"]} == {running, foreign, 99999}
    assert "in progress" in next(s["reason"] for s in result["skipped"] if s["id"] == running)
    assert "2 report(s) deleted, 3 skipped" == result["message"]
    assert not f1.exists() and not f2.exists()
    with _report_session() as db:
        assert db.query(M.ReportHistory).count() == 2                           # running + foreign remain
        bulk = [a for a in db.query(M.ReportAuditLog).filter_by(action="report.deleted")]
        assert len(bulk) == 2 and all(json.loads(a.details)["bulk"] for a in bulk)


def test_bulk_delete_needs_the_delete_permission_and_a_sane_selection(report_env, analyst_client, admin_client):
    assert analyst_client.post("/api/reports/history/bulk-delete", json={"ids": [1]}).status_code == 403
    assert _editor_client().post("/api/reports/history/bulk-delete", json={"ids": [1]}).status_code == 403
    assert admin_client.post("/api/reports/history/bulk-delete", json={"ids": []}).status_code == 422
    assert admin_client.post("/api/reports/history/bulk-delete", json={"ids": list(range(1, 202))}).status_code == 422


# --- cancelling a running report -----------------------------------------------------------------


def test_the_api_can_cancel_a_running_report(report_env):
    deleter = _deleter_client()
    with _report_session() as db:
        running = _history_row(db, generated_by=ANALYST_ID, status=M.ReportGenerationStatus.RUNNING,
                               started_at=NOW - timedelta(seconds=3))
    assert deleter.get(f"/api/reports/history/{running}").json()["can_cancel"] is True
    assert deleter.post(f"/api/reports/history/{running}/cancel").status_code == 200
    body = deleter.get(f"/api/reports/history/{running}").json()
    assert body["status"] == "cancelled" and body["duration_seconds"] >= 3 and body["can_cancel"] is False
    assert deleter.post(f"/api/reports/history/{running}/cancel").status_code == 409
    with _report_session() as db:
        assert json.loads(db.query(M.ReportAuditLog).filter_by(action="report.cancelled").one().details) == {"was_running": True}


def test_a_report_cancelled_while_reading_data_never_completes(report_env, monkeypatch):
    with _report_session() as db:
        ids = _all_templates(db)
        hid = _history_row(db, template_id=ids["executive"], status=M.ReportGenerationStatus.QUEUED)
    real_rows = report_generator.ReportDataProvider.rows

    def cancel_midway(self, category, params=None):
        rows = real_rows(self, category, params)
        with _report_session() as other:            # the user clicks Cancel while the data is being read
            other.get(M.ReportHistory, hid).status = M.ReportGenerationStatus.CANCELLED
            other.commit()
        return rows

    monkeypatch.setattr(report_generator.ReportDataProvider, "rows", cancel_midway)
    report_generator.generate_report(hid)
    with _report_session() as db:
        row = db.get(M.ReportHistory, hid)
        assert row.status == M.ReportGenerationStatus.CANCELLED and row.file_path is None
    assert list(report_env.glob("report-*")) == []
    assert "report.completed" not in _audit_actions()


def test_a_report_cancelled_while_its_file_is_written_is_cleaned_up(report_env, monkeypatch):
    with _report_session() as db:
        ids = _all_templates(db)
        hid = _history_row(db, template_id=ids["executive"], status=M.ReportGenerationStatus.QUEUED)
    real_render = report_generator.render_report_file

    def cancel_after_write(file_format, rows, meta=None):
        data = real_render(file_format, rows, meta)
        with _report_session() as other:
            other.get(M.ReportHistory, hid).status = M.ReportGenerationStatus.CANCELLED
            other.commit()
        return data

    monkeypatch.setattr(report_generator, "render_report_file", cancel_after_write)
    report_generator.generate_report(hid)
    with _report_session() as db:
        assert db.get(M.ReportHistory, hid).status == M.ReportGenerationStatus.CANCELLED
    assert list(report_env.glob("report-*")) == []                  # the half-finished file was removed


def test_cancel_between_worker_dispatch_and_claim_is_not_overwritten(report_env, monkeypatch):
    with _report_session() as db:
        ids = _all_templates(db)
        hid = _history_row(db, template_id=ids["executive"], status=M.ReportGenerationStatus.QUEUED)
    claim_report = report_generator._claim_report

    def cancel_before_claim(db, history_id):
        with _report_session() as other:
            other.get(M.ReportHistory, history_id).status = M.ReportGenerationStatus.CANCELLED
            other.commit()
        return claim_report(db, history_id)

    monkeypatch.setattr(report_generator, "_claim_report", cancel_before_claim)
    report_generator.generate_report(hid)

    with _report_session() as db:
        row = db.get(M.ReportHistory, hid)
        assert row.status == M.ReportGenerationStatus.CANCELLED
        assert row.file_path is None
    assert list(report_env.glob("report-*")) == []


def test_cancel_before_completion_cannot_be_overwritten(report_env, monkeypatch):
    with _report_session() as db:
        ids = _all_templates(db)
        hid = _history_row(db, template_id=ids["executive"], status=M.ReportGenerationStatus.QUEUED)
    complete_report = report_generator._complete_report

    def cancel_before_complete(db, history, target, clock):
        with _report_session() as other:
            other.get(M.ReportHistory, hid).status = M.ReportGenerationStatus.CANCELLED
            other.commit()
        return complete_report(db, history, target, clock)

    monkeypatch.setattr(report_generator, "_complete_report", cancel_before_complete)
    report_generator.generate_report(hid)

    with _report_session() as db:
        row = db.get(M.ReportHistory, hid)
        assert row.status == M.ReportGenerationStatus.CANCELLED
        assert row.file_path is None
    assert list(report_env.glob("report-*")) == []
    assert "report.completed" not in _audit_actions()


# --- wording ----------------------------------------------------------------------------------------


def test_empty_results_carry_the_wireframe_messages(admin_client, report_env):
    body = admin_client.get("/api/reports/history", params={"search": "nothing-here"}).json()
    assert body["items"] == [] and body["total"] == 0 and body["message"] == "No matching reports found."
    assert admin_client.get("/api/reports/scheduled").json()["message"] == "No matching scheduled reports found."
    with _report_session() as db:
        _history_row(db)
    assert admin_client.get("/api/reports/history").json()["message"] is None


def test_a_missing_template_gets_the_friendly_message(admin_client):
    for body in ({}, {"file_format": "csv"}):
        response = admin_client.post("/api/reports/generate", json=body)
        assert response.status_code == 422 and response.json()["detail"] == "Please select a report template."


def test_schedule_search_matches_the_template_description(admin_client, report_env):
    with _report_session() as db:
        db.add(M.ReportTemplate(name="Plain", category="sales", is_active=True, description="Quarterly boardroom pack"))
        db.commit()
    _schedule(admin_client, 1)
    assert admin_client.get("/api/reports/scheduled", params={"search": "boardroom"}).json()["total"] == 1
    assert admin_client.get("/api/reports/scheduled", params={"search": "zzzz"}).json()["total"] == 0


# --- template approval and version -----------------------------------------------------------------------


def test_only_approved_templates_can_be_used(admin_client, report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        db.get(M.ReportTemplate, ids["kpi"]).approval_status = "pending"
        db.get(M.ReportTemplate, ids["forecast"]).approval_status = "rejected"
        db.commit()
    listed = {t["name"] for t in admin_client.get("/api/reports/templates").json()}
    assert "KPI Report" not in listed and "Forecast Report" not in listed and "Sales Performance" in listed
    assert "kpi" not in {c["category"] for c in admin_client.get("/api/reports/categories").json()}
    assert admin_client.get(f"/api/reports/templates/{ids['kpi']}").status_code == 404
    assert admin_client.get(f"/api/reports/templates/{ids['kpi']}/preview").status_code == 404
    for body in ({"template_id": ids["kpi"]}, {"template_id": ids["kpi"], "scheduled": True, "frequency": "daily",
                                                "next_run_time": _iso(timedelta(days=1))}):
        response = admin_client.post("/api/reports/generate", json=body)
        assert response.status_code == 404 and "unavailable" in response.json()["detail"]
    with _report_session() as db:
        failed = _history_row(db, template_id=ids["kpi"], status=M.ReportGenerationStatus.FAILED)
    assert admin_client.post(f"/api/reports/history/{failed}/retry").status_code == 409


def test_a_template_pulled_after_scheduling_fails_the_run_with_a_clear_reason(report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        _due(db, ids["kpi"], M.ReportFrequency.DAILY, datetime(2026, 1, 1))
        db.get(M.ReportTemplate, ids["kpi"]).approval_status = "rejected"
        db.commit()
        report_scheduler.process_due_reports(db, now=datetime(2026, 1, 2))
        row = db.query(M.ReportHistory).one()
        assert row.status == M.ReportGenerationStatus.FAILED and "no longer available" in row.failure_reason


def test_template_version_and_approval_are_returned(admin_client, report_env):
    with _report_session() as db:
        ids = _all_templates(db)
        db.get(M.ReportTemplate, ids["sales"]).version = 4
        db.commit()
    body = admin_client.get(f"/api/reports/templates/{ids['sales']}").json()
    assert body["version"] == 4 and body["approval_status"] == "approved" and body["updated_at"]
    assert body["default_format"] == "csv" and "supported_formats" in body


# --- organisation time zone ------------------------------------------------------------------------------


def test_schedules_default_to_the_users_settings_time_zone(report_env):
    user = _user(ADMIN_ID, "admin")
    user.timezone = "Asia/Kolkata"           # the Settings > General value stored on users.timezone
    client = _client(user)
    with _report_session() as db:
        ids = _all_templates(db)
    run = (_utcnow() + timedelta(days=30)).replace(hour=9, minute=0, second=0, microsecond=0)
    created = _schedule(client, ids["sales"], next_run_time=run.isoformat()).json()
    assert created["next_run_time_local"] == run.isoformat() + "+05:30"
    assert client.get(f"/api/reports/scheduled/{created['scheduled_report_id']}").json()["timezone"] == "Asia/Kolkata"
    user.timezone = "Not/AZone"              # a corrupt setting must not break scheduling
    again = _schedule(client, ids["sales"], next_run_time=(run + timedelta(days=1)).isoformat()).json()
    assert again["next_run_time_local"].endswith("+00:00")
