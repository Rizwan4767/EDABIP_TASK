"""
The caller is found by the token's EMAIL, not its `sub`.

The auth backend and this module number their users in separate databases,
so `sub` (an auth-database id) says nothing about which settings row is the
caller. Every test here sends a real signed JWT through the real
get_current_user — nothing overrides it — and most of them deliberately set
`sub` to the id of a DIFFERENT settings user than the email names, so a
lookup by id would visibly resolve the wrong person. See app/core/security.py.
"""
import logging
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import jwt
import pytest

from app.core.config import settings
from app.core.rate_limit import change_password_limiter
from app.models import (
    IntegrationProvider,
    IntegrationStatus,
    NotificationPreference,
    ReportFrequency,
    Role,
    User,
    UserIntegration,
)


def _token(sub, email=None, **claims) -> str:
    # The claims utils/auth.py issue_session_tokens puts in an access token.
    payload = {
        "sub": str(sub),
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
    }
    if email is not None:
        payload["email"] = email
    payload.update(claims)
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _role(db_session, name):
    return db_session.query(Role).filter(Role.name == name).one()


@pytest.fixture
def users(db_session):
    """Settings user #1 is an Admin, #2 a Viewer, each with distinct data in
    every module, so any /me response shows unambiguously whose it is."""
    one = User(
        first_name="Una",
        last_name="First",
        email="una.first@edabip.io",
        role_id=_role(db_session, "Admin").id,
        two_factor_enabled=True,
    )
    two = User(
        first_name="Theo",
        last_name="Second",
        email="theo.second@edabip.io",
        company_size="51-200",
        role_id=_role(db_session, "Viewer").id,
        two_factor_enabled=False,
    )
    db_session.add_all([one, two])
    db_session.commit()
    assert (one.id, two.id) == (1, 2)

    db_session.add_all(
        [
            NotificationPreference(
                user_id=one.id, sms_notifications=False, report_updates=ReportFrequency.daily
            ),
            NotificationPreference(
                user_id=two.id, sms_notifications=True, report_updates=ReportFrequency.weekly
            ),
        ]
    )
    slack = db_session.query(IntegrationProvider).filter(IntegrationProvider.name == "Slack").one()
    db_session.add(
        UserIntegration(
            user_id=two.id,
            provider_id=slack.id,
            status=IntegrationStatus.active,
            connected_at=datetime.now(timezone.utc),
        )
    )
    db_session.commit()
    return SimpleNamespace(one=one, two=two)


@pytest.fixture
def as_two(users):
    """Auth-database id 1 (== settings user #1's id), email of settings user #2."""
    return _auth(_token(1, users.two.email))


# -- Resolution by email -------------------------------------------------


def test_sub_1_with_user_2s_email_resolves_to_user_2(anonymous_client, users, as_two):
    response = anonymous_client.get("/settings/general/me", headers=as_two)
    assert response.status_code == 200
    assert response.json()["email"] == users.two.email
    assert response.json()["firstName"] == "Theo"


def test_sub_does_not_grant_the_matching_settings_ids_role(anonymous_client, users, as_two):
    """sub=1 is settings user #1's id, and #1 is an Admin. The caller is #2,
    a Viewer, so the Admin-only surfaces stay shut."""
    assert anonymous_client.get("/users", headers=as_two).status_code == 403
    assert anonymous_client.get("/settings/roles", headers=as_two).status_code == 403


def test_token_without_email_is_rejected(anonymous_client, users):
    response = anonymous_client.get("/settings/general/me", headers=_auth(_token(2)))
    assert response.status_code == 401
    assert response.json()["detail"] == "Token missing email claim"


@pytest.mark.parametrize("email", ["", "   ", 42])
def test_token_with_blank_or_non_string_email_is_rejected(anonymous_client, users, email):
    response = anonymous_client.get("/settings/general/me", headers=_auth(_token(2, email)))
    assert response.status_code == 401
    assert response.json()["detail"] == "Token missing email claim"


def test_email_match_is_case_insensitive(anonymous_client, db_session, users):
    users_before = db_session.query(User).count()
    token = _token(1, "  THEO.Second@EDABIP.io ")

    response = anonymous_client.get("/settings/general/me", headers=_auth(token))

    assert response.status_code == 200
    assert response.json()["email"] == users.two.email
    assert db_session.query(User).count() == users_before  # matched, not auto-created


