"""
Every login path of the auth backend issues a session token carrying `email`.

The Settings module finds the caller by that claim (app/core/security.py), so
a login path that forgets it produces a token Settings answers with 401.
These tests drive the real auth-backend routes (routers/auth.py, login_mfa.py,
microsoft.py, oauth.py) and sign with the real utils/auth.py functions. Only
the network calls to Microsoft and Google are faked, and the auth backend's
MySQL `database` module is swapped for in-memory SQLite before anything
imports it — the real one connects to MySQL at import time.
"""
import sys
import types
from datetime import datetime, timedelta
from urllib.parse import parse_qs, urlparse

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool


def _install_sqlite_auth_database():
    if "database" in sys.modules:
        return sys.modules["database"]
    mod = types.ModuleType("database")
    mod.engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    mod.SessionLocal = sessionmaker(bind=mod.engine, autoflush=False, autocommit=False)
    mod.Base = declarative_base()

    def get_db():
        db = mod.SessionLocal()
        try:
            yield db
        finally:
            db.close()

    mod.get_db = get_db
    sys.modules["database"] = mod
    return mod


auth_database = _install_sqlite_auth_database()

from models.user import RefreshToken, Role, User  # noqa: E402
from routers import auth as auth_router  # noqa: E402
from routers import login_mfa, microsoft, oauth  # noqa: E402
from utils.auth import decode_token, hash_password, issue_session_tokens  # noqa: E402

EMAIL = "thomas.login@edabip.io"
PASSWORD = "Sup3r!Secret"


@pytest.fixture
def auth_db():
    auth_database.Base.metadata.create_all(auth_database.engine)
    session = auth_database.SessionLocal()
    try:
        yield session
    finally:
        session.close()
        auth_database.Base.metadata.drop_all(auth_database.engine)


@pytest.fixture
def auth_user(auth_db):
    role = Role(name="client_user")
    auth_db.add(role)
    auth_db.flush()
    user = User(
        role_id=role.id,
        full_name="Thomas Login",
        email=EMAIL,
        password_hash=hash_password(PASSWORD),
        is_active=True,
        is_verified=True,
        email_verified=True,
    )
    auth_db.add(user)
    auth_db.commit()
    return user


@pytest.fixture
def auth_client(auth_db):
    app = FastAPI()
    for module in (auth_router, login_mfa, microsoft, oauth):
        app.include_router(module.router)

    def override_get_db():
        yield auth_db

    app.dependency_overrides[auth_database.get_db] = override_get_db
    return TestClient(app)


def _assert_session_token(token: str, user: User) -> dict:
    claims = decode_token(token)
    assert claims["type"] == "access"
    assert claims["sub"] == str(user.id)
    assert claims["email"] == EMAIL
    return claims


# -- Each login path -----------------------------------------------------


def test_password_login_token_contains_email(auth_client, auth_user):
    response = auth_client.post("/auth/login", json={"email": EMAIL, "password": PASSWORD})
    assert response.status_code == 200, response.text
    _assert_session_token(response.json()["access_token"], auth_user)


def test_refresh_token_exchange_token_contains_email(auth_client, auth_user):
    login = auth_client.post("/auth/login", json={"email": EMAIL, "password": PASSWORD}).json()
    response = auth_client.post("/auth/refresh", json={"refresh_token": login["refresh_token"]})
    assert response.status_code == 200, response.text
    _assert_session_token(response.json()["access_token"], auth_user)


def test_mfa_verify_token_contains_email_but_challenge_does_not(auth_client, auth_db, auth_user):
    challenge = login_mfa.create_mfa_challenge_token(auth_user.id)
    # The challenge is not a session and must not become one to Settings.
    assert "email" not in decode_token(challenge)

    auth_user.otp_code = "4821"
    auth_user.otp_expires_at = datetime.utcnow() + timedelta(minutes=5)
    auth_user.otp_attempts = 0
    auth_db.commit()

    response = auth_client.post(
        "/auth/login/mfa/verify", json={"challenge_token": challenge, "otp": "4821"}
    )
    assert response.status_code == 200, response.text
    _assert_session_token(response.json()["access_token"], auth_user)


def test_microsoft_exchange_token_contains_email(auth_client, auth_user, monkeypatch):
    # Only the Microsoft network round-trip (JWKS fetch + signature check) is faked.
    monkeypatch.setattr(microsoft, "_get_tenant_id", lambda tenant=None: "common")
    monkeypatch.setattr(
        microsoft,
        "_verify_microsoft_id_token",
        lambda id_token, tenant: {"oid": "ms-oid-1", "email": EMAIL, "name": "Thomas Login"},
    )
    response = auth_client.post("/auth/microsoft/exchange", json={"id_token": "fake"})
    assert response.status_code == 200, response.text
    _assert_session_token(response.json()["access_token"], auth_user)


class _FakeGoogle:
    """Stands in for httpx.Client in routers/oauth.py's Google callback."""

    def __init__(self, *args, **kwargs):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def post(self, url, data=None):
        return types.SimpleNamespace(status_code=200, json=lambda: {"access_token": "g-token"})

    def get(self, url, headers=None):
        profile = {"sub": "google-1", "email": EMAIL, "email_verified": True, "name": "Thomas"}
        return types.SimpleNamespace(status_code=200, json=lambda: profile)


def test_google_oauth_callback_token_contains_email(auth_client, auth_user, monkeypatch):
    monkeypatch.setattr(oauth.httpx, "Client", _FakeGoogle)
    state = oauth._make_state()
    assert "email" not in decode_token(state)

    response = auth_client.get(
        "/auth/google/callback",
        params={"code": "c", "state": state},
        follow_redirects=False,
    )
    assert response.status_code in (302, 307), response.text
    fragment = parse_qs(urlparse(response.headers["location"]).fragment)
    _assert_session_token(fragment["access_token"][0], auth_user)


# -- The shared issuer itself ---------------------------------------------


def test_issue_session_tokens_refuses_a_user_without_email(auth_db, auth_user):
    auth_user.email = ""
    with pytest.raises(ValueError):
        issue_session_tokens(auth_db, auth_user)
    auth_db.rollback()
    assert auth_db.query(RefreshToken).count() == 0


# -- End to end: Settings accepts what the auth backend issues ------------


def test_password_login_token_is_accepted_by_settings(
    auth_client, auth_user, anonymous_client, db_session
):
    token = auth_client.post(
        "/auth/login", json={"email": EMAIL, "password": PASSWORD}
    ).json()["access_token"]
    response = anonymous_client.get(
        "/settings/general/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200, response.text
    assert response.json()["email"] == EMAIL
