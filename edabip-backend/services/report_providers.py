"""Report data providers: one per template category, behind a single registry.

Every provider returns a list of rows (first row = column headers); the writers
in services.report_generator turn that into CSV / XLSX / PDF. Adding a template
category is: write a `_rows_<name>` method, register it in PROVIDERS, seed a
template row. An unknown category raises ReportParameterError instead of silently
falling back to another report.
"""
import math
import re
from datetime import date, datetime, timedelta, timezone
from dataclasses import dataclass

from sqlalchemy import case, distinct, extract, func
from sqlalchemy.orm import Session

from models.reports import SuperstoreImport, SuperstoreOrder

MONEY = "{:,.2f}"
_FILTER_VALUE = re.compile(r"^[A-Za-z0-9 &._-]{1,60}$")


class ReportParameterError(ValueError):
    """A problem with the request/template that is safe to show to the user."""


ORDER_FILTERS = frozenset({"date_from", "date_to", "region", "segment", "product_category"})


@dataclass(frozen=True)
class ProviderSpec:
    method: str
    supported_parameters: frozenset


PROVIDERS: dict[str, ProviderSpec] = {
    "executive": ProviderSpec("_rows_executive", ORDER_FILTERS),
    "sales": ProviderSpec("_rows_sales", ORDER_FILTERS),
    "financial": ProviderSpec("_rows_financial", ORDER_FILTERS),
    "operations": ProviderSpec("_rows_operations", ORDER_FILTERS),
    "kpi": ProviderSpec("_rows_kpi", ORDER_FILTERS),
    "forecast": ProviderSpec("_rows_forecast", ORDER_FILTERS | {"forecast_months"}),
    "hr": ProviderSpec("_rows_hr", frozenset()),
    "data": ProviderSpec("_rows_data_quality", frozenset()),
}


def supported_parameters(category: str) -> list[str]:
    spec = PROVIDERS.get((category or "").lower())
    return sorted(spec.supported_parameters) if spec else []


def validate_parameters(category: str, params: dict) -> dict:
    """Check a parameters dict against the template's category; return it cleaned.

    Raises ReportParameterError for a malformed value, an unsupported filter or a
    reversed date range (AC-RM-011).
    """
    spec = PROVIDERS.get((category or "").lower())
    if spec is None:
        raise ReportParameterError("Selected report template is invalid.")
    clean = {k: v for k, v in (params or {}).items() if v not in (None, "")}
    unsupported = sorted(set(clean) - spec.supported_parameters)
    if unsupported:
        raise ReportParameterError(
            f"This report does not support the filter(s): {', '.join(unsupported)}."
        )
    for key in ("region", "segment", "product_category"):
        if key in clean and not _FILTER_VALUE.match(str(clean[key])):
            raise ReportParameterError(f"'{key}' contains invalid characters.")
    for key in ("date_from", "date_to"):
        if key in clean:
            try:
                clean[key] = date.fromisoformat(str(clean[key])).isoformat()
            except ValueError as exc:
                raise ReportParameterError(f"'{key}' must be a date (YYYY-MM-DD).") from exc
    if "date_from" in clean and "date_to" in clean and clean["date_from"] > clean["date_to"]:
        raise ReportParameterError("'date_from' must not be after 'date_to'.")
    if "forecast_months" in clean:
        try:
            months = int(clean["forecast_months"])
        except (TypeError, ValueError) as exc:
            raise ReportParameterError("'forecast_months' must be a whole number.") from exc
        if not 1 <= months <= 12:
            raise ReportParameterError("'forecast_months' must be between 1 and 12.")
        clean["forecast_months"] = months
    return clean


def _linear_fit(values: list[float]) -> tuple[float, float]:
    """Least-squares line through (0..n-1, values): returns (slope, intercept)."""
    n = len(values)
    mean_x = (n - 1) / 2
    mean_y = sum(values) / n
    denominator = sum((x - mean_x) ** 2 for x in range(n))
    slope = sum((x - mean_x) * (y - mean_y) for x, y in enumerate(values)) / denominator if denominator else 0.0
    return slope, mean_y - slope * mean_x


def _pct(numerator: float, denominator: float) -> str:
    return f"{(numerator / denominator) if denominator else 0:.2%}"


