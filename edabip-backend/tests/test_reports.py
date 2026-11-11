"""Endpoint tests for the Reporting module (/api/reports).

Why `database` is stubbed before the imports below: edabip-backend/database.py
opens a MySQL connection the moment it is imported
(`create_database_if_not_exists()` runs at module import) and the Reporting
module is built directly on that engine (`get_db`, `SessionLocal`). Importing
the real module here would make `pytest tests` require a live MySQL server —
the same caveat billing/tests/ documents. Substituting an in-memory SQLite
module keeps this file inside the default suite and tests what actually carries
risk in this module: permissions, per-user scoping, status codes and the file
writers.

`report_generator.REPORT_DIR` is redirected to pytest's tmp_path so the suite
never writes into the git-ignored generated_reports/ directory, and
`report_generator.SessionLocal` is pointed at the SQLite sessionmaker because
BackgroundTasks and the scheduler worker open their own session.
"""
import io
import sys
import types
import zipfile
from datetime import datetime, timedelta
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool

if str(Path(__file__).resolve().parents[1]) not in sys.path:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# --- in-memory stand-in for the auth database ---------------------------------
_report_engine = create_engine(
    "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
)
_report_base = declarative_base()
_report_session = sessionmaker(autocommit=False, autoflush=False, bind=_report_engine)


def _get_db():
    db = _report_session()
    try:
        yield db
    finally:
        db.close()


_database_stub = types.ModuleType("database")
_database_stub.Base = _report_base
_database_stub.engine = _report_engine
_database_stub.SessionLocal = _report_session
_database_stub.get_db = _get_db
_database_stub.init_db = lambda: None  # never ALTER a real database from tests
_database_stub.create_database_if_not_exists = lambda: None
sys.modules["database"] = _database_stub

import models.reports as report_models  # noqa: E402
import services.report_generator as report_generator  # noqa: E402
import services.report_scheduler as report_scheduler  # noqa: E402
import utils.auth  # noqa: E402
from routers import reports as reports_api  # noqa: E402
from services.superstore_etl import EXPECTED_COLUMNS, import_superstore_workbook  # noqa: E402

ADMIN_ID = 1          # role "admin": no explicit permission rows needed
OWNER_ID = 7          # the non-admin account that owns the rows below
ANALYST_ID = 8        # a different non-admin account

TEMPLATE_CATEGORIES = (("Executive Summary", "executive"),
                       ("Sales Performance", "sales"),
                       ("Data Quality", "data"))

VALID_ORDER_ROW = (
    "1", "CA-2026-100", datetime(2026, 1, 5), datetime(2026, 1, 7), "Standard Class",
    "CG-1", "Alice B", "Consumer", "United States", "New York", "New York", "10001",
    "East", "FUR-CH-100", "Furniture", "Chairs", "Hon Chair", 120.5, 2, 0.1, 24.1,
)


@pytest.fixture(autouse=True)
def report_env(tmp_path, monkeypatch):
    """Fresh schema + redirected output dir + SQLite session for every test."""
    _report_base.metadata.drop_all(bind=_report_engine)
    _report_base.metadata.create_all(bind=_report_engine)
    monkeypatch.setattr(report_generator, "REPORT_DIR", tmp_path)
    monkeypatch.setattr(reports_api, "REPORT_DIR", tmp_path)
    monkeypatch.setattr(report_generator, "SessionLocal", _report_session)
    yield tmp_path


def _user(user_id, role_name, permission_codes=()):
    """Minimal stand-in for the User behind get_current_user.

    The codes are collected by the `permission_codes` parameter on purpose: a
    comprehension inside a class body cannot read a name the class body itself
    assigns, so `permissions = [... for code in permissions]` raised NameError.
    """

    class Role:
        name = role_name
        permissions = [types.SimpleNamespace(name=code) for code in permission_codes]

    class User:
        id = user_id
        role = Role

    return User()


def _client(user):
    """The reporting router on its own app, signed in as `user`."""
    app = FastAPI()
    app.include_router(reports_api.router)
    app.dependency_overrides[utils.auth.get_current_user] = lambda: user
    return TestClient(app)


@pytest.fixture
def admin_client():
    return _client(_user(ADMIN_ID, "admin"))


@pytest.fixture
def analyst_client():
    """A non-admin holding exactly the two codes the reports routes check."""
    return _client(_user(ANALYST_ID, "Analyst", ["reports.view", "reports.create"]))


