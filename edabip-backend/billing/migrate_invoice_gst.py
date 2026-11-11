"""Add GST invoice snapshot + billing profile tables.

create_all never ALTERs existing tables, so already-provisioned databases
need this once. Idempotent.

    python -m billing.migrate_invoice_gst
"""
from sqlalchemy import inspect, text

from database import Base, engine


def _columns(conn, table: str) -> set[str]:
    rows = conn.execute(
        text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_schema = DATABASE() AND table_name = :t"
        ),
        {"t": table},
    )
    return {r[0] for r in rows}


def migrate() -> list[str]:
    from billing import models as billing_models  # noqa: F401

    applied: list[str] = []
    inspector = inspect(engine)

    if "billing_invoices" in inspector.get_table_names():
        with engine.begin() as conn:
            cols = _columns(conn, "billing_invoices")
            if cols and "gst_snapshot" not in cols:
                conn.execute(text(
                    "ALTER TABLE billing_invoices "
                    "ADD COLUMN gst_snapshot TEXT NULL"
                ))
                applied.append("billing_invoices.gst_snapshot added")

    if "billing_profiles" not in inspector.get_table_names():
        Base.metadata.create_all(bind=engine, tables=[billing_models.BillingProfile.__table__])
        applied.append("billing_profiles created")

    if not applied:
        return ["invoice GST schema already current - nothing to migrate"]
    return applied


if __name__ == "__main__":
    for line in migrate():
        print(f"  {line}")
    print("done")
