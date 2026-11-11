"""Tests for the TEST-mode card fallback.

The behaviour under test exists because Razorpay will not mint a card
token for an account that has not completed KYC: the verification
payment is captured, but `token_id` comes back null and "+ Add New
Payment Method" can never finish. The fallback stores the non-sensitive
card metadata instead, marked non-chargeable.

The most important tests here are the negative ones - the fallback must
be unreachable with a live key, whatever the flag says.
"""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from billing import razorpay_service  # noqa: E402
from billing.config import BillingSettings  # noqa: E402
from billing.razorpay_service import RazorpayServiceError  # noqa: E402

CUSTOMER_ID = "cust_TajND3EcBFzJNE"
ORDER_ID = "order_Tajda9gSUJYgLU"
PAYMENT_ID = "pay_TajduhwxRF4lZB"
SIGNATURE = "sig"

# Shaped exactly like the live response pulled from Razorpay for the
# payment that was failing: captured, filed under the right customer,
# carrying card metadata but no token.
TOKENLESS_PAYMENT = {
    "id": PAYMENT_ID,
    "order_id": ORDER_ID,
    "status": "captured",
    "method": "card",
    "customer_id": CUSTOMER_ID,
    "token_id": None,
    "card_id": "card_TajduwvcSCTuIt",
    "card": {
        "id": "card_TajduwvcSCTuIt",
        "last4": "1007",
        "network": "Visa",
        "type": "debit",
        "issuer": "DCBL",
    },
}

TOKENISED_PAYMENT = {**TOKENLESS_PAYMENT, "token_id": "token_ABC123"}


class _FakeClient:
    """Stands in for the Razorpay SDK client."""

    def __init__(self, payment, token=None):
        self._payment = payment
        self._token = token
        self.refunded = []
        self.utility = self._Utility()
        self.payment = self._Payment(self)
        self.token = self._Token(self)

    class _Utility:
        def verify_payment_signature(self, params):
            return True

    class _Payment:
        def __init__(self, outer):
            self._outer = outer

        def fetch(self, payment_id):
            return self._outer._payment

        def refund(self, payment_id, params):
            self._outer.refunded.append((payment_id, params))
            return {"id": "rfnd_1"}

    class _Token:
        def __init__(self, outer):
            self._outer = outer

        def fetch(self, customer_id, token_id):
            if self._outer._token is None:
                raise AssertionError("token.fetch must not be called without a token")
            return self._outer._token


@pytest.fixture
def fake_client(monkeypatch):
    def _install(payment, token=None):
        client = _FakeClient(payment, token)
        monkeypatch.setattr(razorpay_service, "_get_client", lambda: client)
        return client

    return _install


def _build_settings(monkeypatch, *, key_id, flag):
    """A BillingSettings built from a controlled environment."""
    monkeypatch.setenv("RAZORPAY_KEY_ID", key_id)
    monkeypatch.setenv("BILLING_ALLOW_TEST_CARD_FALLBACK", flag)
    return BillingSettings()


def _use_settings(monkeypatch, key_id, flag):
    """Build settings and make razorpay_service read them."""
    s = _build_settings(monkeypatch, key_id=key_id, flag=flag)
    monkeypatch.setattr(razorpay_service, "settings", s)
    return s


# --------------------------------------------------------------------------
# The gate
# --------------------------------------------------------------------------

@pytest.mark.parametrize("flag", ["true", "1", "yes", "on", "TRUE"])
def test_gate_open_for_test_key_with_flag(monkeypatch, flag):
    s = _build_settings(monkeypatch, key_id="rzp_test_Tah9NvEufnnK9Z", flag=flag)
    assert s.test_card_fallback_enabled() is True


def test_gate_open_by_default_on_test_key(monkeypatch):
    """A rzp_test_ key arms the fallback on its own — test accounts cannot KYC."""
    monkeypatch.setenv("RAZORPAY_KEY_ID", "rzp_test_Tah9NvEufnnK9Z")
    monkeypatch.delenv("BILLING_ALLOW_TEST_CARD_FALLBACK", raising=False)
    assert BillingSettings().test_card_fallback_enabled() is True


