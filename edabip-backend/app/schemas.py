import re
from datetime import datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator
from pydantic.alias_generators import to_camel

_NON_DIGIT_RE = re.compile(r"\D")
_MAX_MOBILE_LENGTH = 30  # matches User.mobile_number's column width


class CamelModel(BaseModel):
    """Base for schemas that face the EDABIP frontend, which reads/writes
    camelCase JSON (`firstName`, not `first_name`). Internal Python code
    stays snake_case; only the wire format changes.

    - `alias_generator=to_camel` serializes/parses every field via its
      camelCase alias (`mobile_number` <-> `mobileNumber`).
    - `populate_by_name=True` means the snake_case name still works for
      Python callers (tests, scripts, another backend service) that
      construct these models directly.
    - `from_attributes=True` lets these models build straight off
      SQLAlchemy model instances, same as before.

    NOTE: the User Management schemas near the bottom of this file
    (UserResponse, PaginatedUsers, AdminUserCreate, AdminUserUpdate,
    AssignRoleRequest) intentionally do NOT use this base. That surface
    belongs to the separate `/users` admin screen, which the current
    frontend (`src/modules/user-management`) doesn't call yet — only the
    Settings-page-facing schemas below need to match its JSON conventions.
    """

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


# ---------- General Settings (profile) ----------

