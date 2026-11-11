"""
Authorization: who is refused, and who is let through.

Everything here signs in as a real, valid user. None of these are 401 cases —
the point is that authentication alone is not authorization. `viewer_client`
holds the Viewer role, which has none of the Users & Access Management
permissions; `client` holds Admin.

Permissions are resolved from the database, not from the token: the auth
backend mints tokens carrying only `sub` (edabip-backend/routers/auth.py) and
runs against a separate database, so a role name never arrives in the JWT.
See app/core/security.py.
"""
import pytest

from app.core.permissions_catalog import GRANTED_BY, granting_codes
from app.models import Permission, Role, User
from tests.conftest import ADMIN_EMAIL, VIEWER_EMAIL

FORBIDDEN_DETAIL = "You do not have permission to perform this action"


# ---------- Users & Access Management is closed to a normal user ----------

# (method, path) for every admin surface a Viewer must not reach. Paths use a
# user/role id that need not exist: the permission check runs as a router
# dependency, before the handler that would 404, so an unauthorized caller
# cannot use 403-vs-404 to probe which ids are real.
FORBIDDEN_ROUTES = [
    ("get", "/users"),
    ("get", "/users/1"),
    ("post", "/users"),
    ("put", "/users/1"),
    ("put", "/users/1/role"),
    ("post", "/users/1/deactivate"),
    ("post", "/users/1/reactivate"),
    ("delete", "/users/1"),
    ("get", "/settings/roles"),
    ("post", "/settings/roles"),
    ("put", "/settings/roles/1"),
    ("delete", "/settings/roles/1"),
    ("get", "/settings/permissions"),
    ("post", "/settings/permissions"),
    ("get", "/settings/permissions/matrix"),
    ("put", "/settings/permissions/1"),
    ("get", "/settings/general/1"),
    ("put", "/settings/general/1"),
    ("get", "/settings/notifications/1"),
    ("put", "/settings/notifications/1"),
    ("get", "/settings/integrations/1"),
    ("post", "/settings/integrations/1/1/toggle"),
    ("get", "/settings/security/1"),
    ("put", "/settings/security/1"),
    ("post", "/settings/security/1/change-password"),
]


@pytest.mark.parametrize("method,path", FORBIDDEN_ROUTES)
def test_viewer_gets_403(viewer_client, method, path):
    send = getattr(viewer_client, method)
    # An empty body where the method takes one: the request must be refused on
    # authorization, so it never has to be well-formed.
    response = send(path, json={}) if method in {"post", "put"} else send(path)
    assert response.status_code == 403, f"{method.upper()} {path} returned {response.status_code}"
    assert response.json()["detail"] == FORBIDDEN_DETAIL


def test_403_is_returned_before_the_body_is_validated(viewer_client):
    """An unauthorized caller gets 403, not 422.

    If schema validation ran first, an outsider could map the API's request
    shapes by reading the validation errors on endpoints they cannot call.
    """
    response = viewer_client.post("/settings/roles", json={"nonsense": True})
    assert response.status_code == 403


def test_403_is_returned_before_the_handler_can_404(viewer_client):
    response = viewer_client.get("/users/999999")
    assert response.status_code == 403


def test_admin_is_allowed_through_the_same_routes(client):
    """The mirror of test_viewer_gets_403: the gate refuses the unprivileged
    caller without also breaking the privileged one."""
    assert client.get("/users").status_code == 200
    assert client.get("/settings/roles").status_code == 200
    assert client.get("/settings/permissions/matrix").status_code == 200


# ---------- Self-service endpoints stay open ----------

SELF_SERVICE_ROUTES = [
    ("get", "/settings/me"),
    ("get", "/settings/general/me"),
    ("get", "/settings/notifications/me"),
    ("get", "/settings/security/me"),
    ("get", "/settings/integrations/me"),
]


@pytest.mark.parametrize("method,path", SELF_SERVICE_ROUTES)
def test_viewer_can_still_reach_their_own_settings(viewer_client, method, path):
    """Locking down the admin surface must not lock a normal user out of
    their own Settings page."""
    assert getattr(viewer_client, method)(path).status_code == 200


# ---------- /settings/me includes the permission matrix for every role ----------


def test_settings_me_includes_roles_for_a_normal_user(viewer_client):
    """Roles Overview and the Permission Matrix are visible to every role.
    A Viewer still cannot call the admin write routes."""
    response = viewer_client.get("/settings/me")
    assert response.status_code == 200
    body = response.json()

    assert len(body["roles"]) == 7
    assert body["general"]["email"]
    assert body["notifications"]
    assert body["security"]
    assert body["options"]["modules"]
    assert viewer_client.get("/settings/roles").status_code == 403


def test_settings_me_includes_roles_for_an_admin(client):
    response = client.get("/settings/me")
    assert response.status_code == 200
    roles = response.json()["roles"]

    assert len(roles) == 7
    admin = next(role for role in roles if role["name"] == "Admin")
    assert admin["permissions"]["users"]["manage"] == "access"


# ---------- How permissions are resolved ----------


def test_permission_comes_from_the_role_link_not_the_role_name(viewer_client, db_session):
    """Granting the matrix cell to the Viewer role opens the gate, with no
    code change and nothing hard-coded about which names are privileged."""
    assert viewer_client.get("/settings/roles").status_code == 403

    viewer = db_session.query(Role).filter(Role.name == "Viewer").one()
    users_manage = db_session.query(Permission).filter(Permission.code == "users:manage").one()
    viewer.permissions.append(users_manage)
    db_session.commit()

    assert viewer_client.get("/settings/roles").status_code == 200


