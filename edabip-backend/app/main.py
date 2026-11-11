from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import settings_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging

configure_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.AUTO_CREATE_TABLES:
        # Dev/standalone convenience only. In an integrated deployment, table
        # creation is owned by the main app's Alembic migrations — leave
        # AUTO_CREATE_TABLES=false there. See alembic/ in this module for
        # standalone-only migrations.
        from app.core.database import Base, engine
        import app.models  # noqa: F401  (ensure models are registered before create_all)

        Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="EDABIP Settings Module",
    description=(
        "Standalone-runnable Settings module for EDABIP (General Settings, "
        "Notification Preferences, Integrations) plus the Users & Access "
        "Management admin surface (Roles, Permission Matrix, Users). "
        "See README.md for how to mount this into the main EDABIP backend."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(settings_router)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}
