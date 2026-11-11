from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional

_BACKEND_DIR = Path(__file__).resolve().parent
_ENV_FILE = _BACKEND_DIR / ".env"
load_dotenv(_ENV_FILE, override=False)


class Settings(BaseSettings):
    app_name: str = "EDABIP API"
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    debug: bool = True
    frontend_url: str = "http://localhost:5173"
    # Optional LAN-reachable SPA URL for phones (e.g. http://192.168.1.20:5173).
    frontend_mobile_url: Optional[str] = None
    # Optional public API URL for email links (e.g. http://192.168.1.20:8000).
    api_public_url: Optional[str] = None
    # Auto-detected LAN IP when frontend_url uses localhost (override if needed).
    dev_lan_ip: Optional[str] = None
    # Expo / React Native deep-link scheme (development: edabip-dev).
    mobile_app_scheme: Optional[str] = None
    # Android package for intent:// fallback links in reset emails.
    mobile_app_package: Optional[str] = "com.edabip.mobile.dev"
    # Comma-separated extra CORS origins (e.g. Expo tunnel URL).
    cors_extra_origins: Optional[str] = None
    expose_docs: bool = True

    database_url: str = None

    jwt_secret_key: str = "change-this-secret-minimum-32-chars"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7

    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    google_redirect_uri: str = "http://localhost:8000/auth/google/callback"

    # Microsoft / Azure AD SSO
    microsoft_client_id: Optional[str] = None          
    microsoft_tenant_id: Optional[str] = "common"      
    microsoft_client_secret: Optional[str] = None      

    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: Optional[str] = ""
    smtp_password: Optional[str] = ""
    email_from: str =""
    email_from_name: str = "Auth Service"

    # Security
    max_login_attempts: int = 5
    login_lockout_minutes: int = 15
    rate_limit_per_minute: int = 60
    max_password_length: int = 72

    class Config:
        env_file = str(_ENV_FILE)
        case_sensitive = False
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
