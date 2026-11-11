"""Bring already-provisioned report tables up to the current models.

init_db() only runs Base.metadata.create_all(), which creates missing tables but
never ALTERs an existing one, so a database created before a column (or enum
value) was added keeps the old shape and the endpoints touching it fail with
MySQL 1054 "Unknown column" / 1265 "Data truncated". This module closes that gap
for the report tables. It covers, in order:

  1. the original template_id / file_format columns (kept from the first version)
  2. new columns on report_templates, scheduled_reports and report_history
  3. widening native ENUM columns (new statuses / frequencies) without data loss
  4. supporting indexes and the history -> schedule foreign key
  5. the append-only report_audit_logs table and its immutability triggers

Same shape as billing/migrate_invoice_gst.py: idempotent, safe to re-run, a no-op
on a fresh database.

    python -m services.reports_migration

The triggers need the MySQL TRIGGER privilege. If the account lacks it the
migration still succeeds and reports that the triggers were skipped; the ORM-level
guard in models/reports.py keeps audit rows immutable for the application either way.
"""
import logging
import re

from sqlalchemy import inspect, text

from database import engine

logger = logging.getLogger(__name__)

REPORT_TEMPLATES = "report_templates"
REPORT_HISTORY = "report_history"
SCHEDULED_REPORTS = "scheduled_reports"
AUDIT_TABLE = "report_audit_logs"


def _enum_ddl(enum_cls) -> str:
    # SQLAlchemy stores enum member NAMES (e.g. 'PROCESSING'), not their values.
    return "ENUM(" + ",".join(f"'{member.name}'" for member in enum_cls) + ")"


def _columns(conn, table: str) -> set[str]:
    rows = conn.execute(
        text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_schema = DATABASE() AND table_name = :t"
        ),
        {"t": table},
    )
    return {r[0] for r in rows}


def _indexes(conn, table: str) -> set[str]:
    rows = conn.execute(
        text(
            "SELECT index_name FROM information_schema.statistics "
            "WHERE table_schema = DATABASE() AND table_name = :t"
        ),
        {"t": table},
    )
    return {r[0] for r in rows}


def parse_enum_values(column_type: str) -> list[str]:
    """`enum('A','B''s')` -> ['A', "B's"] (information_schema.columns.column_type)."""
    if not column_type.lower().startswith("enum("):
        return []
    return [v.replace("''", "'") for v in re.findall(r"'((?:[^']|'')*)'", column_type)]


def _widen_enum(conn, table: str, column: str, enum_cls) -> bool:
    """Append any members the ENUM column lacks; existing values/rows are untouched."""
    row = conn.execute(
        text(
            "SELECT column_type, is_nullable, column_default FROM information_schema.columns "
            "WHERE table_schema = DATABASE() AND table_name = :t AND column_name = :c"
        ),
        {"t": table, "c": column},
    ).first()
    if row is None:
        return False
    existing = parse_enum_values(row[0])
    if not existing:
        return False
    missing = [m.name for m in enum_cls if m.name not in existing]
    if not missing:
        return False
    values = ",".join(f"'{v.replace(chr(39), chr(39) * 2)}'" for v in existing + missing)
    nullability = "NULL" if row[1] == "YES" else "NOT NULL"
    default = f" DEFAULT '{row[2]}'" if row[2] is not None else ""
    conn.execute(text(f"ALTER TABLE {table} MODIFY COLUMN {column} ENUM({values}) {nullability}{default}"))
    return True


