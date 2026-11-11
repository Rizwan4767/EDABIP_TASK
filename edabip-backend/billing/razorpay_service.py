"""
Razorpay integration layer.

Why Razorpay: BR-SB-010 requires "payment processing... only through
approved and secure payment gateways that comply with applicable
security and compliance standards." Razorpay is PCI-DSS compliant and,
like the Stripe integration this replaces, the raw card never touches
this backend - Razorpay Checkout collects it in the browser and hands
this server back an order id, payment id and signature to verify.

This is the ONLY file that imports the `razorpay` package. Every other
file talks to `razorpay_service.*` functions, never to the SDK client
directly - that keeps the SDK version and error handling in one place.

How "saving a card" works here (Razorpay has no direct equivalent of
Stripe's zero-amount SetupIntent): we create a small verification order
for RAZORPAY_CARD_VERIFICATION_AMOUNT paise, the frontend completes it
with Razorpay Checkout using `save=1`, and once we've verified the
signature and pulled the resulting card token off the customer, we
immediately refund that verification charge. The card itself is never
billed for real until a plan is actually selected.

Recurring billing (subscription renewals) is handled by Razorpay's own
Subscriptions API once a plan is chosen - Razorpay charges the saved
token on its own schedule and lets us know what happened via webhook,
same as Stripe did.
"""
import re
import time
import uuid
from dataclasses import dataclass
from typing import Optional

import razorpay
from razorpay.errors import BadRequestError, GatewayError, ServerError, SignatureVerificationError

from billing.config import settings

_razorpay_client = None

_KEYS_MISSING_MESSAGE = (
    "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET "
    "in edabip-backend/.env from https://dashboard.razorpay.com/app/keys "
    "(test mode: Key Id starts with rzp_test_), then restart the backend."
)
_KEYS_REJECTED_MESSAGE = (
    "Razorpay rejected these API keys. Confirm RAZORPAY_KEY_ID and "
    "RAZORPAY_KEY_SECRET in edabip-backend/.env match the Key Id and Key "
    "Secret from https://dashboard.razorpay.com/app/keys, then restart "
    "the backend."
)


class RazorpayServiceError(Exception):
    """Raised for any Razorpay failure. `user_message` is safe to show to
    the end user (already mapped to the spec's error copy); `detail` is
    for server-side logs only."""

    def __init__(self, user_message: str, detail: str = ""):
        self.user_message = user_message
        self.detail = detail or user_message
        super().__init__(self.detail)


def _require_configured() -> None:
    if not settings.keys_are_configured():
        raise RazorpayServiceError(_KEYS_MISSING_MESSAGE, "missing or placeholder Razorpay keys")


def _get_client():
    """Build the SDK client after `.env` has been loaded (see billing.config)."""
    _require_configured()
    global _razorpay_client
    if _razorpay_client is None:
        _razorpay_client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )
    return _razorpay_client


def _receipt(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:16]}"


def _wrap(fn, *args, error_message: str, **kwargs):
    try:
        return fn(*args, **kwargs)
    except BadRequestError as e:  # bad params, declined card, auth, etc.
        detail = str(e)
        if "authentication failed" in detail.lower():
            raise RazorpayServiceError(_KEYS_REJECTED_MESSAGE, detail) from e
        raise RazorpayServiceError("Payment could not be completed.", detail) from e
    except SignatureVerificationError as e:
        raise RazorpayServiceError("Invalid payment signature.", str(e)) from e
    except (GatewayError, ServerError) as e:
        raise RazorpayServiceError("Unable to communicate with the billing service.", str(e)) from e
    except Exception as e:  # network hiccups, timeouts, etc.
        raise RazorpayServiceError(error_message, str(e)) from e


# --------------------------------------------------------------------------
# Customers
# --------------------------------------------------------------------------

def create_customer(org_id: int, email: str, name: str, contact: str = "") -> dict:
    # fail_existing="0" means: if a customer with this email already
    # exists on our Razorpay account, hand back the existing one instead
    # of erroring out - keeps this safe to call more than once for the
    # same org without creating duplicates.
    payload = {
        "name": name,
        "email": email,
        "fail_existing": "0",
        "notes": {"org_id": str(org_id)},
    }
    # Razorpay files saved cards against the customer's contact number as
    # well as the customer id, so a customer minted without one can end up
    # with tokens that never show up under it. Omitted rather than sent
    # blank when we don't have a phone on file - Razorpay rejects an empty
    # contact outright.
    if contact and contact.strip():
        payload["contact"] = contact.strip()
    return _wrap(
        _get_client().customer.create,
        payload,
        error_message="Unable to set up billing for this account.",
    )


