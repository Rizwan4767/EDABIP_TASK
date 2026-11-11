import os

# Must happen before any app.* module is imported: disable the startup
# auto-create-tables hook (which targets the real MySQL engine) and avoid
# touching real secrets/DB config during tests. The test DB itself is the
# in-memory SQLite engine wired up below via dependency overrides.
os.environ.setdefault("AUTO_CREATE_TABLES", "false")
os.environ.setdefault("ENVIRONMENT", "development")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-not-for-prod")

import hmac

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.auth_credentials import get_credential_store
from app.core.auth_credentials import hash_password as bcrypt_hash_password
from app.core.rate_limit import change_password_limiter
from app.core.permissions_catalog import all_codes as _all_matrix_codes
from app.core.permissions_catalog import default_access_codes as _default_access_codes
from app.core.database import Base, get_db
from app.core.security import CurrentUser, get_current_user
from app.main import app
from app.models import IntegrationProvider, Permission, Role

SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

# The signed-in caller each client fixture below impersonates. Passwords are
# the ones FakeCredentialStore starts out holding, i.e. what a "current
# password" check should accept.
ADMIN_EMAIL = "dev.user@edabip.io"
ADMIN_PASSWORD = "Current!Pass1"
VIEWER_EMAIL = "viewer.user@edabip.io"
VIEWER_PASSWORD = "Viewer!Pass1"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class FakeCredentialStore:
    """In-memory stand-in for the auth backend's credential store.

    Mirrors AuthCredentialStore's contract exactly — including the 404 for an
    email with no login account — so the suite exercises the same branches
    without needing the auth database (a separate MySQL schema owned by
    edabip-backend/) to be running. See app/core/auth_credentials.py.
    """

    def __init__(self):
        self._passwords: dict[str, str] = {}
        # Mirrors the auth backend's users.failed_login_attempts /
        # locked_until, so tests can assert that a password change clears a
        # lockout the way edabip-backend's reset_password does.
        self._lockouts: dict[str, dict] = {}

    def seed(self, email: str, password: str) -> None:
        self._passwords[email] = password
        self._lockouts[email] = {"failed_login_attempts": 0, "locked_until": None}

    def current_password(self, email: str) -> str | None:
        return self._passwords.get(email)

    def lock_out(self, email: str, attempts: int = 5, until: str = "2099-01-01T00:00:00") -> None:
        """Put the account in the state a run of bad logins would leave it in."""
        self._lockouts[email] = {"failed_login_attempts": attempts, "locked_until": until}

    def lockout_state(self, email: str) -> dict:
        return self._lockouts.get(email, {})

    def _require_account(self, email: str) -> str:
        if email not in self._passwords:
            raise HTTPException(
                status_code=404, detail="No login account was found for this email address."
            )
        return self._passwords[email]

    def verify(self, email: str, raw_password: str) -> bool:
        return hmac.compare_digest(self._require_account(email), raw_password)

    def set_password(self, email: str, raw_password: str) -> str:
        self._require_account(email)
        self._passwords[email] = raw_password
        self._lockouts[email] = {"failed_login_attempts": 0, "locked_until": None}
        # A real bcrypt hash, so assertions about the mirrored local column
        # are testing the real format.
        return bcrypt_hash_password(raw_password)