def test_case_insensitive_match_works_when_the_stored_email_is_mixed_case(
    anonymous_client, db_session
):
    stored = User(
        first_name="Mixed",
        last_name="Case",
        email="Mixed.Case@Edabip.IO",
        role_id=_role(db_session, "Viewer").id,
    )
    db_session.add(stored)
    db_session.commit()

    response = anonymous_client.get(
        "/settings/general/me", headers=_auth(_token(99, "mixed.case@edabip.io"))
    )
    assert response.status_code == 200
    assert response.json()["firstName"] == "Mixed"


# -- Auto-creation -------------------------------------------------------


def test_unknown_email_auto_creates_a_viewer(anonymous_client, db_session, users, caplog):
    # sub=1 is an Admin's id in THIS database; it must not leak into the new row.
    token = _token(1, "brand.new@edabip.io")

    with caplog.at_level(logging.INFO, logger="app.core.security"):
        response = anonymous_client.get("/settings/general/me", headers=_auth(token))

    assert response.status_code == 200
    assert response.json()["email"] == "brand.new@edabip.io"

    created = db_session.query(User).filter(User.email == "brand.new@edabip.io").one()
    assert created.role is not None and created.role.name == "Viewer"
    assert created.id not in (users.one.id, users.two.id)
    logged = [r for r in caplog.records if "Auto-created settings user" in r.getMessage()]
    assert len(logged) == 1
    assert logged[0].levelno == logging.INFO
    # Masked: never the full address.
    assert "br***@edabip.io" in logged[0].getMessage()
    assert "brand.new@edabip.io" not in logged[0].getMessage()

    # And the new row really is a Viewer, not merely labelled one.
    assert anonymous_client.get("/users", headers=_auth(token)).status_code == 403
    assert anonymous_client.get("/settings/roles", headers=_auth(token)).status_code == 403


def test_auto_create_never_assigns_admin_even_without_a_viewer_role(
    anonymous_client, db_session, users
):
    viewer_role = _role(db_session, "Viewer")
    users.two.role_id = None
    viewer_role.permissions = []
    db_session.delete(viewer_role)
    db_session.commit()

    token = _token(1, "no.viewer.role@edabip.io")
    assert anonymous_client.get("/settings/general/me", headers=_auth(token)).status_code == 200

    created = db_session.query(User).filter(User.email == "no.viewer.role@edabip.io").one()
    assert created.role is None
    assert anonymous_client.get("/users", headers=_auth(token)).status_code == 403


def test_auth_administrator_is_stored_as_settings_admin(anonymous_client, db_session, monkeypatch):
    """The login role lives in the auth database, not in the token.

    A platform administrator must receive the Settings Admin role, or the
    Roles & Permissions section is omitted from GET /settings/me.
    """
    monkeypatch.setattr("app.core.security._auth_role_name", lambda email: "admin")
    token = _token(99, "platform.admin@edabip.io", role="client_user")

    response = anonymous_client.get("/settings/me", headers=_auth(token))

    assert response.status_code == 200
    assert response.json()["roles"], "Admin should receive the roles payload"
    created = db_session.query(User).filter(User.email == "platform.admin@edabip.io").one()
    assert created.role is not None and created.role.name == "Admin"


def test_auth_admin_previously_stored_as_viewer_can_see_roles(
    anonymous_client, db_session, monkeypatch
):
    viewer = _role(db_session, "Viewer")
    stuck = User(email="stuck.admin@edabip.io", role_id=viewer.id)
    db_session.add(stuck)
    db_session.commit()
    monkeypatch.setattr("app.core.security._auth_role_name", lambda email: "admin")

    response = anonymous_client.get(
        "/settings/me", headers=_auth(_token(7, "stuck.admin@edabip.io"))
    )

    assert response.status_code == 200
    assert response.json()["roles"]
    refreshed = db_session.query(User).filter(User.email == "stuck.admin@edabip.io").one()
    assert refreshed.role.name == "Admin"


def test_non_admin_auth_role_stays_viewer(anonymous_client, db_session, monkeypatch):
    monkeypatch.setattr("app.core.security._auth_role_name", lambda email: "client_user")
    token = _token(4, "ordinary.user@edabip.io")

    assert anonymous_client.get("/settings/me", headers=_auth(token)).status_code == 200

    created = db_session.query(User).filter(User.email == "ordinary.user@edabip.io").one()
    assert created.role is not None and created.role.name == "Viewer"
    assert anonymous_client.get("/settings/roles", headers=_auth(token)).status_code == 403


def test_auto_create_happens_once_per_email(anonymous_client, db_session):
    token = _auth(_token(5, "once.only@edabip.io"))
    for _ in range(3):
        assert anonymous_client.get("/settings/general/me", headers=token).status_code == 200
    assert (
        db_session.query(User).filter(User.email == "once.only@edabip.io").count() == 1
    )


