"""Saved cards must not silently die when the Razorpay customer changes.

A card token is minted against one specific Razorpay customer and cannot
be moved to another. When the stored customer id stops resolving - almost
always because the API keys were swapped for a different Razorpay account,
which is routine in test mode - `_ensure_razorpay_customer` mints a
replacement. It already healed Subscription's copy of the id; the payment
methods were left pointing at tokens belonging to the retired customer, so
charging one failed at the gateway and removing one 502'd.

They are now demoted to non-chargeable, which is the truth: the row is
still the user's card, it just has nothing chargeable behind it any more.
"""
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from database import Base  # noqa: E402
from billing import models as billing_models  # noqa: E402,F401  (registers tables)
from billing import router as billing_router  # noqa: E402
from billing.models import (  # noqa: E402
    BillingCustomer, PaymentMethod, Subscription, SubscriptionStatus, Plan,
)

ORG_ID = 1
OLD_CUSTOMER = "cust_OldAccount001"
NEW_CUSTOMER = "cust_NewAccount002"


class _User:
    def __init__(self, org_id=ORG_ID, user_id=1):
        self.id = user_id
        self.org_id = org_id
        self.email = "owner@example.com"
        self.name = "Owner"
        self.phone = "9999999999"


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
def stub_razorpay(monkeypatch):
    """Make the stored customer unresolvable and hand back a new one -
    exactly what a key swap looks like from inside the router."""
    def _install(*, stored_is_usable):
        monkeypatch.setattr(
            billing_router, "_stored_customer_id_is_usable",
            lambda customer_id: stored_is_usable,
        )
        monkeypatch.setattr(
            billing_router.razorpay_service, "create_customer",
            lambda **kwargs: {"id": NEW_CUSTOMER},
        )
    return _install


def _card(db, token, *, chargeable=True, primary=False):
    pm = PaymentMethod(
        org_id=ORG_ID, razorpay_token_id=token, razorpay_card_id="card_X",
        brand="visa", last4="4242", exp_month=4, exp_year=2031,
        is_chargeable=chargeable, is_primary=primary,
    )
    db.add(pm)
    return pm


@pytest.fixture
def org(db):
    db.add(BillingCustomer(org_id=ORG_ID, razorpay_customer_id=OLD_CUSTOMER))
    db.commit()


# --------------------------------------------------------------------------
# The swap
# --------------------------------------------------------------------------

def test_cards_are_demoted_when_the_customer_is_replaced(db, org, stub_razorpay):
    stub_razorpay(stored_is_usable=False)
    _card(db, "token_A", primary=True)
    _card(db, "token_B")
    db.commit()

    customer_id = billing_router._ensure_razorpay_customer(db, ORG_ID, _User())

    assert customer_id == NEW_CUSTOMER
    assert [pm.is_chargeable for pm in db.query(PaymentMethod).all()] == [False, False]


def test_demoted_cards_keep_their_identity(db, org, stub_razorpay):
    """Demoting is not deleting. The row still shows in the list, still
    names the right card, and can still be removed - removal skips the
    detach call precisely because is_chargeable is False."""
    stub_razorpay(stored_is_usable=False)
    _card(db, "token_A", primary=True)
    db.commit()

    billing_router._ensure_razorpay_customer(db, ORG_ID, _User())

    pm = db.query(PaymentMethod).one()
    assert pm.razorpay_token_id == "token_A"
    assert pm.last4 == "4242"
    assert pm.is_primary is True
    assert pm.is_chargeable is False


def test_the_subscription_is_healed_too(db, org, stub_razorpay):
    """Pre-existing behaviour, pinned here because the card demotion sits
    right next to it and must not have displaced it."""
    stub_razorpay(stored_is_usable=False)
    plan = Plan(
        code="enterprise", name="Enterprise", description="", price_cents=100000,
        currency="inr", billing_cycle="monthly",
        # All NOT NULL, and only here to satisfy the insert - the limits
        # play no part in what this test asserts.
        max_users=100, max_storage_gb=500, max_reports_per_month=1000,
        max_dashboards=50, max_data_processing_gb=100,
    )
    db.add(plan)
    db.flush()
    now = datetime(2026, 9, 1, tzinfo=timezone.utc)
    db.add(Subscription(
        org_id=ORG_ID, plan_id=plan.id, status=SubscriptionStatus.ACTIVE,
        razorpay_customer_id=OLD_CUSTOMER,
        current_period_start=now, current_period_end=now + timedelta(days=30),
    ))
    db.commit()

    billing_router._ensure_razorpay_customer(db, ORG_ID, _User())

    assert db.query(Subscription).one().razorpay_customer_id == NEW_CUSTOMER


# --------------------------------------------------------------------------
# The non-swap
# --------------------------------------------------------------------------

def test_a_usable_customer_leaves_cards_alone(db, org, stub_razorpay):
    """The overwhelmingly common path. Demoting here would break working
    cards on every single request that resolves a customer."""
    stub_razorpay(stored_is_usable=True)
    _card(db, "token_A", primary=True)
    db.commit()

    customer_id = billing_router._ensure_razorpay_customer(db, ORG_ID, _User())

    assert customer_id == OLD_CUSTOMER
    assert db.query(PaymentMethod).one().is_chargeable is True


def test_first_time_setup_touches_nothing(db, stub_razorpay):
    """No BillingCustomer row yet, so there is no retired customer and
    nothing to demote."""
    stub_razorpay(stored_is_usable=False)
    _card(db, "token_A", primary=True)
    db.commit()

    customer_id = billing_router._ensure_razorpay_customer(db, ORG_ID, _User())

    assert customer_id == NEW_CUSTOMER
    assert db.query(PaymentMethod).one().is_chargeable is True


def test_another_orgs_cards_are_untouched(db, org, stub_razorpay):
    stub_razorpay(stored_is_usable=False)
    _card(db, "token_A", primary=True)
    other = PaymentMethod(
        org_id=2, razorpay_token_id="token_Other", brand="visa", last4="1111",
        exp_month=1, exp_year=2030, is_chargeable=True, is_primary=True,
    )
    db.add(other)
    db.commit()

    billing_router._ensure_razorpay_customer(db, ORG_ID, _User())

    assert db.query(PaymentMethod).filter(PaymentMethod.org_id == 2).one().is_chargeable is True
