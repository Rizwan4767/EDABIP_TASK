"""
Demo billing rows for org_id = 1 so the frontend can build against a
populated Subscription & Billing screen.

Also:
  - upserts the three catalog plans
  - creates a view-only login (role=client_user, email_verified=true)

Idempotent: re-running replaces org 1 billing rows.

Run from edabip-backend/:
    python -m billing.seed_demo
"""
from __future__ import annotations

from calendar import monthrange
from datetime import datetime, timezone

from sqlalchemy.orm import joinedload

from database import Base, SessionLocal, engine
from billing.models import (
    BillingAlert,
    BillingAuditLog,
    BillingCustomer,
    BillingProfile,
    Invoice,
    InvoiceStatus,
    Payment,
    PaymentMethod,
    PaymentStatus,
    Plan,
    Subscription,
    SubscriptionAction,
    SubscriptionHistory,
    SubscriptionStatus,
    UsageRecord,
)
from billing.gst import gstin_checksum
from billing.invoice_document import persist_gst_snapshot
from billing.seed_plans import seed as seed_plans

ORG_ID = 1
VIEW_ONLY_EMAIL = "user@edabip.com"
VIEW_ONLY_PASSWORD = "User@123"


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _month_start(year: int, month: int) -> datetime:
    return datetime(year, month, 1)


def _add_months(year: int, month: int, delta: int) -> tuple[int, int]:
    index = year * 12 + (month - 1) + delta
    return index // 12, index % 12 + 1


def _month_end(year: int, month: int) -> datetime:
    last_day = monthrange(year, month)[1]
    return datetime(year, month, last_day, 23, 59, 59)


def _clear_org_billing(db, org_id: int) -> None:
    sub_ids = [sid for (sid,) in db.query(Subscription.id).filter(Subscription.org_id == org_id).all()]
    pay_ids = [pid for (pid,) in db.query(Payment.id).filter(Payment.org_id == org_id).all()]
    if pay_ids:
        db.query(SubscriptionHistory).filter(SubscriptionHistory.payment_id.in_(pay_ids)).delete(
            synchronize_session=False
        )
    if sub_ids:
        db.query(SubscriptionHistory).filter(SubscriptionHistory.subscription_id.in_(sub_ids)).delete(
            synchronize_session=False
        )
    db.query(BillingAlert).filter(BillingAlert.org_id == org_id).delete(synchronize_session=False)
    db.query(BillingAuditLog).filter(BillingAuditLog.org_id == org_id).delete(synchronize_session=False)
    db.query(UsageRecord).filter(UsageRecord.org_id == org_id).delete(synchronize_session=False)
    db.query(Payment).filter(Payment.org_id == org_id).delete(synchronize_session=False)
    db.query(Invoice).filter(Invoice.org_id == org_id).delete(synchronize_session=False)
    db.query(PaymentMethod).filter(PaymentMethod.org_id == org_id).delete(synchronize_session=False)
    db.query(Subscription).filter(Subscription.org_id == org_id).delete(synchronize_session=False)
    db.query(BillingCustomer).filter(BillingCustomer.org_id == org_id).delete(synchronize_session=False)
    db.query(BillingProfile).filter(BillingProfile.org_id == org_id).delete(synchronize_session=False)
    db.flush()


def _ensure_view_only_user(db) -> None:
    from models.user import Role, User
    from utils.auth import hash_password

    role = (
        db.query(Role).filter(Role.name == "client_user").first()
        or db.query(Role).filter(Role.name == "user").first()
    )
    if role is None:
        role = Role(name="client_user", description="Client access to dashboards, reports and permitted data")
        db.add(role)
        db.flush()

    user = db.query(User).filter(User.email == VIEW_ONLY_EMAIL).first()
    fields = dict(
        role_id=role.id,
        full_name="Billing Viewer",
        password_hash=hash_password(VIEW_ONLY_PASSWORD),
        is_active=True,
        is_verified=True,
        email_verified=True,
    )
    if user is None:
        db.add(User(email=VIEW_ONLY_EMAIL, **fields))
    else:
        for key, value in fields.items():
            setattr(user, key, value)