# -- Every module's /me route returns the email-matched user's data -------


def test_general_me_get_and_put_use_the_email_matched_user(
    anonymous_client, db_session, users, as_two
):
    got = anonymous_client.get("/settings/general/me", headers=as_two).json()
    assert (got["firstName"], got["companySize"]) == ("Theo", "51-200")

    put = anonymous_client.put(
        "/settings/general/me", headers=as_two, json={"firstName": "Theodore"}
    )
    assert put.status_code == 200
    db_session.expire_all()
    assert db_session.get(User, users.two.id).first_name == "Theodore"
    assert db_session.get(User, users.one.id).first_name == "Una"


def test_notifications_me_get_and_put_use_the_email_matched_user(
    anonymous_client, db_session, users, as_two
):
    got = anonymous_client.get("/settings/notifications/me", headers=as_two).json()
    assert got["smsNotifications"] is True
    assert got["reportUpdates"] == ReportFrequency.weekly.value

    put = anonymous_client.put(
        "/settings/notifications/me", headers=as_two, json={"smsNotifications": False}
    )
    assert put.status_code == 200
    db_session.expire_all()
    pref = lambda uid: (  # noqa: E731
        db_session.query(NotificationPreference).filter_by(user_id=uid).one()
    )
    assert pref(users.two.id).sms_notifications is False
    assert pref(users.one.id).report_updates == ReportFrequency.daily


def test_security_me_get_and_put_use_the_email_matched_user(
    anonymous_client, db_session, users, as_two
):
    got = anonymous_client.get("/settings/security/me", headers=as_two).json()
    assert got["twoFactorEnabled"] is False

    put = anonymous_client.put(
        "/settings/security/me", headers=as_two, json={"twoFactorEnabled": True}
    )
    assert put.status_code == 200
    db_session.expire_all()
    assert db_session.get(User, users.two.id).two_factor_enabled is True
    assert db_session.get(User, users.one.id).two_factor_enabled is True  # untouched


def test_security_me_change_password_uses_the_email_matched_user(
    anonymous_client, credential_store, users, as_two
):
    credential_store.seed(users.two.email, "Theo!Pass1")
    credential_store.seed(users.one.email, "Una!Pass1")

    response = anonymous_client.post(
        "/settings/security/me/change-password",
        headers=as_two,
        json={"currentPassword": "Theo!Pass1", "newPassword": "Str0ng!Pass"},
    )
    assert response.status_code == 200
    assert credential_store.current_password(users.two.email) == "Str0ng!Pass"
    assert credential_store.current_password(users.one.email) == "Una!Pass1"


def test_integrations_me_list_and_toggle_use_the_email_matched_user(
    anonymous_client, db_session, users, as_two
):
    listed = anonymous_client.get("/settings/integrations/me", headers=as_two).json()
    assert {i["name"] for i in listed if i["connected"]} == {"Slack"}

    teams = (
        db_session.query(IntegrationProvider)
        .filter(IntegrationProvider.name == "Microsoft Teams")
        .one()
    )
    toggled = anonymous_client.post(
        f"/settings/integrations/me/{teams.id}/toggle", headers=as_two, json={"connected": True}
    )
    assert toggled.status_code == 200
    active = lambda uid: {  # noqa: E731
        ui.provider_id
        for ui in db_session.query(UserIntegration).filter_by(
            user_id=uid, status=IntegrationStatus.active
        )
    }
    assert teams.id in active(users.two.id)
    assert active(users.one.id) == set()


def test_aggregate_me_returns_the_email_matched_users_data(anonymous_client, users, as_two):
    data = anonymous_client.get("/settings/me", headers=as_two).json()
    assert data["general"]["email"] == users.two.email
    assert data["general"]["firstName"] == "Theo"
    assert data["notifications"]["smsNotifications"] is True
    assert data["security"]["twoFactorEnabled"] is False
    assert {i["name"] for i in data["integrations"] if i["connected"]} == {"Slack"}
    # Every role can see the matrix. The payload is still Theo's profile,
    # not the Admin named by sub=1.
    assert len(data["roles"]) == 7


# -- Things keyed on the caller's settings id ----------------------------


