"""
Security card (Settings page): a 2FA preference flag and password changes.

Deliberately NOT a real MFA/login system — see the `two_factor_enabled` /
`password_hash` columns' comment in app/models.py and the "Known pending
upstream dependencies" note in app/core/security.py's module docstring.
This router only gives the Settings page's Security card somewhere to
read/write `twoFactorEnabled` and to accept a new password; neither column
is consulted by `get_current_user` or any login flow (none exists in this
standalone module — see app/core/security.py, a different file from this
one despite the similar name).

Password changes go through app/core/auth_credentials.py, which reads and
writes the AUTH backend's `users.password_hash` — the credential the login
flow actually checks — because that backend runs on a separate database from
this one. The local `User.password_hash` column is kept in sync with the same
bcrypt hash so the two never disagree, but it is a mirror, not the source of
truth. See that module's docstring for why it is not simply importing
edabip-backend/utils/auth.py.

Follows the same /me (self-service) vs /{user_id} (admin, permission-gated)
split as general.py / notifications.py / integrations.py.
"""
import re

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app import schemas
from app.core.auth_credentials import AuthCredentialStore, get_credential_store
from app.core.database import get_db
from app.core.rate_limit import change_password_limiter, enforce_rate_limit
from app.core.lookups import get_user_or_404
from app.core.security import (
    SUPERUSER_ROLE,
    CurrentUser,
    get_current_db_user,
    get_current_user,
    is_superuser,
    require_permission,
)
from app.models import User

router = APIRouter(prefix="/settings/security", tags=["Security"])


def _password_error(password: str) -> str:
    """Mirrors getPasswordError() in the frontend's SecuritySettings.jsx
    exactly, so a direct API call is held to the same bar the form already
    enforces client-side before it ever calls this endpoint."""
    if not password:
        return "Password is required."
    if len(password) < 8:
        return "Password must be at least 8 characters."
    if not re.search(r"[A-Z]", password):
        return "Password must contain an uppercase letter."
    if not re.search(r"[a-z]", password):
        return "Password must contain a lowercase letter."
    if not re.search(r"[0-9]", password):
        return "Password must contain a number."
    if not re.search(r"[^A-Za-z0-9]", password):
        return "Password must contain a special character."
    return ""


def _to_response(user: User) -> schemas.SecuritySettingsResponse:
    return schemas.SecuritySettingsResponse(two_factor_enabled=user.two_factor_enabled)


def _apply_update(
    user: User, payload: schemas.SecuritySettingsUpdate, db: Session
) -> schemas.SecuritySettingsResponse:
    user.two_factor_enabled = payload.two_factor_enabled
    db.commit()
    db.refresh(user)
    return _to_response(user)


def _set_password(
    user: User, new_password: str, db: Session, store: AuthCredentialStore
) -> schemas.ChangePasswordResponse:
    """Validate, then write the new password to the auth backend's store and
    mirror the resulting hash locally.

    Rejecting a new password identical to the current one matches the auth
    backend's own `reset_password` (edabip-backend/routers/auth.py), which
    refuses the same thing in the same words. A "change" that changes nothing
    is worth refusing on both paths: it silently defeats the point of the
    rotation the user (or the admin resetting them) believes they just did.
    """
    error = _password_error(new_password)
    if error:
        raise HTTPException(status_code=422, detail=error)

    if store.verify(user.email, new_password):
        # 422, not the auth backend's 400, even though the rule and the wording
        # are deliberately identical. On this endpoint 400 means exactly one
        # thing — "the current password you supplied is wrong" — and the
        # frontend puts 400s on the Current Password field. This is a
        # complaint about the NEW password, so it travels with the other
        # new-password rejections above and lands on the right input.
        raise HTTPException(
            status_code=422,
            detail=(
                "New password cannot be the same as your current password. "
                "Please choose a different password."
            ),
        )

    user.password_hash = store.set_password(user.email, new_password)
    db.commit()
    return schemas.ChangePasswordResponse(ok=True)


def _apply_password_change(
    user: User,
    payload: schemas.ChangePasswordRequest,
    db: Session,
    store: AuthCredentialStore,
) -> schemas.ChangePasswordResponse:
    """Self-service change: prove knowledge of the current password first.

    Checked before the new password is validated, so a caller probing with a
    deliberately invalid new password can't use the difference between a 422
    and a 400 to learn whether their guess at the current one was right.
    """
    if not store.verify(user.email, payload.current_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    return _set_password(user, payload.new_password, db, store)


@router.get("/me", response_model=schemas.SecuritySettingsResponse)
def get_my_security_settings(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return _to_response(get_current_db_user(db, current_user))


@router.put("/me", response_model=schemas.SecuritySettingsResponse)
def update_my_security_settings(
    payload: schemas.SecuritySettingsUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    user = get_current_db_user(db, current_user)
    return _apply_update(user, payload, db)


@router.post("/me/change-password", response_model=schemas.ChangePasswordResponse)
def change_my_password(
    request: Request,
    payload: schemas.ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
    store: AuthCredentialStore = Depends(get_credential_store),
):
    """
    Rate-limited because it verifies the caller's current password: without a
    cap, a stolen session token could be walked into the account's real
    password by guessing here, where failures never reach the auth backend's
    own lockout counters. See app/core/rate_limit.py.

    The limit is spent before the guess is checked, so a wrong current
    password costs budget whether or not the rest of the request is valid.
    """
    user = get_current_db_user(db, current_user)
    enforce_rate_limit(request, change_password_limiter, extra_key=str(user.id))
    return _apply_password_change(user, payload, db, store)


@router.get(
    "/{user_id}",
    response_model=schemas.SecuritySettingsResponse,
    dependencies=[Depends(require_permission("users:read"))],
)
def get_security_settings(user_id: int, db: Session = Depends(get_db)):
    """Admin path: view another user's security settings."""
    return _to_response(get_user_or_404(db, user_id))


@router.put(
    "/{user_id}",
    response_model=schemas.SecuritySettingsResponse,
    dependencies=[Depends(require_permission("users:write"))],
)
def update_security_settings(
    user_id: int, payload: schemas.SecuritySettingsUpdate, db: Session = Depends(get_db)
):
    """Admin path: update another user's security settings."""
    user = get_user_or_404(db, user_id)
    return _apply_update(user, payload, db)


@router.post(
    "/{user_id}/change-password",
    response_model=schemas.ChangePasswordResponse,
    dependencies=[Depends(require_permission("users:write"))],
)
def change_password(
    user_id: int,
    payload: schemas.AdminSetPasswordRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
    store: AuthCredentialStore = Depends(get_credential_store),
):
    """Admin path: reset another user's password directly.

    No current-password check — an admin resetting someone else's account
    can't know it. Because that makes it an account takeover in one request,
    `users:write` alone is not enough:
      - the caller's role in the database must be Admin;
      - the caller cannot target themselves (use /me/change-password, which
        does check the current password);
      - the target cannot be another Admin.
    """
    if not is_superuser(db, current_user):
        raise HTTPException(
            status_code=403, detail="Only an Admin can reset another user's password."
        )
    if user_id == get_current_db_user(db, current_user).id:
        raise HTTPException(
            status_code=403,
            detail="Use /settings/security/me/change-password to change your own password.",
        )
    user = get_user_or_404(db, user_id)
    if user.role is not None and user.role.name == SUPERUSER_ROLE:
        raise HTTPException(
            status_code=403, detail="An Admin's password cannot be reset by another user."
        )
    return _set_password(user, payload.new_password, db, store)
