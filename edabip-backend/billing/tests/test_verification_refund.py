"""The verification charge must always come back.

Adding a card takes RAZORPAY_CARD_VERIFICATION_AMOUNT off the card just
to mint a token, and gives it straight back. The refund used to sit on
the happy path only, so every way the save could fail *after* the money
was captured - a card filed under the wrong customer, a token fetch that
errored, no token with the fallback disabled - returned an error to the
user and quietly kept their money. They would then try another card and
be charged again, with the first amount never refunded.

These are the failure paths. The success paths are covered in
test_card_fallback.py, which asserts the same refund.
"""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from billing import razorpay_service  # noqa: E402
from billing.razorpay_service import RazorpayServiceError  # noqa: E402
from billing.tests.test_card_fallback import (  # noqa: E402
    CUSTOMER_ID, ORDER_ID, PAYMENT_ID, SIGNATURE,
    TOKENLESS_PAYMENT, TOKENISED_PAYMENT,
    _FakeClient, _use_settings,
)

REFUND = (PAYMENT_ID, {"amount": 100})


def _install(monkeypatch, payment, token=None, token_error=None):
    client = _FakeClient(payment, token)
    if token_error is not None:
        def _raise(customer_id, token_id):
            raise token_error
        client.token.fetch = _raise
    monkeypatch.setattr(razorpay_service, "_get_client", lambda: client)
    return client


def test_refunds_when_card_belongs_to_another_customer(monkeypatch):
    """The strictest check in the function, and the one that leaked most:
    it rejects the save outright, long after the money was taken."""
    _use_settings(monkeypatch, "rzp_test_Tah9NvEufnnK9Z", "false")
    payment = {**TOKENISED_PAYMENT, "customer_id": "cust_SomeoneElse00"}
    client = _install(monkeypatch, payment)

    with pytest.raises(RazorpayServiceError):
        razorpay_service.verify_and_save_card(CUSTOMER_ID, ORDER_ID, PAYMENT_ID, SIGNATURE)

    assert client.refunded == [REFUND]


def test_refunds_when_no_token_and_fallback_disabled(monkeypatch):
    """With a live key the fallback is closed, so a tokenless payment is a
    hard failure - but the verification charge is still ours to return."""
    _use_settings(monkeypatch, "rzp_live_Tah9NvEufnnK9Z", "false")
    monkeypatch.setattr(razorpay_service, "_LIVE_TOKEN_RETRY_DELAY_SECONDS", 0)
    client = _install(monkeypatch, TOKENLESS_PAYMENT)

    with pytest.raises(RazorpayServiceError):
        razorpay_service.verify_and_save_card(CUSTOMER_ID, ORDER_ID, PAYMENT_ID, SIGNATURE)

    assert client.refunded == [REFUND]


def test_refunds_when_token_fetch_fails(monkeypatch):
    """Razorpay named a token but would not hand it over - a transient
    gateway failure, and the one most likely to be retried by the user."""
    _use_settings(monkeypatch, "rzp_test_Tah9NvEufnnK9Z", "false")
    client = _install(
        monkeypatch, TOKENISED_PAYMENT, token_error=RuntimeError("gateway down"),
    )

    with pytest.raises(RazorpayServiceError):
        razorpay_service.verify_and_save_card(CUSTOMER_ID, ORDER_ID, PAYMENT_ID, SIGNATURE)

    assert client.refunded == [REFUND]


def test_refunds_exactly_once_on_success(monkeypatch):
    """The refund moved into a `finally`; this pins that it did not end up
    firing twice on the path that already refunded."""
    _use_settings(monkeypatch, "rzp_test_Tah9NvEufnnK9Z", "false")
    token = {"id": "token_ABC123", "card": {"last4": "1007", "network": "Visa"}}
    client = _install(monkeypatch, TOKENISED_PAYMENT, token=token)

    card = razorpay_service.verify_and_save_card(CUSTOMER_ID, ORDER_ID, PAYMENT_ID, SIGNATURE)

    assert card.is_chargeable is True
    assert client.refunded == [REFUND]


def test_does_not_refund_a_payment_that_is_not_ours(monkeypatch):
    """An order_id mismatch means this payment was never for our order.
    Refunding it would be handing back money we never took."""
    _use_settings(monkeypatch, "rzp_test_Tah9NvEufnnK9Z", "false")
    payment = {**TOKENISED_PAYMENT, "order_id": "order_SomethingElse"}
    client = _install(monkeypatch, payment)

    with pytest.raises(RazorpayServiceError):
        razorpay_service.verify_and_save_card(CUSTOMER_ID, ORDER_ID, PAYMENT_ID, SIGNATURE)

    assert client.refunded == []
