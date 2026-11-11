"""Build an immutable GST snapshot for a billing invoice.

The snapshot is frozen onto the invoice at issue time so later edits to
the org's billed-to profile (or to seller env) cannot rewrite a tax
invoice that has already gone out. Pending invoices may be rebuilt from
the current profile until they are paid.
"""
from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Optional

from sqlalchemy.orm import Session, joinedload

from billing.config import settings
from billing.gst import (
    SAC_CODE,
    SAC_LABEL,
    normalize_gstin,
    place_of_supply_label,
    split_inclusive_gst,
    state_code_from_gstin,
    state_code_from_name,
    state_name,
)
from billing.models import BillingProfile, Invoice, InvoiceStatus, Payment, Plan, Subscription

SNAPSHOT_VERSION = 1


def seller_from_settings() -> dict[str, Any]:
    state_code = (settings.SELLER_STATE_CODE or "29").zfill(2)
    city = settings.SELLER_CITY
    state = settings.SELLER_STATE or state_name(state_code)
    pincode = settings.SELLER_PINCODE
    country = settings.SELLER_COUNTRY or "India"
    locality = ", ".join(part for part in (city, f"{state} {pincode}".strip(), country) if part)
    lines = [settings.SELLER_ADDRESS_LINE1]
    if settings.SELLER_ADDRESS_LINE2:
        lines.append(settings.SELLER_ADDRESS_LINE2)
    if locality:
        lines.append(locality)
    return {
        "legal_name": settings.SELLER_LEGAL_NAME,
        "address_lines": [line for line in lines if line],
        "gstin": normalize_gstin(settings.SELLER_GSTIN),
        "email": settings.SELLER_EMAIL,
        "state": state,
        "state_code": state_code,
    }


def _buyer_from_profile(profile: Optional[BillingProfile]) -> dict[str, Any]:
    if profile is None:
        return {
            "legal_name": "",
            "address_lines": [],
            "gstin": None,
            "email": None,
            "state": "",
            "state_code": "",
        }
    locality = ", ".join(
        part
        for part in (
            profile.city,
            f"{profile.state} {profile.pincode}".strip(),
            profile.country or "India",
        )
        if part
    )
    lines = [profile.address_line1]
    if profile.address_line2:
        lines.append(profile.address_line2)
    if locality:
        lines.append(locality)
    gstin = normalize_gstin(profile.gstin)
    state_code = profile.state_code or (
        state_code_from_gstin(gstin) if gstin else state_code_from_name(profile.state) or ""
    )
    return {
        "legal_name": profile.legal_name,
        "address_lines": [line for line in lines if line],
        "gstin": gstin,
        "email": profile.email,
        "state": profile.state or (state_name(state_code) if state_code else ""),
        "state_code": state_code,
    }


def _cycle_label(period_start: datetime) -> str:
    return f"{period_start:%b %Y} cycle"


def _buyer_state_code(buyer: dict[str, Any], seller_state_code: str) -> str:
    gstin = buyer.get("gstin")
    if gstin:
        return state_code_from_gstin(gstin)
    code = buyer.get("state_code") or state_code_from_name(buyer.get("state") or "")
    return code or seller_state_code


def build_gst_snapshot(
    invoice: Invoice,
    *,
    plan: Optional[Plan],
    profile: Optional[BillingProfile],
    payment: Optional[Payment] = None,
) -> dict[str, Any]:
    seller = seller_from_settings()
    buyer = _buyer_from_profile(profile)
    buyer_state = _buyer_state_code(buyer, seller["state_code"])
    tax = split_inclusive_gst(
        invoice.amount_cents,
        seller_state_code=seller["state_code"],
        buyer_state_code=buyer_state,
    )
    plan_name = plan.name if plan else "EDABIP Plan"
    description = (
        plan.description
        if plan and plan.description
        else "Monthly subscription for dashboards, reports, analytics and support"
    )
    return {
        "version": SNAPSHOT_VERSION,
        "seller": seller,
        "buyer": buyer,
        "place_of_supply": tax.place_of_supply if buyer_state else place_of_supply_label(seller["state_code"]),
        "sac_code": SAC_CODE,
        "sac_label": SAC_LABEL,
        "line": {
            "name": f"EDABIP {plan_name} Plan" if plan and not plan_name.lower().startswith("edabip") else plan_name,
            "description": description,
            "qty": 1,
            "cycle_label": _cycle_label(invoice.period_start),
        },
        "tax": {
            "mode": "intra" if tax.intra_state else "inter",
            "rate_percent": 18,
            "taxable_cents": tax.taxable_cents,
            "cgst_cents": tax.cgst_cents,
            "sgst_cents": tax.sgst_cents,
            "igst_cents": tax.igst_cents,
            "total_cents": tax.total_cents,
        },
        "payment_provider_label": "Razorpay",
        "payment_id": payment.razorpay_payment_id if payment else None,
    }


def parse_gst_snapshot(raw: Optional[str]) -> Optional[dict[str, Any]]:
    if not raw:
        return None
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return None
    return data if isinstance(data, dict) else None


def dump_gst_snapshot(snapshot: dict[str, Any]) -> str:
    return json.dumps(snapshot, separators=(",", ":"), ensure_ascii=False)


def persist_gst_snapshot(
    db: Session,
    invoice: Invoice,
    *,
    plan: Optional[Plan] = None,
    payment: Optional[Payment] = None,
    force: bool = False,
) -> dict[str, Any]:
    existing = parse_gst_snapshot(invoice.gst_snapshot)
    if existing and not force:
        return existing
    if plan is None:
        sub = (
            db.query(Subscription)
            .options(joinedload(Subscription.plan))
            .filter(Subscription.id == invoice.subscription_id)
            .first()
        )
        plan = sub.plan if sub else None
    profile = db.query(BillingProfile).filter(BillingProfile.org_id == invoice.org_id).first()
    snapshot = build_gst_snapshot(invoice, plan=plan, profile=profile, payment=payment)
    invoice.gst_snapshot = dump_gst_snapshot(snapshot)
    return snapshot


def invoice_status_is_paid(status: str | InvoiceStatus) -> bool:
    value = status.value if hasattr(status, "value") else status
    return str(value).lower() == InvoiceStatus.PAID.value
