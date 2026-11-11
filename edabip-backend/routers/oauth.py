"""
oauth.py  - Google OAuth2 login.

Flow:
1. GET /auth/google/login -> redirects to Google's consent screen.
2. Google redirects to /auth/google/callback.
3. The backend exchanges the code, gets the Google profile,
   finds or creates the user, issues JWT tokens, and redirects
   to the frontend.
4. Tokens are returned in the URL fragment.
"""

from datetime import timedelta
from typing import Optional
from urllib.parse import urlencode
import secrets

import httpx

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from database import get_db
from models.user import User, Role

from utils.auth import (
    create_access_token,
    issue_session_tokens,
    decode_token,
    hash_password,
    user_to_dict,
)

from config import settings


router = APIRouter(
    prefix="/auth",
    tags=["OAuth"],
)


# ============================================================
# OAuth State
# ============================================================

def _make_state() -> str:
    """Create a short-lived signed OAuth state token."""

    return create_access_token(
        {
            "purpose": "oauth_state",
            "provider": "google",
        },
        expires_delta=timedelta(minutes=10),
    )


def _verify_state(state: str) -> None:
    """Validate the OAuth state token."""

    try:
        payload = decode_token(state)

    except HTTPException:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid or expired sign-in attempt  - "
                "please try again"
            ),
        )

    if (
        payload.get("purpose") != "oauth_state"
        or payload.get("provider") != "google"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Sign-in state mismatch  - "
                "please try again"
            ),
        )


# ============================================================
# Session / JWT
# ============================================================

def _issue_session_and_redirect(
    db: Session,
    user: User,
) -> RedirectResponse:

    tokens = issue_session_tokens(db, user)

    fragment = urlencode(
        {
            "access_token": tokens["access_token"],
            "refresh_token": tokens["refresh_token"],
        }
    )

    return RedirectResponse(
        url=(
            f"{settings.frontend_url}"
            f"/oauth-callback#{fragment}"
        )
    )


# ============================================================
# Find or Create Google User
# ============================================================

def _find_or_create_user(
    db: Session,
    google_id: str,
    email: Optional[str],
    name: Optional[str],
    email_verified: bool,
) -> User:

    # --------------------------------------------------------
    # Existing Google account
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(User.google_id == google_id)
        .first()
    )

    if user:
        return user

    # --------------------------------------------------------
    # Link Google account to existing verified email account
    # --------------------------------------------------------

    if email and email_verified:

        user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if user:

            user.google_id = google_id
            user.is_verified = True
            user.email_verified = True

            db.commit()

            return user

    # --------------------------------------------------------
    # Google account must provide an email
    # --------------------------------------------------------

    if not email:
        raise HTTPException(
            status_code=400,
            detail=(
                "Your Google account has no accessible email "
                "address. Please use email/password "
                "registration instead."
            ),
        )

    # --------------------------------------------------------
    # Get default RBAC role
    # --------------------------------------------------------

    role = (
        db.query(Role)
        .filter(Role.name == "client_user")
        .first()
    )

    if not role:
        raise HTTPException(
            status_code=500,
            detail=(
                "Default 'client_user' role is not configured"
            ),
        )

    # --------------------------------------------------------
    # Create new Google user
    # --------------------------------------------------------

    full_name = (
        name
        or email.split("@")[0]
    )

    user = User(
        role_id=role.id,
        full_name=full_name,
        email=email,
        google_id=google_id,
        password_hash=hash_password(
            secrets.token_urlsafe(32)
        ),
        is_active=True,
        is_verified=True,
        email_verified=True,
    )

    db.add(user)

    db.commit()

    db.refresh(user)

    return user


# ============================================================
# Google Login
# ============================================================

@router.get("/google/login")
def google_login():

    if not settings.google_client_id:
        raise HTTPException(
            status_code=503,
            detail=(
                "Google login is not configured "
                "on this server"
            ),
        )

    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": _make_state(),
        "prompt": "select_account",
    }

    google_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        + urlencode(params)
    )

    return RedirectResponse(
        url=google_url
    )


# ============================================================
# Google Callback
# ============================================================

@router.get("/google/callback")
def google_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    db: Session = Depends(get_db),
):

    # --------------------------------------------------------
    # User denied Google login
    # --------------------------------------------------------

    if error:
        return RedirectResponse(
            url=(
                f"{settings.frontend_url}"
                "/login?oauth_error=google_denied"
            )
        )

    # --------------------------------------------------------
    # Validate callback parameters
    # --------------------------------------------------------

    if not code or not state:
        raise HTTPException(
            status_code=400,
            detail="Missing OAuth code or state",
        )

    _verify_state(state)

    # --------------------------------------------------------
    # Exchange authorization code for Google token
    # --------------------------------------------------------

    with httpx.Client(timeout=10) as client:

        token_res = client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
        )

        if token_res.status_code != 200:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Failed to exchange Google "
                    "authorization code"
                ),
            )

        google_access_token = (
            token_res.json()
            .get("access_token")
        )

        if not google_access_token:
            raise HTTPException(
                status_code=400,
                detail="Google access token was not returned",
            )

        # ----------------------------------------------------
        # Fetch Google profile
        # ----------------------------------------------------

        profile_res = client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={
                "Authorization": (
                    f"Bearer {google_access_token}"
                )
            },
        )

        if profile_res.status_code != 200:
            raise HTTPException(
                status_code=400,
                detail="Failed to fetch Google profile",
            )

        profile = profile_res.json()

    # --------------------------------------------------------
    # Find or create local EDABIP user
    # --------------------------------------------------------

    user = _find_or_create_user(
        db=db,
        google_id=profile["sub"],
        email=profile.get("email"),
        name=profile.get("name"),
        email_verified=bool(
            profile.get("email_verified")
        ),
    )

    # --------------------------------------------------------
    # Issue EDABIP JWT session
    # --------------------------------------------------------

    return _issue_session_and_redirect(
        db,
        user,
    )