@pytest.mark.parametrize("flag", ["false", "0", "no", "off", ""])
def test_gate_stays_open_on_test_key_even_if_legacy_flag_is_off(monkeypatch, flag):
    s = _build_settings(monkeypatch, key_id="rzp_test_Tah9NvEufnnK9Z", flag=flag)
    assert s.test_card_fallback_enabled() is True


@pytest.mark.parametrize(
    "key_id",
    [
        "rzp_live_Tah9NvEufnnK9Z",   # the real thing
        "rzp_Tah9NvEufnnK9Z",        # no mode segment
        "RZP_TEST_Tah9NvEufnnK9Z",   # case must not be a loophole
        "xrzp_test_Tah9NvEufnnK9Z",  # prefix must anchor at the start
        "",                          # unset
    ],
)
def test_gate_closed_for_non_test_keys_even_with_flag(monkeypatch, key_id):
    """The flag being set must never be enough on its own."""
    s = _build_settings(monkeypatch, key_id=key_id, flag="true")
    assert s.test_card_fallback_enabled() is False


# --------------------------------------------------------------------------
# The fallback itself
# --------------------------------------------------------------------------

def test_fallback_saves_non_chargeable_card(monkeypatch, fake_client):
    _use_settings(monkeypatch, "rzp_test_Tah9NvEufnnK9Z", "true")
    client = fake_client(TOKENLESS_PAYMENT)

    card = razorpay_service.verify_and_save_card(
        CUSTOMER_ID, ORDER_ID, PAYMENT_ID, SIGNATURE
    )

    assert card.is_chargeable is False
    assert card.razorpay_token_id is None
    assert card.razorpay_card_id == "card_TajduwvcSCTuIt"
    assert card.brand == "visa"
    assert card.last4 == "1007"
    # Still refunds the verification charge, same as the normal path.
    assert client.refunded == [(PAYMENT_ID, {"amount": 100})]


def test_fallback_does_not_invent_an_expiry(monkeypatch, fake_client):
    _use_settings(monkeypatch, "rzp_test_Tah9NvEufnnK9Z", "true")
    fake_client(TOKENLESS_PAYMENT)

    card = razorpay_service.verify_and_save_card(
        CUSTOMER_ID, ORDER_ID, PAYMENT_ID, SIGNATURE
    )

    assert card.exp_month is None
    assert card.exp_year is None


def test_fallback_carries_only_display_metadata(monkeypatch, fake_client):
    """Nothing beyond brand/last4/card reference may reach the caller.

    The payment entity the fallback reads has an issuer, a card type and
    a `token_iin`; none of it should be picked up, and there is no PAN or
    CVV anywhere in it to pick up in the first place.
    """
    _use_settings(monkeypatch, "rzp_test_Tah9NvEufnnK9Z", "true")
    fake_client(TOKENLESS_PAYMENT)

    card = razorpay_service.verify_and_save_card(
        CUSTOMER_ID, ORDER_ID, PAYMENT_ID, SIGNATURE
    )

    populated = {k for k, v in vars(card).items() if v is not None and v is not False}
    assert populated == {"razorpay_card_id", "brand", "last4", "method"}
    # last4 is the only digit string kept, and it stays four digits.
    assert len(card.last4) <= 4


def test_fallback_rejects_card_belonging_to_another_customer(monkeypatch, fake_client):
    """Ownership is checked before the fallback, not after."""
    _use_settings(monkeypatch, "rzp_test_Tah9NvEufnnK9Z", "true")
    fake_client({**TOKENLESS_PAYMENT, "customer_id": "cust_SomeoneElse123"})

    with pytest.raises(RazorpayServiceError):
        razorpay_service.verify_and_save_card(
            CUSTOMER_ID, ORDER_ID, PAYMENT_ID, SIGNATURE
        )