# Razorpay entity ids are "<prefix>_<14 base62 chars>" (e.g.
# cust_Tah9NvEufnnK9Z). Anything else - notably the "cust_demo_org1"
# placeholder written by seed_demo.py - was never minted by Razorpay and
# cannot be used against the API. The range is kept loose rather than
# pinned to exactly 14 so a future id length change does not reject
# genuine ids.
_CUSTOMER_ID_RE = re.compile(r"^cust_[A-Za-z0-9]{12,20}$")


def is_well_formed_customer_id(customer_id: Optional[str]) -> bool:
    """True if `customer_id` could plausibly be a real Razorpay customer id.

    A purely local check - no API call. Fake/demo ids fail here, which
    matters because Razorpay answers a malformed id with a bare
    ServerError that is indistinguishable from a genuine outage.
    """
    return bool(customer_id and _CUSTOMER_ID_RE.match(customer_id.strip()))


def customer_exists(customer_id: str) -> Optional[bool]:
    """Does this customer exist on the Razorpay account these keys belong to?

    Returns True if it does, False if Razorpay positively reports it does
    not, and None when that could not be determined (network trouble, an
    upstream outage, a malformed id). Callers must treat None as "assume
    it is still good" - discarding a customer on an unverifiable answer
    would mint duplicates every time Razorpay had a bad minute.
    """
    try:
        _get_client().customer.fetch(customer_id)
        return True
    except BadRequestError:
        # The only response that positively means "no such customer".
        return False
    except Exception:
        return None


# --------------------------------------------------------------------------
# Payment methods - see module docstring for how card-saving works
# without an actual purchase happening.
# --------------------------------------------------------------------------

def create_card_verification_order(customer_id: str, org_id: int) -> dict:
    """Backs the '+ Add New Payment Method' button. Razorpay Checkout on
    the frontend opens against this order and, once the customer enters
    their card, hands back a payment id/signature we can verify and a
    token we can charge later for renewals."""
    return _wrap(
        _get_client().order.create,
        {
            # Without this the payment still succeeds, but Razorpay has no
            # customer to mint a token against - `save=1` on the frontend
            # only files the card under the payer's phone number in
            # Razorpay's own saved-card UX. token.all(customer_id) then
            # comes back empty and verify_and_save_card raises after the
            # money has already moved.
            "customer_id": customer_id,
            "amount": settings.RAZORPAY_CARD_VERIFICATION_AMOUNT,
            "currency": settings.DEFAULT_CURRENCY.upper(),
            "receipt": _receipt(f"cardverify-{org_id}"),
            "payment_capture": 1,
            "notes": {"org_id": str(org_id), "purpose": "card_verification"},
        },
        error_message="Unable to start payment method setup.",
    )


@dataclass
class CardDetails:
    # The chargeable token, or None on a TEST-mode fallback (see
    # verify_and_save_card). Never both this and a fallback.
    razorpay_token_id: Optional[str]
    brand: str
    last4: str
    # None when Razorpay did not supply an expiry. Only a token fetch
    # carries one; the payment entity does not.
    exp_month: Optional[int]
    exp_year: Optional[int]
    # Razorpay's per-payment card reference. Informational only.
    razorpay_card_id: Optional[str] = None
    is_chargeable: bool = True
    # card | netbanking | wallet | upi | other
    method: str = "card"


def _refund_verification_charge(payment_id: str) -> None:
    """Give back the RAZORPAY_CARD_VERIFICATION_AMOUNT taken just to
    tokenize the card. Best-effort: the card is saved either way, and a
    failed refund can be retried or reconciled by hand."""
    try:
        _get_client().payment.refund(payment_id, {"amount": settings.RAZORPAY_CARD_VERIFICATION_AMOUNT})
    except Exception:
        pass


_CAPTURED_STATUSES = frozenset({"captured", "authorized"})
_LIVE_TOKEN_RETRIES = 3
_LIVE_TOKEN_RETRY_DELAY_SECONDS = 0.4
_LAST4_RE = re.compile(r"^\d{4}$")
_NO_TOKEN_LIVE_MESSAGE = (
    "Razorpay did not tokenize this card. Confirm the Razorpay account "
    "has KYC and card tokenisation enabled, then try again."
)


