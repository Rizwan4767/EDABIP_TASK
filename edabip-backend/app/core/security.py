"""
Auth integration seam.
=======================

This module is the ONE place another codebase needs to touch to plug this
Settings module into a real authentication system. Everything downstream
(routers) depends on the two callables below via FastAPI's dependency
injection, never on JWTs, sessions, or request headers directly.

Standalone mode (what ships here)
----------------------------------
`get_current_user()` decodes a bearer JWT signed with `settings.JWT_SECRET_KEY`
and 401s if there isn't one. It used to fall back to an auto-created "dev"
user so the module ran with zero setup; that fallback resolved to the
lowest-numbered user — the Administrator in any seeded database — so an
unauthenticated caller got full admin rights and never met a permission
check. Standalone use now needs a token; mint one with the same
JWT_SECRET_KEY, e.g.

    python -c "import jwt,datetime; print(jwt.encode({'sub':'1','email':'you@example.com','type':'access','exp':datetime.datetime.utcnow()+datetime.timedelta(days=1)},'<JWT_SECRET_KEY>',algorithm='HS256'))"

Only access tokens are accepted: the payload's `type` must be "access", the
value the auth backend's create_access_token stamps (edabip-backend/utils/
auth.py). A refresh token, or a token with no `type` at all, gets 401.

Identity: the caller is found by EMAIL, not by id. The auth backend numbers
its users in its own database and this module numbers them in another, so a
token's `sub` says nothing about which row here is the caller — `sub=1` in
the auth database may well be settings user #2. The auth backend therefore
puts the user's `email` in every session access token it issues (utils/auth.py
`issue_session_tokens`, used by every login path), and
`get_current_db_user()` below matches it against `User.email`
case-insensitively. A token with no `email` claim gets 401.
`CurrentUser.user_id` still carries `sub` for logging, but nothing looks a
user up by it. The first time an email is seen with no settings row, one is
    created with the lowest-privilege role (Viewer). The one exception is a
    login account whose role in the auth database is `admin`: that person is
    stored as Settings Admin so the Roles & Permissions section is visible.
    The token's own role claim is still ignored. Admin `/{user_id}` routes are
    unaffected: the id in their path is, and always was, a settings-database id.

`require_permission(...)` enforces for real: it resolves the caller, works out
which permission codes they hold, and raises 403 when the required one is
missing. The role and permission codes come ONLY from THIS module's own
database, via the role the user is assigned (`role_permissions`). Any `role`
or `permissions` claim in the token is ignored: trusting them would let
anyone who can mint a token under the shared secret simply claim "Admin".

Integrating into the main EDABIP backend
------------------------------------------
The main app already has a working, tested auth stack: `app.auth.get_current_user`,
`app.auth.require_role`, `app.auth.require_permission`, JWT issuance under
`/auth/*`. When merging this module in, DO NOT run both auth systems side by
side. Instead:

    from app.auth import get_current_user as real_get_current_user
    from app.auth import require_permission as real_require_permission
    from app.core.security import get_current_user, require_permission

    main_app.dependency_overrides[get_current_user] = real_get_current_user
    # require_permission is a dependency *factory*; override each instance
    # routers actually request, or refactor routers to import the real
    # factory directly once merged into a single codebase.

`get_current_user` must return a `CurrentUser` (user_id + email + role name +
a set of permission codes) so router code doesn't change either way.

Known pending upstream dependencies (do not build around these here):
  - Email change re-verification: `general.py`'s update endpoint calls
    `on_email_change(...)` below as a hook. Standalone: no-op. Integrated:
    point it at the main Auth service's re-verification flow instead of
    committing the new email immediately.
  - Persistent 2FA: `User.two_factor_enabled` is a stored *preference flag*
    only (added so the Settings page's Security card has somewhere to read/
    write it — see app/routers/security.py), not real MFA. It never gates
    `get_current_user()` below, because this module has no login flow for it
    to gate. Actual login-time MFA challenge/enforcement, TOTP secrets, and
    recovery codes still belong to the main codebase's auth stack.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field

import jwt
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core import permissions_catalog
from app.core.config import settings
from app.core.database import get_db

logger = logging.getLogger(__name__)

# A role that is granted everything regardless of what its permission matrix
# currently says. Without it, an administrator who unticks `users:manage` in
# the Permission Matrix UI locks *everyone* out of that same screen forever,
# with no in-app way back: re-ticking the box is itself gated on the box.
# "Admin" is the name seed.py gives the role it describes as "Full access to
# all features and settings", and the first entry of MATRIX_ROLE_ORDER.
SUPERUSER_ROLE = "Admin"

# The role a settings row is given when get_current_db_user() has to create
# one for an email it has never seen. seed.py describes it as "View only
# access to reports and dashboards" — the least any seeded role can do.
DEFAULT_ROLE = "Viewer"


@dataclass
class CurrentUser:
    # The token's `sub`: an AUTH-database id. Kept for logging only — it is
    # not a settings User.id and nothing looks a user up by it.
    user_id: int
    email: str
    role: str | None = None
    permissions: frozenset[str] = field(default_factory=frozenset)


def _decode_bearer_token(request: Request) -> dict | None:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    # Refresh tokens are signed with the same key but live far longer; they
    # must only ever be exchanged at the auth backend, never used as a session.
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )
    return payload


def get_current_user(request: Request, db: Session = Depends(get_db)) -> CurrentUser:
    """
    Resolve the caller from their bearer token, or refuse the request.

    There is deliberately no unauthenticated fallback. An earlier version of
    this module answered a request with no Authorization header by returning
    `db.query(User).order_by(User.id).first()` — the lowest-numbered user in
    the database, which in a seeded deployment is the Administrator. That
    handed full admin access, including the entire Roles & Permission Matrix,
    to anyone who could reach the port without authenticating at all, and it
    bypassed `require_permission` completely because the caller it resolved
    genuinely held the permissions.

    Swap this dependency wholesale when integrating (see module docstring) —
    router code only ever depends on `CurrentUser`.
    """
    payload = _decode_bearer_token(request)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub") or payload.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Token missing subject claim")
    email = payload.get("email")
    if not isinstance(email, str) or not email.strip():
        raise HTTPException(status_code=401, detail="Token missing email claim")
    # Only the subject and email are taken from the token. Role and
    # permissions are read from the database, whatever the token claims.
    current_user = CurrentUser(user_id=int(user_id), email=email.strip())
    role, permission_codes = resolve_identity(db, current_user)
    return CurrentUser(
        user_id=current_user.user_id,
        email=current_user.email,
        role=role,
        permissions=permission_codes,
    )


def _mask_email(email: str) -> str:
    """'thomas@edabip.io' -> 'th***@edabip.io', for logs."""
    local, _, domain = email.partition("@")
    return f"{local[:2]}***@{domain}" if domain else "***"


def _find_by_email(db: Session, email: str):
    from app.models import User

    return (
        db.query(User)
        .filter(func.lower(User.email) == email.lower())
        .order_by(User.id)
        .first()
    )


def _auth_role_name(email: str) -> str | None:
    """Role name on the login account. None when the auth database can't be read.

    This is not the token's `role` claim. Tests and standalone runs that
    cannot reach the auth database get None and fall back to Viewer.
    """
    try:
        from app.core.auth_credentials import get_credential_store

        return get_credential_store().role_name(email)
    except Exception:
        logger.warning("Auth role lookup unavailable; settings will keep the default role")
        return None


def _is_auth_administrator(email: str) -> bool:
    role_name = _auth_role_name(email)
    return bool(role_name and role_name.strip().lower() == "admin")


def _role_named(db: Session, name: str):
    from app.models import Role

    return db.query(Role).filter(Role.name == name).first()


def _align_platform_admin(db: Session, user, email: str):
    """Give a platform administrator the Settings Admin role.

    The first visit stores Viewer, which hides Roles & Permissions. A login
    account whose auth role is admin should see that section. Any other
    Settings role is left as it was.
    """
    if user.role is not None and user.role.name not in (None, DEFAULT_ROLE):
        return user
    if not _is_auth_administrator(email):
        return user
    admin = _role_named(db, SUPERUSER_ROLE)
    if admin is None or user.role_id == admin.id:
        return user
    user.role = admin
    db.commit()
    db.refresh(user)
    logger.info(
        "Assigned settings Admin to auth administrator id=%s email=%s",
        user.id,
        _mask_email(email),
    )
    return user


def get_current_db_user(db: Session, current_user: CurrentUser):
    """The caller's row in THIS module's database, matched on email.

    Case-insensitive, because the auth backend matches logins the same way
    (routers/auth.py `login`) and a stored "Jane@X.io" is the same person as a
    token's "jane@x.io". Never uses `current_user.user_id` — see the module
    docstring.

    No row yet means the person has an auth account but has never been seen
    here. One is created for them with DEFAULT_ROLE, unless the auth database
    says the login account is an administrator — then the row is Settings
    Admin so Roles & Permissions is visible. If Viewer has not been seeded,
    the row is created with no role at all (no permissions).
    """
    from app.models import User

    email = current_user.email.strip()
    user = _find_by_email(db, email)
    if user is not None:
        return _align_platform_admin(db, user, email)

    if _is_auth_administrator(email):
        role = _role_named(db, SUPERUSER_ROLE) or _role_named(db, DEFAULT_ROLE)
    else:
        role = _role_named(db, DEFAULT_ROLE)
    user = User(email=email, role_id=role.id if role else None)
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        # A concurrent request for the same email created it first.
        db.rollback()
        user = _find_by_email(db, email)
        if user is None:
            raise
        return _align_platform_admin(db, user, email)
    db.refresh(user)
    logger.info(
        "Auto-created settings user id=%s email=%s role=%s (auth sub=%s)",
        user.id,
        _mask_email(email),
        role.name if role else None,
        current_user.user_id,
    )
    return user


def _stored_permission_codes(user) -> frozenset[str]:
    """The permission codes linked to this user's role, or none if unassigned."""
    if user is None or user.role is None:
        return frozenset()
    return frozenset(permission.code for permission in user.role.permissions)


