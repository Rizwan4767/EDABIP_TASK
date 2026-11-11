"""
Bridge to the authentication backend's credential store.

Why this file exists
--------------------
This Settings module and the auth backend (`edabip-backend/`) are separate
FastAPI apps running against separate databases — `edabip_settings` here,
`edabip` there (compare .env with edabip-backend/.env). The password a user
actually logs in with lives in the AUTH database's `users.password_hash`,
bcrypt-hashed by `edabip-backend/utils/auth.py`.

`User.password_hash` in *this* module's database is a different column in a
different schema. Before this change, "Change Password" on the Settings page
wrote only to that column, so it never affected login: the user's real
credential was untouched and the next sign-in still wanted the old password.
Verifying a "current password" against that column would have been worse than
useless — it is NULL for every user this module creates, so the check would
have had nothing to compare against.

So the change-password flow reads and writes the auth database's row instead.
It matches on EMAIL, not on id: the two databases assign user ids
independently and they do not line up (see the cross-database note in
app/core/security.py).

Hashing
-------
bcrypt, in exactly the format `edabip-backend/utils/auth.py` produces and
consumes — 12 rounds, input truncated to bcrypt's hard 72-byte limit — so a
hash written here verifies at login, and a hash written at registration
verifies here. That module is deliberately not imported rather than
reimplemented-by-accident: `edabip-backend` is not a valid Python package
name (hyphen), and importing it would pull in its own `config`/`database`
modules for a second, unrelated app. The two helpers below are kept
format-compatible on purpose; if the backends are ever merged into one
codebase, delete this file and call that module directly.
"""
from __future__ import annotations

import logging
from functools import lru_cache

import bcrypt
from fastapi import HTTPException, status
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings

logger = logging.getLogger(__name__)

# bcrypt ignores everything past 72 bytes; truncate explicitly rather than
# relying on the library to do it silently (and identically) forever.
_BCRYPT_MAX_BYTES = 72
_BCRYPT_ROUNDS = 12


def hash_password(raw_password: str) -> str:
    """bcrypt hash, wire-compatible with edabip-backend/utils/auth.py."""
    pw_bytes = raw_password.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    return bcrypt.hashpw(pw_bytes, bcrypt.gensalt(rounds=_BCRYPT_ROUNDS)).decode("utf-8")


def verify_password(raw_password: str, stored_hash: str | None) -> bool:
    """Constant-time check against a bcrypt hash. False for a NULL/garbage hash."""
    if not stored_hash:
        return False
    try:
        return bcrypt.checkpw(
            raw_password.encode("utf-8")[:_BCRYPT_MAX_BYTES], stored_hash.encode("utf-8")
        )
    except (ValueError, TypeError):
        return False


class AuthCredentialStore:
    """Reads and writes `users.password_hash` in the auth backend's database.

    Raw SQL against two columns, rather than a second set of SQLAlchemy
    models: the auth backend already owns that table's schema, and mirroring
    its `User` model here would be exactly the kind of duplicated auth code
    this module is trying not to grow.
    """

    def __init__(self, engine: Engine):
        self._engine = engine

    def _fetch_hash(self, email: str) -> str | None:
        try:
            with self._engine.connect() as connection:
                row = connection.execute(
                    text("SELECT password_hash FROM users WHERE email = :email"),
                    {"email": email},
                ).first()
        except SQLAlchemyError as exc:  # auth DB down / unreachable
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="The authentication service is unavailable. Try again shortly.",
            ) from exc

        if row is None:
            # No login account for this address: this module's user table and
            # the auth backend's have drifted, and there is no credential to
            # change. Say so plainly instead of silently writing a local hash
            # that no login flow will ever read.
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No login account was found for this email address.",
            )
        return row[0]

    def role_name(self, email: str) -> str | None:
        """The login account's role name, or None when it cannot be read.

        Used only to choose the Settings role the first time an account is
        seen (and to correct the automatic Viewer default for administrators).
        A failure here must not take down the Settings page.
        """
        try:
            with self._engine.connect() as connection:
                row = connection.execute(
                    text(
                        "SELECT roles.name "
                        "FROM users "
                        "INNER JOIN roles ON roles.id = users.role_id "
                        "WHERE LOWER(users.email) = LOWER(:email) "
                        "ORDER BY users.id "
                        "LIMIT 1"
                    ),
                    {"email": email},
                ).first()
        except SQLAlchemyError:
            logger.warning("Auth role lookup failed; settings will keep the default role")
            return None
        if row is None or row[0] is None:
            return None
        return str(row[0])

    def verify(self, email: str, raw_password: str) -> bool:
        """Whether `raw_password` is this account's current login password."""
        return verify_password(raw_password, self._fetch_hash(email))

    def set_password(self, email: str, raw_password: str) -> str:
        """Write a new login password. Returns the hash that was stored.

        Also clears `failed_login_attempts` and `locked_until`, exactly as the
        auth backend's own `reset_password` does (edabip-backend/routers/
        auth.py). Without this a user who locked themselves out by mistyping
        their password could change it here and still be refused at login
        until the lockout aged out, with nothing in the UI explaining why.
        """
        self._fetch_hash(email)  # 404 before writing if there is no such account
        new_hash = hash_password(raw_password)
        try:
            with self._engine.begin() as connection:
                connection.execute(
                    text(
                        "UPDATE users"
                        "   SET password_hash = :hash,"
                        "       failed_login_attempts = 0,"
                        "       locked_until = NULL"
                        " WHERE email = :email"
                    ),
                    {"hash": new_hash, "email": email},
                )
        except SQLAlchemyError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="The authentication service is unavailable. Try again shortly.",
            ) from exc
        return new_hash


@lru_cache(maxsize=1)
def _auth_engine() -> Engine:
    # pool_pre_ping because this connects to a database owned by another
    # service, whose restarts this app never hears about.
    return create_engine(settings.AUTH_DATABASE_URL, pool_pre_ping=True)


def get_credential_store() -> AuthCredentialStore:
    """FastAPI dependency.

    Overridden in tests/conftest.py with an in-memory fake, so the suite never
    needs the auth database running.
    """
    return AuthCredentialStore(_auth_engine())
