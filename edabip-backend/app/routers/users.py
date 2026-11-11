"""
User management. Same scope note as roles.py — this is the admin surface of
the "Users & Access Management" screen, not the self-service Settings screen.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import schemas
from app.core.database import get_db
from app.core.security import (
    CurrentUser,
    get_current_user,
    require_admin_for_email_change,
    require_permission,
)
from app.models import Role, User

router = APIRouter(
    prefix="/users",
    tags=["User Management"],
    dependencies=[Depends(require_permission("users:read"))],
)


def _to_user_response(user: User) -> schemas.UserResponse:
    return schemas.UserResponse(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        is_active=user.is_active,
        role_id=user.role_id,
        role_name=user.role.name if user.role else None,
        created_at=user.created_at,
    )


@router.get("", response_model=schemas.PaginatedUsers)
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    search: str | None = Query(None, min_length=2, max_length=100, description="Filter by name or email"),
    role_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if search:
        like = f"%{search}%"
        query = query.filter(
            (User.first_name.ilike(like)) | (User.last_name.ilike(like)) | (User.email.ilike(like))
        )
    if role_id is not None:
        query = query.filter(User.role_id == role_id)

    total = query.count()
    users = query.order_by(User.id).offset((page - 1) * page_size).limit(page_size).all()

    return schemas.PaginatedUsers(
        total=total, page=page, page_size=page_size, items=[_to_user_response(u) for u in users]
    )


@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _to_user_response(user)


@router.post(
    "",
    response_model=schemas.UserResponse,
    status_code=201,
    dependencies=[Depends(require_permission("users:write"))],
)
def create_user(payload: schemas.AdminUserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="A user with this email address already exists")

    if payload.role_id is not None:
        if not db.query(Role).filter(Role.id == payload.role_id).first():
            raise HTTPException(status_code=400, detail="Role not found")

    user = User(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        role_id=payload.role_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _to_user_response(user)


@router.put(
    "/{user_id}",
    response_model=schemas.UserResponse,
    dependencies=[Depends(require_permission("users:write"))],
)
def update_user(
    user_id: int,
    payload: schemas.AdminUserUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    data = payload.model_dump(exclude_unset=True)
    require_admin_for_email_change(db, current_user, user, data.get("email"))
    if "email" in data and data["email"] != user.email:
        if db.query(User).filter(User.email == data["email"]).first():
            raise HTTPException(status_code=400, detail="A user with this email address already exists")

    for field, value in data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return _to_user_response(user)


@router.put(
    "/{user_id}/role",
    response_model=schemas.UserResponse,
    dependencies=[Depends(require_permission("users:write"))],
)
def assign_role(user_id: int, payload: schemas.AssignRoleRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    role = db.query(Role).filter(Role.id == payload.role_id).first()
    if not role:
        raise HTTPException(status_code=400, detail="Unable to assign the selected role")

    user.role_id = role.id
    db.commit()
    db.refresh(user)
    return _to_user_response(user)


@router.post(
    "/{user_id}/deactivate",
    response_model=schemas.UserResponse,
    dependencies=[Depends(require_permission("users:write"))],
)
def deactivate_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = False
    db.commit()
    db.refresh(user)
    return _to_user_response(user)


@router.post(
    "/{user_id}/reactivate",
    response_model=schemas.UserResponse,
    dependencies=[Depends(require_permission("users:write"))],
)
def reactivate_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = True
    db.commit()
    db.refresh(user)
    return _to_user_response(user)


@router.delete(
    "/{user_id}",
    status_code=204,
    dependencies=[Depends(require_permission("users:write"))],
)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """
    Hard delete. BR-UAM-003 restricts this to Administrator privileges — once
    real RBAC is wired in (see app/core/security.py), consider soft-delete
    (is_active=False) as the default and reserve hard delete for a separate,
    more tightly-gated endpoint, since this cascades to notification prefs
    and integration rows.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
