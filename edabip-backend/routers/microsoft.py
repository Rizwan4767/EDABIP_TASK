"""
microsoft.py  - Microsoft (Azure AD) SSO token exchange & login redirect.
"""

from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import urlencode
import secrets

import httpx

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from jose import jwt, JWTError
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models.user import User, Role

from utils.auth import (
    issue_session_tokens,
    hash_password,
)


router = APIRouter(
    prefix="/auth",
    tags=["Microsoft SSO"],
)


# ============================================================
# Microsoft OAuth Configuration
# ============================================================

_MSFT_JWKS_TEMPLATE = (
    "https://login.microsoftonline.com/"
    "{tenant}/discovery/v2.0/keys"
)

_MSFT_ISSUER_TEMPLATE = (
    "https://login.microsoftonline.com/"
    "{tenant}/v2.0"
)


# ============================================================
# Schemas
# ============================================================

class MicrosoftExchangeRequest(BaseModel):
    id_token: str = Field(
        ...,
        description="Microsoft idToken from MSAL popup/redirect",
    )

    tenant_id: Optional[str] = Field(
        None,
        description="Override tenant ID (optional)",
    )


class MicrosoftExchangeResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


# ============================================================
# Microsoft Helpers
# ============================================================

def _get_tenant_id(
    override: Optional[str] = None,
) -> str:
    """
    Return the effective Microsoft tenant ID.

    Falls back to 'common' so personal accounts
    can work in development.
    """

    return (
        override
        or (
            settings.microsoft_tenant_id
            if hasattr(settings, "microsoft_tenant_id")
            else None
        )
        or "common"
    )


def _fetch_microsoft_jwks(
    tenant: str,
) -> list:

    url = _MSFT_JWKS_TEMPLATE.format(
        tenant=tenant
    )

    try:
        with httpx.Client(timeout=10) as client:
            response = client.get(url)
            response.raise_for_status()

            return response.json().get(
                "keys",
                []
            )

    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=503,
            detail=(
                "Could not fetch Microsoft signing keys: "
                f"{exc}"
            ),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=(
                "Could not fetch Microsoft signing keys: "
                f"{exc}"
            ),
        )


def _verify_microsoft_id_token(
    id_token: str,
    tenant: str,
) -> dict:
    """
    Decode and verify a Microsoft ID token.
    Returns the verified claims.
    """

    if not (
        hasattr(settings, "microsoft_client_id")
        and settings.microsoft_client_id
    ):
        raise HTTPException(
            status_code=503,
            detail=(
                "Microsoft SSO is not configured "
                "on this server"
            ),
        )

    jwks = _fetch_microsoft_jwks(
        tenant
    )

    allowed_issuers = [
        _MSFT_ISSUER_TEMPLATE.format(
            tenant=tenant
        ),
        _MSFT_ISSUER_TEMPLATE.format(
            tenant="{tenantid}"
        ),
    ]

    last_error: Exception = Exception(
        "No keys matched"
    )

    for key in jwks:

        try:
            claims = jwt.decode(
                id_token,
                key,
                algorithms=["RS256"],
                audience=settings.microsoft_client_id,
                options={
                    "verify_iss": False
                },
            )

            issuer = claims.get(
                "iss",
                ""
            )

            if not any(
                issuer.startswith(
                    base.split("{")[0]
                )
                for base in allowed_issuers
            ):
                raise JWTError(
                    f"Unexpected issuer: {issuer}"
                )

            return claims

        except JWTError as exc:
            last_error = exc
            continue

    raise HTTPException(
        status_code=401,
        detail=(
            "Microsoft idToken verification failed: "
            f"{last_error}"
        ),
    )


# ============================================================
# Find or Create Microsoft User
# ============================================================

