"""Import a Superstore Excel workbook into the internal reporting tables.

This is intentionally a command-line import, not a public HTTP upload endpoint.
It keeps file-system access out of the API while giving administrators an auditable,
repeatable way to load a workbook.
"""
from __future__ import annotations

import argparse
import hashlib
import math
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Any

from openpyxl import load_workbook
from sqlalchemy.orm import Session

from models.reports import SuperstoreImport, SuperstoreImportError, SuperstoreOrder


ORDERS_SHEET = "Orders"
EXPECTED_COLUMNS = (
    "Row ID", "Order ID", "Order Date", "Ship Date", "Ship Mode",
    "Customer ID", "Customer Name", "Segment", "Country/Region", "City",
    "State/Province", "Postal Code", "Region", "Product ID", "Category",
    "Sub-Category", "Product Name", "Sales", "Quantity", "Discount", "Profit",
)
REQUIRED_TEXT_COLUMNS = (
    "Row ID", "Order ID", "Ship Mode", "Customer ID", "Customer Name", "Segment",
    "Country/Region", "City", "State/Province", "Region", "Product ID", "Category",
    "Sub-Category", "Product Name",
)
MAX_STORED_ERRORS = 1_000


@dataclass(frozen=True)
class ImportResult:
    import_id: int
    status: str
    total_rows: int
    accepted_rows: int
    rejected_rows: int
    already_imported: bool = False


def _file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _as_text(value: Any, field: str, *, required: bool = True) -> str | None:
    if value is None or not str(value).strip():
        if required:
            raise ValueError(f"{field} is required")
        return None
    return str(value).strip()


def _as_datetime(value: Any, field: str) -> datetime:
    if isinstance(value, datetime):
        return value.replace(tzinfo=None)
    if isinstance(value, date):
        return datetime.combine(value, datetime.min.time())
    raise ValueError(f"{field} must be a date")


def _as_float(value: Any, field: str) -> float:
    try:
        numeric = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{field} must be a number") from exc
    if not math.isfinite(numeric):
        raise ValueError(f"{field} must be a finite number")
    return numeric


def _as_positive_int(value: Any, field: str) -> int:
    numeric = _as_float(value, field)
    if not numeric.is_integer() or numeric <= 0:
        raise ValueError(f"{field} must be a positive whole number")
    return int(numeric)


def _as_postal_code(value: Any) -> str | None:
    if value is None or value == "":
        return None
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    if isinstance(value, int):
        return f"{value:05d}"
    return str(value).strip() or None


def _normalise_header(value: Any) -> str:
    return " ".join(str(value or "").strip().split())


def _validate_and_map(row: dict[str, Any]) -> dict[str, Any]:
    text = {name: _as_text(row[name], name) for name in REQUIRED_TEXT_COLUMNS}
    order_date = _as_datetime(row["Order Date"], "Order Date")
    ship_date = _as_datetime(row["Ship Date"], "Ship Date")
    if ship_date < order_date:
        raise ValueError("Ship Date cannot be before Order Date")
    sales = _as_float(row["Sales"], "Sales")
    if sales < 0:
        raise ValueError("Sales cannot be negative")
    discount = _as_float(row["Discount"], "Discount")
    if not 0 <= discount <= 1:
        raise ValueError("Discount must be between 0 and 1")
    return {
        "row_id": text["Row ID"], "order_id": text["Order ID"],
        "order_date": order_date, "ship_date": ship_date, "ship_mode": text["Ship Mode"],
        "customer_id": text["Customer ID"], "customer_name": text["Customer Name"],
        "segment": text["Segment"], "country_region": text["Country/Region"], "city": text["City"],
        "state_province": text["State/Province"], "postal_code": _as_postal_code(row["Postal Code"]),
        "region": text["Region"], "product_id": text["Product ID"], "category": text["Category"],
        "sub_category": text["Sub-Category"], "product_name": text["Product Name"],
        "sales": sales, "quantity": _as_positive_int(row["Quantity"], "Quantity"),
        "discount": discount, "profit": _as_float(row["Profit"], "Profit"),
    }


def import_superstore_workbook(db: Session, workbook_path: str | Path) -> ImportResult:
    """Validate and persist Orders rows, returning counts for the import run."""
    path = Path(workbook_path).expanduser().resolve()
    if not path.is_file() or path.suffix.lower() != ".xlsx":
        raise ValueError("Provide an existing .xlsx workbook")

    checksum = _file_sha256(path)
    existing = (db.query(SuperstoreImport)
        .filter(SuperstoreImport.file_sha256 == checksum, SuperstoreImport.status == "completed")
        .order_by(SuperstoreImport.id.desc()).first())
    if existing:
        return ImportResult(existing.id, existing.status, existing.total_rows, existing.accepted_rows,
                            existing.rejected_rows, already_imported=True)

    workbook = load_workbook(path, read_only=True, data_only=True)
    if ORDERS_SHEET not in workbook.sheetnames:
        raise ValueError("Workbook must contain an 'Orders' worksheet")
    worksheet = workbook[ORDERS_SHEET]
    headers = [_normalise_header(value) for value in next(worksheet.iter_rows(values_only=True))]
    if tuple(headers) != EXPECTED_COLUMNS:
        missing = sorted(set(EXPECTED_COLUMNS) - set(headers))
        unexpected = sorted(set(headers) - set(EXPECTED_COLUMNS))
        raise ValueError(f"Orders columns do not match the expected Superstore layout. Missing: {missing}; unexpected: {unexpected}")

    run = SuperstoreImport(source_filename=path.name, file_sha256=checksum, status="processing")
    db.add(run)
    db.flush()
    stored_errors = 0
    try:
        for source_row, values in enumerate(worksheet.iter_rows(min_row=2, values_only=True), start=2):
            run.total_rows += 1
            try:
                mapped = _validate_and_map(dict(zip(headers, values, strict=True)))
                db.add(SuperstoreOrder(import_id=run.id, source_row=source_row, **mapped))
                run.accepted_rows += 1
            except ValueError as exc:
                run.rejected_rows += 1
                if stored_errors < MAX_STORED_ERRORS:
                    db.add(SuperstoreImportError(import_id=run.id, source_row=source_row, message=str(exc)))
                    stored_errors += 1
        run.status = "completed"
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        workbook.close()
    return ImportResult(run.id, run.status, run.total_rows, run.accepted_rows, run.rejected_rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="Import a Superstore .xlsx workbook for reports")
    parser.add_argument("workbook", help="Path to the source .xlsx file")
    args = parser.parse_args()
    # Make a first import usable on a fresh development database. Existing
    # databases should still be started normally once so their legacy schema
    # migrations run through database.init_db().
    from database import Base, SessionLocal, engine
    from models import user as user_models  # noqa: F401 - registers users table for FK creation
    from models import reports as report_models  # noqa: F401 - registers import tables
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        result = import_superstore_workbook(db, args.workbook)
    prefix = "Already imported" if result.already_imported else "Imported"
    print(f"{prefix}: import #{result.import_id}; total={result.total_rows}, accepted={result.accepted_rows}, rejected={result.rejected_rows}")


if __name__ == "__main__":
    main()
