from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas
from app.core.database import get_db
from app.core.lookups import get_user_or_404
from app.core.security import CurrentUser, get_current_db_user, get_current_user, require_permission
from app.models import IntegrationProvider, IntegrationStatus, User, UserIntegration

router = APIRouter(prefix="/settings/integrations", tags=["Integrations"])


def _list_for_user(db: Session, user_id: int) -> list[schemas.IntegrationResponse]:
    """Every catalog provider with this user's status, auto-creating an
    'Inactive' row for providers the user hasn't touched yet."""
    providers = db.query(IntegrationProvider).order_by(IntegrationProvider.name).all()
    existing = {
        ui.provider_id: ui
        for ui in db.query(UserIntegration).filter(UserIntegration.user_id == user_id)
    }

    results = []
    for provider in providers:
        ui = existing.get(provider.id)
        if not ui:
            ui = UserIntegration(
                user_id=user_id, provider_id=provider.id, status=IntegrationStatus.inactive
            )
            db.add(ui)
            db.flush()
        results.append(
            schemas.IntegrationResponse(
                id=provider.id,
                name=provider.name,
                connected=ui.status == IntegrationStatus.active,
                connected_at=ui.connected_at,
            )
        )
    db.commit()
    return results


def _set_status(
    db: Session, user_id: int, provider_id: int, connected: bool
) -> schemas.IntegrationResponse:
    provider = db.query(IntegrationProvider).filter(IntegrationProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Integration provider not found")

    ui = db.query(UserIntegration).filter(
        UserIntegration.user_id == user_id, UserIntegration.provider_id == provider_id
    ).first()
    if not ui:
        ui = UserIntegration(user_id=user_id, provider_id=provider_id)
        db.add(ui)

    ui.status = IntegrationStatus.active if connected else IntegrationStatus.inactive
    ui.connected_at = datetime.now(timezone.utc) if connected else None
    db.commit()
    db.refresh(ui)

    return schemas.IntegrationResponse(
        id=provider_id,
        name=provider.name,
        connected=ui.status == IntegrationStatus.active,
        connected_at=ui.connected_at,
    )


@router.get("/me", response_model=list[schemas.IntegrationResponse])
def list_my_integrations(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return _list_for_user(db, get_current_db_user(db, current_user).id)


@router.post("/me/{provider_id}/toggle", response_model=schemas.IntegrationResponse)
def toggle_my_integration(
    provider_id: int,
    payload: schemas.IntegrationToggleRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    user = get_current_db_user(db, current_user)
    return _set_status(db, user.id, provider_id, payload.connected)


@router.get(
    "/{user_id}",
    response_model=list[schemas.IntegrationResponse],
    dependencies=[Depends(require_permission("users:read"))],
)
def list_integrations(user_id: int, db: Session = Depends(get_db)):
    get_user_or_404(db, user_id)
    return _list_for_user(db, user_id)


@router.post(
    "/{user_id}/{provider_id}/toggle",
    response_model=schemas.IntegrationResponse,
    dependencies=[Depends(require_permission("users:write"))],
)
def toggle_integration(
    user_id: int,
    provider_id: int,
    payload: schemas.IntegrationToggleRequest,
    db: Session = Depends(get_db),
):
    get_user_or_404(db, user_id)
    return _set_status(db, user_id, provider_id, payload.connected)