def _token_id_from_payment(payment: dict) -> Optional[str]:
    """Razorpay has used both a top-level token_id and a nested token object."""
    token_id = payment.get("token_id")
    if token_id:
        return str(token_id)
    token = payment.get("token")
    if isinstance(token, str) and token:
        return token
    if isinstance(token, dict):
        nested = token.get("id") or token.get("token_id")
        if nested:
            return str(nested)
    return None


def _optional_month(value) -> Optional[int]:
    try:
        month = int(value)
    except (TypeError, ValueError):
        return None
    return month if 1 <= month <= 12 else None


def _optional_year(value) -> Optional[int]:
    try:
        year = int(value)
    except (TypeError, ValueError):
        return None
    return year if year >= 2000 else None


def _card_blob(payment: dict) -> dict:
    card = payment.get("card")
    return card if isinstance(card, dict) else {}


def _clip_brand(value, fallback: str) -> str:
    text = re.sub(r"\s+", " ", str(value or "").strip()) or fallback
    return text[:32]


def _title_brand(value: str) -> str:
    if not value:
        return value
    if value.isupper() or len(value) <= 4:
        return value.upper() if value.isupper() else value.capitalize()
    return value.replace("_", " ").title()


def _non_card_method_details(payment: dict) -> CardDetails:
    """Net banking, wallet, UPI and similar one-time methods.

    Checkout still captures the ₹1 verification payment, but Razorpay
    does not mint a reusable card token. We keep the display metadata
    (bank / wallet name) so a successful Checkout is saved instead of
    422ing after Razorpay already showed success.
    """
    method = str(payment.get("method") or "other").lower()
    if method == "netbanking":
        brand = _title_brand(_clip_brand(payment.get("bank"), "Net banking"))
        stored_method = "netbanking"
    elif method == "wallet":
        brand = _title_brand(_clip_brand(payment.get("wallet"), "Wallet"))
        stored_method = "wallet"
    elif method == "upi":
        brand = "UPI"
        stored_method = "upi"
    else:
        brand = _title_brand(_clip_brand(method.replace("_", " "), "Payment method"))
        stored_method = "other"
    return CardDetails(
        razorpay_token_id=None,
        razorpay_card_id=payment.get("id"),
        brand=brand,
        last4="",
        exp_month=None,
        exp_year=None,
        is_chargeable=False,
        method=stored_method,
    )


def _fallback_card_details(payment: dict) -> CardDetails:
    """Build a NON-CHARGEABLE card row from a tokenless payment.

    Only the display metadata Razorpay puts on the payment entity is
    used - `card_id`, `last4`, `network`. That is not cardholder data:
    the PAN, CVV and expiry never appear here (the payment entity has no
    expiry field at all, which is why exp_* stay None rather than being
    invented).

    The signature on this payment has already been verified by the
    caller, so the card really was entered through Razorpay Checkout -
    this path fabricates nothing, it just records less.
    """
    card = _card_blob(payment)
    last4 = str(card.get("last4") or "")
    if not _LAST4_RE.match(last4):
        raise RazorpayServiceError(
            "Unable to save payment method.",
            "tokenless payment had no usable last4",
        )
    return CardDetails(
        razorpay_token_id=None,
        razorpay_card_id=payment.get("card_id") or card.get("id"),
        brand=(card.get("network") or "card").lower(),
        last4=last4,
        exp_month=_optional_month(card.get("expiry_month")),
        exp_year=_optional_year(card.get("expiry_year")),
        is_chargeable=False,
    )


def _refetch_payment_for_token(payment_id: str, payment: dict) -> dict:
    """Live accounts sometimes mint the token a moment after capture."""
    latest = payment
    for attempt in range(_LIVE_TOKEN_RETRIES - 1):
        if _token_id_from_payment(latest):
            return latest
        time.sleep(_LIVE_TOKEN_RETRY_DELAY_SECONDS)
        latest = _wrap(
            _get_client().payment.fetch,
            payment_id,
            error_message="Unable to save payment method.",
        )
    return latest


