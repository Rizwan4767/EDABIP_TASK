from datetime import datetime, timedelta
from typing import Optional
import secrets
import random
import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from config import settings
from database import get_db
from utils.user_names import compose_full_name, split_full_name

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


# -- Password --------------------------------------------
# Uses the `bcrypt` library directly rather than passlib's CryptContext.
# passlib==1.7.4 (the latest release) probes bcrypt's internals via
# `bcrypt.__about__.__version__`, which was removed in bcrypt>=4.1  -
# a fresh `pip install` pulls the newer bcrypt and login silently breaks
# with "AttributeError: module 'bcrypt' has no attribute '__about__'".
# Calling bcrypt directly avoids that whole fragile dependency chain.

def hash_password(plain: str) -> str:
    # bcrypt has a hard 72-byte input limit; truncate explicitly rather
    # than relying on a library to do it silently/inconsistently.
    pw_bytes = plain.encode("utf-8")[:72]
    return bcrypt.hashpw(pw_bytes, bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8")[:72], hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


# -- JWT -------------------------------------------------

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    # jti makes every minted token byte-unique even when two tokens are issued
    # for the same user within the same second (same sub + same exp would
    # otherwise encode to an identical JWT string).
    to_encode.update({"exp": expire, "type": "access", "jti": secrets.token_urlsafe(16)})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    # refresh_tokens.token has a UNIQUE constraint  - without a jti, two refresh
    # tokens minted in the same second for the same user collide and raise
    # IntegrityError. jti guarantees uniqueness regardless of timing.
    to_encode.update({"exp": expire, "type": "refresh", "jti": secrets.token_urlsafe(16)})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def issue_session_tokens(db: Session, user) -> dict:
    """Mint the access/refresh pair for a user who has fully signed in.

    The ONE place a real session is issued: password login, MFA verify,
    Microsoft and Google sign-in all go through here, so every access token
    carries `email` — the Settings module finds the caller by it
    (app/core/security.py), since user ids are numbered independently there.
    Short-lived purpose tokens (MFA challenge, OAuth state) still call
    create_access_token directly and deliberately carry no email.
    """
    from models.user import RefreshToken

    if not user.email:
        raise ValueError(f"User {user.id} has no email; cannot issue a session token")

    access_token = create_access_token({"sub": str(user.id), "email": user.email})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    db.add(
        RefreshToken(
            user_id=user.id,
            token=refresh_token,
            expires_at=datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days),
        )
    )
    user.last_login = datetime.utcnow()
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_to_dict(user),
    }


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# -- Current User Dependency ------------------------------

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    from models.user import User
    payload = decode_token(token)
    user_id: int = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


def require_roles(*roles):
    """Allow only users whose assigned role is one of the supplied roles."""
    def checker(current_user=Depends(get_current_user)):
        if not current_user.role or current_user.role.name not in roles:
            raise HTTPException(status_code=403, detail="Insufficient role permissions")
        return current_user
    return checker


def require_permission(permission_name: str):
    """
    Backend RBAC check. The user's assigned role determines which permissions
    they have. Never rely on frontend button visibility for authorization.
    """
    def checker(current_user=Depends(get_current_user)):
        role = current_user.role
        if not role:
            raise HTTPException(status_code=403, detail="User has no role assigned")

        if role.name == "admin":
            return current_user

        permission_names = {permission.name for permission in role.permissions}
        if permission_name not in permission_names:
            raise HTTPException(
                status_code=403,
                detail=f"Permission required: {permission_name}",
            )
        return current_user

    return checker


def get_user_permissions(user) -> list[str]:
    """Return effective permissions for API responses / frontend menus."""
    if not user.role:
        return []
    if user.role.name == "admin":
        return [permission.name for permission in user.role.permissions]
    return sorted(permission.name for permission in user.role.permissions)


# -- Shared user serializer -------------------------------
# The frontend's mapBackendUser() (src/modules/auth/utils/authSession.js)
# expects exactly this shape from every endpoint that returns a user object
# (register/login/refresh/me/oauth). Building it in one place means every
# router stays in sync automatically instead of hand-rolling the same dict
# (and re-introducing the same field-name bugs) in five different files.
# first_name/last_name are derived from full_name so web + mobile clients
# keep working while the users table only stores full_name.
def user_to_dict(user) -> dict:
    full_name = (getattr(user, "full_name", None) or "").strip()
    if not full_name:
        full_name = compose_full_name(
            getattr(user, "first_name", None),
            getattr(user, "last_name", None),
        )
    first_name, last_name = split_full_name(full_name)

    return {
        "id": user.id,
        "first_name": first_name,
        "last_name": last_name,
        "full_name": full_name,
        "email": user.email,
        "role": user.role.name if user.role else "user",
        "permissions": get_user_permissions(user),
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "email_verified": user.email_verified,
        "mobile_number": getattr(user, "mobile_number", None) or "",
        "application_name": getattr(user, "application_name", None) or "EDABIP",
        "timezone": getattr(user, "timezone", None) or "UTC",
        "company_size": getattr(user, "company_size", None) or "",
        "industry": getattr(user, "industry", None) or "",
        "email_notifications": bool(getattr(user, "email_notifications", True)),
        "created_at": (
            user.created_at.isoformat()
            if user.created_at
            else None
        ),
        "updated_at": (
            user.updated_at.isoformat()
            if user.updated_at
            else None
        ),
    }


def user_display_name(user) -> str:
    full_name = (getattr(user, "full_name", None) or "").strip()
    if full_name:
        return full_name
    name = compose_full_name(
        getattr(user, "first_name", None),
        getattr(user, "last_name", None),
    )
    return name or "there"


def mask_email(email: str) -> str:
    local, sep, domain = (email or "").partition("@")
    if not sep or not domain:
        return "your email"
    visible = local[: min(2, len(local))]
    stars = "*" * max(1, len(local) - len(visible))
    return f"{visible}{stars}@{domain}"


def generate_otp(length: int = 4) -> str:
    return "".join([str(random.randint(0, 9)) for _ in range(length)])


def otp_expiry(minutes: int = 10) -> datetime:
    return datetime.utcnow() + timedelta(minutes=minutes)


# -- Password Reset Token ---------------------------------

def generate_reset_token() -> str:
    return secrets.token_urlsafe(48)


def reset_token_expiry(hours: int = 1) -> datetime:
    return datetime.utcnow() + timedelta(hours=hours)
