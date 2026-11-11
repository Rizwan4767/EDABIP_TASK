"""
Primary integration point.

To fold this module into the main EDABIP FastAPI app, import `settings_router`
and mount it once:

    from app.api import settings_router  # this module
    main_app.include_router(settings_router)

`settings_router` already carries every route's full path (e.g.
`/settings/general/me`, `/users/{user_id}`), so no extra prefix is needed
unless you want to namespace the whole module (e.g. mount at `/api/v1`, which
FastAPI's `include_router(prefix=...)` handles for you).

Also override the auth dependency once, at the main app level, per
app/core/security.py's module docstring — that's the only other piece that
needs to change.
"""
from fastapi import APIRouter

from app.routers import aggregate, general, integrations, notifications, roles, security, users

settings_router = APIRouter()

settings_router.include_router(aggregate.router)
settings_router.include_router(general.router)
settings_router.include_router(notifications.router)
settings_router.include_router(security.router)
settings_router.include_router(integrations.router)
settings_router.include_router(roles.router)
settings_router.include_router(roles.permissions_router)
settings_router.include_router(users.router)
