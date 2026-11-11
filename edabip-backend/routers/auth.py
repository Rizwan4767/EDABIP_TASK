from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr, Field

from database import get_db
from models.user import User, Role, RefreshToken

from utils.auth import (
    hash_password,
    verify_password,
    issue_session_tokens,
    decode_token,
    get_current_user,
    generate_otp,
    otp_expiry,
    generate_reset_token,
    reset_token_expiry,
    user_to_dict,
    user_display_name,
)
from utils.user_names import compose_full_name

from utils.email import (
    send_otp_email_safe,
    send_password_reset_email,
)

from utils.security import (
    validate_password_strength,
    enforce_rate_limit,
    login_limiter,
    register_limiter,
    otp_verify_limiter,
    otp_resend_limiter,
    password_reset_limiter,
    is_account_locked,
    register_failed_login,
    register_successful_login,
    register_failed_otp,
)

from config import settings

import logging

logger = logging.getLogger(__name__)

EMAIL_NOT_REGISTERED = "This email is not registered"


def _send_password_reset_email_task(to: str, name: str, link: str) -> None:
    """Background send. Must not raise: BaseHTTPMiddleware turns that into HTTP 500."""
    try:
        send_password_reset_email(to, name, link, link)
    except Exception:
        logger.exception("Password reset email failed")


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# ============================================================
# SCHEMAS
# ============================================================

class RegisterRequest(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=80)
    last_name: str = Field(..., min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., max_length=72)
    
class UpdateProfileRequest(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=80)
    last_name: str = Field(..., min_length=1, max_length=80)
    mobile_number: str = Field("", max_length=30)
    application_name: str = Field(..., min_length=1, max_length=120)
    timezone: str = Field(..., min_length=1, max_length=60)
    company_size: str = Field("", max_length=30)
    industry: str = Field("", max_length=60)
    email_notifications: bool = True


class OTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=4, max_length=10)


class ResendOTPRequest(BaseModel):
    email: EmailStr


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=72)


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


# ============================================================
# ROLE HELPER
# ============================================================

def _new_user_role(db: Session) -> Role:
    """
    Role assigned to accounts created through public
    self-registration.
    """

    role = (
        db.query(Role)
        .filter(Role.name == "client_user")
        .first()
    )

    if not role:
        raise HTTPException(
            status_code=500,
            detail="Default 'client_user' role is not configured",
        )

    return role


# ============================================================
# REGISTRATION
# ============================================================

@router.post(
    "/register",
    status_code=201,
)
def register(
    payload: RegisterRequest,
    request: Request,
    bg: BackgroundTasks,
    db: Session = Depends(get_db),
):

    enforce_rate_limit(
        request,
        register_limiter,
        extra_key="register",
    )

    ok, msg = validate_password_strength(
        payload.password
    )

    if not ok:
        raise HTTPException(
            status_code=400,
            detail=msg,
        )

    # Check if email already exists
    if (
        db.query(User)
        .filter(User.email == payload.email)
        .first()
    ):
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    role = _new_user_role(db)

    otp = generate_otp()

    user = User(
        role_id=role.id,
        full_name=compose_full_name(payload.first_name, payload.last_name),
        email=payload.email,
        password_hash=hash_password(
            payload.password
        ),
        otp_code=otp,
        otp_expires_at=otp_expiry(),
        is_active=True,
        is_verified=False,
        email_verified=False,
    )

    db.add(user)

    try:
        db.commit()
        db.refresh(user)

    except IntegrityError as e:
        db.rollback()

        logger.exception(
            "Integrity error occurred during user registration."
        )

        raise HTTPException(
            status_code=400,
            detail=str(e.orig),
        )

    except Exception:
        db.rollback()

        logger.exception(
            "Unexpected error occurred during user registration."
        )

        raise HTTPException(
            status_code=500,
            detail="Internal server error.",
        )

    if settings.smtp_user:
        bg.add_task(
            send_otp_email_safe,
            user.email,
            user_display_name(user),
            otp,
        )

    response = {
        "message": (
            "Registration successful. "
            "Please verify your email."
        ),
        "user_id": user.id,
    }

    if not settings.smtp_user:
        response["dev_email_otp"] = otp

    return response


