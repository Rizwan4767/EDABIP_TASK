"""
Real bearer tokens through the real get_current_user.

Unlike the rest of the suite, nothing here overrides get_current_user: each
request carries a JWT signed with the test JWT_SECRET_KEY, and the real
dependency has to decode it. See app/core/security.py.
"""
from datetime import datetime, timedelta, timezone

import jwt
import pytest

from app.core.config import settings
from app.models import Role, User


def _token(user: User, **claims) -> str:
    # The claims the auth backend's _issue_tokens puts in an access token,
    # minus `type`, which each test sets (or leaves out) itself.
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
    }
    payload.update(claims)
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _make_user(db_session, role_name: str, email: str) -> User:
    role = db_session.query(Role).filter(Role.name == role_name).first()
    user = User(first_name="Token", last_name=role_name, email=email, role_id=role.id)
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def viewer(db_session):
    return _make_user(db_session, "Viewer", "token.viewer@edabip.io")


@pytest.fixture
def admin(db_session):
    return _make_user(db_session, "Admin", "token.admin@edabip.io")


def test_access_token_is_accepted(anonymous_client, viewer):
    response = anonymous_client.get(
        "/settings/security/me", headers=_auth(_token(viewer, type="access"))
    )
    assert response.status_code == 200


def test_access_token_for_admin_reaches_admin_routes(anonymous_client, admin):
    """Positive control for the Admin-claim test below: a real Admin's plain
    access token does get in, so the 403 there is about the claim, not the route."""
    response = anonymous_client.get("/users", headers=_auth(_token(admin, type="access")))
    assert response.status_code == 200


def test_refresh_token_is_rejected(anonymous_client, viewer):
    response = anonymous_client.get(
        "/settings/security/me", headers=_auth(_token(viewer, type="refresh"))
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid token type"


def test_token_without_type_is_rejected(anonymous_client, viewer):
    response = anonymous_client.get("/settings/security/me", headers=_auth(_token(viewer)))
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid token type"


def test_role_and_permission_claims_in_token_are_ignored(anonymous_client, viewer):
    """A Viewer's token claiming Admin (and every Users permission) is still a Viewer."""
    token = _token(
        viewer,
        type="access",
        role="Admin",
        permissions=["users:manage", "users:read", "users:write", "roles:write"],
    )
    for method, path in [("get", "/users"), ("get", "/settings/roles"), ("put", f"/users/{viewer.id}")]:
        send = getattr(anonymous_client, method)
        response = send(path, headers=_auth(token), json={}) if method == "put" else send(
            path, headers=_auth(token)
        )
        assert response.status_code == 403, f"{method.upper()} {path} returned {response.status_code}"