def seed(db=None) -> dict:
    owns_session = db is None
    db = db or SessionLocal()
    try:
        plans = seed_plans(db)
        plan = next(p for p in plans if p.code == "enterprise")
        _clear_org_billing(db, ORG_ID)
        _ensure_view_only_user(db)

        now = _now()
        period_start = _month_start(now.year, now.month)
        end_y, end_m = _add_months(now.year, now.month, 1)
        period_end = _month_start(end_y, end_m)

        db.add(BillingCustomer(org_id=ORG_ID, razorpay_customer_id="cust_demo_org1"))
        db.add(
            BillingProfile(
                org_id=ORG_ID,
                legal_name="ABC Technologies Pvt Ltd",
                address_line1="123, Business Park, Koramangala",
                city="Bengaluru",
                state="Karnataka",
                state_code="29",
                pincode="560034",
                country="India",
                gstin="29AABCA1234C1Z" + gstin_checksum("29AABCA1234C1Z"),
                email="finance@abctech.com",
            )
        )

        primary = PaymentMethod(
            org_id=ORG_ID,
            razorpay_token_id="token_demo_visa_4242",
            # A placeholder, not a token Razorpay ever minted - nothing
            # here can be charged or detached.
            is_chargeable=False,
            brand="visa",
            last4="4242",
            exp_month=12,
            exp_year=now.year + 1,
            is_primary=True,
        )
        backup = PaymentMethod(
            org_id=ORG_ID,
            razorpay_token_id="token_demo_mastercard_4346",
            # A placeholder, not a token Razorpay ever minted - nothing
            # here can be charged or detached.
            is_chargeable=False,
            brand="mastercard",
            last4="4346",
            exp_month=12,
            exp_year=now.year + 1,
            is_primary=False,
        )
        db.add_all([primary, backup])
        db.flush()

        sub = Subscription(
            org_id=ORG_ID,
            plan_id=plan.id,
            status=SubscriptionStatus.ACTIVE,
            razorpay_customer_id="cust_demo_org1",
            current_period_start=period_start,
            current_period_end=period_end,
            grace_period_days=7,
        )
        db.add(sub)
        db.flush()

        invoices = []
        payments = []
        # Six calendar months including the current month, so /history
        # (last 6 months) has a bar for every bucket.
        for months_ago in range(5, -1, -1):
            y, m = _add_months(now.year, now.month, -months_ago)
            inv_start = _month_start(y, m)
            inv_end = _month_end(y, m)
            paid_at = inv_end if months_ago else min(now, inv_end)

            invoice = Invoice(
                invoice_number=f"TMP-{y}{m:02d}",
                org_id=ORG_ID,
                subscription_id=sub.id,
                period_start=inv_start,
                period_end=inv_end,
                issue_date=inv_end,
                due_date=inv_end,
                amount_cents=plan.price_cents,
                currency=plan.currency,
                status=InvoiceStatus.PAID,
            )
            db.add(invoice)
            db.flush()
            invoice.invoice_number = f"INV-{y}-{invoice.id:05d}"

            payment = Payment(
                transaction_id=f"TXN-DEMO-{y}{m:02d}",
                reference_number=f"REF-DEMO-{y}{m:02d}",
                org_id=ORG_ID,
                invoice_id=invoice.id,
                payment_method_id=primary.id,
                razorpay_payment_id=f"pay_demo_{y}{m:02d}",
                amount_cents=plan.price_cents,
                currency=plan.currency,
                status=PaymentStatus.SUCCESSFUL,
                paid_at=paid_at,
            )
            db.add(payment)
            db.flush()
            persist_gst_snapshot(db, invoice, plan=plan, payment=payment, force=True)
            invoices.append(invoice)
            payments.append(payment)

        # Current period invoice is still unpaid so Overview "Amount Due" has a value.
        due = Invoice(
            invoice_number=f"TMP-due-{now.year}{now.month:02d}",
            org_id=ORG_ID,
            subscription_id=sub.id,
            period_start=period_start,
            period_end=period_end,
            issue_date=period_start,
            due_date=period_end,
            amount_cents=plan.price_cents,
            currency=plan.currency,
            status=InvoiceStatus.PENDING,
        )
        db.add(due)
        db.flush()
        due.invoice_number = f"INV-{now.year}-{due.id:05d}"
        persist_gst_snapshot(db, due, plan=plan, force=True)
        invoices.append(due)

        db.add(
            SubscriptionHistory(
                subscription_id=sub.id,
                action=SubscriptionAction.CREATE,
                previous_plan_id=None,
                new_plan_id=plan.id,
                payment_id=payments[0].id,
                effective_date=invoices[0].period_start,
            )
        )

        # Matches the Billing screenshot Usage Overview (Enterprise limits).
        db.add(
            UsageRecord(
                org_id=ORG_ID,
                period_start=period_start,
                period_end=period_end,
                active_users=86,
                storage_used_gb=1228.8,
                reports_generated=1245,
                active_dashboards=48,
                data_processed_gb=2560.0,
            )
        )

        db.commit()
        return {
            "plans": [p.code for p in plans],
            "subscription_id": sub.id,
            "invoices": len(invoices),
            "payments": len(payments),
            "subscription_status": "active",
            "period_start": period_start,
            "period_end": period_end,
        }
    except Exception:
        db.rollback()
        raise
    finally:
        if owns_session:
            db.close()