@pytest.fixture(scope="function")
def db_session():
    """Fresh in-memory schema per test, seeded with reference/catalog data."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()

    roles = [
        Role(name="Admin", description="Full access to all features and settings"),
        Role(name="Business Analyst", description="Access to analytics, reports and dashboards"),
        Role(name="Editor", description="Can edit reports and dashboards"),
        Role(name="Viewer", description="View only access to reports and dashboards"),
        # The remaining three, plus Admin and Business Analyst above, are the
        # five MATRIX_ROLE_ORDER names from the frontend's permissionMatrix.js.
        Role(name="Executive", description="High-level visibility across dashboards and billing"),
        Role(name="Data Engineer", description="Builds and maintains dashboards and pipelines"),
        Role(name="Client User", description="External client with limited, view-focused access"),
    ]
    session.add_all(roles)

    providers = [
        IntegrationProvider(name="Salesforce CRM", description="Sync leads, contacts and opportunities"),
        IntegrationProvider(name="Google Analytics", description="Import web analytics into dashboards"),
        IntegrationProvider(name="Slack", description="Post alerts and notifications to Slack channels"),
        IntegrationProvider(name="Microsoft Teams", description="Post alerts and reports to Teams channels"),
    ]
    session.add_all(providers)

    permissions = [
        Permission(code="users:read", description="View user accounts"),
        Permission(code="users:write", description="Manage user accounts"),
        Permission(code="roles:write", description="Manage roles"),
        Permission(code="dashboards:view", description="View dashboards"),
    ]
    # The fixed '<module>:<action>' catalog the Permission Matrix is built
    # from (app/core/permissions_catalog.py) — kept alongside the free-form
    # admin codes above rather than replacing them, since require_permission()
    # call sites around the routers still reference those by string.
    permissions += [Permission(code=code, description="") for code in _all_matrix_codes()]
    session.add_all(permissions)
    session.flush()  # assign ids before linking role_permissions below

    # Link each of the five frontend-canonical roles to its default ACCESS
    # codes, mirroring what seed.py does for a real deployment. This lets
    # tests assert on realistic default state (e.g. Admin starts with access
    # to Users management) instead of everything defaulting to VIEW.
    permission_by_code = {p.code: p for p in permissions}
    role_by_name = {r.name: r for r in roles}
    for role in roles:
        role.permissions = [
            permission_by_code[code]
            for code in _default_access_codes(role.name)
            if code in permission_by_code
        ]
    session.commit()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function", autouse=True)
def _reset_rate_limits():
    """The password-change limiter is process-global, so without this a test
    would inherit whatever attempts the previous one spent."""
    change_password_limiter.reset()
    yield
    change_password_limiter.reset()


@pytest.fixture(scope="function")
def credential_store():
    """The fake auth-backend credential store both client fixtures install."""
    store = FakeCredentialStore()
    store.seed(ADMIN_EMAIL, ADMIN_PASSWORD)
    store.seed(VIEWER_EMAIL, VIEWER_PASSWORD)
    return store


def _client_as(db_session, credential_store, *, role_name, email):
    """TestClient signed in as a user holding `role_name`.

    Overrides:
      - get_db            -> the in-memory test session
      - get_current_user  -> the fixed caller created below, so tests don't
                             need to pre-create one by hand
      - get_credential_store -> the fake store (no auth DB needed)

    `get_current_user` is left returning a CurrentUser with NO permissions
    claim on purpose: that is what the auth backend's tokens actually look
    like today (they carry only `sub`), so require_permission has to resolve
    the caller's permissions from the database — which is the path that
    matters and the one these tests should exercise.
    """
    from app.models import User

    # Created up front rather than on first use: require_permission resolves
    # the caller on every gated route, so lazy creation would make the users
    # table's contents depend on which endpoint a test happened to hit first.
    caller = db_session.query(User).filter(User.email == email).first()
    if caller is None:
        role = db_session.query(Role).filter(Role.name == role_name).first()
        caller = User(
            first_name="Dev",
            last_name="User",
            email=email,
            role_id=role.id if role else None,
        )
        db_session.add(caller)
        db_session.commit()
        db_session.refresh(caller)
    caller_id = caller.id

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    def override_get_current_user() -> CurrentUser:
        return CurrentUser(user_id=caller_id, email=email, role=None)

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_credential_store] = lambda: credential_store
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def client(db_session, credential_store):
    """Signed in as an Admin.

    Most of this suite drives admin surfaces (/users, /settings/roles,
    /settings/*/{user_id}), which require_permission now gates for real, so
    the default caller has to be someone entitled to use them.
    """
    yield from _client_as(db_session, credential_store, role_name="Admin", email=ADMIN_EMAIL)


@pytest.fixture(scope="function")
def viewer_client(db_session, credential_store):
    """Signed in as a Viewer: a perfectly valid session with none of the
    Users & Access Management permissions. The caller every 403 test uses."""
    yield from _client_as(db_session, credential_store, role_name="Viewer", email=VIEWER_EMAIL)


@pytest.fixture(scope="function")
def anonymous_client(db_session, credential_store):
    """A client that sends NO Authorization header.

    Deliberately does not override `get_current_user`: the real dependency has
    to run, because what is being tested is that it refuses rather than
    quietly resolving somebody. It used to resolve the lowest-numbered user —
    the Admin — which handed full access to anyone who simply did not log in.
    """

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_credential_store] = lambda: credential_store
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def user_manager_client(db_session, credential_store):
    """Signed in as a non-Admin whose role holds users:read and users:write.

    Exists to prove that users:write alone does not unlock the actions that
    are reserved for Admin (password reset, email change).
    """
    role = Role(name="User Manager", description="Manages user accounts, not an Admin")
    role.permissions = (
        db_session.query(Permission)
        .filter(Permission.code.in_(["users:read", "users:write"]))
        .all()
    )
    db_session.add(role)
    db_session.commit()
    yield from _client_as(
        db_session, credential_store, role_name="User Manager", email="manager.user@edabip.io"
    )
