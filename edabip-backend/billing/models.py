"""
ORM models for Subscription & Billing.

Table names are all prefixed `billing_` so they can be merged into an
existing schema/migration history without name collisions.

Money is always stored as an integer in minor units (cents/paise) -
`amount_cents` - never as float. This is deliberate: floats cannot
represent currency exactly (0.1 + 0.2 != 0.3), and this module deals
with real charges. Convert to a display float only in the API response
layer (schemas.py), never in the database.
"""
import enum
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


# --------------------------------------------------------------------------
# Enums - kept as plain str Enums so they serialize cleanly through Pydantic
# and so the exact values match what's written in the wireframe spec.
# --------------------------------------------------------------------------

class BillingCycle(str, enum.Enum):
    MONTHLY = "monthly"
    YEARLY = "yearly"


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    PAST_DUE = "past_due"          # payment failed, still inside grace period
    SUSPENDED = "suspended"        # BR-SB-011: grace period exceeded
    CANCELED = "canceled"
    TRIALING = "trialing"


class SubscriptionAction(str, enum.Enum):
    CREATE = "create"
    UPGRADE = "upgrade"
    DOWNGRADE = "downgrade"
    RENEW = "renew"
    CANCEL = "cancel"


# Invoice Table spec (page 9): "Status Paid / Pending / Overdue"
class InvoiceStatus(str, enum.Enum):
    PAID = "paid"
    PENDING = "pending"
    OVERDUE = "overdue"
    VOID = "void"


# Payment History spec (page 11): 4 categories
class PaymentStatus(str, enum.Enum):
    SUCCESSFUL = "successful"
    FAILED = "failed"
    PENDING = "pending"
    REFUNDED = "refunded"


# Billing Alerts spec (page 14): 5 alert types
class AlertType(str, enum.Enum):
    SUBSCRIPTION_EXPIRY = "subscription_expiry"
    PAYMENT_DUE = "payment_due"
    PAYMENT_FAILURE = "payment_failure"
    STORAGE_LIMIT_REACHED = "storage_limit_reached"
    LICENSE_EXPIRY = "license_expiry"