def ensure_overview_and_usage(db=None) -> None:
    """Make sure org 1 has an active subscription, usage meters, and an unpaid invoice.

    Safe to run on every backend start in development. Does not wipe existing rows.
    """
    owns_session = db is None
    db = db or SessionLocal()
    try:
        seed_plans(db)
        sub = (
            db.query(Subscription)
            .options(joinedload(Subscription.plan))
            .filter(Subscription.org_id == ORG_ID, Subscription.status != SubscriptionStatus.CANCELED)
            .first()
        )
        if sub is None:
            seed(db)
            return

        if db.query(BillingProfile).filter(BillingProfile.org_id == ORG_ID).first() is None:
            db.add(
                BillingProfile(
                    org_id=ORG_ID,
                    legal_name="ABC Technologies Pvt Ltd",
                    address_line1="123, Business Park, Koramangala",
                    city="Bengaluru",
                    state="Karnataka",
                    state_code="29",
                    pincode="560034",
                    country="India",
                    gstin="29AABCA1234C1Z" + gstin_checksum("29AABCA1234C1Z"),
                    email="finance@abctech.com",
                )
            )

        if db.query(UsageRecord).filter(UsageRecord.org_id == ORG_ID).first() is None:
            db.add(
                UsageRecord(
                    org_id=ORG_ID,
                    period_start=sub.current_period_start,
                    period_end=sub.current_period_end,
                    active_users=86,
                    storage_used_gb=1228.8,
                    reports_generated=1245,
                    active_dashboards=48,
                    data_processed_gb=2560.0,
                )
            )

        pending = (
            db.query(Invoice)
            .filter(
                Invoice.org_id == ORG_ID,
                Invoice.status.in_([InvoiceStatus.PENDING, InvoiceStatus.OVERDUE]),
            )
            .first()
        )
        if pending is None:
            plan = sub.plan
            now = _now()
            due = Invoice(
                invoice_number=f"TMP-due-{now.year}{now.month:02d}",
                org_id=ORG_ID,
                subscription_id=sub.id,
                period_start=sub.current_period_start,
                period_end=sub.current_period_end,
                issue_date=sub.current_period_start,
                due_date=sub.current_period_end,
                amount_cents=plan.price_cents,
                currency=plan.currency,
                status=InvoiceStatus.PENDING,
            )
            db.add(due)
            db.flush()
            due.invoice_number = f"INV-{now.year}-{due.id:05d}"
            persist_gst_snapshot(db, due, plan=plan, force=True)
        elif sub.plan is not None:
            pending.amount_cents = sub.plan.price_cents
            pending.currency = sub.plan.currency
            persist_gst_snapshot(db, pending, plan=sub.plan, force=True)

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        if owns_session:
            db.close()


if __name__ == "__main__":
    from billing.config import settings as billing_settings

    Base.metadata.create_all(bind=engine)
    result = seed()
    key_id = billing_settings.RAZORPAY_KEY_ID
    print(f"Plans: {', '.join(result['plans'])}")
    print(
        f"Org {ORG_ID}: active Enterprise subscription {result['period_start']:%Y-%m-%d} → "
        f"{result['period_end']:%Y-%m-%d}"
    )
    print("Overview: GET /api/billing/overview")
    print("Usage:    GET /api/billing/usage")
    print(f"Invoices: {result['invoices']}  Payments: {result['payments']}  Cards: 2 (Visa 4242 primary)")
    print(f"View-only user: {VIEW_ONLY_EMAIL} / {VIEW_ONLY_PASSWORD}  (email_verified=true)")
    if key_id:
        print(f"Razorpay key id loaded: {key_id[:12]}…")
    else:
        print(
            "Razorpay keys are empty. Copy edabip-backend/.env.example to .env "
            "and paste test Key ID + Secret from https://dashboard.razorpay.com/app/keys"
        )