class ReportDataProvider:
    """Return report rows from the validated Superstore data (and platform tables)."""

    def __init__(self, db: Session):
        self.db = db

    # -- public ------------------------------------------------------------
    def rows(self, category: str, params: dict | None = None) -> list[list[str]]:
        spec = PROVIDERS.get((category or "").lower())
        if spec is None:
            raise ReportParameterError(
                f"No data source is configured for the '{category}' report category."
            )
        return getattr(self, spec.method)(validate_parameters(category, params or {}))

    # -- helpers -----------------------------------------------------------
    def _orders(self, params: dict, *columns):
        query = self.db.query(*columns) if columns else self.db.query(SuperstoreOrder)
        if "date_from" in params:
            query = query.filter(SuperstoreOrder.order_date >= datetime.fromisoformat(params["date_from"]))
        if "date_to" in params:
            query = query.filter(
                SuperstoreOrder.order_date < datetime.fromisoformat(params["date_to"]) + timedelta(days=1)
            )
        if "region" in params:
            query = query.filter(SuperstoreOrder.region == params["region"])
        if "segment" in params:
            query = query.filter(SuperstoreOrder.segment == params["segment"])
        if "product_category" in params:
            query = query.filter(SuperstoreOrder.category == params["product_category"])
        return query

    def _days_between(self, later, earlier):
        # Portable "whole days between two datetimes" (MySQL in production, SQLite in tests).
        if self.db.get_bind().dialect.name == "sqlite":
            return func.julianday(later) - func.julianday(earlier)
        return func.datediff(later, earlier)

    @staticmethod
    def _no_orders() -> list[list[str]]:
        return [["Message", "No validated Superstore orders match the selected filters or have been imported yet."]]

    # -- providers ---------------------------------------------------------
    def _rows_executive(self, params):
        count, sales, profit, quantity = self._orders(
            params, func.count(SuperstoreOrder.id), func.coalesce(func.sum(SuperstoreOrder.sales), 0),
            func.coalesce(func.sum(SuperstoreOrder.profit), 0), func.coalesce(func.sum(SuperstoreOrder.quantity), 0),
        ).one()
        return [
            ["Metric", "Value"], ["Validated order lines", str(count)],
            ["Total sales", MONEY.format(sales)], ["Total profit", MONEY.format(profit)],
            ["Units sold", str(quantity)],
        ]

    def _rows_sales(self, params):
        records = (self._orders(
            params, SuperstoreOrder.category, func.sum(SuperstoreOrder.sales),
            func.sum(SuperstoreOrder.profit), func.sum(SuperstoreOrder.quantity),
        ).group_by(SuperstoreOrder.category).order_by(func.sum(SuperstoreOrder.sales).desc()).all())
        rows = [["Category", "Sales", "Profit", "Quantity", "Profit margin"]]
        for category, sales, profit, quantity in records:
            rows.append([category, MONEY.format(sales), MONEY.format(profit), str(quantity), _pct(profit, sales)])
        return rows if records else self._no_orders()

    def _rows_financial(self, params):
        sales, profit, discount, loss_lines = self._orders(
            params, func.coalesce(func.sum(SuperstoreOrder.sales), 0), func.coalesce(func.sum(SuperstoreOrder.profit), 0),
            func.coalesce(func.avg(SuperstoreOrder.discount), 0),
            func.coalesce(func.sum(case((SuperstoreOrder.profit < 0, 1), else_=0)), 0),
        ).one()
        by_year = (self._orders(
            params, extract("year", SuperstoreOrder.order_date), func.sum(SuperstoreOrder.sales),
            func.sum(SuperstoreOrder.profit),
        ).group_by(extract("year", SuperstoreOrder.order_date)).order_by(extract("year", SuperstoreOrder.order_date)).all())
        if not by_year:
            return self._no_orders()
        rows = [
            ["Metric", "Value"], ["Total sales", MONEY.format(sales)], ["Total profit", MONEY.format(profit)],
            ["Profit margin", _pct(profit, sales)], ["Average discount", f"{discount:.2%}"],
            ["Loss-making order lines", str(int(loss_lines))], [],
            ["Year", "Sales", "Profit", "Profit margin"],
        ]
        for year, year_sales, year_profit in by_year:
            rows.append([str(int(year)), MONEY.format(year_sales), MONEY.format(year_profit), _pct(year_profit, year_sales)])
        return rows

    def _rows_operations(self, params):
        ship_days = self._days_between(SuperstoreOrder.ship_date, SuperstoreOrder.order_date)
        by_mode = (self._orders(
            params, SuperstoreOrder.ship_mode, func.count(SuperstoreOrder.id),
            func.count(distinct(SuperstoreOrder.order_id)), func.avg(ship_days),
        ).group_by(SuperstoreOrder.ship_mode).order_by(func.count(SuperstoreOrder.id).desc()).all())
        if not by_mode:
            return self._no_orders()
        rows = [["Ship mode", "Order lines", "Orders", "Avg days to ship"]]
        for mode, lines, orders, avg_days in by_mode:
            rows.append([mode, str(lines), str(orders), f"{(avg_days or 0):.1f}"])
        by_region = (self._orders(
            params, SuperstoreOrder.region, func.count(distinct(SuperstoreOrder.order_id)),
            func.avg(ship_days), func.sum(SuperstoreOrder.quantity),
        ).group_by(SuperstoreOrder.region).order_by(SuperstoreOrder.region).all())
        rows += [[], ["Region", "Orders", "Avg days to ship", "Units shipped"]]
        for region, orders, avg_days, units in by_region:
            rows.append([region, str(orders), f"{(avg_days or 0):.1f}", str(units)])
        return rows

    def _rows_kpi(self, params):
        lines, orders, customers, sales, profit, units, discount, first, last = self._orders(
            params, func.count(SuperstoreOrder.id), func.count(distinct(SuperstoreOrder.order_id)),
            func.count(distinct(SuperstoreOrder.customer_id)), func.coalesce(func.sum(SuperstoreOrder.sales), 0),
            func.coalesce(func.sum(SuperstoreOrder.profit), 0), func.coalesce(func.sum(SuperstoreOrder.quantity), 0),
            func.coalesce(func.avg(SuperstoreOrder.discount), 0), func.min(SuperstoreOrder.order_date),
            func.max(SuperstoreOrder.order_date),
        ).one()
        if not lines:
            return self._no_orders()
        return [
            ["KPI", "Value"],
            ["Period covered", f"{first:%Y-%m-%d} to {last:%Y-%m-%d}"],
            ["Total sales", MONEY.format(sales)], ["Total profit", MONEY.format(profit)],
            ["Profit margin", _pct(profit, sales)], ["Orders", str(orders)], ["Customers", str(customers)],
            ["Average order value", MONEY.format(sales / orders if orders else 0)],
            ["Units sold", str(units)], ["Average discount", f"{discount:.2%}"],
        ]

    def _rows_forecast(self, params):
        horizon = int(params.get("forecast_months", 3))
        monthly = (self._orders(
            params, extract("year", SuperstoreOrder.order_date), extract("month", SuperstoreOrder.order_date),
            func.sum(SuperstoreOrder.sales),
        ).group_by(extract("year", SuperstoreOrder.order_date), extract("month", SuperstoreOrder.order_date))
          .order_by(extract("year", SuperstoreOrder.order_date), extract("month", SuperstoreOrder.order_date)).all())
        monthly = monthly[-24:]   # at most the latest two years of actuals
        if len(monthly) < 3:
            return [["Message", "At least 3 months of order history are needed to produce a forecast."]]
        values = [float(total) for _y, _m, total in monthly]
        slope, intercept = _linear_fit(values)
        rows = [["Month", "Sales", "Type"]]
        for (year, month, total) in monthly:
            rows.append([f"{int(year):04d}-{int(month):02d}", MONEY.format(total), "Actual"])
        year, month = int(monthly[-1][0]), int(monthly[-1][1])
        for step in range(1, horizon + 1):
            month += 1
            if month == 13:
                year, month = year + 1, 1
            projected = max(0.0, intercept + slope * (len(values) - 1 + step))
            rows.append([f"{year:04d}-{month:02d}", MONEY.format(projected), "Forecast (linear trend)"])
        return rows

    def _rows_hr(self, params):
        # Aggregates over the platform's own user/role tables - no personal data.
        from models.user import Role, User

        total = self.db.query(func.count(User.id)).scalar() or 0
        active = self.db.query(func.count(User.id)).filter(User.is_active.is_(True)).scalar() or 0
        verified = self.db.query(func.count(User.id)).filter(User.is_verified.is_(True)).scalar() or 0
        cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=30)
        recent = self.db.query(func.count(User.id)).filter(User.last_login >= cutoff).scalar() or 0
        joined = self.db.query(func.count(User.id)).filter(User.created_at >= cutoff).scalar() or 0
        rows = [
            ["Metric", "Value"], ["Total accounts", str(total)], ["Active accounts", str(active)],
            ["Inactive accounts", str(total - active)], ["Verified accounts", str(verified)],
            ["Signed in during the last 30 days", str(recent)], ["Accounts created in the last 30 days", str(joined)],
            [], ["Role", "Accounts"],
        ]
        by_role = (self.db.query(Role.name, func.count(User.id)).outerjoin(User, User.role_id == Role.id)
                   .group_by(Role.name).order_by(Role.name).all())
        for name, count in by_role:
            rows.append([name, str(count)])
        return rows

    def _rows_data_quality(self, params):
        latest = self.db.query(SuperstoreImport).order_by(SuperstoreImport.id.desc()).first()
        if latest is None:
            return [["Metric", "Value"], ["Message", "No Superstore workbook has been imported yet."]]
        return [
            ["Metric", "Value"], ["Source workbook", latest.source_filename],
            ["Import status", latest.status], ["Rows read", str(latest.total_rows)],
            ["Rows accepted", str(latest.accepted_rows)], ["Rows rejected", str(latest.rejected_rows)],
        ]