def verify_and_save_card(customer_id: str, order_id: str, payment_id: str, signature: str) -> CardDetails:
    """Confirms the verification payment really came from Razorpay (not
    someone replaying an old payment id), reads the token Razorpay minted
    for that payment, then refunds the small verification charge so the
    customer isn't actually out any money for just adding a card.

    `customer_id` must be the customer the verification order was created
    against - the caller passes the stored one rather than re-resolving it,
    so this never looks for the token under a customer the payment never
    touched."""
    try:
        _get_client().utility.verify_payment_signature({
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature,
        })
    except SignatureVerificationError as e:
        raise RazorpayServiceError("Selected payment method is invalid.", str(e)) from e

    payment = _wrap(_get_client().payment.fetch, payment_id, error_message="Selected payment method is invalid.")
    if payment.get("order_id") != order_id:
        raise RazorpayServiceError("Selected payment method is invalid.", "order_id mismatch on payment")

    status = str(payment.get("status") or "").lower()
    if status not in _CAPTURED_STATUSES:
        raise RazorpayServiceError(
            "Payment was not completed.",
            f"payment status {status or 'unknown'} is not captured",
        )

    # Past this line the verification charge is provably ours: the
    # signature checked out and the payment belongs to the order we
    # created. So the refund belongs in a `finally`, not on the happy
    # path - every `raise` below (customer mismatch, no token with the
    # fallback disabled, a failed token fetch) used to return an error to
    # the user while quietly keeping their money. The user then retries
    # with another card and is charged again, and the first
    # RAZORPAY_CARD_VERIFICATION_AMOUNT is never given back.
    #
    # Nothing above this point is refunded on purpose: a bad signature or
    # a mismatched order_id means the payment is not ours to refund.
    #
    # _refund_verification_charge swallows its own errors, so this cannot
    # mask the exception on its way out.
    try:
        # Belt and braces: the card has to hang off the customer we are about
        # to file it under, otherwise a later renewal would charge a token the
        # customer does not own. Checked before the token lookup so the
        # TEST-mode fallback below is covered by it too.
        payment_customer_id = payment.get("customer_id")
        if payment_customer_id and payment_customer_id != customer_id:
            raise RazorpayServiceError(
                "Unable to save payment method.",
                f"payment customer {payment_customer_id} != billing customer {customer_id}",
            )

        # The payment entity names the token minted for THIS payment. Listing
        # the customer's tokens and taking the newest was both the thing that
        # kept failing here and racy - with more than one saved card it could
        # pick a different card's token than the one just entered.
        method = str(payment.get("method") or "card").lower()
        if method and method != "card":
            return _non_card_method_details(payment)

        token_id = _token_id_from_payment(payment)
        if not token_id and settings.test_card_fallback_enabled():
            # Razorpay took the money but minted nothing reusable. In TEST
            # mode on an account that cannot complete KYC this is permanent,
            # not transient - tokenisation is never going to succeed, so
            # "+ Add New Payment Method" would 422 after a successful
            # Checkout forever. Fall back to the non-sensitive metadata
            # Razorpay *did* return, clearly marked as non-chargeable.
            # Never reachable with a live key.
            return _fallback_card_details(payment)

        if not token_id:
            payment = _refetch_payment_for_token(payment_id, payment)
            token_id = _token_id_from_payment(payment)
        if not token_id:
            raise RazorpayServiceError(
                _NO_TOKEN_LIVE_MESSAGE,
                "payment succeeded but Razorpay minted no token - Checkout was not "
                "given customer_id/save, or the account cannot tokenise",
            )

        token = _wrap(
            _get_client().token.fetch, customer_id, token_id,
            error_message="Unable to save payment method.",
        )
        card = token.get("card") or {}
        last4 = str(card.get("last4") or "")
        if not _LAST4_RE.match(last4):
            raise RazorpayServiceError(
                "Unable to save payment method.",
                f"token {token_id} had no usable last4",
            )

        return CardDetails(
            razorpay_token_id=token["id"],
            razorpay_card_id=payment.get("card_id") or card.get("id"),
            brand=(card.get("network") or "card").lower(),
            last4=last4,
            exp_month=_optional_month(card.get("expiry_month")),
            exp_year=_optional_year(card.get("expiry_year")),
            is_chargeable=True,
            method="card",
        )
    finally:
        _refund_verification_charge(payment_id)


def detach_payment_method(customer_id: str, token_id: str) -> None:
    _wrap(_get_client().token.delete, customer_id, token_id, error_message="Unable to remove payment method.")


