from app.core.auth_credentials import verify_password as verify_bcrypt
from types import SimpleNamespace

from fastapi import HTTPException

from app.core.rate_limit import RateLimiter, change_password_limiter, enforce_rate_limit
from app.models import Role, User
from tests.conftest import ADMIN_EMAIL, ADMIN_PASSWORD


def test_get_my_security_settings_defaults_to_two_factor_enabled(client):
    response = client.get("/settings/security/me")
    assert response.status_code == 200
    assert response.json()["twoFactorEnabled"] is True


def test_update_my_security_settings_toggles_two_factor(client):
    response = client.put("/settings/security/me", json={"twoFactorEnabled": False})
    assert response.status_code == 200
    assert response.json()["twoFactorEnabled"] is False

    # Persisted, not just echoed back.
    again = client.get("/settings/security/me")
    assert again.json()["twoFactorEnabled"] is False


def test_change_my_password_happy_path(client, db_session, credential_store):
    response = client.post(
        "/settings/security/me/change-password",
        json={"currentPassword": ADMIN_PASSWORD, "newPassword": "Str0ng!Pass"},
    )
    assert response.status_code == 200
    assert response.json()["ok"] is True

    # The credential the LOGIN flow checks is the one that changed. That store
    # stands in for the auth backend's database, which is separate from this
    # module's (see app/core/auth_credentials.py).
    assert credential_store.current_password(ADMIN_EMAIL) == "Str0ng!Pass"

    # ...and this module's own column mirrors it, in the auth backend's bcrypt
    # format.
    user = db_session.query(User).filter(User.email == ADMIN_EMAIL).first()
    assert user.password_hash is not None
    assert verify_bcrypt("Str0ng!Pass", user.password_hash) is True
    assert verify_bcrypt("wrong-password", user.password_hash) is False


def test_change_my_password_requires_current_password_field(client, credential_store):
    """Omitting it is a schema error, not a silently-accepted change."""
    response = client.post(
        "/settings/security/me/change-password", json={"newPassword": "Str0ng!Pass"}
    )
    assert response.status_code == 422
    assert credential_store.current_password(ADMIN_EMAIL) == ADMIN_PASSWORD