class AlertPriority(str, enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class AlertStatus(str, enum.Enum):
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    DISMISSED = "dismissed"
    READ = "read"


def gen_uuid() -> str:
    return uuid.uuid4().hex


# --------------------------------------------------------------------------
# Plan - the 3 cards in "Choose the Right Plan for Your Business"
# --------------------------------------------------------------------------

class Plan(Base):
    __tablename__ = "billing_plans"

    id: Mapped[int] = mapped_column(primary_key=True)
    # "starter" | "professional" | "enterprise" - matches the frontend's
    # card labels. (The wireframe spec text calls these Basic/Standard/
    # Enterprise; see README "Plan naming" for why the frontend names win.)
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(64))
    description: Mapped[str] = mapped_column(Text, default="")

    price_cents: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(3), default="inr")
    billing_cycle: Mapped[str] = mapped_column(SAEnum(BillingCycle), default=BillingCycle.MONTHLY)

    max_users: Mapped[int] = mapped_column(Integer)
    max_storage_gb: Mapped[int] = mapped_column(Integer)
    max_reports_per_month: Mapped[int] = mapped_column(Integer)
    max_dashboards: Mapped[int] = mapped_column(Integer)
    max_data_processing_gb: Mapped[int] = mapped_column(Integer)
    support_level: Mapped[str] = mapped_column(String(64), default="24/7 Support")

    razorpay_plan_id: Mapped[str | None] = mapped_column(String(64), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # Highlights this plan as the recommended/"most popular" card on the
    # pricing section (the frontend's "Professional" card is styled
    # differently from Starter/Enterprise). Previously there was no way
    # for the API to say which plan that should be, so the frontend had
    # it hardcoded - this makes it a real, editable piece of plan data.
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


# --------------------------------------------------------------------------
# BillingCustomer - the Razorpay customer for an org. Deliberately
# separate from Subscription: a customer (and their saved payment
# methods) can and should exist BEFORE the org has chosen a plan -
# that's the natural "add a card, then pick a plan" flow. Subscription
# still carries its own razorpay_customer_id copy for convenience/
# history once created.
# --------------------------------------------------------------------------

class BillingCustomer(Base):
    __tablename__ = "billing_customers"

    id: Mapped[int] = mapped_column(primary_key=True)
    org_id: Mapped[int] = mapped_column(Integer, unique=True, index=True)
    razorpay_customer_id: Mapped[str] = mapped_column(String(64), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


# --------------------------------------------------------------------------
# Subscription - one org has exactly one non-canceled subscription
# (BR-SB-001: only one active plan at a time).
# --------------------------------------------------------------------------

class Subscription(Base):
    __tablename__ = "billing_subscriptions"
    __table_args__ = (
        Index("ix_billing_subscriptions_org_status", "org_id", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    org_id: Mapped[int] = mapped_column(Integer, index=True)
    plan_id: Mapped[int] = mapped_column(ForeignKey("billing_plans.id"))

    status: Mapped[str] = mapped_column(SAEnum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE)

    razorpay_customer_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    razorpay_subscription_id: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True)

    current_period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    current_period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    grace_period_days: Mapped[int] = mapped_column(Integer, default=7)
    past_due_since: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    cancel_at_period_end: Mapped[bool] = mapped_column(Boolean, default=False)
    canceled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    plan: Mapped["Plan"] = relationship("Plan")


class SubscriptionHistory(Base):
    """BR-SB-057 / AC-SB-057: previous plan, new plan, payment, effective date."""
    __tablename__ = "billing_subscription_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    subscription_id: Mapped[int] = mapped_column(ForeignKey("billing_subscriptions.id"), index=True)
    action: Mapped[str] = mapped_column(SAEnum(SubscriptionAction))
    previous_plan_id: Mapped[int | None] = mapped_column(ForeignKey("billing_plans.id"), nullable=True)
    new_plan_id: Mapped[int] = mapped_column(ForeignKey("billing_plans.id"))
    payment_id: Mapped[int | None] = mapped_column(ForeignKey("billing_payments.id"), nullable=True)
    effective_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


# --------------------------------------------------------------------------
# Payment method - card metadata ONLY. The PAN never touches this backend;
# Razorpay Checkout collects it client-side and hands us back a
# payment/order/signature we verify, then a token id. See
# razorpay_service.py.
# --------------------------------------------------------------------------

class PaymentMethod(Base):
    __tablename__ = "billing_payment_methods"
    __table_args__ = (
        Index("ix_billing_payment_methods_org", "org_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    org_id: Mapped[int] = mapped_column(Integer, index=True)

    # The reusable token Razorpay minted for this card - the only thing
    # that can actually be charged later. NULL on a TEST-mode fallback
    # row, where Razorpay captured the verification payment but minted no
    # token (tokenisation is KYC-gated). NULL is allowed by the unique
    # constraint as many times as needed.
    razorpay_token_id: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)

    # Razorpay's id for the card instance on a single payment. Not a
    # token and NOT chargeable - it only identifies which card was used.
    # Recorded on fallback rows so a real Razorpay reference is kept
    # instead of a made-up one.
    razorpay_card_id: Mapped[str | None] = mapped_column(String(64), nullable=True)

    brand: Mapped[str] = mapped_column(String(32))       # visa | mastercard | amex ...
    last4: Mapped[str] = mapped_column(String(4))

    # NULL when Razorpay did not tell us. The payment entity carries no
    # expiry (only a token fetch does), so a fallback row genuinely has
    # none - and guessing one would put a wrong date in front of the user.
    exp_month: Mapped[int | None] = mapped_column(Integer, nullable=True)
    exp_year: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # False for TEST-mode fallback rows. Guards every path that would
    # hand razorpay_token_id to Razorpay - charging and detaching.
    is_chargeable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # card | netbanking | wallet | upi | other. Cards may be tokenised;
    # the rest are display-only after a successful verification payment.
    method: Mapped[str] = mapped_column(String(16), default="card", nullable=False)

    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


# --------------------------------------------------------------------------
# Invoice
# --------------------------------------------------------------------------

class Invoice(Base):
    __tablename__ = "billing_invoices"
    __table_args__ = (
        Index("ix_billing_invoices_org_status", "org_id", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    invoice_number: Mapped[str] = mapped_column(String(32), unique=True, index=True)  # INV-2026-000123
    org_id: Mapped[int] = mapped_column(Integer, index=True)
    subscription_id: Mapped[int] = mapped_column(ForeignKey("billing_subscriptions.id"))

    razorpay_invoice_id: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True)

    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    issue_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    amount_cents: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(3), default="inr")
    status: Mapped[str] = mapped_column(SAEnum(InvoiceStatus), default=InvoiceStatus.PENDING)

    # Legacy Razorpay hosted page. Download now serves a self-generated
    # GST PDF from gst_snapshot; this URL is kept for older rows only.
    hosted_invoice_pdf_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Frozen GST invoice payload (seller, buyer, tax split, line item).
    # Paid invoices never rewrite this; pending ones may refresh from the
    # org billing profile until they are settled.
    gst_snapshot: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class BillingProfile(Base):
    """Org billed-to details the client can edit (GST tax invoice buyer)."""
    __tablename__ = "billing_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    org_id: Mapped[int] = mapped_column(Integer, unique=True, index=True)

    legal_name: Mapped[str] = mapped_column(String(128))
    address_line1: Mapped[str] = mapped_column(String(128))
    address_line2: Mapped[str | None] = mapped_column(String(128), nullable=True)
    city: Mapped[str] = mapped_column(String(64))
    state: Mapped[str] = mapped_column(String(64))
    state_code: Mapped[str] = mapped_column(String(2))
    pincode: Mapped[str] = mapped_column(String(6))
    country: Mapped[str] = mapped_column(String(64), default="India")
    gstin: Mapped[str | None] = mapped_column(String(15), nullable=True)
    email: Mapped[str] = mapped_column(String(180))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


# --------------------------------------------------------------------------
# Payment (Payment History table, page 11)
# --------------------------------------------------------------------------

class Payment(Base):
    __tablename__ = "billing_payments"
    __table_args__ = (
        Index("ix_billing_payments_org_status", "org_id", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    transaction_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)  # system generated
    reference_number: Mapped[str] = mapped_column(String(64))

    org_id: Mapped[int] = mapped_column(Integer, index=True)
    invoice_id: Mapped[int | None] = mapped_column(ForeignKey("billing_invoices.id"), nullable=True)
    payment_method_id: Mapped[int | None] = mapped_column(
        ForeignKey("billing_payment_methods.id", ondelete="SET NULL"), nullable=True
    )

    razorpay_payment_id: Mapped[str | None] = mapped_column(String(64), nullable=True)

    amount_cents: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(3), default="inr")
    status: Mapped[str] = mapped_column(SAEnum(PaymentStatus))
    failure_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Self-referential FK: a REFUNDED payment row points back at the
    # original SUCCESSFUL payment it refunds (business rule: "Refunds
    # linked to original transactions", page 11).
    refunded_payment_id: Mapped[int | None] = mapped_column(ForeignKey("billing_payments.id"), nullable=True)

    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    # These two were missing in an earlier revision even though router.py's
    # payment-history endpoints read p.invoice / p.payment_method directly -
    # that was a real 500-error bug (AttributeError), caught by testing
    # payment-history against a payment that actually had an invoice
    # attached. See tests/test_billing.py::test_no_enum_class_repr_leaks_into_responses.
    invoice: Mapped[Optional["Invoice"]] = relationship("Invoice")
    payment_method: Mapped[Optional["PaymentMethod"]] = relationship("PaymentMethod")


# --------------------------------------------------------------------------
# Usage (Usage Overview widgets)
# --------------------------------------------------------------------------

class UsageRecord(Base):
    """One row per org per billing period. Updated incrementally as usage
    happens, or recalculated wholesale - see router.py `recompute_usage`."""
    __tablename__ = "billing_usage_records"
    __table_args__ = (
        UniqueConstraint("org_id", "period_start", name="uq_billing_usage_org_period"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    org_id: Mapped[int] = mapped_column(Integer, index=True)
    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    active_users: Mapped[int] = mapped_column(Integer, default=0)
    storage_used_gb: Mapped[float] = mapped_column(Float, default=0)
    reports_generated: Mapped[int] = mapped_column(Integer, default=0)
    active_dashboards: Mapped[int] = mapped_column(Integer, default=0)
    data_processed_gb: Mapped[float] = mapped_column(Float, default=0)

    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


# --------------------------------------------------------------------------
# Billing alerts
# --------------------------------------------------------------------------

class BillingAlert(Base):
    __tablename__ = "billing_alerts"
    __table_args__ = (
        Index("ix_billing_alerts_org_status", "org_id", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    org_id: Mapped[int] = mapped_column(Integer, index=True)

    alert_type: Mapped[str] = mapped_column(SAEnum(AlertType))
    priority: Mapped[str] = mapped_column(SAEnum(AlertPriority))
    status: Mapped[str] = mapped_column(SAEnum(AlertStatus), default=AlertStatus.ACTIVE)

    title: Mapped[str] = mapped_column(String(128))
    message: Mapped[str] = mapped_column(String(512))

    related_entity_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    related_entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


# --------------------------------------------------------------------------
# Audit log (BR-SB-007: immutable audit trail for every billing action)
# --------------------------------------------------------------------------

class BillingAuditLog(Base):
    __tablename__ = "billing_audit_logs"
    __table_args__ = (
        Index("ix_billing_audit_org_created", "org_id", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    org_id: Mapped[int] = mapped_column(Integer, index=True)
    actor_user_id: Mapped[int] = mapped_column(Integer)
    action: Mapped[str] = mapped_column(String(64))          # e.g. "subscription.upgrade"
    entity_type: Mapped[str] = mapped_column(String(32))     # e.g. "subscription"
    entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    details_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    # No update_at on purpose - audit rows are append-only. Don't add an
    # UPDATE/DELETE endpoint for this table.


# --------------------------------------------------------------------------
# Idempotency - one row per money-moving request the client may retry
# --------------------------------------------------------------------------

class IdempotencyRecord(Base):
    """Makes a retried charge request return the FIRST result instead of
    charging again.

    Plan changes charge the saved card the moment the request arrives. If
    the response is lost on the way back - a dropped connection, a phone
    losing signal, a proxy timing out - the client has no way to tell "the
    charge never happened" from "the charge happened and the receipt went
    missing". Retrying is the natural thing to do, and without this table
    the retry mints a second Razorpay order and charges the card a second
    time.

    The client sends the same key for every retry of one user action. The
    row is claimed BEFORE the charge, so a concurrent duplicate loses the
    unique constraint rather than racing into a second charge; the
    response is filled in after, so a later retry can replay it verbatim.
    """
    __tablename__ = "billing_idempotency_keys"
    __table_args__ = (
        # Scoped to the org, so one tenant's key can never collide with
        # or replay another's.
        UniqueConstraint("org_id", "idempotency_key", name="uq_billing_idem_org_key"),
        Index("ix_billing_idem_created", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    org_id: Mapped[int] = mapped_column(Integer, index=True)

    # Client-generated, opaque to us. Only ever compared, never parsed.
    idempotency_key: Mapped[str] = mapped_column(String(64))

    # Which operation claimed the key, so the same key arriving at a
    # different endpoint is treated as a new request rather than
    # replaying an unrelated response.
    endpoint: Mapped[str] = mapped_column(String(64))

    # NULL while the charge is still in flight. Set once, then replayed.
    response_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
