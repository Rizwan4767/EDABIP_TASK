"""
Billing/Razorpay configuration.

The host Settings model reads `.env` into its own fields only
(`extra="ignore"`), so RAZORPAY_* never landed in `os.environ`. This
module loads `edabip-backend/.env` explicitly, then reads keys at
instance-init time (not as class attributes, which freeze empty values
at import).
"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

_BACKEND_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(_BACKEND_ROOT / ".env", override=False)


def _env(name: str, default: str = "") -> str:
    value = os.getenv(name)
    if value is None or not str(value).strip():
        return default
    return str(value).strip()


class BillingSettings:
    def __init__(self) -> None:
        self.RAZORPAY_KEY_ID: str = _env("RAZORPAY_KEY_ID")
        self.RAZORPAY_KEY_SECRET: str = _env("RAZORPAY_KEY_SECRET")
        self.RAZORPAY_WEBHOOK_SECRET: str = _env("RAZORPAY_WEBHOOK_SECRET")

        # Amount (in paise) charged - then immediately refunded - to verify
        # and tokenize a new card when there's no real purchase happening
        # yet (the "+ Add New Payment Method" button). 100 paise = INR 1,
        # which is Razorpay's minimum order amount for cards.
        self.RAZORPAY_CARD_VERIFICATION_AMOUNT: int = int(
            _env("RAZORPAY_CARD_VERIFICATION_AMOUNT", "100")
        )

        # Saving a card needs Razorpay to mint a reusable token, and
        # tokenisation is gated behind completed KYC. On a test account
        # that cannot be KYC'd, the verification payment is captured but
        # comes back with token_id=null, so "+ Add New Payment Method"
        # can never finish. This flag lets the attach step fall back to
        # the non-sensitive card metadata Razorpay *does* return
        # (card_id/last4/network), stored as a NON-CHARGEABLE row.
        #
        # Opt-in only, and see test_card_fallback_enabled() below - the
        # flag alone is deliberately not enough to turn it on.
        self.ALLOW_TEST_CARD_FALLBACK: bool = _env(
            "BILLING_ALLOW_TEST_CARD_FALLBACK", "false"
        ).lower() in ("1", "true", "yes", "on")

        # Grace period (BR-SB-011): days after a payment is overdue before we
        # suspend access. Product/business decision - adjust freely.
        self.DEFAULT_GRACE_PERIOD_DAYS: int = int(_env("BILLING_GRACE_PERIOD_DAYS", "7"))

        # Storage/usage alert thresholds (BR-SB-005 / AC-SB-040).
        self.USAGE_WARNING_THRESHOLD_PCT: float = float(_env("BILLING_USAGE_WARNING_PCT", "80"))
        self.USAGE_CRITICAL_THRESHOLD_PCT: float = float(_env("BILLING_USAGE_CRITICAL_PCT", "95"))

        # Razorpay India settles in INR. List prices are round rupees
        # (₹3,000 / ₹8,000 / ₹20,000) in seed_plans.py.
        self.DEFAULT_CURRENCY: str = _env("BILLING_DEFAULT_CURRENCY", "inr").lower()

        self.SUBSCRIPTION_EXPIRY_ALERT_DAYS: int = int(_env("BILLING_EXPIRY_ALERT_DAYS", "5"))

        # Seller printed on every GST tax invoice. Override in production
        # with the live STACKLY / EDABIP legal entity — never the buyer's.
        self.SELLER_LEGAL_NAME: str = _env("BILLING_SELLER_LEGAL_NAME", "STACKLY Pvt Ltd")
        self.SELLER_ADDRESS_LINE1: str = _env(
            "BILLING_SELLER_ADDRESS_LINE1", "#42, 3rd Floor, Indiranagar"
        )
        self.SELLER_ADDRESS_LINE2: str = _env("BILLING_SELLER_ADDRESS_LINE2", "")
        self.SELLER_CITY: str = _env("BILLING_SELLER_CITY", "Bengaluru")
        self.SELLER_STATE: str = _env("BILLING_SELLER_STATE", "Karnataka")
        self.SELLER_STATE_CODE: str = _env("BILLING_SELLER_STATE_CODE", "29")
        self.SELLER_PINCODE: str = _env("BILLING_SELLER_PINCODE", "560038")
        self.SELLER_COUNTRY: str = _env("BILLING_SELLER_COUNTRY", "India")
        self.SELLER_GSTIN: str = _env("BILLING_SELLER_GSTIN", "29AABCE1234F1Z5")
        self.SELLER_EMAIL: str = _env("BILLING_SELLER_EMAIL", "accounts@edabip.com")

        # Origins allowed to call this API from the browser. The React
        # frontend runs on Vite (localhost:5173 by default) which is a
        # different origin than this API, so without this the browser
        # blocks every request with a CORS error before it even reaches
        # FastAPI. Comma-separated list, e.g.
        # "http://localhost:5173,https://app.edabip.com"
        self.CORS_ORIGINS: list[str] = [
            origin.strip()
            for origin in _env(
                "BILLING_CORS_ORIGINS",
                "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
            ).split(",")
            if origin.strip()
        ]

    def keys_are_configured(self) -> bool:
        """True when KEY_ID / KEY_SECRET look like real Razorpay credentials.

        `.env.example` ships `rzp_test_xxxxxxxxxxxxxx` / `xxxx...`, which the
        SDK will send to Razorpay and get back "Authentication failed".
        Treat those as unset so the API can fail with setup copy instead
        of a 500.
        """
        key_id = (self.RAZORPAY_KEY_ID or "").strip()
        secret = (self.RAZORPAY_KEY_SECRET or "").strip()
        if not (
            key_id.startswith("rzp_test_") or key_id.startswith("rzp_live_")
        ):
            return False
        suffix = key_id.split("_", 2)[-1]
        if not suffix or set(suffix.lower()) <= {"x"}:
            return False
        if not secret or set(secret.lower()) <= {"x"}:
            return False
        return True

    def test_card_fallback_enabled(self) -> bool:
        """May the attach step save a non-chargeable card row?

        Live keys (`rzp_live_`) never allow this: a production charge needs
        a real Razorpay token. Test keys always do, because Razorpay will
        not mint a reusable token until the account completes KYC — which
        a `rzp_test_` account cannot do. The payment is still
        signature-verified; we only skip the token requirement.

        BILLING_ALLOW_TEST_CARD_FALLBACK is kept for compatibility but is
        not the gate. A stray true in a production .env cannot arm this,
        because live keys never start with rzp_test_.
        """
        return self.RAZORPAY_KEY_ID.startswith("rzp_test_")


settings = BillingSettings()
