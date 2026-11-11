"""Admin and RBAC management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from models.user import User, Role, Permission
from utils.auth import (
    get_current_user,
    require_roles,
    require_permission,
    user_to_dict,
)


router = APIRouter(
    prefix="/admin",
    tags=["Admin / RBAC"],
)


# ============================================================
# Request Models
# ============================================================

class RoleCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=50,
        pattern=r"^[a-z][a-z0-9_]*$",
    )
    description: str | None = Field(
        default=None,
        max_length=500,
    )
    permissions: list[str] = []


class RoleUpdate(BaseModel):
    description: str | None = Field(
        default=None,
        max_length=500,
    )
    permissions: list[str] = []


class AssignRoleRequest(BaseModel):
    role_name: str = Field(
        min_length=2,
        max_length=50,
    )


class PermissionCreate(BaseModel):
    name: str = Field(
        min_length=3,
        max_length=100,
        pattern=r"^[a-z][a-z0-9_.-]*$",
    )
    description: str | None = Field(
        default=None,
        max_length=255,
    )


# ============================================================
# Helper Functions
# ============================================================

def _role_dict(role: Role) -> dict:
    """Convert Role model to API response."""
    return {
        "id": role.id,
        "name": role.name,
        "description": role.description,
        "permissions": sorted(
            permission.name
            for permission in role.permissions
        ),
        "user_count": len(role.users),
    }


def _get_permissions(
    db: Session,
    names: list[str],
) -> list[Permission]:
    """Get permissions by name and validate that all exist."""

    names = sorted(set(names))

    if not names:
        return []

    permissions = (
        db.query(Permission)
        .filter(Permission.name.in_(names))
        .all()
    )

    found = {permission.name for permission in permissions}

    missing = [
        name
        for name in names
        if name not in found
    ]

    if missing:
        raise HTTPException(
            status_code=400,
            detail={
                "unknown_permissions": missing
            },
        )

    return permissions


# ============================================================
# USER MANAGEMENT
# ============================================================

@router.get(
    "/users",
    dependencies=[
        Depends(require_permission("users.view"))
    ],
)
def list_users(
    db: Session = Depends(get_db),
):
    """List all users."""

    users = (
        db.query(User)
        .order_by(User.id.desc())
        .all()
    )

    return [
        user_to_dict(user)
        for user in users
    ]


# ============================================================
# ROLE MANAGEMENT
# ============================================================

@router.get(
    "/roles",
    dependencies=[
        Depends(require_permission("roles.view"))
    ],
)
def list_roles(
    db: Session = Depends(get_db),
):
    """List all roles."""

    roles = (
        db.query(Role)
        .order_by(Role.id)
        .all()
    )

    return [
        _role_dict(role)
        for role in roles
    ]


@router.post(
    "/roles",
    status_code=status.HTTP_201_CREATED,
)
def create_role(
    payload: RoleCreate,
    db: Session = Depends(get_db),
    _: User = Depends(
        require_roles("admin")
    ),
):
    """Create a new role."""

    existing_role = (
        db.query(Role)
        .filter(Role.name == payload.name)
        .first()
    )

    if existing_role:
        raise HTTPException(
            status_code=409,
            detail="Role already exists",
        )

    role = Role(
        name=payload.name,
        description=payload.description,
        permissions=_get_permissions(
            db,
            payload.permissions,
        ),
    )

    db.add(role)
    db.commit()
    db.refresh(role)

    return _role_dict(role)


@router.patch(
    "/roles/{role_id}"
)
def update_role(
    role_id: int,
    payload: RoleUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(
        require_roles("admin")
    ),
):
    """Update an existing role."""

    role = (
        db.query(Role)
        .filter(Role.id == role_id)
        .first()
    )

    if not role:
        raise HTTPException(
            status_code=404,
            detail="Role not found",
        )

    # Admin role must always retain full access.
    if role.name == "admin":
        existing_permissions = sorted(
            permission.name
            for permission in role.permissions
        )

        requested_permissions = sorted(
            set(payload.permissions)
        )

        if requested_permissions != existing_permissions:
            raise HTTPException(
                status_code=400,
                detail="Admin role always has full access",
            )

    role.description = payload.description

    role.permissions = _get_permissions(
        db,
        payload.permissions,
    )

    db.commit()
    db.refresh(role)

    return _role_dict(role)


# ============================================================
# PERMISSION MANAGEMENT
# ============================================================

@router.get(
    "/permissions",
    dependencies=[
        Depends(require_permission("roles.view"))
    ],
)
def list_permissions(
    db: Session = Depends(get_db),
):
    """List all permissions."""

    permissions = (
        db.query(Permission)
        .order_by(Permission.name)
        .all()
    )

    return [
        {
            "id": permission.id,
            "name": permission.name,
            "description": permission.description,
        }
        for permission in permissions
    ]


@router.post(
    "/permissions",
    status_code=status.HTTP_201_CREATED,
)
def create_permission(
    payload: PermissionCreate,
    db: Session = Depends(get_db),
    _: User = Depends(
        require_roles("admin")
    ),
):
    """Create a new permission."""

    existing_permission = (
        db.query(Permission)
        .filter(
            Permission.name == payload.name
        )
        .first()
    )

    if existing_permission:
        raise HTTPException(
            status_code=409,
            detail="Permission already exists",
        )

    permission = Permission(
        name=payload.name,
        description=payload.description,
    )

    db.add(permission)
    db.commit()
    db.refresh(permission)

    return {
        "id": permission.id,
        "name": permission.name,
        "description": permission.description,
    }


# ============================================================
# USER ROLE ASSIGNMENT
# ============================================================

@router.patch(
    "/users/{user_id}/role"
)
def assign_role(
    user_id: int,
    payload: AssignRoleRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(
        require_roles("admin")
    ),
):
    """Assign a role to a user."""

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    role = (
        db.query(Role)
        .filter(Role.name == payload.role_name)
        .first()
    )

    if not role:
        raise HTTPException(
            status_code=404,
            detail="Role not found",
        )

    # Prevent the current admin from removing
    # their own admin role.
    if (
        user.id == admin.id
        and role.name != "admin"
    ):
        raise HTTPException(
            status_code=400,
            detail="Admin cannot remove their own admin role",
        )

    user.role_id = role.id

    db.commit()
    db.refresh(user)

    return user_to_dict(user)


# ============================================================
# CURRENT USER / RBAC INFORMATION
# ============================================================

@router.get("/me")
def admin_me(
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Return the logged-in user's information
    and effective RBAC permissions.
    """

    return user_to_dict(current_user)
