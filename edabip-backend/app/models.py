import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# Join table for the Role <-> Permission many-to-many relationship (powers
# the Permission Matrix tab on the Users & Access Management screen).
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)


class ReportFrequency(str, enum.Enum):
    # Values match the frontend's REPORT_UPDATE_OPTIONS slugs exactly
    # (src/modules/settings/api/settingsApi.js) since NotificationPreferenceResponse
    # serializes `.value` directly to JSON.
    realtime = "realtime"
    hourly = "hourly"
    daily = "daily"
    weekly = "weekly"


class IntegrationStatus(str, enum.Enum):
    active = "Active"
    inactive = "Inactive"


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    # Admin, Business Analyst, Editor, Viewer, Executive, Data Engineer, Client User (see seed.py).
    # The last five match MATRIX_ROLE_ORDER in the frontend's permissionMatrix.js.
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255), nullable=False)

    users = relationship("User", back_populates="role")
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")


class Permission(Base):
    """A single granular capability.

    Two families of codes live in this same table:
      - coarse admin codes such as 'users:read', 'roles:write' — the strings
        passed to `require_permission(...)` around the routers, and now
        enforced for real (see app/core/security.py). They are not linked to
        roles directly: permissions_catalog.GRANTED_BY maps each onto the
        matrix cell that grants it, so the matrix stays the only thing an
        admin has to maintain;
      - '<module>:<action>' codes such as 'dashboard:view', 'billing:edit' —
        the fixed catalog from app/core/permissions_catalog.py that backs the
        frontend's Permission Matrix. A role has ACCESS to (module, action)
        exactly when the matching code is linked via `role_permissions`;
        unlinked means VIEW. See app/routers/roles.py.
    """

    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255), default="")

    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False, default="")
    last_name = Column(String(100), nullable=False, default="")
    email = Column(String(255), unique=True, nullable=False, index=True)

    mobile_number = Column(String(30), default="")
    application_name = Column(String(150), default="EDABIP")
    timezone = Column(String(100), default="UTC")
    company_size = Column(String(50), default="")
    industry = Column(String(100), default="")
    email_notifications = Column(Boolean, default=True, nullable=False)

    is_active = Column(Boolean, default=True, nullable=False)  # soft-deactivate, never hard-delete via API

    # Backs the Settings page's Security card (app/routers/security.py).
    # Deliberately minimal — a preference flag and a password hash, not a
    # real MFA/login system: no TOTP secret, no recovery codes, no session
    # invalidation, no re-auth challenge, and `/auth/login` (which doesn't
    # exist in this module) never reads either column. Real MFA enforcement
    # still belongs to the main codebase's login flow — see app/core/security.py
    # module docstring ("Known pending upstream dependencies"). This module
    # only needs somewhere to persist what the Security card reads/writes.
    two_factor_enabled = Column(Boolean, default=True, nullable=False)
    password_hash = Column(String(255), nullable=True)

    role_id = Column(Integer, ForeignKey("roles.id", ondelete="SET NULL"), nullable=True)
    role = relationship("Role", back_populates="users")

    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)

    notification_preference = relationship(
        "NotificationPreference",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    integrations = relationship(
        "UserIntegration", back_populates="user", cascade="all, delete-orphan"
    )

    __table_args__ = (Index("ix_users_role_id", "role_id"),)


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    dashboard_alerts = Column(String(50), default="all", nullable=False)
    report_updates = Column(Enum(ReportFrequency), default=ReportFrequency.daily, nullable=False)
    sms_notifications = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="notification_preference")


class IntegrationProvider(Base):
    """Catalog of integrations available in the platform (Salesforce, GA, Slack, Teams, ...)."""

    __tablename__ = "integration_providers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, default="")


class UserIntegration(Base):
    """Per-user connection status for a given integration provider."""

    __tablename__ = "user_integrations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider_id = Column(Integer, ForeignKey("integration_providers.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum(IntegrationStatus), default=IntegrationStatus.inactive, nullable=False)
    connected_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="integrations")
    provider = relationship("IntegrationProvider")

    __table_args__ = (
        Index("ix_user_integrations_user_provider", "user_id", "provider_id", unique=True),
    )