def test_change_password_rate_limit_is_keyed_on_the_settings_user_id(
    anonymous_client, credential_store, users
):
    """The budget belongs to settings user #2 whatever `sub` the token carries,
    and spending it does not touch settings user #1's budget."""
    credential_store.seed(users.two.email, "Theo!Pass1")
    credential_store.seed(users.one.email, "Una!Pass1")
    wrong = {"currentPassword": "nope", "newPassword": "Str0ng!Pass"}

    for sub in range(1, 1 + change_password_limiter.max_requests):
        response = anonymous_client.post(
            "/settings/security/me/change-password",
            headers=_auth(_token(sub, users.two.email)),
            json=wrong,
        )
        assert response.status_code == 400

    # A fresh sub does not buy fresh budget for the same settings user...
    blocked = anonymous_client.post(
        "/settings/security/me/change-password",
        headers=_auth(_token(999, users.two.email)),
        json=wrong,
    )
    assert blocked.status_code == 429

    # ...and user #1, whose settings id (1) equals a sub already spent above,
    # still has theirs.
    other = anonymous_client.post(
        "/settings/security/me/change-password",
        headers=_auth(_token(2, users.one.email)),
        json=wrong,
    )
    assert other.status_code == 400


def test_admin_self_reset_guard_compares_settings_ids(anonymous_client, credential_store, users):
    """The admin reset route refuses the caller's own account. "Own" has to
    mean the settings row the email resolved to, not whatever id `sub` holds."""
    credential_store.seed(users.one.email, "Una!Pass1")
    credential_store.seed(users.two.email, "Theo!Pass1")
    # Auth id 2 for the Admin, settings user #1: sub coincides with user #2's id.
    as_admin = _auth(_token(2, users.one.email))

    own = anonymous_client.post(
        f"/settings/security/{users.one.id}/change-password",
        headers=as_admin,
        json={"newPassword": "Str0ng!Pass"},
    )
    assert own.status_code == 403
    assert "/settings/security/me/change-password" in own.json()["detail"]

    other = anonymous_client.post(
        f"/settings/security/{users.two.id}/change-password",
        headers=as_admin,
        json={"newPassword": "Str0ng!Pass"},
    )
    assert other.status_code == 200
    assert credential_store.current_password(users.two.email) == "Str0ng!Pass"


def test_admin_user_id_routes_still_use_the_settings_id(anonymous_client, users):
    as_admin = _auth(_token(2, users.one.email))
    response = anonymous_client.get(f"/settings/general/{users.two.id}", headers=as_admin)
    assert response.status_code == 200
    assert response.json()["email"] == users.two.email


# -- Email is locked on self-service --------------------------------------


EMAIL_LOCKED = "Email is managed by your login account"


def test_general_me_rejects_an_email_change(anonymous_client, db_session, users, as_two):
    response = anonymous_client.put(
        "/settings/general/me", headers=as_two, json={"email": "someone.else@edabip.io"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == EMAIL_LOCKED
    db_session.expire_all()
    assert db_session.get(User, users.two.id).email == "theo.second@edabip.io"


@pytest.mark.parametrize("same", ["theo.second@edabip.io", "Theo.Second@EDABIP.io"])
def test_general_me_accepts_the_same_email(anonymous_client, db_session, users, as_two, same):
    # The form sends every field, email included; resending it (in any case)
    # must still save the rest, and must not rewrite the stored email.
    response = anonymous_client.put(
        "/settings/general/me", headers=as_two, json={"email": same, "firstName": "Theodore"}
    )
    assert response.status_code == 200
    db_session.expire_all()
    stored = db_session.get(User, users.two.id)
    assert (stored.first_name, stored.email) == ("Theodore", "theo.second@edabip.io")


@pytest.mark.parametrize("victim_email", ["una.first@edabip.io", "UNA.FIRST@edabip.io"])
def test_user_a_cannot_take_over_user_b_by_setting_their_email(
    anonymous_client, db_session, users, victim_email
):
    """The takeover: Theo (Viewer) sets his settings email to Una's (Admin).
    Were that accepted, Una's next token would resolve to... whichever row
    matched first, and Theo's own token would stop matching his row. Either
    way identity is broken, so the change must be refused outright."""
    as_theo = _auth(_token(2, users.two.email))
    response = anonymous_client.put(
        "/settings/general/me", headers=as_theo, json={"email": victim_email}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == EMAIL_LOCKED

    db_session.expire_all()
    assert db_session.get(User, users.two.id).email == "theo.second@edabip.io"
    assert db_session.get(User, users.one.id).email == "una.first@edabip.io"
    # Theo is still Theo, and still only a Viewer.
    me = anonymous_client.get("/settings/general/me", headers=as_theo).json()
    assert me["firstName"] == "Theo"
    assert anonymous_client.get("/users", headers=as_theo).status_code == 403
