"""
Roles & Permission Matrix.

Belongs to the "Users & Access Management" screen in the wireframe, not the
Settings screen proper — bundled into this module because they share the
same DB session, models, and auth seam. See README.md "Module scope" for the
distinction and where to split this out later if desired.

The data these endpoints manage is also what enforcement reads: a role's
linked Permission rows are exactly what `require_permission` checks against
(see app/core/security.py), so editing the matrix here changes who can do
what, immediately and everywhere. Every route below is itself gated on
`roles:read` / `roles:write` per BR-UAM-004.

Permission Matrix shape: a role's permissions are exposed/edited as a
nested {moduleId: {actionId: 'access' | 'view'}} matrix (see
app/core/permissions_catalog.py), matching the frontend's Permission Matrix
tab exactly. Underneath, this is still the same Permission / role_permissions
many-to-many tables: a role has ACCESS to (module, action) exactly when the
Permission row coded '<module>:<action>' is linked to it; unlinked means
VIEW. `serialize_role()` / `set_role_permissions()` below are the only two
places that translate between the nested matrix and the linked-code set.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import schemas
from app.core import permissions_catalog
from app.core.database import get_db
from app.core.security import require_permission
from app.models import Permission, Role, User

router = APIRouter(
    prefix="/settings/roles",
    tags=["Roles & Permissions"],
    dependencies=[Depends(require_permission("roles:read"))],
)


def _role_permissions_map(role: Role) -> schemas.PermissionsMatrix:
    """Project a role's linked Permission codes onto the full canonical
    matrix: ACCESS where '<module>:<action>' is linked, VIEW (the default)
    everywhere else — including modules/actions the role has never touched."""
    linked_codes = {p.code for p in role.permissions}
    return {
        module["id"]: {
            action["id"]: (
                permissions_catalog.ACCESS
                if permissions_catalog.permission_code(module["id"], action["id"]) in linked_codes
                else permissions_catalog.VIEW
            )
            for action in module["actions"]
        }
        for module in permissions_catalog.PERMISSION_MODULES
    }


def serialize_role(role: Role, user_count: int) -> schemas.RoleResponse:
    """The one place a Role becomes the RoleResponse the frontend expects —
    used by this router directly and imported by aggregate.py for the
    `roles` list in the one-shot `/settings/me` payload."""
    return schemas.RoleResponse(
        id=role.id,
        name=role.name,
        description=role.description,
        user_count=user_count,
        permissions=_role_permissions_map(role),
    )


def _role_user_counts(db: Session) -> dict:
    return dict(db.query(User.role_id, func.count(User.id)).group_by(User.role_id).all())


@router.get("", response_model=schemas.PaginatedRoles)
def list_roles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    total = db.query(Role).count()

    roles = (
        db.query(Role)
        .order_by(Role.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    counts = _role_user_counts(db)
    items = [serialize_role(r, counts.get(r.id, 0)) for r in roles]

    return schemas.PaginatedRoles(total=total, page=page, page_size=page_size, items=items)


@router.post(
    "",
    response_model=schemas.RoleResponse,
    status_code=201,
    dependencies=[Depends(require_permission("roles:write"))],
)
def create_role(payload: schemas.RoleCreate, db: Session = Depends(get_db)):
    if db.query(Role).filter(Role.name == payload.name).first():
        raise HTTPException(status_code=400, detail="Role already exists")

    role = Role(name=payload.name, description=payload.description)
    db.add(role)
    db.commit()
    db.refresh(role)
    return serialize_role(role, user_count=0)


@router.put(
    "/{role_id}",
    response_model=schemas.RoleResponse,
    dependencies=[Depends(require_permission("roles:write"))],
)
def update_role(role_id: int, payload: schemas.RoleUpdate, db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    data = payload.model_dump(exclude_unset=True)
    if "name" in data and data["name"] != role.name:
        if db.query(Role).filter(Role.name == data["name"]).first():
            raise HTTPException(status_code=400, detail="Role already exists")

    for field, value in data.items():
        setattr(role, field, value)
    db.commit()
    db.refresh(role)

    user_count = db.query(User).filter(User.role_id == role.id).count()
    return serialize_role(role, user_count)


@router.delete(
    "/{role_id}",
    status_code=204,
    dependencies=[Depends(require_permission("roles:write"))],
)
def delete_role(role_id: int, db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    in_use = db.query(User).filter(User.role_id == role_id).count()
    if in_use:
        raise HTTPException(status_code=400, detail="Cannot delete a role assigned to users")

    db.delete(role)
    db.commit()


# ---------- Permission Matrix ----------

permissions_router = APIRouter(
    prefix="/settings/permissions",
    tags=["Roles & Permissions"],
    dependencies=[Depends(require_permission("roles:read"))],
)


@permissions_router.get("", response_model=list[schemas.PermissionResponse])
def list_all_permissions(db: Session = Depends(get_db)):
    """Full permission catalog: free-form admin codes (users:read, ...) plus
    the '<module>:<action>' codes that back the Permission Matrix."""
    return db.query(Permission).order_by(Permission.code).all()


@permissions_router.post(
    "",
    response_model=schemas.PermissionResponse,
    status_code=201,
    dependencies=[Depends(require_permission("roles:write"))],
)
def create_permission(payload: schemas.PermissionCreate, db: Session = Depends(get_db)):
    if db.query(Permission).filter(Permission.code == payload.code).first():
        raise HTTPException(status_code=400, detail="Permission code already exists")

    perm = Permission(code=payload.code, description=payload.description)
    db.add(perm)
    db.commit()
    db.refresh(perm)
    return perm


@permissions_router.get("/matrix", response_model=list[schemas.RoleResponse])
def get_permission_matrix(db: Session = Depends(get_db)):
    """Every role with its full permissions matrix — renders the Permission
    Matrix grid (roles as rows, module/action cells as ACCESS/VIEW toggles)."""
    roles = db.query(Role).order_by(Role.id).all()
    counts = _role_user_counts(db)
    return [serialize_role(r, counts.get(r.id, 0)) for r in roles]


@permissions_router.put(
    "/{role_id}",
    response_model=schemas.RoleResponse,
    dependencies=[Depends(require_permission("roles:write"))],
)
def set_role_permissions(
    role_id: int, payload: schemas.RolePermissionsUpdate, db: Session = Depends(get_db)
):
    """Update a role's permission matrix. Only the modules/actions present in
    `payload.permissions` change — matches ticking/unticking checkboxes in
    the matrix UI and saving the row (the frontend always sends the full
    matrix, so in practice this is a full replace; a partial payload works
    the same way and leaves everything else untouched)."""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    unknown = sorted(
        f"{module_id}:{action_id}"
        for module_id, actions in payload.permissions.items()
        for action_id in actions
        if not permissions_catalog.is_known_module_action(module_id, action_id)
    )
    if unknown:
        raise HTTPException(status_code=400, detail=f"Unknown module/action pairs: {unknown}")

    linked_codes = {p.code for p in role.permissions}
    for module_id, actions in payload.permissions.items():
        for action_id, level in actions.items():
            code = permissions_catalog.permission_code(module_id, action_id)
            if level == permissions_catalog.ACCESS:
                linked_codes.add(code)
            else:
                linked_codes.discard(code)

    existing = (
        {p.code: p for p in db.query(Permission).filter(Permission.code.in_(linked_codes)).all()}
        if linked_codes
        else {}
    )
    missing_codes = linked_codes - existing.keys()
    for code in missing_codes:
        perm = Permission(code=code)
        db.add(perm)
        existing[code] = perm
    if missing_codes:
        db.flush()

    role.permissions = [existing[code] for code in linked_codes]
    db.commit()
    db.refresh(role)

    user_count = db.query(User).filter(User.role_id == role.id).count()
    return serialize_role(role, user_count)