# --------------------------------------------------------------------------
# Plans & Subscriptions
# --------------------------------------------------------------------------

def get_or_create_plan(razorpay_plan_id: Optional[str], name: str, amount_cents: int, currency: str, billing_cycle: str) -> str:
    """Plan.razorpay_plan_id is cached on the row after the first call so
    we never create duplicate Razorpay plans for the same internal plan."""
    if razorpay_plan_id:
        return razorpay_plan_id
    period = "monthly" if billing_cycle == "monthly" else "yearly"
    plan = _wrap(
        _get_client().plan.create,
        {
            "period": period,
            "interval": 1,
            "item": {"name": name, "amount": amount_cents, "currency": currency.upper()},
        },
        error_message="Unable to set up subscription plan.",
    )
    return plan["id"]


def _total_count_for_cycle(billing_cycle: str) -> int:
    # Razorpay subscriptions need a bounded number of cycles up front
    # (no "run forever" option) - 10 years' worth is effectively
    # indefinite for how this product is used, and select_plan()/
    # renew_subscription() re-create a fresh subscription on
    # upgrade/downgrade anyway.
    return 120 if billing_cycle == "monthly" else 10


def create_subscription(customer_id: str, razorpay_plan_id: str, billing_cycle: str, org_id: int) -> dict:
    return _wrap(
        _get_client().subscription.create,
        {
            "plan_id": razorpay_plan_id,
            "customer_id": customer_id,
            "total_count": _total_count_for_cycle(billing_cycle),
            "customer_notify": 1,
            "notes": {"org_id": str(org_id)},
        },
        error_message="Unable to activate subscription.",
    )


def fetch_subscription(subscription_id: str) -> dict:
    return _wrap(_get_client().subscription.fetch, subscription_id, error_message="Unable to retrieve subscription.")


def cancel_subscription(subscription_id: str, at_period_end: bool = True) -> dict:
    return _wrap(
        _get_client().subscription.cancel,
        subscription_id,
        {"cancel_at_cycle_end": 1 if at_period_end else 0},
        error_message="Unable to cancel subscription.",
    )


def charge_saved_card_now(customer_id: str, token_id: str, amount_cents: int, currency: str, email: str, org_id: int) -> dict:
    """Backs the manual 'Renew Subscription' button - charges the org's
    saved card token directly, right now, instead of waiting for
    Razorpay's own billing schedule to fire. Returns the payment dict on
    success (raises RazorpayServiceError otherwise)."""
    order = _wrap(
        _get_client().order.create,
        {
            "amount": amount_cents,
            "currency": currency.upper(),
            "receipt": _receipt(f"renew-{org_id}"),
            "payment_capture": 1,
            "notes": {"org_id": str(org_id), "purpose": "manual_renewal"},
        },
        error_message="Unable to renew subscription.",
    )
    return _wrap(
        _get_client().payment.createRecurring,
        {
            "email": email,
            "amount": amount_cents,
            "currency": currency.upper(),
            "order_id": order["id"],
            "customer_id": customer_id,
            "token": token_id,
            "recurring": "1",
            "description": "Subscription renewal",
        },
        error_message="Payment could not be processed.",
    )


# --------------------------------------------------------------------------
# Invoices - Razorpay's Invoice API gives us a real hosted page/PDF to
# link the "Download Invoice" button at, same role hosted_invoice_pdf
# played for Stripe. Best-effort: a failure here should never block the
# payment itself from going through, so callers treat this as optional.
# --------------------------------------------------------------------------

def create_hosted_invoice(customer_id: str, payment_id: str, description: str, amount_cents: int, currency: str) -> Optional[dict]:
    try:
        return _get_client().invoice.create({
            "type": "invoice",
            "customer_id": customer_id,
            "line_items": [{"name": description, "amount": amount_cents, "currency": currency.upper()}],
        })
    except Exception:
        return None


# --------------------------------------------------------------------------
# Webhooks
# --------------------------------------------------------------------------

def verify_webhook_signature(payload: bytes, signature: str) -> None:
    try:
        _get_client().utility.verify_webhook_signature(payload.decode("utf-8"), signature, settings.RAZORPAY_WEBHOOK_SECRET)
    except SignatureVerificationError as e:
        raise RazorpayServiceError("Invalid webhook signature.", str(e)) from e
