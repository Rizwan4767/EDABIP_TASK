from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import schemas
from app.core.database import get_db
from app.core.lookups import get_user_or_404
from app.core.security import (
    CurrentUser,
    get_current_db_user,
    get_current_user,
    require_admin_for_email_change,
    require_permission,
)
from app.models import User

router = APIRouter(prefix="/settings/general", tags=["General Settings"])


def on_email_change(db: Session, user: User, new_email: str) -> None:
    """
    INTEGRATION POINT: standalone mode commits the new email immediately.
    When merged into the main app, replace this body with a call into the
    Auth service's re-verification flow (send a confirmation link, hold the
    pending email in a separate column, and only swap `user.email` once the
    link is clicked) instead of writing `new_email` synchronously here.
    """
    user.email = new_email


def _apply_update(user: User, payload: schemas.GeneralSettingsUpdate, db: Session) -> User:
    data = payload.model_dump(exclude_unset=True)

    new_email = data.pop("email", None)
    if new_email is not None and new_email.lower() != (user.email or "").lower():
        clash = (
            db.query(User)
            .filter(func.lower(User.email) == new_email.lower(), User.id != user.id)
            .first()
        )
        if clash:
            raise HTTPException(status_code=400, detail="Email already in use")
        on_email_change(db, user, new_email)

    for field, value in data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=schemas.GeneralSettingsResponse)
def get_my_general_settings(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return get_current_db_user(db, current_user)


@router.put("/me", response_model=schemas.GeneralSettingsResponse)
def update_my_general_settings(
    payload: schemas.GeneralSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    user = get_current_db_user(db, current_user)
    # The email is how every token is matched to a settings row
    # (app/core/security.py). Letting a user change it would let them point
    # their row at someone else's login. Resending the same email is fine so
    # the form can submit all its fields.
    if payload.email is not None and payload.email.lower() != (user.email or "").lower():
        raise HTTPException(status_code=400, detail="Email is managed by your login account")
    return _apply_update(user, payload, db)


@router.get(
    "/{user_id}",
    response_model=schemas.GeneralSettingsResponse,
    dependencies=[Depends(require_permission("users:read"))],
)
def get_general_settings(user_id: int, db: Session = Depends(get_db)):
    """Admin path: view another user's general settings."""
    return get_user_or_404(db, user_id)


@router.put(
    "/{user_id}",
    response_model=schemas.GeneralSettingsResponse,
    dependencies=[Depends(require_permission("users:write"))],
)
def update_general_settings(
    user_id: int,
    payload: schemas.GeneralSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Admin path: update another user's general settings."""
    user = get_user_or_404(db, user_id)
    require_admin_for_email_change(db, current_user, user, payload.email)
    return _apply_update(user, payload, db)