def resolve_identity(db: Session, current_user: CurrentUser) -> tuple[str | None, frozenset[str]]:
    """(role name, permission codes) for the caller, read from the database.

    Always looks the user up by email (get_current_db_user) and reads both off
    their assigned role. Whatever `role`/`permissions` the CurrentUser already
    carries is ignored, so nothing a token (or an override) asserts can raise
    the caller's access.
    """
    user = get_current_db_user(db, current_user)
    role = user.role.name if user.role else None
    return role, _stored_permission_codes(user)


def is_superuser(db: Session, current_user: CurrentUser) -> bool:
    """Whether the caller's role in the database is SUPERUSER_ROLE."""
    role, _ = resolve_identity(db, current_user)
    return role == SUPERUSER_ROLE


def require_admin_for_email_change(
    db: Session, current_user: CurrentUser, user, new_email: str | None
) -> None:
    """403 unless the caller is an Admin, when `new_email` would change `user`'s email.

    The email is the login identity (get_current_db_user matches tokens on
    it), so changing someone else's is as good as taking the account over.
    users:write alone is not enough. Shared by every admin route that can
    write `User.email` so the rule cannot drift between them. Compared
    case-insensitively, the same way identities are matched.
    """
    if new_email is None or new_email.lower() == (user.email or "").lower():
        return
    if not is_superuser(db, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only an Admin can change a user's email.",
        )


def has_permission(db: Session, current_user: CurrentUser, code: str) -> bool:
    """Whether the caller may perform the action guarded by `code`.

    Non-raising, so callers that need to *degrade* rather than reject can ask
    the same question `require_permission` asks — see app/routers/aggregate.py,
    which omits the roles payload instead of failing the whole request.
    """
    role, held_codes = resolve_identity(db, current_user)
    if role == SUPERUSER_ROLE:
        return True
    return bool(held_codes & permissions_catalog.granting_codes(code))


def require_permission(code: str):
    """
    Dependency factory: 403s a caller who lacks `code`.

    Both of its own dependencies go through `Depends(...)` rather than direct
    calls, so an integrated app that overrides `get_current_user` (per the
    module docstring) or a test that overrides `get_db` automatically governs
    this check too.
    """

    def _dependency(
        current_user: CurrentUser = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> CurrentUser:
        if not has_permission(db, current_user, code):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return current_user

    return _dependency
