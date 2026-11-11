from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.engine.url import make_url
from config import settings

def create_database_if_not_exists():
    try:
        url = make_url(settings.database_url)

        database_name = url.database

        server_url = (
            f"{url.drivername}://{url.username}:{url.password}"
            f"@{url.host}:{url.port}"
        )

        print("Server URL:", server_url)

        server_engine = create_engine(server_url)

        with server_engine.connect() as conn:
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{database_name}`"))
            conn.commit()

        server_engine.dispose()

    except Exception as e:
        raise RuntimeError(f"Failed to create database '{database_name}': {e}")

# Create database if it doesn't exist
create_database_if_not_exists()

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=10,
    max_overflow=20,
    echo=settings.debug,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a DB session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables if they don't exist (dev convenience)."""
    from models import user  # noqa — auth / role / refresh-token / audit-log tables
    from models import analytics  # noqa — dashboard & analytics processed-data tables
    from models import reports  # noqa — report templates / schedules / history tables
    from billing import models as billing_models  # noqa — billing_* tables
    Base.metadata.create_all(bind=engine)
    _ensure_users_full_name_column()
    _ensure_users_settings_columns()
    _ensure_reports_schema()
    _ensure_billing_schema()
    _maybe_seed_billing_demo()


def _ensure_users_full_name_column():
    """Add users.full_name on local DBs that still have first_name/last_name.

    create_all() never ALTERs existing tables. Production already has
    full_name, so this is a no-op there. Leftover first_name/last_name
    columns are left in place; the ORM no longer selects them.
    """
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    columns = {col["name"] for col in inspector.get_columns("users")}
    if "full_name" in columns:
        return

    statements = ["ALTER TABLE users ADD COLUMN full_name VARCHAR(255) NULL"]
    if "first_name" in columns and "last_name" in columns:
        statements.append(
            "UPDATE users SET full_name = TRIM(CONCAT("
            "COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))) "
            "WHERE full_name IS NULL OR TRIM(full_name) = ''"
        )
    elif "first_name" in columns:
        statements.append(
            "UPDATE users SET full_name = TRIM(COALESCE(first_name, '')) "
            "WHERE full_name IS NULL OR TRIM(full_name) = ''"
        )
    statements.extend(
        [
            "UPDATE users SET full_name = 'User' "
            "WHERE full_name IS NULL OR TRIM(full_name) = ''",
            "ALTER TABLE users MODIFY COLUMN full_name VARCHAR(255) NOT NULL",
        ]
    )

    with engine.begin() as conn:
        for sql in statements:
            conn.execute(text(sql))

def _ensure_users_settings_columns():
    """Add the Settings > General Settings columns to users on local DBs
    created before this feature existed. create_all() never ALTERs
    existing tables, so — like _ensure_users_full_name_column above —
    this brings older local DBs up to date. No-op once the columns exist.
    """
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    columns = {col["name"] for col in inspector.get_columns("users")}
    statements = []

    if "mobile_number" not in columns:
        statements.append(
            "ALTER TABLE users ADD COLUMN mobile_number VARCHAR(30) NULL"
        )
    if "application_name" not in columns:
        statements.append(
            "ALTER TABLE users ADD COLUMN application_name VARCHAR(120) "
            "NOT NULL DEFAULT 'EDABIP'"
        )
    if "timezone" not in columns:
        statements.append(
            "ALTER TABLE users ADD COLUMN timezone VARCHAR(60) "
            "NOT NULL DEFAULT 'UTC'"
        )
    if "company_size" not in columns:
        statements.append(
            "ALTER TABLE users ADD COLUMN company_size VARCHAR(30) NULL"
        )
    if "industry" not in columns:
        statements.append(
            "ALTER TABLE users ADD COLUMN industry VARCHAR(60) NULL"
        )
    if "email_notifications" not in columns:
        statements.append(
            "ALTER TABLE users ADD COLUMN email_notifications TINYINT(1) "
            "NOT NULL DEFAULT 1"
        )

    if not statements:
        return

    with engine.begin() as conn:
        for sql in statements:
            conn.execute(text(sql))

def _ensure_reports_schema():
    """Add report columns create_all cannot: it never ALTERs existing tables.

    Local databases that created report_history / scheduled_reports before
    template_id and file_format existed keep the old shape, and every report
    endpoint touching the missing column then 500s with MySQL 1054. See
    services/reports_migration.py.
    """
    from services.reports_migration import migrate as migrate_reports

    try:
        applied = migrate_reports()
        if applied and not (
            len(applied) == 1 and "already current" in applied[0]
        ):
            for line in applied:
                print(f"[ok]  Reports schema: {line}")
    except Exception as exc:
        print(f"[!]  Reports schema migration failed: {exc}")
        raise


def _ensure_billing_schema():
    """Rebuild leftover pre-Razorpay billing tables create_all cannot ALTER.

    Local DBs that already had billing_plans / invoices / payment_methods /
    subscriptions from the older user-scoped schema keep those tables, then
    the merged Razorpay models 500 on missing columns such as
    billing_plans.code. See billing/migrate_legacy_schema.py.
    """
    from billing.migrate_legacy_schema import migrate as migrate_legacy_billing
    from billing.migrate_card_fallback import migrate as migrate_card_fallback
    from billing.migrate_invoice_gst import migrate as migrate_invoice_gst

    try:
        applied = migrate_legacy_billing()
        if applied and not (
            len(applied) == 1 and "already current" in applied[0]
        ):
            for line in applied:
                print(f"[ok]  Billing schema: {line}")
    except Exception as exc:
        print(f"[!]  Billing schema migration failed: {exc}")
        raise

    try:
        applied = migrate_card_fallback()
        notable = [line for line in applied if "nothing to migrate" not in line]
        for line in notable:
            print(f"[ok]  Billing card-fallback schema: {line}")
    except Exception as exc:
        print(f"[!]  Billing card-fallback migration skipped: {exc}")

    try:
        applied = migrate_invoice_gst()
        notable = [line for line in applied if "nothing to migrate" not in line]
        for line in notable:
            print(f"[ok]  Billing invoice GST schema: {line}")
    except Exception as exc:
        print(f"[!]  Billing invoice GST migration skipped: {exc}")


def _maybe_seed_billing_demo():
    """If org 1 has no active subscription, load the frontend demo rows.

    Overview and Usage 404 without a subscription; Plans / History / cards do not.
    Skip in production so we never wipe or invent billing data there.
    """
    if (settings.app_env or "").lower() == "production":
        return
    from billing.seed_demo import ensure_overview_and_usage

    try:
        ensure_overview_and_usage()
        print("[ok]  Billing overview/usage demo data ready for org_id=1")
    except Exception as exc:
        print(f"[!]  Billing demo seed skipped: {exc}")