class GeneralSettingsUpdate(CamelModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    mobile_number: Optional[str] = None
    application_name: Optional[str] = None
    timezone: Optional[str] = None
    company_size: Optional[str] = None
    industry: Optional[str] = None
    email_notifications: Optional[bool] = None

    @field_validator("mobile_number")
    @classmethod
    def _validate_mobile(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        trimmed = v.strip()
        # Mirrors validateGeneral() in the frontend's GeneralSettingsForm.jsx
        # exactly: mobile number is optional (empty is fine); if non-empty,
        # the only rule is >= 10 digits once everything else is stripped out
        # — so "(123) 456-7890", "123.456.7890", "+91 98765 43210", and
        # "123-456-7890 x123" are all valid, same as the form accepts them.
        if trimmed and len(_NON_DIGIT_RE.sub("", trimmed)) < 10:
            raise ValueError("Enter a valid mobile number.")
        if len(trimmed) > _MAX_MOBILE_LENGTH:
            raise ValueError(f"mobile_number must be {_MAX_MOBILE_LENGTH} characters or fewer")
        return trimmed

    @field_validator("first_name", "last_name")
    @classmethod
    def _validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        trimmed = v.strip()
        # Mirrors validateGeneral() in the frontend's GeneralSettingsForm.jsx:
        # required, 80 characters or fewer. (A PUT that omits the field
        # entirely — v is None — leaves the stored value untouched; this
        # only fires when the caller is actively setting it.)
        if not trimmed:
            raise ValueError("This field cannot be blank.")
        if len(trimmed) > 80:
            raise ValueError("Must be 80 characters or fewer.")
        return trimmed

    @field_validator("application_name")
    @classmethod
    def _validate_application_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        trimmed = v.strip()
        # Mirrors validateGeneral(): required. The frontend has no explicit
        # max length for this field; 150 is this column's width (User.application_name).
        if not trimmed:
            raise ValueError("This field cannot be blank.")
        if len(trimmed) > 150:
            raise ValueError("Must be 150 characters or fewer.")
        return trimmed


class GeneralSettingsResponse(CamelModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    mobile_number: str
    application_name: str
    timezone: str
    company_size: str
    industry: str
    email_notifications: bool


# ---------- Notification Preferences ----------

# Matches the DASHBOARD_ALERT_OPTIONS values in the frontend's settingsApi.js.
DashboardAlertLevel = Literal["all", "critical", "warnings", "none"]


class NotificationPreferenceUpdate(CamelModel):
    dashboard_alerts: Optional[DashboardAlertLevel] = None
    report_updates: Optional[str] = None  # realtime/hourly/daily/weekly — see ReportFrequency
    sms_notifications: Optional[bool] = None


class NotificationPreferenceResponse(CamelModel):
    dashboard_alerts: DashboardAlertLevel
    report_updates: str
    sms_notifications: bool


# ---------- Security ----------
# Minimal, settings-page-scoped security data: a persisted 2FA preference
# flag and password changes. This is intentionally NOT a real MFA/login
# system (no TOTP secret, no session invalidation, no re-auth challenge) —
# see app/core/security.py's module docstring for the auth seam that would
# eventually own real MFA enforcement. This exists because the Settings
# page's Security card needs somewhere to read/write `twoFactorEnabled` and
# to accept a new password; see app/routers/security.py.

class SecuritySettingsResponse(CamelModel):
    two_factor_enabled: bool


class SecuritySettingsUpdate(CamelModel):
    two_factor_enabled: bool


class ChangePasswordRequest(CamelModel):
    """Self-service password change.

    `current_password` is required and re-checked server-side against the
    live login credential — a session alone must not be enough to replace the
    password it was issued for (that turns any unattended tab or stolen token
    into a permanent account takeover). See app/core/auth_credentials.py for
    where the check reads from.
    """

    current_password: str
    new_password: str


class AdminSetPasswordRequest(CamelModel):
    """Admin reset of *another* user's password.

    No current-password field on purpose: an administrator resetting an
    account they do not own has no way to know it, and the authorization for
    this action is the `users:write` permission on the endpoint, not
    knowledge of the existing secret.
    """

    new_password: str


class ChangePasswordResponse(CamelModel):
    ok: bool = True


# ---------- Integrations ----------

class IntegrationResponse(CamelModel):
    id: int
    name: str
    connected: bool
    connected_at: Optional[datetime] = None


class IntegrationToggleRequest(CamelModel):
    connected: bool


# ---------- Options ----------

class OptionItem(CamelModel):
    value: str
    label: str


class ModuleOption(CamelModel):
    id: str
    label: str


# ---------- Roles & Permissions ----------

# Two-level access, matching ACCESS/VIEW_ONLY in the frontend's
# data/permissionMatrix.js.
PermissionLevel = Literal["access", "view"]

# {moduleId: {actionId: level}}, e.g. {"dashboard": {"view": "access", "edit": "view"}}.
PermissionsMatrix = Dict[str, Dict[str, PermissionLevel]]


class RoleResponse(CamelModel):
    id: int
    name: str
    description: str
    user_count: int
    permissions: PermissionsMatrix


class PaginatedRoles(CamelModel):
    total: int
    page: int
    page_size: int
    items: List[RoleResponse]


class RoleCreate(CamelModel):
    name: str
    description: str


class RoleUpdate(CamelModel):
    name: Optional[str] = None
    description: Optional[str] = None


class PermissionResponse(CamelModel):
    id: int
    code: str
    description: str


class PermissionCreate(CamelModel):
    code: str
    description: str = ""


class RolePermissionsUpdate(CamelModel):
    """Nested {moduleId: {actionId: 'access' | 'view'}} matrix — mirrors
    what the frontend's Permission Matrix tab edits and saves. Only the
    modules/actions present in the payload are changed; anything omitted
    keeps its current stored level."""

    permissions: PermissionsMatrix


# ---------- Settings Aggregator ----------

class SettingsOptionsResponse(CamelModel):
    timezones: List[OptionItem]
    company_sizes: List[OptionItem]
    industries: List[OptionItem]
    dashboard_alerts: List[OptionItem]
    report_updates: List[OptionItem]
    modules: List[ModuleOption]


class AllSettingsResponse(CamelModel):
    general: GeneralSettingsResponse
    notifications: NotificationPreferenceResponse
    security: SecuritySettingsResponse
    integrations: List[IntegrationResponse]
    roles: List[RoleResponse]
    options: SettingsOptionsResponse


# ---------- User Management ----------
# Admin `/users` surface — snake_case on purpose, see CamelModel docstring.

class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    is_active: bool
    role_id: Optional[int] = None
    role_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedUsers(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[UserResponse]


class AdminUserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    role_id: Optional[int] = None


class AdminUserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None


class AssignRoleRequest(BaseModel):
    role_id: int


# ---------- Error envelope ----------

class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None