def test_change_my_password_rejects_wrong_current_password(client, credential_store):
    response = client.post(
        "/settings/security/me/change-password",
        json={"currentPassword": "not-my-password", "newPassword": "Str0ng!Pass"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Current password is incorrect."
    # A failed check must not have written anything.
    assert credential_store.current_password(ADMIN_EMAIL) == ADMIN_PASSWORD


def test_change_my_password_checks_current_before_validating_new(client, credential_store):
    """A wrong current password reports 400, not the new password's 422.

    Otherwise the status code itself tells an attacker whether their guess at
    the current password was right.
    """
    response = client.post(
        "/settings/security/me/change-password",
        json={"currentPassword": "not-my-password", "newPassword": "weak"},
    )
    assert response.status_code == 400
    assert credential_store.current_password(ADMIN_EMAIL) == ADMIN_PASSWORD


def test_change_my_password_rejects_empty(client, credential_store):
    response = client.post(
        "/settings/security/me/change-password",
        json={"currentPassword": ADMIN_PASSWORD, "newPassword": ""},
    )
    assert response.status_code == 422
    assert response.json()["detail"] == "Password is required."
    assert credential_store.current_password(ADMIN_EMAIL) == ADMIN_PASSWORD


def test_change_my_password_rejects_weak_password(client, credential_store):
    # Missing an uppercase letter and a special character — the frontend's
    # own getPasswordError() would already block this client-side; this is
    # the server-side backstop for direct API callers.
    response = client.post(
        "/settings/security/me/change-password",
        json={"currentPassword": ADMIN_PASSWORD, "newPassword": "weakpass1"},
    )
    assert response.status_code == 422
    assert credential_store.current_password(ADMIN_EMAIL) == ADMIN_PASSWORD


def test_change_my_password_404s_without_a_login_account(client, credential_store):
    """The two backends' user tables can drift.

    When the caller has no row in the auth store there is no credential to
    change, and the endpoint says so rather than writing a local hash that no
    login flow will ever read.
    """
    credential_store._passwords.pop(ADMIN_EMAIL)
    response = client.post(
        "/settings/security/me/change-password",
        json={"currentPassword": ADMIN_PASSWORD, "newPassword": "Str0ng!Pass"},
    )
    assert response.status_code == 404


def test_admin_get_and_update_security_settings_by_id(client, db_session):
    user = User(first_name="Sec", last_name="Target", email="sectarget@edabip.com")
    db_session.add(user)
    db_session.commit()

    get_resp = client.get(f"/settings/security/{user.id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["twoFactorEnabled"] is True  # column default

    put_resp = client.put(f"/settings/security/{user.id}", json={"twoFactorEnabled": False})
    assert put_resp.status_code == 200
    assert put_resp.json()["twoFactorEnabled"] is False


def test_admin_change_password_by_id(client, db_session, credential_store):
    """Admin reset takes no current password — the `users:write` permission
    on the endpoint is what authorizes it."""
    user = User(first_name="Sec", last_name="Target2", email="sectarget2@edabip.com")
    db_session.add(user)
    db_session.commit()
    credential_store.seed(user.email, "Old!Password1")

    response = client.post(
        f"/settings/security/{user.id}/change-password", json={"newPassword": "Adm1n!Pass"}
    )
    assert response.status_code == 200
    assert credential_store.current_password(user.email) == "Adm1n!Pass"

    db_session.refresh(user)
    assert verify_bcrypt("Adm1n!Pass", user.password_hash) is True


def test_security_settings_404_for_unknown_user(client):
    response = client.get("/settings/security/999999")
    assert response.status_code == 404


# ---------- Rate limiting (app/core/rate_limit.py) ----------


def _attempt(client, current="whatever-is-wrong", new="Str0ng!Pass"):
    return client.post(
        "/settings/security/me/change-password",
        json={"currentPassword": current, "newPassword": new},
    )


def test_change_password_is_rate_limited_after_repeated_attempts(client):
    """Without a cap this endpoint is an unthrottled oracle against the live
    login credential: failures here never reach the auth backend's own
    lockout counters, so an attacker holding a session token could guess the
    real password indefinitely."""
    for attempt in range(change_password_limiter.max_requests):
        assert _attempt(client).status_code == 400, f"attempt {attempt + 1} should still be allowed"

    blocked = _attempt(client)
    assert blocked.status_code == 429
    assert "Too many password change attempts" in blocked.json()["detail"]


def test_rate_limit_counts_successful_changes_too(client, credential_store):
    """The budget is spent per request, not per failure, so a correct guess
    cannot be used to refill it."""
    assert _attempt(client, current=ADMIN_PASSWORD, new="Str0ng!Pass").status_code == 200
    for _ in range(change_password_limiter.max_requests - 1):
        _attempt(client)
    assert _attempt(client).status_code == 429


def test_rate_limit_is_keyed_per_account_not_per_ip():
    """One account exhausting its budget must not lock out another, and an
    attacker holding one stolen token must not buy fresh budget by changing
    IP. Exercised directly rather than through two client fixtures, which
    cannot be combined: both install the same global dependency override.
    """
    limiter = RateLimiter(max_requests=2, window_seconds=900)

    def attempt(user_id, ip):
        request = SimpleNamespace(headers={}, client=SimpleNamespace(host=ip))
        try:
            enforce_rate_limit(request, limiter, extra_key=str(user_id))
            return True
        except HTTPException as exc:
            assert exc.status_code == 429
            return False

    # User 1 spends its budget, moving to a new IP each time.
    assert attempt(1, "10.0.0.1") is True
    assert attempt(1, "10.0.0.2") is True
    assert attempt(1, "10.0.0.3") is False  # a new IP buys nothing

    # User 2 is untouched, even from an IP user 1 already burned.
    assert attempt(2, "10.0.0.1") is True


def test_admin_reset_is_not_rate_limited(client, db_session, credential_store):
    """The limiter guards the current-password oracle. The admin path has no
    such check, and throttling it would cap legitimate bulk resets."""
    user = User(first_name="Reset", last_name="Target", email="resettarget@edabip.com")
    db_session.add(user)
    db_session.commit()
    credential_store.seed(user.email, "Old!Password1")

    for index in range(change_password_limiter.max_requests + 2):
        response = client.post(
            f"/settings/security/{user.id}/change-password",
            json={"newPassword": f"Adm1n!Pass{index}"},
        )
        assert response.status_code == 200


# ---------- Parity with the auth backend's reset_password ----------


def test_change_password_rejects_reusing_the_current_password(client, credential_store):
    """Same rule, same wording as edabip-backend's reset_password. A change
    that changes nothing silently defeats the rotation the user thinks they
    just performed."""
    response = client.post(
        "/settings/security/me/change-password",
        json={"currentPassword": ADMIN_PASSWORD, "newPassword": ADMIN_PASSWORD},
    )
    # 422 (a bad NEW password), not 400 (a bad CURRENT one) — see _set_password.
    assert response.status_code == 422
    assert "cannot be the same as your current password" in response.json()["detail"]
    assert credential_store.current_password(ADMIN_EMAIL) == ADMIN_PASSWORD


def test_admin_reset_also_rejects_reusing_the_current_password(
    client, db_session, credential_store
):
    user = User(first_name="Same", last_name="Pass", email="samepass@edabip.com")
    db_session.add(user)
    db_session.commit()
    credential_store.seed(user.email, "Old!Password1")

    response = client.post(
        f"/settings/security/{user.id}/change-password",
        json={"newPassword": "Old!Password1"},
    )
    assert response.status_code == 422
    assert credential_store.current_password(user.email) == "Old!Password1"


def test_successful_change_clears_failed_logins_and_lockout(client, credential_store):
    """Matches reset_password in edabip-backend/routers/auth.py. Otherwise a
    user who locked themselves out could change their password here and still
    be refused at login, with nothing explaining why."""
    credential_store.lock_out(ADMIN_EMAIL, attempts=5, until="2099-01-01T00:00:00")

    response = client.post(
        "/settings/security/me/change-password",
        json={"currentPassword": ADMIN_PASSWORD, "newPassword": "Str0ng!Pass"},
    )
    assert response.status_code == 200

    state = credential_store.lockout_state(ADMIN_EMAIL)
    assert state["failed_login_attempts"] == 0
    assert state["locked_until"] is None


def test_failed_change_leaves_lockout_untouched(client, credential_store):
    """A refused attempt must not clear a lockout — that would turn this
    endpoint into a way to undo the auth backend's brute-force protection."""
    credential_store.lock_out(ADMIN_EMAIL, attempts=5, until="2099-01-01T00:00:00")

    assert _attempt(client).status_code == 400

    state = credential_store.lockout_state(ADMIN_EMAIL)
    assert state["failed_login_attempts"] == 5
    assert state["locked_until"] == "2099-01-01T00:00:00"


# ---------- Admin reset is Admin-only (users:write is not enough) ----------


def test_admin_reset_refused_for_users_write_without_admin_role(
    user_manager_client, db_session, credential_store
):
    """users:write gets past the endpoint's permission check, but a password
    reset with no current-password check is reserved for Admin."""
    user = User(first_name="Plain", last_name="Target", email="plaintarget@edabip.com")
    db_session.add(user)
    db_session.commit()
    credential_store.seed(user.email, "Old!Password1")

    response = user_manager_client.post(
        f"/settings/security/{user.id}/change-password", json={"newPassword": "Adm1n!Pass"}
    )
    assert response.status_code == 403
    assert credential_store.current_password(user.email) == "Old!Password1"


def test_admin_reset_refused_when_target_is_an_admin(client, db_session, credential_store):
    admin_role = db_session.query(Role).filter(Role.name == "Admin").first()
    other_admin = User(
        first_name="Other", last_name="Admin", email="otheradmin@edabip.com", role_id=admin_role.id
    )
    db_session.add(other_admin)
    db_session.commit()
    credential_store.seed(other_admin.email, "Old!Password1")

    response = client.post(
        f"/settings/security/{other_admin.id}/change-password", json={"newPassword": "Adm1n!Pass"}
    )
    assert response.status_code == 403
    assert credential_store.current_password(other_admin.email) == "Old!Password1"


def test_admin_reset_refused_when_target_is_the_caller(client, db_session, credential_store):
    """Your own password goes through /me/change-password, which checks the
    current one; the admin path would let a stolen session skip that."""
    me = db_session.query(User).filter(User.email == ADMIN_EMAIL).first()

    response = client.post(
        f"/settings/security/{me.id}/change-password", json={"newPassword": "Adm1n!Pass"}
    )
    assert response.status_code == 403
    assert "/me/change-password" in response.json()["detail"]
    assert credential_store.current_password(ADMIN_EMAIL) == ADMIN_PASSWORD
