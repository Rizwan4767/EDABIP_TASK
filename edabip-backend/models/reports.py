"""Report templates, schedules, generated report history and the report audit trail."""
import enum
from datetime import datetime

from sqlalchemy import (
    Boolean, DateTime, Enum as SAEnum, Float, ForeignKey, Index, Integer, String, Text, event,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from database import Base


# NOTE on enum ordering: MySQL stores SQLAlchemy Enums as native ENUM columns, and
# members are appended to the end so an existing ENUM definition is always a
# prefix of the new one (see services/reports_migration.py, which widens them).
class ReportFrequency(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ONE_TIME = "one_time"
    CUSTOM = "custom"      # every `interval_days` days


class ScheduledReportStatus(str, enum.Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"   # a one-time schedule that has run


class ReportGenerationStatus(str, enum.Enum):
    PROCESSING = "processing"   # legacy "in progress" value, still valid
    COMPLETED = "completed"
    FAILED = "failed"
    PENDING = "pending"         # reserved: accepted, not yet queued
    QUEUED = "queued"           # row committed, waiting for a worker
    RUNNING = "running"         # worker has started
    CANCELLED = "cancelled"


# Anything that is neither finished nor failed. The UI shows all of these as
# the single "Processing" indicator (see status_label in the API).
IN_PROGRESS_STATUSES = frozenset({
    ReportGenerationStatus.PROCESSING, ReportGenerationStatus.PENDING,
    ReportGenerationStatus.QUEUED, ReportGenerationStatus.RUNNING,
})
TERMINAL_STATUSES = frozenset({
    ReportGenerationStatus.COMPLETED, ReportGenerationStatus.FAILED,
    ReportGenerationStatus.CANCELLED,
})


class ReportTriggerType(str, enum.Enum):
    """What started a run - drives the dashboard's "Report Type Distribution"."""

    ON_DEMAND = "on_demand"   # a user clicked Generate with the template defaults
    SCHEDULED = "scheduled"   # started by a schedule (services/report_scheduler.py)
    SYSTEM = "system"         # started by the platform itself
    AD_HOC = "ad_hoc"         # a user run with custom filters / date range


class ReportFileFormat(str, enum.Enum):
    PDF = "pdf"
    EXCEL = "excel"
    CSV = "csv"


# Only approved templates can be listed, previewed, generated, scheduled or retried.
TEMPLATE_APPROVED = "approved"
TEMPLATE_PENDING = "pending"
TEMPLATE_REJECTED = "rejected"


class ReportTemplate(Base):
    __tablename__ = "report_templates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    category: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, server_default="1", nullable=False)
    # approved | pending | rejected. Plain VARCHAR so a new state needs no ALTER.
    approval_status: Mapped[str] = mapped_column(
        String(20), default=TEMPLATE_APPROVED, server_default=TEMPLATE_APPROVED, nullable=False
    )
    default_format: Mapped[ReportFileFormat] = mapped_column(
        SAEnum(ReportFileFormat), default=ReportFileFormat.CSV, server_default="CSV", nullable=False
    )
    # JSON object of parameters pre-filled for this template (AC-RM-021).
    default_parameters_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    # JSON list of role names allowed to see/generate it; NULL = every role that
    # holds reports.view (BR-RM-001). Admins always have access.
    allowed_roles_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
    schedules: Mapped[list["ScheduledReport"]] = relationship(back_populates="template")


class ScheduledReport(Base):
    __tablename__ = "scheduled_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    template_id: Mapped[int] = mapped_column(ForeignKey("report_templates.id"), nullable=False, index=True)
    name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    frequency: Mapped[ReportFrequency] = mapped_column(SAEnum(ReportFrequency), nullable=False)
    interval_days: Mapped[int | None] = mapped_column(Integer, nullable=True)   # CUSTOM only
    file_format: Mapped[ReportFileFormat] = mapped_column(
        SAEnum(ReportFileFormat), default=ReportFileFormat.CSV, nullable=False
    )
    # Stored as naive UTC. `timezone` is the zone the schedule's wall-clock time
    # (and calendar arithmetic for monthly/quarterly runs) is evaluated in.
    next_run_time: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    timezone: Mapped[str] = mapped_column(String(64), default="UTC", server_default="UTC", nullable=False)
    recipients_json: Mapped[str | None] = mapped_column(Text, nullable=True)    # JSON list of emails
    parameters_json: Mapped[str | None] = mapped_column(Text, nullable=True)    # JSON object
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    status: Mapped[ScheduledReportStatus] = mapped_column(
        SAEnum(ScheduledReportStatus), default=ScheduledReportStatus.ACTIVE, nullable=False
    )
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_run_status: Mapped[ReportGenerationStatus | None] = mapped_column(
        SAEnum(ReportGenerationStatus), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
    template: Mapped[ReportTemplate] = relationship(back_populates="schedules")
    owner = relationship("User")


class ReportHistory(Base):
    __tablename__ = "report_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    template_id: Mapped[int | None] = mapped_column(ForeignKey("report_templates.id"), nullable=True, index=True)
    report_name: Mapped[str] = mapped_column(String(150), nullable=False)
    generated_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    status: Mapped[ReportGenerationStatus] = mapped_column(
        SAEnum(ReportGenerationStatus), default=ReportGenerationStatus.QUEUED, nullable=False, index=True
    )
    # Plain VARCHAR (not a native ENUM) so a future trigger type needs no ALTER.
    trigger_type: Mapped[ReportTriggerType] = mapped_column(
        SAEnum(ReportTriggerType, native_enum=False, length=20),
        default=ReportTriggerType.ON_DEMAND, server_default="ON_DEMAND", nullable=False,
    )
    schedule_id: Mapped[int | None] = mapped_column(
        ForeignKey("scheduled_reports.id", ondelete="SET NULL"), nullable=True, index=True
    )
    file_format: Mapped[ReportFileFormat] = mapped_column(SAEnum(ReportFileFormat), nullable=False)
    file_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    parameters_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    progress_percent: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    # failure_reason is safe to show users; error_detail is server-side only and is
    # never serialised by the API (BR-RM-011).
    failure_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    error_detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    retry_of_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0", nullable=False)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False, index=True)
    template = relationship("ReportTemplate")
    generator = relationship("User")


class ReportAuditLog(Base):
    """Append-only trail of every report action (BR-RM-007).

    Written with services.report_audit.log_report_action inside the same
    transaction as the change it records. There is deliberately no update or
    delete path: the ORM refuses both below, and services/reports_migration.py
    installs MySQL triggers that refuse them at the database level too.
    """

    __tablename__ = "report_audit_logs"
    __table_args__ = (
        Index("ix_report_audit_entity", "entity_type", "entity_id"),
        Index("ix_report_audit_actor_created", "actor_user_id", "created_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    actor_user_id: Mapped[int | None] = mapped_column(Integer, nullable=True)   # NULL = system / scheduler
    action: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(40), nullable=False)
    entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)            # JSON
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False, index=True)


@event.listens_for(ReportAuditLog, "before_update")
def _audit_rows_are_immutable_on_update(mapper, connection, target):  # noqa: ARG001
    raise RuntimeError("Report audit logs are immutable and cannot be updated.")


@event.listens_for(ReportAuditLog, "before_delete")
def _audit_rows_are_immutable_on_delete(mapper, connection, target):  # noqa: ARG001
    raise RuntimeError("Report audit logs are immutable and cannot be deleted.")


class SuperstoreImport(Base):
    """One audited import of a Superstore-compatible Orders worksheet."""

    __tablename__ = "superstore_imports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    source_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_sha256: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), default="processing", nullable=False)
    total_rows: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    accepted_rows: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    rejected_rows: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    imported_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)


class SuperstoreImportError(Base):
    """A row rejected during an import, retained for diagnosis."""

    __tablename__ = "superstore_import_errors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    import_id: Mapped[int] = mapped_column(ForeignKey("superstore_imports.id"), nullable=False, index=True)
    source_row: Mapped[int] = mapped_column(Integer, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)


class SuperstoreOrder(Base):
    """A validated line item from the source workbook's Orders sheet."""

    __tablename__ = "superstore_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    import_id: Mapped[int] = mapped_column(ForeignKey("superstore_imports.id"), nullable=False, index=True)
    source_row: Mapped[int] = mapped_column(Integer, nullable=False)
    row_id: Mapped[str] = mapped_column(String(40), nullable=False)
    order_id: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    order_date: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    ship_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    ship_mode: Mapped[str] = mapped_column(String(40), nullable=False)
    customer_id: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    customer_name: Mapped[str] = mapped_column(String(150), nullable=False)
    segment: Mapped[str] = mapped_column(String(60), nullable=False)
    country_region: Mapped[str] = mapped_column(String(80), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state_province: Mapped[str] = mapped_column(String(100), nullable=False)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    region: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    product_id: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    sub_category: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    sales: Mapped[float] = mapped_column(Float, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    discount: Mapped[float] = mapped_column(Float, nullable=False)
    profit: Mapped[float] = mapped_column(Float, nullable=False)