@pytest.fixture
def no_permission_client():
    """A signed-in caller with no reports.* codes at all -> every route 403s."""
    return _client(_user(ANALYST_ID, "Analyst"))


def _seed_templates(db):
    """The catalog seed_reports.py installs, reduced to the ids tests need."""
    ids = {}
    for name, category in TEMPLATE_CATEGORIES:
        template = report_models.ReportTemplate(name=name, category=category, is_active=True)
        db.add(template)
        db.flush()
        ids[category] = template.id
    db.commit()
    return ids


def _seed_order(db):
    """One validated Superstore line item.

    Required by the sales/executive templates: without a row they render the
    two-column "nothing imported yet" placeholder, which hid the PDF bug.
    """
    db.add(report_models.SuperstoreOrder(
        import_id=1, source_row=2, row_id="1", order_id="CA-2026-100",
        order_date=datetime(2026, 1, 5), ship_date=datetime(2026, 1, 7),
        ship_mode="Standard Class", customer_id="CG-1", customer_name="Alice B",
        segment="Consumer", country_region="United States", city="New York",
        state_province="New York", postal_code="10001", region="East",
        product_id="FUR-CH-100", category="Furniture", sub_category="Chairs",
        product_name="Hon Chair", sales=120.5, quantity=2, discount=0.1, profit=24.1,
    ))
    db.commit()


# --- catalog ------------------------------------------------------------------


def test_templates_returns_the_active_catalog_sorted_by_name(admin_client, report_env):
    with _report_session() as db:
        _seed_templates(db)
        db.add(report_models.ReportTemplate(name="Retired", category="sales", is_active=False))
        db.commit()

    response = admin_client.get("/api/reports/templates")

    assert response.status_code == 200
    assert [item["name"] for item in response.json()] == [
        "Data Quality", "Executive Summary", "Sales Performance",
    ]


def test_reports_routes_require_the_reports_permissions(no_permission_client, report_env):
    with _report_session() as db:
        _seed_templates(db)

    assert no_permission_client.get("/api/reports/templates").status_code == 403
    assert no_permission_client.get("/api/reports/history").status_code == 403
    assert no_permission_client.post(
        "/api/reports/generate", json={"template_id": 1}
    ).status_code == 403


# --- generation ---------------------------------------------------------------


def test_generate_runs_in_the_background_and_serves_a_csv(admin_client, report_env):
    with _report_session() as db:
        ids = _seed_templates(db)
        _seed_order(db)

    started = admin_client.post(
        "/api/reports/generate", json={"template_id": ids["sales"], "file_format": "csv"}
    )

    assert started.status_code == 200
    assert started.json()["status"] == "processing"
    history_id = started.json()["history_id"]

    with _report_session() as db:
        stored = db.get(report_models.ReportHistory, history_id)
        assert stored.status == report_models.ReportGenerationStatus.COMPLETED

    download = admin_client.get(f"/api/reports/download/{history_id}")
    assert download.status_code == 200
    assert download.headers["content-type"].startswith("text/csv")
    assert b"Category,Sales,Profit,Quantity,Profit margin" in download.content
    assert b"Furniture" in download.content


