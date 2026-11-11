"""
Environment-driven configuration.

Production rule: nothing secret ships with a real-looking default. DB
credentials and the JWT secret must come from the environment (.env locally,
real secret storage in staging/prod). If ENVIRONMENT=production and a secret
still equals its placeholder, the app refuses to start (see main.py).

When this module is imported by the main API (`main.py`), it reuses that
process's MySQL server and JWT secret. Settings tables stay in their own
schema (`edabip_settings`) because the auth database already has `users`,
`roles`, and `permissions` tables with a different shape.
"""
import os
from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine.url import make_url

_PLACEHOLDER_SECRET = "changeme-generate-a-real-secret"
_SETTINGS_SCHEMA = "edabip_settings"


class Settings(BaseSettings):
    # --- runtime mode ---
    ENVIRONMENT: str = "development"  # development | staging | production
    AUTO_CREATE_TABLES: bool = True   # dev convenience only; prod uses Alembic

    # --- database ---
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "edabip_settings"

    # --- the auth backend's credential store ---
    # The password a user logs in with lives in the AUTH backend's database
    # (edabip-backend/.env DATABASE_URL), which is a different schema from
    # DB_NAME above. app/core/auth_credentials.py needs to reach it so that
    # "Change Password" on the Settings page changes the credential login
    # actually checks. Same server/credentials by default; set
    # AUTH_DATABASE_URL_RAW to point somewhere else entirely.
    AUTH_DB_NAME: str = "edabip"
    AUTH_DATABASE_URL_RAW: str = ""

    # --- auth integration seam ---
    # Only used by the module's OWN standalone JWT stub (app/core/security.py).
    # When this module is mounted inside the main EDABIP app, the main app's
    # auth system owns JWT verification and this key is never consulted —
    # see "Integration Points" in README.md.
    JWT_SECRET_KEY: str = _PLACEHOLDER_SECRET
    JWT_ALGORITHM: str = "HS256"

    # --- CORS ---
    # Explicit origin list. "*" is intentionally not supported because this
    # API is served with allow_credentials=True, and browsers reject a
    # wildcard origin combined with credentials.
    # Comma-separated list of allowed frontend origins, e.g.
    # "http://localhost:5173,http://localhost:3000". Kept as a raw string
    # field (not list[str]) because pydantic-settings tries to JSON-decode
    # any list-typed field read from the environment/.env before any custom
    # validator runs, and a comma-separated string isn't valid JSON. Use the
    # `CORS_ORIGINS` property below to get the parsed list.
    CORS_ORIGINS_RAW: str = "http://localhost:5173,http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env.settings")

    @property
    def CORS_ORIGINS(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS_RAW.split(",") if origin.strip()]

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    @property
    def AUTH_DATABASE_URL(self) -> str:
        """Where the auth backend keeps `users.password_hash`."""
        if self.AUTH_DATABASE_URL_RAW:
            return self.AUTH_DATABASE_URL_RAW
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.AUTH_DB_NAME}"
        )

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @model_validator(mode="after")
    def _inherit_main_app_database(self) -> "Settings":
        """Fill connection details from the main API when no settings DB was configured.

        `.env.settings` wins when it sets DB_PASSWORD. Otherwise, a process
        that already has DATABASE_URL (the auth API) shares that MySQL server.
        The schema name stays `edabip_settings` even if DB_NAME was pointed at
        the auth database.
        """
        raw_url = os.environ.get("DATABASE_URL", "").strip()
        auth_url = None
        if raw_url:
            try:
                auth_url = make_url(raw_url)
            except Exception:
                auth_url = None

        if (
            auth_url is not None
            and not os.environ.get("DB_PASSWORD")
            and not self.DB_PASSWORD
        ):
            if auth_url.host and not os.environ.get("DB_HOST"):
                self.DB_HOST = auth_url.host
            if auth_url.port and not os.environ.get("DB_PORT"):
                self.DB_PORT = int(auth_url.port)
            if auth_url.username and not os.environ.get("DB_USER"):
                self.DB_USER = auth_url.username
            if auth_url.password is not None:
                self.DB_PASSWORD = auth_url.password

        if (
            auth_url is not None
            and not os.environ.get("AUTH_DATABASE_URL_RAW")
            and not self.AUTH_DATABASE_URL_RAW
        ):
            self.AUTH_DATABASE_URL_RAW = raw_url

        if auth_url is not None and auth_url.database and not os.environ.get("AUTH_DB_NAME"):
            self.AUTH_DB_NAME = auth_url.database

        if self.DB_NAME == self.AUTH_DB_NAME:
            self.DB_NAME = _SETTINGS_SCHEMA
        return self

    @model_validator(mode="after")
    def _guard_production_secrets(self) -> "Settings":
        if self.is_production:
            problems = []
            if self.JWT_SECRET_KEY == _PLACEHOLDER_SECRET:
                problems.append("JWT_SECRET_KEY is still the placeholder value")
            if not self.DB_PASSWORD:
                problems.append("DB_PASSWORD is empty")
            if problems:
                raise ValueError(
                    "Refusing to start with ENVIRONMENT=production: " + "; ".join(problems)
                )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
