from sqlalchemy import (Column, Integer, String, Boolean, DateTime, Text,
                         ForeignKey, Table)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


# Role <-> Permission many-to-many relationship.
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=func.now())

    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    # String is intentional: admins can create/use new roles without changing a DB ENUM.
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text)
    created_at = Column(DateTime, default=func.now())

    users = relationship("User", back_populates="role")
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)

    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)

    
    # Registration fields. Production MySQL stores a single full_name;
    # first/last are derived only in API responses for the frontend.
    full_name = Column(String(255), nullable=False)
    email = Column(String(180), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    # Account verification
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    email_verified = Column(Boolean, default=False)

    # Settings > General Settings (see routers/auth.py PATCH /auth/me)
    mobile_number = Column(String(30), nullable=True)
    application_name = Column(String(120), nullable=False, default="EDABIP", server_default="EDABIP")
    timezone = Column(String(60), nullable=False, default="UTC", server_default="UTC")
    company_size = Column(String(30), nullable=True)
    industry = Column(String(60), nullable=True)
    email_notifications = Column(Boolean, nullable=False, default=True, server_default="1")

    # Email OTP verification
    otp_code = Column(String(10), nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    otp_attempts = Column(Integer, default=0)

    # OAuth provider identifiers
    google_id = Column(String(120), unique=True, nullable=True, index=True)
    microsoft_oid = Column(String(120), unique=True, nullable=True, index=True)

    # Brute-force / lockout protection
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)

    last_login = Column(DateTime)
    reset_token = Column(String(255))
    reset_expires = Column(DateTime)

    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    role = relationship("Role", back_populates="users")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String(512), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    user = relationship("User", back_populates="refresh_tokens")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(120), nullable=False)
    entity = Column(String(80))
    entity_id = Column(Integer)
    details = Column(Text)
    ip_address = Column(String(45))
    created_at = Column(DateTime, default=func.now())
    user = relationship("User", back_populates="audit_logs")