def test_revoking_the_permission_closes_the_gate_again(client, db_session):
    """The check reads current state on every request, so a revocation takes
    effect immediately rather than at the next login."""
    assert client.get("/users").status_code == 200

    # Admin is a superuser by name (see SUPERUSER_ROLE), so demote the caller
    # to a role whose access depends purely on its links.
    analyst = db_session.query(Role).filter(Role.name == "Business Analyst").one()
    caller = db_session.query(User).filter(User.email == ADMIN_EMAIL).one()
    caller.role_id = analyst.id
    users_manage = db_session.query(Permission).filter(Permission.code == "users:manage").one()
    analyst.permissions.append(users_manage)
    db_session.commit()

    assert client.get("/users").status_code == 200

    analyst.permissions.remove(users_manage)
    db_session.commit()

    assert client.get("/users").status_code == 403


def test_user_with_no_role_is_refused(viewer_client, db_session):
    """An unassigned user holds no permissions, rather than defaulting open."""
    caller = db_session.query(User).filter(User.email == VIEWER_EMAIL).one()
    caller.role_id = None
    db_session.commit()

    assert viewer_client.get("/users").status_code == 403


def test_admin_keeps_access_with_an_emptied_matrix(client, db_session):
    """Guards against a one-way lockout: an admin who unticks users:manage
    would otherwise have no way back, because re-ticking it is gated on it."""
    admin = db_session.query(Role).filter(Role.name == "Admin").one()
    admin.permissions = []
    db_session.commit()

    assert client.get("/settings/roles").status_code == 200
    assert client.get("/users").status_code == 200


# ---------- The coarse codes the routers check ----------


def test_every_router_code_maps_to_a_matrix_cell():
    """The routers gate on coarse codes that are not matrix cells. Each must
    map onto one, or ticking the box in the UI would grant nothing."""
    from app.core.permissions_catalog import all_codes

    matrix = set(all_codes())
    for coarse_code, matrix_code in GRANTED_BY.items():
        assert matrix_code in matrix, f"{coarse_code} maps to unknown cell {matrix_code}"


def test_granting_codes_always_includes_the_code_itself():
    assert "users:read" in granting_codes("users:read")
    assert "users:manage" in granting_codes("users:read")
    # A code with no mapping is satisfied only by itself.
    assert granting_codes("dashboards:view") == frozenset({"dashboards:view"})

# ---------- No token means no access ----------

# Every route, gated or self-service. An anonymous caller must get 401 on all
# of them, including the /me endpoints: there is no "default" user to be.
UNAUTHENTICATED_ROUTES = [
    ("get", "/settings/me"),
    ("get", "/settings/general/me"),
    ("put", "/settings/general/me"),
    ("get", "/settings/notifications/me"),
    ("get", "/settings/security/me"),
    ("get", "/settings/integrations/me"),
    ("post", "/settings/security/me/change-password"),
    ("get", "/settings/roles"),
    ("get", "/settings/permissions/matrix"),
    ("get", "/users"),
    ("post", "/users"),
    ("delete", "/users/1"),
]


@pytest.mark.parametrize("method,path", UNAUTHENTICATED_ROUTES)
def test_no_token_is_401(anonymous_client, method, path):
    send = getattr(anonymous_client, method)
    response = send(path, json={}) if method in {"post", "put"} else send(path)
    assert response.status_code == 401, f"{method.upper()} {path} returned {response.status_code}"


def test_no_token_never_resolves_to_the_admin(anonymous_client, db_session):
    """The regression this guards against.

    `get_current_user` used to answer an unauthenticated request with
    `query(User).order_by(User.id).first()` — the lowest-numbered user, which
    in a seeded database is the Administrator. That returned 200 with the full
    permission matrix and bypassed require_permission entirely, because the
    caller it invented genuinely held the permissions.
    """
    admin = db_session.query(Role).filter(Role.name == "Admin").one()
    first_user = User(
        first_name="Alpha", last_name="Admin", email="alpha@edabip.com", role_id=admin.id
    )
    db_session.add(first_user)
    db_session.commit()

    response = anonymous_client.get("/settings/roles")
    assert response.status_code == 401
    assert "roles" not in response.text

    me = anonymous_client.get("/settings/me")
    assert me.status_code == 401


def test_no_token_does_not_create_a_user(anonymous_client, db_session):
    """The old fallback provisioned a row when the table was empty. Refusing
    the request must not write anything."""
    before = db_session.query(User).count()
    assert anonymous_client.get("/settings/me").status_code == 401
    assert db_session.query(User).count() == before


def test_unauthenticated_401_carries_the_www_authenticate_header(anonymous_client):
    response = anonymous_client.get("/settings/me")
    assert response.headers.get("www-authenticate") == "Bearer"


def test_malformed_authorization_header_is_401(anonymous_client):
    """Anything that is not a valid Bearer token is refused, not waved past."""
    for header in ("", "Basic dXNlcjpwYXNz", "Bearer", "Bearer not-a-jwt", "token abc"):
        response = anonymous_client.get("/settings/me", headers={"Authorization": header})
        assert response.status_code == 401, f"{header!r} returned {response.status_code}"