# ============================================================
# VERIFY OTP
# ============================================================

@router.post("/verify-otp")
def verify_otp(
    payload: OTPRequest,
    request: Request,
    db: Session = Depends(get_db),
):

    enforce_rate_limit(
        request,
        otp_verify_limiter,
        extra_key=payload.email,
    )

    user = (
        db.query(User)
        .filter(User.email == payload.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OTP",
        )

    if user.email_verified:
        return {
            "message": "Email already verified",
            "is_fully_verified": user.is_verified,
        }

    if (
        not user.otp_code
        or user.otp_expires_at is None
        or user.otp_expires_at < datetime.utcnow()
    ):
        raise HTTPException(
            status_code=400,
            detail="OTP expired  - request a new one",
        )

    if user.otp_code != payload.otp:

        invalidated = register_failed_otp(
            db,
            user,
        )

        if invalidated:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Too many incorrect attempts. "
                    "Please request a new OTP."
                ),
            )

        raise HTTPException(
            status_code=400,
            detail="Invalid OTP",
        )

    user.email_verified = True
    user.is_verified = True

    user.otp_code = None
    user.otp_expires_at = None

    db.commit()

    return {
        "message": (
            "Email verified. Your account is fully "
            "verified  - you can now log in."
        ),
        "is_fully_verified": True,
    }


# ============================================================
# RESEND OTP
# ============================================================

@router.post("/resend-otp")
def resend_otp(
    payload: ResendOTPRequest,
    request: Request,
    bg: BackgroundTasks,
    db: Session = Depends(get_db),
):

    enforce_rate_limit(
        request,
        otp_resend_limiter,
        extra_key=payload.email,
    )

    user = (
        db.query(User)
        .filter(func.lower(User.email) == str(payload.email).strip().lower())
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail=EMAIL_NOT_REGISTERED,
        )

    if user.email_verified:
        return {
            "message": "Email already verified",
            "is_fully_verified": user.is_verified,
        }

    otp = generate_otp()

    user.otp_code = otp
    user.otp_expires_at = otp_expiry()
    user.otp_attempts = 0

    db.commit()

    if settings.smtp_user:
        bg.add_task(
            send_otp_email_safe,
            user.email,
            user_display_name(user),
            otp,
        )

    response = {
        "message": "A new verification code has been sent."
    }

    if not settings.smtp_user:
        response["dev_email_otp"] = otp

    return response


# ============================================================
# OAUTH2 TOKEN
# ============================================================

@router.post("/token")
def token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    request: Request = None,
    db: Session = Depends(get_db),
):

    email = form_data.username

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if (
        not user
        or not user.password_hash
        or not verify_password(
            form_data.password,
            user.password_hash,
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before login",
        )

    return issue_session_tokens(
        db,
        user,
    )


# ============================================================
# LOGIN
# ============================================================

@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
):

    enforce_rate_limit(
        request,
        login_limiter,
        extra_key=payload.email,
    )

    user = (
        db.query(User)
        .filter(func.lower(User.email) == str(payload.email).strip().lower())
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=400,
            detail=EMAIL_NOT_REGISTERED,
        )

    if not user.password_hash:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if is_account_locked(user):

        minutes_left = max(
            1,
            int(
                (
                    user.locked_until
                    - datetime.utcnow()
                ).total_seconds()
                // 60
            ) + 1,
        )

        raise HTTPException(
            status_code=423,
            detail=(
                "Account temporarily locked due to "
                "repeated failed attempts. "
                f"Try again in {minutes_left} minute(s)."
            ),
        )

    if not verify_password(
        payload.password,
        user.password_hash,
    ):

        register_failed_login(
            db,
            user,
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=400,
            detail="Account is disabled  - contact admin",
        )

    if not user.email_verified:
        raise HTTPException(
            status_code=403,
            detail="Please verify your email before login",
        )

    register_successful_login(
        db,
        user,
    )

    return issue_session_tokens(
        db,
        user,
    )


# ============================================================
# REFRESH TOKEN
# ============================================================

