"""One confirm-click must only ever produce one charge.

POST /plans/{code}/select charges the saved card before it answers, so a
response lost on the way back is indistinguishable from a request that
never arrived. The client's natural reaction - press Confirm again - used
to mint a second Razorpay order and charge the card twice.

The client now sends an idempotency key that lives as long as the
confirmation dialog, and the server records the outcome against it. These
tests drive `select_plan` directly against SQLite, with the real work
stubbed out, so what is under test is purely the claim/replay wrapper.
"""
import sys
from datetime import datetime, timezone
from pathlib import Path

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from database import Base  # noqa: E402
from billing import models as billing_models  # noqa: E402,F401  (registers tables)
from billing import router as billing_router  # noqa: E402
from billing.models import IdempotencyRecord  # noqa: E402
from billing.schemas import PlanChangeResultOut, PlanOut, PlanSelectIn  # noqa: E402

ORG_ID = 1
KEY = "dialog-key-0001"


class _User:
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


def _result(message="Subscription upgraded to the Enterprise plan."):
    return PlanChangeResultOut(
        subscription_id=7,
        plan=PlanOut(
            code="enterprise", name="Enterprise", description="", price=1000.0,
            currency="inr", billing_cycle="monthly", features=[],
        ),
        status="active",
        effective_date=datetime(2026, 9, 15, tzinfo=timezone.utc),
        invoice=None,
        message=message,
    )


def _stub_impl(monkeypatch, outcome):
    """Replace the real plan change with something countable.

    `outcome` is either a PlanChangeResultOut to return or an exception to
    raise. Returns the call-count list so a test can assert the work did
    not run twice.
    """
    calls = []

    def _impl(plan_code, payload, db, user):
        calls.append(plan_code)
        if isinstance(outcome, Exception):
            raise outcome
        return outcome

    monkeypatch.setattr(billing_router, "_select_plan_impl", _impl)
    return calls


def _select(db, key=KEY):
    return billing_router.select_plan(
        "enterprise", PlanSelectIn(confirmed=True, idempotency_key=key),
        db=db, user=_User(),
    )


# --------------------------------------------------------------------------
# Replay
# --------------------------------------------------------------------------

def test_retry_with_the_same_key_does_not_charge_again(db, monkeypatch):
    """The whole point: the second call must not reach the charging code."""
    calls = _stub_impl(monkeypatch, _result())

    first = _select(db)
    second = _select(db)

    assert calls == ["enterprise"]          # ran exactly once
    assert second.model_dump() == first.model_dump()


def test_replayed_result_survives_a_fresh_session(db, monkeypatch):
    """A retry usually arrives on a new request with nothing cached in
    memory, so the replay has to come off the row, not an object still
    hanging around in the identity map."""
    calls = _stub_impl(monkeypatch, _result())
    first = _select(db)

    db.expunge_all()
    second = _select(db)

    assert calls == ["enterprise"]
    assert second.message == first.message
    assert second.subscription_id == first.subscription_id


def test_a_different_key_is_a_new_request(db, monkeypatch):
    """A fresh confirm-click mints a fresh key and must go through."""
    calls = _stub_impl(monkeypatch, _result())

    _select(db, key="dialog-key-0001")
    _select(db, key="dialog-key-0002")

    assert calls == ["enterprise", "enterprise"]


def test_another_org_cannot_replay_our_result(db, monkeypatch):
    """Keys are client-generated, so a collision across tenants is only a
    matter of time. Scoping is what stops one org reading another's."""
    _stub_impl(monkeypatch, _result())
    _select(db)

    other = billing_router.select_plan(
        "enterprise", PlanSelectIn(confirmed=True, idempotency_key=KEY),
        db=db, user=_User(org_id=2),
    )

    assert other.subscription_id == 7
    assert db.query(IdempotencyRecord).count() == 2


def test_no_key_means_no_record(db, monkeypatch):
    """Optional by design - an older client keeps working, it just gets no
    protection."""
    calls = _stub_impl(monkeypatch, _result())

    billing_router.select_plan(
        "enterprise", PlanSelectIn(confirmed=True), db=db, user=_User(),
    )

    assert calls == ["enterprise"]
    assert db.query(IdempotencyRecord).count() == 0


# --------------------------------------------------------------------------
# Failures
# --------------------------------------------------------------------------

def test_a_failure_replays_as_the_same_failure(db, monkeypatch):
    """Once the key is claimed we cannot tell whether money moved - a 402
    from the subscription swap lands *after* the card was charged. Re-running
    could charge twice, so the original answer is replayed instead. It is
    also what the user already saw."""
    calls = _stub_impl(monkeypatch, HTTPException(status_code=402, detail="Card declined."))

    with pytest.raises(HTTPException) as first:
        _select(db)
    with pytest.raises(HTTPException) as second:
        _select(db)

    assert calls == ["enterprise"]
    assert second.value.status_code == first.value.status_code == 402
    assert second.value.detail == "Card declined."


def test_an_unfinished_claim_is_not_retried(db, monkeypatch):
    """A claim with no outcome means the request died mid-charge, or is
    still running. Either way we cannot say whether the card was charged,
    so retrying is the one thing we must not do."""
    db.add(IdempotencyRecord(
        org_id=ORG_ID, idempotency_key=KEY,
        endpoint=billing_router.SELECT_PLAN_ENDPOINT, response_json=None,
    ))
    db.commit()
    calls = _stub_impl(monkeypatch, _result())

    with pytest.raises(HTTPException) as excinfo:
        _select(db)

    assert excinfo.value.status_code == 409
    assert calls == []


def test_an_unexpected_crash_leaves_the_claim_unfinished(db, monkeypatch):
    """Not an HTTPException, so we have no idea what state Razorpay is in.
    The claim stays open on purpose: the next retry gets the 409 above
    rather than a second charge, and a human reconciles."""
    _stub_impl(monkeypatch, RuntimeError("connection reset mid-charge"))

    with pytest.raises(RuntimeError):
        _select(db)

    record = db.query(IdempotencyRecord).filter(
        IdempotencyRecord.idempotency_key == KEY,
    ).one()
    assert record.response_json is None