def test_generate_writes_a_valid_xlsx_package(admin_client, report_env):
    with _report_session() as db:
        ids = _seed_templates(db)
        _seed_order(db)

    started = admin_client.post(
        "/api/reports/generate", json={"template_id": ids["sales"], "file_format": "excel"}
    )
    download = admin_client.get(f"/api/reports/download/{started.json()['history_id']}")

    assert download.status_code == 200
    assert download.headers["content-type"].startswith(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    with zipfile.ZipFile(io.BytesIO(download.content)) as package:
        assert "xl/worksheets/sheet1.xml" in package.namelist()
        _assert_sheet_relationship_is_a_worksheet(package)
    from openpyxl import load_workbook

    sheet = load_workbook(io.BytesIO(download.content)).active
    assert "Furniture" in [cell.value for row in sheet.iter_rows() for cell in row]


def _assert_sheet_relationship_is_a_worksheet(package):
    """Regression: the sheet was declared with the relationship type "officeDocument"
    instead of "worksheet". openpyxl and LibreOffice tolerate that, but Microsoft Excel
    discards the sheet, so every Excel report opened empty."""
    import re

    rels = package.read("xl/_rels/workbook.xml.rels").decode()
    sheet_rel = re.search(r'<Relationship[^>]*Target="[^"]*worksheets/sheet1\.xml"[^>]*>', rels)
    assert sheet_rel, "workbook has no relationship to the worksheet part"
    assert re.search(r'Type="[^"]*/relationships/worksheet"', sheet_rel.group(0)), sheet_rel.group(0)


def test_generate_pdf_supports_multi_column_reports(admin_client, report_env):
    """Regression: rows were unpacked as exactly label/value, so a five-column
    report raised ValueError, was stored as "failed", and /download answered 409
    for every PDF of a real report."""
    with _report_session() as db:
        ids = _seed_templates(db)
        _seed_order(db)

    started = admin_client.post(
        "/api/reports/generate", json={"template_id": ids["sales"], "file_format": "pdf"}
    )
    history_id = started.json()["history_id"]

    with _report_session() as db:
        stored = db.get(report_models.ReportHistory, history_id)
        assert stored.status == report_models.ReportGenerationStatus.COMPLETED

    download = admin_client.get(f"/api/reports/download/{history_id}")
    assert download.status_code == 200
    assert download.headers["content-type"].startswith("application/pdf")
    assert download.content.startswith(b"%PDF-1.4")
    assert b"Furniture" in download.content       # the five-column row is in there
    assert b"startxref" in download.content       # xref table was written
    assert download.content.rstrip().endswith(b"%%EOF")


def test_history_reports_progress_without_leaking_server_paths(admin_client, report_env):
    with _report_session() as db:
        ids = _seed_templates(db)

    started = admin_client.post(
        "/api/reports/generate", json={"template_id": ids["executive"], "file_format": "csv"}
    )
    listing = admin_client.get("/api/reports/history")

    assert listing.status_code == 200
    body = listing.json()
    assert (body["page"], body["page_size"], body["total"]) == (1, 20, 1)
    item = body["items"][0]
    assert item["id"] == started.json()["history_id"]
    assert item["status"] == "completed"
    assert item["file_format"] == "csv"
    # The stored path is server-side detail - clients download by id.
    assert "file_path" not in item


# --- per-user scoping ---------------------------------------------------------


def test_non_admin_only_sees_their_own_history_and_schedules(analyst_client, report_env):
    with _report_session() as db:
        ids = _seed_templates(db)
        db.add(report_models.ReportHistory(
            template_id=ids["executive"], report_name="Someone else's report",
            generated_by=OWNER_ID, status=report_models.ReportGenerationStatus.COMPLETED,
            file_format=report_models.ReportFileFormat.CSV,
        ))
        db.add(report_models.ScheduledReport(
            template_id=ids["executive"], frequency=report_models.ReportFrequency.DAILY,
            file_format=report_models.ReportFileFormat.CSV,
            next_run_time=datetime(2026, 1, 1), owner_id=OWNER_ID,
        ))
        db.commit()
        foreign_history_id = db.query(report_models.ReportHistory).one().id

    assert analyst_client.get("/api/reports/history").json()["total"] == 0
    assert analyst_client.get("/api/reports/scheduled").json()["total"] == 0
    assert analyst_client.get(f"/api/reports/download/{foreign_history_id}").status_code == 404


def test_admin_sees_every_row(admin_client, report_env):
    with _report_session() as db:
        ids = _seed_templates(db)
        db.add(report_models.ReportHistory(
            template_id=ids["executive"], report_name="Owned elsewhere",
            generated_by=OWNER_ID, status=report_models.ReportGenerationStatus.COMPLETED,
            file_format=report_models.ReportFileFormat.CSV,
        ))
        db.commit()

    assert admin_client.get("/api/reports/history").json()["total"] == 1


# --- download guards ----------------------------------------------------------


def test_download_refuses_reports_that_are_not_ready(admin_client, report_env):
    with _report_session() as db:
        history = report_models.ReportHistory(
            report_name="Still generating", generated_by=ADMIN_ID,
            status=report_models.ReportGenerationStatus.PROCESSING,
            file_format=report_models.ReportFileFormat.CSV,
        )
        db.add(history)
        db.commit()
        history_id = history.id

    assert admin_client.get(f"/api/reports/download/{history_id}").status_code == 409
    assert admin_client.get("/api/reports/download/424242").status_code == 404


def test_download_refuses_a_path_outside_the_report_directory(admin_client, report_env, tmp_path):
    escaped = tmp_path.parent / "escaped-report.csv"
    escaped.write_text("not ours", encoding="utf-8")
    with _report_session() as db:
        history = report_models.ReportHistory(
            report_name="Escaped", generated_by=ADMIN_ID,
            status=report_models.ReportGenerationStatus.COMPLETED,
            file_format=report_models.ReportFileFormat.CSV, file_path=str(escaped),
        )
        db.add(history)
        db.commit()
        history_id = history.id

    assert admin_client.get(f"/api/reports/download/{history_id}").status_code == 404


# --- scheduling ---------------------------------------------------------------


def test_scheduling_validates_input_and_lists_the_created_schedule(admin_client, report_env):
    with _report_session() as db:
        ids = _seed_templates(db)

    assert admin_client.post(
        "/api/reports/generate", json={"template_id": ids["sales"], "scheduled": True}
    ).status_code == 422
    assert admin_client.post(
        "/api/reports/generate", json={"template_id": ids["sales"], "frequency": "daily"}
    ).status_code == 422
    assert admin_client.post(
        "/api/reports/generate", json={"template_id": 4242}
    ).status_code == 404

    created = admin_client.post("/api/reports/generate", json={
        "template_id": ids["sales"], "scheduled": True, "frequency": "weekly",
        "next_run_time": (datetime.now() + timedelta(days=30)).isoformat(timespec="seconds"),
    })
    assert created.status_code == 200
    assert created.json()["status"] == "scheduled"
    assert created.json()["scheduled_report_id"]

    listing = admin_client.get("/api/reports/scheduled")
    assert listing.json()["total"] == 1
    assert listing.json()["items"][0]["owner_id"] == ADMIN_ID
    assert admin_client.get(
        "/api/reports/scheduled", params={"status": "active"}
    ).json()["total"] == 1
    assert admin_client.get(
        "/api/reports/scheduled", params={"status": "nope"}
    ).status_code == 422


def test_scheduler_generates_due_reports_and_advances_the_schedule(report_env):
    """services/report_scheduler.py is what a cron job calls, so the periodic
    path is covered directly - no HTTP request is involved in it."""
    with _report_session() as db:
        ids = _seed_templates(db)
        db.add(report_models.ScheduledReport(
            template_id=ids["executive"], frequency=report_models.ReportFrequency.WEEKLY,
            file_format=report_models.ReportFileFormat.CSV,
            next_run_time=datetime(2026, 1, 1), owner_id=OWNER_ID,
        ))
        db.commit()

        assert report_scheduler.process_due_reports(db, now=datetime(2026, 1, 2)) == 1

        schedule = db.query(report_models.ScheduledReport).one()
        assert schedule.next_run_time == datetime(2026, 1, 8)
        history = db.query(report_models.ReportHistory).one()
        assert history.status == report_models.ReportGenerationStatus.COMPLETED
        assert history.generated_by == OWNER_ID
        assert Path(history.file_path).is_file()

        # The schedule moved into the future, so a second run is a no-op.
        assert report_scheduler.process_due_reports(db, now=datetime(2026, 1, 2)) == 0


# --- workbook import ----------------------------------------------------------


def test_superstore_import_validates_rows_and_skips_duplicates(report_env, tmp_path):
    from openpyxl import Workbook

    workbook_path = tmp_path / "orders.xlsx"
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Orders"
    sheet.append(list(EXPECTED_COLUMNS))
    sheet.append(list(VALID_ORDER_ROW))
    sheet.append([
        "2", "CA-2026-101", datetime(2026, 1, 6), datetime(2026, 1, 8), "Second Class",
        "CG-2", "Bob C", "Corporate", "United States", "Seattle", "Washington", "98101",
        "West", "OFF-SU-200", "Office Supplies", "Supplies", "Stapler", 40.0, "oops", 0.0, 8.0,
    ])
    workbook.save(workbook_path)

    with _report_session() as db:
        first = import_superstore_workbook(db, workbook_path)

        assert (first.total_rows, first.accepted_rows, first.rejected_rows) == (2, 1, 1)
        assert first.status == "completed"
        assert db.query(report_models.SuperstoreOrder).count() == 1
        error = db.query(report_models.SuperstoreImportError).one()
        assert error.source_row == 3
        assert "Quantity" in error.message

        # Re-importing the same workbook must not duplicate rows.
        again = import_superstore_workbook(db, workbook_path)
        assert again.already_imported is True
        assert db.query(report_models.SuperstoreImport).count() == 1
        assert db.query(report_models.SuperstoreOrder).count() == 1
