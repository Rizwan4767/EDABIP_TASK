"""Rebuild leftover pre-Razorpay billing tables.

This project has no Alembic history, and `Base.metadata.create_all` only
ever CREATEs - it never ALTERs an existing table. Local databases that
already had an older user-scoped billing schema (display_name,
price_monthly, user_id, ...) keep those tables after the Razorpay merge.
Queries then 500 with OperationalError 1054:

    Unknown column 'billing_plans.code' in 'field list'

CORS errors in the browser are a side-effect of that unhandled 500.

Idempotent: no-op when billing_plans already has `code`. Safe on a fresh
database, where create_all has already produced the current shape.

Run automatically from init_db, or:

    python -m billing.migrate_legacy_schema
"""
from sqlalchemy import inspect, text

from config import settings
from database import Base, engine

# Old user-scoped tables, plus dependents that FK onto them, plus the
# unused leftover `billing_usage` table from that schema. New-shape
# tables (alerts, customers, usage_records, ...) are left in place.
_REBUILD_TABLES = (
    "billing_subscription_history",
    "billing_payments",
    "billing_invoices",
    "billing_payment_methods",
    "billing_subscriptions",
    "billing_plans",
    "billing_usage",
)

_LEGACY_MARKERS = {
    "billing_plans": "code",
    "billing_invoices": "org_id",
    "billing_payment_methods": "org_id",
    "billing_subscriptions": "org_id",
}


def _table_columns(inspector, name: str) -> set[str]:
    if name not in inspector.get_table_names():
        return set()
    return {col["name"] for col in inspector.get_columns(name)}


def _is_legacy(inspector) -> bool:
    for table, required in _LEGACY_MARKERS.items():
        cols = _table_columns(inspector, table)
        if cols and required not in cols:
            return True
    return False


def _row_count(conn, table: str) -> int:
    return int(conn.execute(text(f"SELECT COUNT(*) FROM `{table}`")).scalar() or 0)


def migrate() -> list[str]:
    from billing import models as billing_models  # noqa: F401 — register tables

    applied: list[str] = []
    inspector = inspect(engine)
    if not _is_legacy(inspector):
        return ["billing schema already current - nothing to migrate"]

    existing = [name for name in _REBUILD_TABLES if name in inspector.get_table_names()]
    if not existing:
        return ["legacy markers found but rebuild tables are gone - nothing to migrate"]

    is_production = (settings.app_env or "").lower() == "production"
    with engine.begin() as conn:
        occupied = [name for name in existing if _row_count(conn, name) > 0]
        if is_production and occupied:
            raise RuntimeError(
                "Refusing to drop legacy billing tables in production because they "
                f"contain rows: {', '.join(occupied)}. Backup, migrate the data, "
                "or run this locally first."
            )

        conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
        for name in existing:
            conn.execute(text(f"DROP TABLE IF EXISTS `{name}`"))
            applied.append(f"dropped legacy `{name}`")
        conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))

    Base.metadata.create_all(bind=engine)
    applied.append("recreated billing tables from current ORM models")
    return applied


if __name__ == "__main__":
    for line in migrate():
        print(f"  {line}")
    print("done")