def migrate() -> list[str]:
    from models import reports as m

    applied: list[str] = []
    # A brand-new report_audit_logs table is created by create_all() in init_db(); do it
    # here too so `python -m services.reports_migration` also works standalone.
    m.ReportAuditLog.__table__.create(bind=engine, checkfirst=True)

    if engine.dialect.name != "mysql":
        return ["non-MySQL database - column/enum migration skipped"]

    inspector = inspect(engine)
    tables = set(inspector.get_table_names())

    # --- 1. original columns -------------------------------------------------
    if REPORT_HISTORY in tables:
        with engine.begin() as conn:
            cols = _columns(conn, REPORT_HISTORY)
            if cols and "template_id" not in cols:
                # Nullable on purpose: it matches the model, and history rows
                # generated before templates were tracked have no template.
                conn.execute(text(f"ALTER TABLE {REPORT_HISTORY} ADD COLUMN template_id INT NULL"))
                applied.append(f"{REPORT_HISTORY}.template_id added")
            if "template_id" in _columns(conn, REPORT_HISTORY) and (
                "ix_report_history_template_id" not in _indexes(conn, REPORT_HISTORY)
            ):
                conn.execute(text(
                    f"ALTER TABLE {REPORT_HISTORY} ADD INDEX ix_report_history_template_id (template_id)"
                ))
                applied.append(f"{REPORT_HISTORY}.ix_report_history_template_id added")

    if SCHEDULED_REPORTS in tables:
        with engine.begin() as conn:
            cols = _columns(conn, SCHEDULED_REPORTS)
            if cols and "file_format" not in cols:
                # NOT NULL with the model's default so existing schedules keep
                # the format they were behaving as (CSV).
                conn.execute(text(
                    f"ALTER TABLE {SCHEDULED_REPORTS} "
                    "ADD COLUMN file_format ENUM('PDF','EXCEL','CSV') NOT NULL DEFAULT 'CSV'"
                ))
                applied.append(f"{SCHEDULED_REPORTS}.file_format added")

    # --- 2. new columns ------------------------------------------------------
    new_columns = {
        REPORT_TEMPLATES: [
            ("version", "INT NOT NULL DEFAULT 1"),
            ("approval_status", "VARCHAR(20) NOT NULL DEFAULT 'approved'"),
            ("default_format", "ENUM('PDF','EXCEL','CSV') NOT NULL DEFAULT 'CSV'"),
            ("default_parameters_json", "TEXT NULL"),
            ("allowed_roles_json", "TEXT NULL"),
            ("updated_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"),
        ],
        SCHEDULED_REPORTS: [
            ("name", "VARCHAR(150) NULL"),
            ("interval_days", "INT NULL"),
            ("timezone", "VARCHAR(64) NOT NULL DEFAULT 'UTC'"),
            ("recipients_json", "TEXT NULL"),
            ("parameters_json", "TEXT NULL"),
            ("last_run_at", "DATETIME NULL"),
            ("last_run_status", f"{_enum_ddl(m.ReportGenerationStatus)} NULL"),
            ("created_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"),
            ("updated_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"),
        ],
        REPORT_HISTORY: [
            ("trigger_type", "VARCHAR(20) NOT NULL DEFAULT 'ON_DEMAND'"),
            ("schedule_id", "INT NULL"),
            ("parameters_json", "TEXT NULL"),
            ("progress_percent", "INT NOT NULL DEFAULT 0"),
            ("started_at", "DATETIME NULL"),
            ("completed_at", "DATETIME NULL"),
            ("duration_seconds", "DOUBLE NULL"),
            ("failure_reason", "VARCHAR(500) NULL"),
            ("error_detail", "TEXT NULL"),
            ("retry_of_id", "INT NULL"),
            ("is_archived", "TINYINT(1) NOT NULL DEFAULT 0"),
            ("archived_at", "DATETIME NULL"),
        ],
    }
    for table, columns in new_columns.items():
        if table not in tables:
            continue
        with engine.begin() as conn:
            present = _columns(conn, table)
            for name, ddl in columns:
                if name not in present:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}"))
                    applied.append(f"{table}.{name} added")

    # --- 3. widen native ENUMs ------------------------------------------------
    widen = [
        (REPORT_HISTORY, "status", m.ReportGenerationStatus),
        (SCHEDULED_REPORTS, "frequency", m.ReportFrequency),
        (SCHEDULED_REPORTS, "status", m.ScheduledReportStatus),
        (SCHEDULED_REPORTS, "last_run_status", m.ReportGenerationStatus),
    ]
    for table, column, enum_cls in widen:
        if table in tables:
            with engine.begin() as conn:
                if _widen_enum(conn, table, column, enum_cls):
                    applied.append(f"{table}.{column} enum widened")

    # --- 4. indexes + foreign key ---------------------------------------------
    if REPORT_HISTORY in tables:
        with engine.begin() as conn:
            existing = _indexes(conn, REPORT_HISTORY)
            for index, column in (
                ("ix_report_history_status", "status"),
                ("ix_report_history_created_at", "created_at"),
                ("ix_report_history_schedule_id", "schedule_id"),
                ("ix_report_history_retry_of_id", "retry_of_id"),
            ):
                if index not in existing:
                    conn.execute(text(f"ALTER TABLE {REPORT_HISTORY} ADD INDEX {index} ({column})"))
                    applied.append(f"{REPORT_HISTORY}.{index} added")
        if SCHEDULED_REPORTS in tables:
            with engine.begin() as conn:
                has_fk = conn.execute(text(
                    "SELECT 1 FROM information_schema.table_constraints WHERE table_schema = DATABASE() "
                    "AND table_name = :t AND constraint_name = 'fk_report_history_schedule'"
                ), {"t": REPORT_HISTORY}).first()
                if not has_fk:
                    try:
                        conn.execute(text(
                            f"ALTER TABLE {REPORT_HISTORY} ADD CONSTRAINT fk_report_history_schedule "
                            f"FOREIGN KEY (schedule_id) REFERENCES {SCHEDULED_REPORTS}(id) ON DELETE SET NULL"
                        ))
                        applied.append(f"{REPORT_HISTORY}.fk_report_history_schedule added")
                    except Exception as exc:  # noqa: BLE001 - e.g. a MyISAM table; not fatal
                        logger.warning("Could not add report_history -> scheduled_reports FK: %s", exc)
                        applied.append("fk_report_history_schedule skipped (see log)")

    # --- 5. audit immutability triggers ------------------------------------------
    with engine.begin() as conn:
        existing_triggers = {r[0] for r in conn.execute(text(
            "SELECT trigger_name FROM information_schema.triggers WHERE trigger_schema = DATABASE()"))}
    for name, event_name in ((f"{AUDIT_TABLE}_no_update", "UPDATE"), (f"{AUDIT_TABLE}_no_delete", "DELETE")):
        if name in existing_triggers:
            continue
        try:
            with engine.begin() as conn:
                conn.execute(text(
                    f"CREATE TRIGGER {name} BEFORE {event_name} ON {AUDIT_TABLE} FOR EACH ROW "
                    "SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Report audit logs are immutable'"
                ))
            applied.append(f"trigger {name} added")
        except Exception as exc:  # noqa: BLE001 - usually a missing TRIGGER privilege
            logger.warning("Could not create trigger %s (needs the TRIGGER privilege): %s", name, exc)
            applied.append(f"trigger {name} skipped - grant TRIGGER or create it manually")

    if not applied:
        return ["report schema already current - nothing to migrate"]
    return applied


if __name__ == "__main__":
    for line in migrate():
        print(f"  {line}")
    print("done")
