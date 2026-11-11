from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import settings
from database import init_db
from middleware import TimingMiddleware, AuditMiddleware, SecurityHeadersMiddleware, RateLimitMiddleware

from routers import (
    auth, oauth,
    microsoft, login_mfa, admin, rbac_demo, dashboard, reports, analytics
)
from app.api import settings_router
from billing.router import router as billing_router
from billing.webhooks import router as billing_webhooks_router
from services.report_scheduler import start_background_scheduler

_DEFAULT_SECRET_MARKERS = ("change-this", "your-super-secret", "your-secret")


def _startup_security_checks():
    """Refuse to start in production with a missing/default/weak JWT secret."""
    secret = settings.jwt_secret_key or ""
    looks_default = any(m in secret.lower() for m in _DEFAULT_SECRET_MARKERS) or len(secret) < 32
    if settings.app_env == "production" and looks_default:
        raise RuntimeError(
            "Refusing to start: JWT_SECRET_KEY is missing, default, or shorter than 32 characters "
            "while APP_ENV=production. Set a strong random JWT_SECRET_KEY in your environment "
            "(e.g. `python -c \"import secrets; print(secrets.token_urlsafe(48))\"`)."
        )
    if settings.app_env == "production" and settings.debug:
        print("[!]  WARNING: DEBUG=true while APP_ENV=production. Disable debug mode in production.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    _startup_security_checks()
    init_db()
    _prepare_settings_module()
    report_scheduler = start_background_scheduler()  # None unless REPORT_SCHEDULER_ENABLED=true
    print(f"[ok]  {settings.app_name} Auth API  - {settings.app_env.upper()}")
    if settings.expose_docs:
        print(f"[docs]  Docs -> http://{settings.app_host}:{settings.app_port}/docs")
    yield
    if report_scheduler:
        report_scheduler[1].set()
    print("[stop]  Shutting down gracefully")


app = FastAPI(
    title="EDABIP API",
    description=(
        "EDABIP backend - authentication, SSO, MFA, billing, dashboard, and analytics."
    ),
    version="1.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.expose_docs else None,
    redoc_url="/redoc" if settings.expose_docs else None,
)

# -- Middleware ------------------------------------------
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(TimingMiddleware)
app.add_middleware(AuditMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -- Routers ---------------------------------------------
# Auth & identity
app.include_router(auth.router)
app.include_router(oauth.router)                  # Google OAuth2
app.include_router(microsoft.router)              # Microsoft SSO exchange
app.include_router(login_mfa.router)              # Login-time email MFA
app.include_router(admin.router)                    # Admin RBAC / role assignment
app.include_router(rbac_demo.router)               # Permission enforcement examples
app.include_router(dashboard.router)
app.include_router(reports.router)                # /api/reports
app.include_router(analytics.router)              # /analytics/*
app.include_router(billing_router)                 # /api/billing
app.include_router(billing_webhooks_router)        # /api/billing/webhooks/razorpay
app.include_router(settings_router)                # /settings/*


def _prepare_settings_module() -> None:
    """Create the settings schema and catalog so /settings/* is served here.

    Settings used to be a second uvicorn process on port 8002. It now shares
    this process and port. A failure here must not take down auth or billing.
    """
    try:
        from app.core.database import ensure_settings_database
        from seed_settings import run as seed_settings_catalog

        ensure_settings_database()
        seed_settings_catalog()
        print("[ok]  Settings routes ready on this API")
    except Exception as exc:
        print(
            "[!]  Settings routes were not prepared "
            f"({type(exc).__name__}). Auth and billing are still running."
        )


@app.get("/", tags=["Health"])
def root():
    return {"service": "EDABIP API", "version": "1.1.0", "status": "running",
            "docs": "/docs" if settings.expose_docs else None}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "env": settings.app_env}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.app_host, port=settings.app_port, reload=settings.debug)