@router.post(
    "/refresh",
    response_model=TokenResponse,
)
def refresh(
    payload: RefreshRequest,
    db: Session = Depends(get_db),
):

    decode_token(
        payload.refresh_token
    )

    rt_record = (
        db.query(RefreshToken)
        .filter(
            RefreshToken.token == payload.refresh_token,
            RefreshToken.revoked == False,
        )
        .first()
    )

    if (
        not rt_record
        or rt_record.expires_at < datetime.utcnow()
    ):
        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid or expired refresh token  - "
                "please login again"
            ),
        )

    user = (
        db.query(User)
        .filter(User.id == rt_record.user_id)
        .first()
    )

    if not user or not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="Account not found or disabled",
        )

    # Rotate refresh token on every use
    rt_record.revoked = True

    return issue_session_tokens(
        db,
        user,
    )


# ============================================================
# LOGOUT
# ============================================================

@router.post("/logout")
def logout(
    payload: RefreshRequest,
    db: Session = Depends(get_db),
):

    rt = (
        db.query(RefreshToken)
        .filter(
            RefreshToken.token == payload.refresh_token
        )
        .first()
    )

    if rt:
        rt.revoked = True
        db.commit()

    return {
        "message": "Logged out successfully"
    }

# ============================================================
# FORGOT PASSWORD
# ============================================================
@router.post("/forgot-password")
def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    bg: BackgroundTasks,
    db: Session = Depends(get_db),
):
    enforce_rate_limit(
        request,
        password_reset_limiter,
        extra_key=payload.email,
    )
    user = (
        db.query(User)
        .filter(User.email == payload.email)
        .first()
    )
    # Reject if email is not registered.
    if not user:
        raise HTTPException(
            status_code=404,
            detail="Email not registered",
        )
    # Allow password reset for normal and social-login users.
    token = generate_reset_token()
    user.reset_token = token
    user.reset_expires = reset_token_expiry()
    db.commit()
    link = (
        f"{settings.frontend_url}"
        f"/reset-password?token={token}"
    )
    if settings.smtp_user:
        display_name = (user.full_name or "").strip()
        bg.add_task(
            _send_password_reset_email_task,
            user.email,
            display_name,
            link,
        )
    elif settings.debug:
        print(
            f"\n[DEV MODE] Reset link for "
            f"{user.email}:\n{link}\n"
        )
    return {
        "message": "A reset link has been sent"
    }


# ============================================================
# RESET PASSWORD
# ============================================================

@router.post("/reset-password")
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):

    ok, msg = validate_password_strength(
        payload.new_password
    )

    if not ok:
        raise HTTPException(
            status_code=400,
            detail=msg,
        )

    user = (
        db.query(User)
        .filter(
            User.reset_token == payload.token
        )
        .first()
    )

    if (
        not user
        or not user.reset_expires
        or user.reset_expires < datetime.utcnow()
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid or expired reset link  - "
                "request a new one"
            ),
        )

    # Prevent reusing the current password
    if verify_password(
        payload.new_password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "New password cannot be the same as "
                "your current password. "
                "Please choose a different password."
            ),
        )

    user.password_hash = hash_password(
        payload.new_password
    )

    user.reset_token = None
    user.reset_expires = None
    user.failed_login_attempts = 0
    user.locked_until = None

    db.commit()

    return {
        "message": (
            "Password reset successfully  - "
            "you can now login"
        )
    }


# ============================================================
# CURRENT USER
# ============================================================

@router.get("/me")
def me(
    current_user: User = Depends(
        get_current_user
    ),
):
    return user_to_dict(
        current_user
    )
@router.patch("/me")
def update_me(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Persist every field on Settings > General Settings to the DB.
    full_name stays a single composed column (see models/user.py); the
    rest map 1:1 onto their own columns.
    """
    current_user.full_name = compose_full_name(
        payload.first_name, payload.last_name
    )
    current_user.mobile_number = payload.mobile_number.strip() or None
    current_user.application_name = payload.application_name.strip() or "EDABIP"
    current_user.timezone = payload.timezone.strip() or "UTC"
    current_user.company_size = payload.company_size.strip() or None
    current_user.industry = payload.industry.strip() or None
    current_user.email_notifications = payload.email_notifications
    db.commit()
    db.refresh(current_user)

    return user_to_dict(current_user)