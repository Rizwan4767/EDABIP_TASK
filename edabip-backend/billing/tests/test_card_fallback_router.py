"""Router-level guards for a non-chargeable (TEST-mode fallback) card.

Saving the card is only half the job - the two places that hand
`razorpay_token_id` to Razorpay have to refuse a row that hasn't got
one. These tests drive the router functions directly against a SQLite
session rather than through FastAPI, because the guards are plain
branches and a full app fixture would add a lot of setup for no extra
coverage.

Note: importing the router pulls in `database`, which connects to MySQL
at import time (it runs CREATE DATABASE IF NOT EXISTS on import). So
these tests need the local MySQL up, even though they themselves run
entirely on SQLite.
"""
import sys
from pathlib import Path

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from database import Base  # noqa: E402
from billing import models as billing_models  # noqa: E402,F401  (registers tables)
from billing import router as billing_router  # noqa: E402
from billing.models import BillingCustomer, PaymentMethod, Plan  # noqa: E402

ORG_ID = 1
CUSTOMER_ID = "cust_TajND3EcBFzJNE"


class _User:
    """Minimal stand-in for the authenticated User the routes receive."""

    def __init__(self, org_id=ORG_ID, user_id=1):
        self.id = user_id
        self.org_id = org_id
        self.email = "owner@example.com"


@pytest.fixture
def db():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine)()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def org_with_customer(db):
    db.add(BillingCustomer(org_id=ORG_ID, razorpay_customer_id=CUSTOMER_ID))
    db.commit()


def _fallback_card(db, **overrides):
    pm = PaymentMethod(
        org_id=ORG_ID,
        razorpay_token_id=None,
        razorpay_card_id="card_TajduwvcSCTuIt",
        brand="visa",
        last4="1007",
        exp_month=None,
        exp_year=None,
        is_chargeable=False,
        is_primary=True,
        **overrides,
    )
    db.add(pm)
    db.commit()
    db.refresh(pm)
    return pm


def _tokenised_card(db, **overrides):
    pm = PaymentMethod(
        org_id=ORG_ID,
        razorpay_token_id="token_ABC123",
        razorpay_card_id="card_Real",
        brand="visa",
        last4="4242",
        exp_month=4,
        exp_year=2031,
        is_chargeable=True,
        is_primary=True,
        **overrides,
    )
    db.add(pm)
    db.commit()
    db.refresh(pm)
    return pm


# --------------------------------------------------------------------------
# Remove Card
# --------------------------------------------------------------------------

def test_remove_fallback_card_does_not_call_razorpay(db, org_with_customer, monkeypatch):
    """token.delete with a non-token would 502 and strand the row."""
    pm = _fallback_card(db)
    calls = []
    monkeypatch.setattr(
        billing_router.razorpay_service, "detach_payment_method",
        lambda *a, **k: calls.append(a),
    )

    result = billing_router.remove_payment_method(pm.id, db=db, user=_User())

    assert calls == []
    assert result.payment_methods == []
    assert db.query(PaymentMethod).count() == 0


def test_remove_tokenised_card_still_calls_razorpay(db, org_with_customer, monkeypatch):
    """The production path is unchanged."""
    pm = _tokenised_card(db)
    calls = []
    monkeypatch.setattr(
        billing_router.razorpay_service, "detach_payment_method",
        lambda *a, **k: calls.append(a),
    )

    billing_router.remove_payment_method(pm.id, db=db, user=_User())

    assert calls == [(CUSTOMER_ID, "token_ABC123")]
    assert db.query(PaymentMethod).count() == 0


# --------------------------------------------------------------------------
# Charging
# --------------------------------------------------------------------------

def _plan():
    return Plan(
        code="enterprise", name="Enterprise", price_cents=100000,
        currency="inr", billing_cycle="monthly",
    )


def test_charging_a_fallback_card_on_test_key_settles_locally(db, org_with_customer, monkeypatch):
    pm = _fallback_card(db)
    calls = []
    monkeypatch.setattr(
        billing_router.razorpay_service, "charge_saved_card_now",
        lambda *a, **k: calls.append(a),
    )
    monkeypatch.setattr(billing_router.settings, "test_card_fallback_enabled", lambda: True)

    result = billing_router._charge_for_plan(
        db, org_id=ORG_ID, user_email="owner@example.com",
        plan=_plan(), payment_method=pm,
    )

    assert result == {"id": None, "status": "simulated"}
    assert calls == []


def test_charging_a_fallback_card_on_live_key_is_refused(db, org_with_customer, monkeypatch):
    pm = _fallback_card(db)
    calls = []
    monkeypatch.setattr(
        billing_router.razorpay_service, "charge_saved_card_now",
        lambda *a, **k: calls.append(a),
    )
    monkeypatch.setattr(billing_router.settings, "test_card_fallback_enabled", lambda: False)

    with pytest.raises(HTTPException) as excinfo:
        billing_router._charge_for_plan(
            db, org_id=ORG_ID, user_email="owner@example.com",
            plan=_plan(), payment_method=pm,
        )

    assert excinfo.value.status_code == 402
    assert "couldn't charge" in excinfo.value.detail.lower()
    assert calls == []


def test_charging_a_tokenised_card_still_reaches_razorpay(db, org_with_customer, monkeypatch):
    pm = _tokenised_card(db)
    calls = []

    def _charge(*args, **kwargs):
        calls.append(args)
        return {"id": "pay_OK"}

    monkeypatch.setattr(billing_router.razorpay_service, "charge_saved_card_now", _charge)

    result = billing_router._charge_for_plan(
        db, org_id=ORG_ID, user_email="owner@example.com",
        plan=_plan(), payment_method=pm,
    )

    assert result == {"id": "pay_OK"}
    assert calls and calls[0][0] == CUSTOMER_ID
    assert calls[0][1] == "token_ABC123"


# --------------------------------------------------------------------------
# Display
# --------------------------------------------------------------------------

def test_fallback_card_label_does_not_show_a_made_up_expiry(db):
    pm = _fallback_card(db)

    out = billing_router._payment_method_to_out(pm)

    assert out.expires_label == "Expiry unavailable"
    assert out.exp_month is None
    assert out.exp_year is None
    assert out.is_chargeable is False
    assert out.display_label == "Visa ending in 1007"


def test_tokenised_card_label_is_unchanged(db):
    pm = _tokenised_card(db)

    out = billing_router._payment_method_to_out(pm)

    assert out.expires_label == "Expires 04/2031"
    assert out.is_chargeable is True


def test_netbanking_label_does_not_pretend_to_be_a_card(db):
    pm = PaymentMethod(
        org_id=ORG_ID,
        razorpay_token_id=None,
        razorpay_card_id="pay_nb_1",
        brand="HDFC",
        last4="",
        exp_month=None,
        exp_year=None,
        is_chargeable=False,
        is_primary=True,
        method="netbanking",
    )
    db.add(pm)
    db.commit()
    db.refresh(pm)

    out = billing_router._payment_method_to_out(pm)

    assert out.method == "netbanking"
    assert out.display_label == "HDFC"
    assert out.expires_label == "Net banking"
    assert "ending in" not in out.display_label