def test_fallback_rejects_payment_from_another_order(monkeypatch, fake_client):
    _use_settings(monkeypatch, "rzp_test_Tah9NvEufnnK9Z", "true")
    fake_client({**TOKENLESS_PAYMENT, "order_id": "order_Other"})

    with pytest.raises(RazorpayServiceError):
        razorpay_service.verify_and_save_card(
            CUSTOMER_ID, ORDER_ID, PAYMENT_ID, SIGNATURE
        )


# --------------------------------------------------------------------------
# The fallback must not exist in production
# --------------------------------------------------------------------------

def test_live_key_still_raises_on_missing_token(monkeypatch, fake_client):
    """A live key still requires a real token, flag or no flag."""
    _use_settings(monkeypatch, "rzp_live_Tah9NvEufnnK9Z", "true")
    monkeypatch.setattr(razorpay_service, "_LIVE_TOKEN_RETRY_DELAY_SECONDS", 0)
    fake_client(TOKENLESS_PAYMENT)

    with pytest.raises(RazorpayServiceError) as excinfo:
        razorpay_service.verify_and_save_card(
            CUSTOMER_ID, ORDER_ID, PAYMENT_ID, SIGNATURE
        )
    assert "tokenize" in excinfo.value.user_message.lower()


def test_test_key_saves_fallback_even_when_legacy_flag_is_off(monkeypatch, fake_client):
    _use_settings(monkeypatch, "rzp_test_Tah9NvEufnnK9Z", "false")
    fake_client(TOKENLESS_PAYMENT)

    card = razorpay_service.verify_and_save_card(
        CUSTOMER_ID, ORDER_ID, PAYMENT_ID, SIGNATURE
    )
    assert card.is_chargeable is False
    assert card.last4 == "1007"


def test_nested_token_object_is_used(monkeypatch, fake_client):
    _use_settings(monkeypatch, "rzp_test_Tah9NvEufnnK9Z", "true")
    payment = {**TOKENLESS_PAYMENT, "token_id": None, "token": {"id": "token_ABC123"}}
    fake_client(
        payment,
        token={
            "id": "token_ABC123",
            "card": {"network": "Visa", "last4": "1007", "expiry_month": 4, "expiry_year": 2031},
        },
    )

    card = razorpay_service.verify_and_save_card(
        CUSTOMER_ID, ORDER_ID, PAYMENT_ID, SIGNATURE
    )
    assert card.is_chargeable is True
    assert card.razorpay_token_id == "token_ABC123"
    assert card.exp_month == 4
    assert card.exp_year == 2031


# --------------------------------------------------------------------------
# The normal tokenised path is untouched
# --------------------------------------------------------------------------

def test_tokenised_card_is_unchanged_with_fallback_armed(monkeypatch, fake_client):
    """Even with the fallback available, a real token takes the old path."""
    _use_settings(monkeypatch, "rzp_test_Tah9NvEufnnK9Z", "true")
    client = fake_client(
        TOKENISED_PAYMENT,
        token={
            "id": "token_ABC123",
            "card": {
                "network": "Visa", "last4": "1007",
                "expiry_month": 4, "expiry_year": 2031,
            },
        },
    )

    card = razorpay_service.verify_and_save_card(
        CUSTOMER_ID, ORDER_ID, PAYMENT_ID, SIGNATURE
    )

    assert card.is_chargeable is True
    assert card.razorpay_token_id == "token_ABC123"
    assert card.exp_month == 4
    assert card.exp_year == 2031
    assert client.refunded == [(PAYMENT_ID, {"amount": 100})]


def test_tokenised_path_works_on_live_key(monkeypatch, fake_client):
    _use_settings(monkeypatch, "rzp_live_Tah9NvEufnnK9Z", "false")
    fake_client(
        TOKENISED_PAYMENT,
        token={"id": "token_ABC123", "card": {"network": "Visa", "last4": "1007"}},
    )

    card = razorpay_service.verify_and_save_card(
        CUSTOMER_ID, ORDER_ID, PAYMENT_ID, SIGNATURE
    )
    assert card.is_chargeable is True
    assert card.razorpay_token_id == "token_ABC123"


