"""
Role-based access control for the billing module.

Uses the host login dependency (`utils.auth.get_current_user`) so a Bearer
token from /auth/login is enough — same JWT as the rest of the API.

Sarthak (2026-09-08):
  org_id = 1 (single tenant; User has no org_id yet)
  admin  → administrator (full)
  user   → client_user (view-only)
  role from user.role.name

Host User fields we adapt for:
  - `.id` or `.user_id`
  - `.role` is a relationship with `.name`, not a string
  - `.org_id` may be missing — default 1

Roles from the billing wireframe, plus host aliases:
  - Administrator / admin / billing_administrator -> full access
  - Finance Manager                               -> view + export
  - Client User / user                            -> view only
"""
from __future__ import annotations

from enum import Enum
from typing import Any, Callable

from fastapi import Depends, HTTPException, status

from utils.auth import get_current_user as get_host_user


DEFAULT_ORG_ID = 1
UNAUTHORIZED_MESSAGE = "You do not have permission to perform this action."


class BillingPermission(str, Enum):
    VIEW = "billing:view"
    MANAGE = "billing:manage"  # upgrade / renew / cancel plan, manage payment methods
    EXPORT = "billing:export"


ROLE_PERMISSIONS: dict[str, set[BillingPermission]] = {
    "administrator": {BillingPermission.VIEW, BillingPermission.MANAGE, BillingPermission.EXPORT},
    "billing_administrator": {BillingPermission.VIEW, BillingPermission.MANAGE, BillingPermission.EXPORT},
    "finance_manager": {BillingPermission.VIEW, BillingPermission.EXPORT},
    "client_user": {BillingPermission.VIEW},
}

# Host app today only has admin + user. Map those onto the wireframe roles
# so a normal user can still open /billing (view-only) instead of 403.
ROLE_ALIASES: dict[str, str] = {
    "administrator": "administrator",
    "admin": "administrator",
    "billing_administrator": "billing_administrator",
    "finance_manager": "finance_manager",
    "client_user": "client_user",
    "user": "client_user",
}


def _role_of(user: Any) -> str:
    role = getattr(user, "role", None)
    if role is None:
        raw = "user"
    elif not isinstance(role, str) and hasattr(role, "name"):
        raw = str(role.name)
    else:
        raw = str(role)
    key = raw.strip().lower().replace(" ", "_")
    return ROLE_ALIASES.get(key, key)


def _org_id_of(user: Any) -> int:
    value = getattr(user, "org_id", None)
    if value is None:
        return DEFAULT_ORG_ID
    return int(value)


def _user_id_of(user: Any) -> int:
    value = getattr(user, "id", None)
    if value is None:
        value = getattr(user, "user_id", None)
    if value is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user is missing an id.",
        )
    return int(value)


class BillingUser:
    """Normalized principal the billing router can read (id, org_id, role)."""

    def __init__(self, raw: Any):
        self._raw = raw
        self.id = _user_id_of(raw)
        self.org_id = _org_id_of(raw)
        self.role = _role_of(raw)
        self.email = getattr(raw, "email", None)
        full_name = getattr(raw, "full_name", None)
        if not full_name:
            first = getattr(raw, "first_name", None) or ""
            last = getattr(raw, "last_name", None) or ""
            full_name = f"{first} {last}".strip() or getattr(raw, "name", None)
        self.name = full_name

    def __getattr__(self, item: str):
        return getattr(self._raw, item)


# Router type hint alias (`user: User = Depends(require_view)`).
User = BillingUser


def get_current_user(host_user: Any = Depends(get_host_user)) -> BillingUser:
    """Resolve the caller from the host JWT / DB user."""
    return BillingUser(host_user)


def require_billing_permission(permission: BillingPermission) -> Callable:
    """FastAPI dependency factory — use as:
    `current_user = Depends(require_billing_permission(BillingPermission.MANAGE))`
    """

    def dependency(current_user: Any = Depends(get_current_user)) -> BillingUser:
        principal = current_user if isinstance(current_user, BillingUser) else BillingUser(current_user)
        allowed = ROLE_PERMISSIONS.get(principal.role, set())
        if permission not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=UNAUTHORIZED_MESSAGE)
        return principal

    return dependency


# Convenience dependencies for the common cases used throughout router.py
require_view = require_billing_permission(BillingPermission.VIEW)
require_manage = require_billing_permission(BillingPermission.MANAGE)
require_export = require_billing_permission(BillingPermission.EXPORT)
