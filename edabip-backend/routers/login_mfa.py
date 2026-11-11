"""
login_mfa.py  - Login-time MFA (email OTP second factor).
"""

import secrets
from datetime import datetime, timedelta

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Request,
)
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models.user import User

from utils.auth import (
    create_access_token,
    issue_session_tokens,
    decode_token,
    generate_otp,
    otp_expiry,
    user_display_name,
)

from utils.email import send_otp_email_safe

from utils.security import (
    enforce_rate_limit,
    otp_verify_limiter,
    otp_resend_limiter,
)


router = APIRouter(
    prefix="/auth/login",
    tags=["Login MFA"],
)


_MFA_PURPOSE = "login_mfa"
_MFA_CHALLENGE_MINUTES = 5
_MFA_MAX_ATTEMPTS = 5


# ============================================================
# Schemas
# ============================================================

class MfaVerifyRequest(BaseModel):
    challenge_token: str = Field(
        ...,
        description=(
            "Short-lived JWT issued when MFA is required"
        ),
    )

    otp: str = Field(
        ...,
        min_length=4,
        max_length=10,
        description="One-time password sent to user's email",
    )


class MfaResendRequest(BaseModel):
    challenge_token: str = Field(
        ...,
        description="Same challenge token from login",
    )


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


# ============================================================
# MFA Challenge Validation
# ============================================================

def _decode_mfa_challenge(
    challenge_token: str,
) -> dict:
    """Decode and validate a login MFA challenge token."""

    try:
        claims = decode_token(
            challenge_token
        )

    except HTTPException:
        raise HTTPException(
            status_code=401,
            detail=(
                "MFA challenge expired or invalid  - "
                "please log in again"
            ),
        )

    if (
        claims.get("purpose") != _MFA_PURPOSE
        or not claims.get("sub")
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid MFA challenge token",
        )

    return claims


def create_mfa_challenge_token(
    user_id: int,
) -> str:
    """Create a short-lived JWT representing an MFA challenge."""

    return create_access_token(
        {
            "sub": str(user_id),
            "purpose": _MFA_PURPOSE,
            "jti": secrets.token_urlsafe(12),
        },
        expires_delta=timedelta(
            minutes=_MFA_CHALLENGE_MINUTES
        ),
    )


# ============================================================
# MFA Verification
# ============================================================

@router.post(
    "/mfa/verify",
    response_model=TokenResponse,
)
def verify_login_mfa(
    payload: MfaVerifyRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Verify the login MFA OTP and complete authentication.

    Successful verification returns the normal
    EDABIP access and refresh token pair.
    """

    claims = _decode_mfa_challenge(
        payload.challenge_token
    )

    try:
        user_id = int(
            claims["sub"]
        )
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid MFA challenge token",
        )

    enforce_rate_limit(
        request,
        otp_verify_limiter,
        extra_key=f"login-mfa:{user_id}",
    )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user or not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="Account not found or disabled",
        )

    if (
        not user.otp_code
        or user.otp_expires_at is None
        or user.otp_expires_at < datetime.utcnow()
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "MFA code expired  - please log in again "
                "to receive a new code"
            ),
        )

    # --------------------------------------------------------
    # Invalid OTP
    # --------------------------------------------------------

    if user.otp_code != payload.otp:

        user.otp_attempts = (
            user.otp_attempts or 0
        ) + 1

        if user.otp_attempts >= _MFA_MAX_ATTEMPTS:

            user.otp_code = None
            user.otp_expires_at = None
            user.otp_attempts = 0

            db.commit()

            raise HTTPException(
                status_code=400,
                detail=(
                    "Too many incorrect attempts  - "
                    "please log in again"
                ),
            )

        db.commit()

        remaining = (
            _MFA_MAX_ATTEMPTS
            - user.otp_attempts
        )

        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid MFA code. "
                f"{remaining} attempt(s) remaining."
            ),
        )

    # --------------------------------------------------------
    # Successful MFA
    # --------------------------------------------------------

    user.otp_code = None
    user.otp_expires_at = None
    user.otp_attempts = 0

    return issue_session_tokens(
        db,
        user,
    )


# ============================================================
# MFA Resend
# ============================================================

@router.post("/mfa/resend")
def resend_login_mfa(
    payload: MfaResendRequest,
    request: Request,
    bg: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Resend the login MFA OTP and create a new
    MFA challenge token.
    """

    claims = _decode_mfa_challenge(
        payload.challenge_token
    )

    try:
        user_id = int(
            claims["sub"]
        )
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid MFA challenge token",
        )

    enforce_rate_limit(
        request,
        otp_resend_limiter,
        extra_key=f"login-mfa-resend:{user_id}",
    )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user or not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="Account not found or disabled",
        )

    # --------------------------------------------------------
    # Generate new OTP
    # --------------------------------------------------------

    otp = generate_otp()

    user.otp_code = otp
    user.otp_expires_at = otp_expiry()
    user.otp_attempts = 0

    db.commit()

    # --------------------------------------------------------
    # Send OTP
    # --------------------------------------------------------

    if settings.smtp_user:

        bg.add_task(
            send_otp_email_safe,
            user.email,
            user_display_name(user),
            otp,
        )

    else:

        print(
            f"\n[DEV MODE] Login MFA OTP resend "
            f"for {user.email}: {otp}\n"
        )

    # --------------------------------------------------------
    # Rotate MFA challenge
    # --------------------------------------------------------

    new_challenge_token = (
        create_mfa_challenge_token(
            user.id
        )
    )

    return {
        "message": (
            "A new verification code has been "
            "sent to your email"
        ),
        "challenge_token": new_challenge_token,
        "expires_in_seconds": (
            _MFA_CHALLENGE_MINUTES * 60
        ),
        "dev_otp": (
            otp
            if not settings.smtp_user
            else None
        ),
    }