def test_placeholder_keys_are_not_configured(monkeypatch):
    monkeypatch.setenv("RAZORPAY_KEY_ID", "rzp_test_xxxxxxxxxxxxxx")
    monkeypatch.setenv("RAZORPAY_KEY_SECRET", "xxxxxxxxxxxxxxxxxxxxxxxx")
    assert BillingSettings().keys_are_configured() is False


def test_real_looking_test_keys_are_configured(monkeypatch):
    monkeypatch.setenv("RAZORPAY_KEY_ID", "rzp_test_Tah9NvEufnnK9Z")
    monkeypatch.setenv("RAZORPAY_KEY_SECRET", "not-a-placeholder-secret")
    assert BillingSettings().keys_are_configured() is True


def test_missing_keys_fail_before_sdk_call(monkeypatch):
    monkeypatch.setenv("RAZORPAY_KEY_ID", "rzp_test_xxxxxxxxxxxxxx")
    monkeypatch.setenv("RAZORPAY_KEY_SECRET", "xxxxxxxxxxxxxxxxxxxxxxxx")
    monkeypatch.setattr(razorpay_service, "settings", BillingSettings())
    razorpay_service._razorpay_client = None
    with pytest.raises(RazorpayServiceError) as excinfo:
        razorpay_service.create_customer(1, "a@b.com", "Org")
    assert "not configured" in excinfo.value.user_message.lower()


NETBANKING_PAYMENT = {
    "id": PAYMENT_ID,
    "order_id": ORDER_ID,
    "status": "captured",
    "method": "netbanking",
    "bank": "HDFC",
    "customer_id": CUSTOMER_ID,
    "token_id": None,
}

WALLET_PAYMENT = {
    "id": PAYMENT_ID,
    "order_id": ORDER_ID,
    "status": "captured",
    "method": "wallet",
    "wallet": "mobikwik",
    "customer_id": CUSTOMER_ID,
    "token_id": None,
}


def test_netbanking_payment_is_saved_after_checkout_success(monkeypatch, fake_client):
    """Checkout success must not 422 just because there is no card token."""
    _use_settings(monkeypatch, "rzp_test_Tah9NvEufnnK9Z", "true")
    client = fake_client(NETBANKING_PAYMENT)

    details = razorpay_service.verify_and_save_card(
        CUSTOMER_ID, ORDER_ID, PAYMENT_ID, SIGNATURE
    )

    assert details.method == "netbanking"
    assert details.brand == "HDFC"
    assert details.last4 == ""
    assert details.is_chargeable is False
    assert details.razorpay_card_id == PAYMENT_ID
    assert client.refunded == [(PAYMENT_ID, {"amount": 100})]


def test_wallet_payment_is_saved_after_checkout_success(monkeypatch, fake_client):
    _use_settings(monkeypatch, "rzp_test_Tah9NvEufnnK9Z", "true")
    fake_client(WALLET_PAYMENT)

    details = razorpay_service.verify_and_save_card(
        CUSTOMER_ID, ORDER_ID, PAYMENT_ID, SIGNATURE
    )

    assert details.method == "wallet"
    assert details.brand == "Mobikwik"
    assert details.is_chargeable is False


def test_live_key_still_saves_netbanking(monkeypatch, fake_client):
    """Non-card methods are not tokenised; live keys must still keep them."""
    _use_settings(monkeypatch, "rzp_live_Tah9NvEufnnK9Z", "true")
    fake_client(NETBANKING_PAYMENT)

    details = razorpay_service.verify_and_save_card(
        CUSTOMER_ID, ORDER_ID, PAYMENT_ID, SIGNATURE
    )

    assert details.method == "netbanking"
    assert details.is_chargeable is False