def _find_or_create_user_from_microsoft(
    db: Session,
    oid: str,
    email: Optional[str],
    name: Optional[str],
) -> User:
    """
    Find an existing Microsoft user by object ID,
    link by email when available, or create a new user.

    New users receive the client_user RBAC role.
    """

    # --------------------------------------------------------
    # Existing Microsoft account
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.microsoft_oid == oid
        )
        .first()
    )

    if user:
        return user

    # --------------------------------------------------------
    # Link to existing account by email
    # --------------------------------------------------------

    if email:

        user = (
            db.query(User)
            .filter(
                User.email == email
            )
            .first()
        )

        if user:

            user.microsoft_oid = oid
            user.is_verified = True
            user.email_verified = True

            db.commit()

            return user

    # --------------------------------------------------------
    # Email is required
    # --------------------------------------------------------

    if not email:
        raise HTTPException(
            status_code=400,
            detail=(
                "Your Microsoft account has no accessible "
                "email address. Please use email/password "
                "registration instead."
            ),
        )

    # --------------------------------------------------------
    # Get default RBAC role
    # --------------------------------------------------------

    role = (
        db.query(Role)
        .filter(
            Role.name == "client_user"
        )
        .first()
    )

    if not role:
        raise HTTPException(
            status_code=500,
            detail=(
                "Default 'client_user' role is not "
                "configured  - run the seed script"
            ),
        )

    # --------------------------------------------------------
    # Create new Microsoft user
    # --------------------------------------------------------

    user = User(
        role_id=role.id,
        full_name=(
            name
            or email.split("@")[0]
        ),
        email=email,
        microsoft_oid=oid,
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
# Microsoft Token Exchange
# ============================================================

@router.post(
    "/microsoft/exchange",
    response_model=MicrosoftExchangeResponse,
)
def microsoft_exchange(
    payload: MicrosoftExchangeRequest,
    db: Session = Depends(get_db),
):
    """
    Exchange a Microsoft MSAL ID token
    for an EDABIP JWT session.
    """

    tenant = _get_tenant_id(
        payload.tenant_id
    )

    claims = _verify_microsoft_id_token(
        payload.id_token,
        tenant,
    )

    oid = (
        claims.get("oid")
        or claims.get("sub")
    )

    if not oid:
        raise HTTPException(
            status_code=400,
            detail=(
                "Microsoft token is missing the "
                "user identifier (oid/sub)"
            ),
        )

    email = (
        claims.get("email")
        or claims.get("preferred_username")
    )

    name = claims.get("name")

    user = _find_or_create_user_from_microsoft(
        db,
        oid,
        email,
        name,
    )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail=(
                "Account is disabled  - contact admin"
            ),
        )

    return issue_session_tokens(
        db,
        user,
    )


# ============================================================
# Microsoft Login
# ============================================================

@router.get("/microsoft/login")
def microsoft_login():

    if not (
        hasattr(
            settings,
            "microsoft_client_id",
        )
        and settings.microsoft_client_id
    ):
        raise HTTPException(
            status_code=503,
            detail=(
                "Microsoft login is not configured "
                "on this server"
            ),
        )

    tenant = _get_tenant_id()

    redirect_uri = (
        "http://localhost:8000"
        "/auth/microsoft/callback"
    )

    params = {
        "client_id": settings.microsoft_client_id,
        "response_type": "code",
        "redirect_uri": redirect_uri,
        "response_mode": "query",
        "scope": "user.read openid profile email",
    }

    microsoft_url = (
        f"https://login.microsoftonline.com/"
        f"{tenant}/oauth2/v2.0/authorize?"
        f"{urlencode(params)}"
    )

    return RedirectResponse(
        url=microsoft_url
    )


# ============================================================
# Microsoft Callback
# ============================================================

@router.get("/microsoft/callback")
def microsoft_callback(
    code: Optional[str] = None,
    error: Optional[str] = None,
    db: Session = Depends(get_db),
):

    if error:
        return RedirectResponse(
            url=(
                f"{settings.frontend_url}"
                "/login?oauth_error=microsoft_denied"
            )
        )

    if not code:
        raise HTTPException(
            status_code=400,
            detail="Missing Microsoft authorization code",
        )

    tenant = _get_tenant_id()

    token_url = (
        f"https://login.microsoftonline.com/"
        f"{tenant}/oauth2/v2.0/token"
    )

    redirect_uri = (
        "http://localhost:8000"
        "/auth/microsoft/callback"
    )

    with httpx.Client(timeout=10) as client:

        token_res = client.post(
            token_url,
            data={
                "client_id": settings.microsoft_client_id,
                "client_secret": settings.microsoft_client_secret,
                "code": code,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
        )

        if token_res.status_code != 200:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Failed to exchange Microsoft code: "
                    f"{token_res.text}"
                ),
            )

        token_data = token_res.json()

        id_token = token_data.get(
            "id_token"
        )

        if not id_token:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Microsoft token response "
                    "missing id_token"
                ),
            )

    # --------------------------------------------------------
    # Verify ID token
    # --------------------------------------------------------

    claims = _verify_microsoft_id_token(
        id_token,
        tenant,
    )

    oid = (
        claims.get("oid")
        or claims.get("sub")
    )

    if not oid:
        raise HTTPException(
            status_code=400,
            detail=(
                "Microsoft token is missing the "
                "user identifier (oid/sub)"
            ),
        )

    email = (
        claims.get("email")
        or claims.get("preferred_username")
    )

    name = claims.get("name")

    # --------------------------------------------------------
    # Find or create local user
    # --------------------------------------------------------

    user = _find_or_create_user_from_microsoft(
        db,
        oid,
        email,
        name,
    )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail=(
                "Account is disabled  - contact admin"
            ),
        )

    # --------------------------------------------------------
    # Issue EDABIP tokens
    # --------------------------------------------------------

    tokens = issue_session_tokens(
        db,
        user,
    )

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
