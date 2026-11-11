"""Seed the report template catalog.

Templates are reference data (/api/reports/generate needs a template_id), and
without them the Reports demo has nothing to generate from. Idempotent - it
matches on name, so re-running never duplicates a row and never overwrites a
template that has been edited in the database.

Usage:
    python seed_reports.py
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from database import Base, SessionLocal, engine
from models.reports import ReportTemplate

TEMPLATES = [
    {
        "name": "Executive Summary",
        "category": "executive",
        "description": "High-level business performance summary.",
    },
    {
        # The wireframe's "Sales Report".
        "name": "Sales Performance",
        "category": "sales",
        "description": "Sales trends, totals, and performance metrics.",
    },
    {
        "name": "Financial Report",
        "category": "financial",
        "description": "Revenue, profit, margin and discount performance by year.",
    },
    {
        "name": "HR Report",
        "category": "hr",
        "description": "Workforce summary: accounts, activity and role distribution (aggregates only).",
        # Personnel data: limited to these roles (admins always have access). Edit the
        # allowed_roles_json column to change it; NULL means every role with reports.view.
        "allowed_roles_json": json.dumps(["admin", "business_analyst"]),
    },
    {
        "name": "Operations Report",
        "category": "operations",
        "description": "Shipping and fulfilment: order volume and days to ship by mode and region.",
    },
    {
        "name": "KPI Report",
        "category": "kpi",
        "description": "Headline KPIs: sales, profit, margin, orders, customers and average order value.",
    },
    {
        "name": "Forecast Report",
        "category": "forecast",
        "description": "Monthly sales history with a linear-trend projection of the coming months.",
        "default_parameters_json": json.dumps({"forecast_months": 3}),
    },
    {
        "name": "Data Quality",
        "category": "data",
        "description": "Data freshness and quality indicators.",
    },
]


def main():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        created = 0
        for template in TEMPLATES:
            existing = (
                db.query(ReportTemplate)
                .filter(ReportTemplate.name == template["name"])
                .first()
            )
            if existing:
                print(f"[ok] Template present: {template['name']}")
                continue
            db.add(ReportTemplate(**template, is_active=True))
            created += 1
            print(f"[ok] Template created: {template['name']}")

        db.commit()
        total = db.query(ReportTemplate).count()
    finally:
        db.close()

    print(f"\n[ok] Report templates ready ({created} created, {total} total)")
    print("Run `python main.py`, then: GET /api/reports/templates")


if __name__ == "__main__":
    main()
