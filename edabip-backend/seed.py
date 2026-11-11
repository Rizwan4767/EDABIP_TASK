"""Seed RBAC permissions and roles.

Usage:
    python seed.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from config import settings
from database import SessionLocal, engine, Base
from models import user as user_mod  # noqa: F401
from models.user import Permission, Role, User
from utils.auth import hash_password


PERMISSIONS = {
    "dashboard.view": "View the dashboard",
    "dashboard.edit": "Modify dashboard data",
    "analytics.advanced": "Access advanced analytics",
    "users.view": "View users",
    "users.create": "Create users",
    "users.edit": "Edit users",
    "users.delete": "Delete users",
    "roles.view": "View roles and permissions",
    "roles.manage": "Create/update roles and permissions",
    "reports.view": "View reports",
    "reports.create": "Create reports",
    "reports.edit": "Edit reports",
    "reports.delete": "Delete reports",
    "data.view": "View data",
    "data.create": "Create/import data",
    "data.edit": "Edit data",
    "data.delete": "Delete data",
    "settings.view": "View settings",
    "settings.edit": "Edit settings",
}


ROLE_PERMISSIONS = {
    "admin": list(PERMISSIONS),

    "executive": [
        "dashboard.view",
        "reports.view",
        "data.view",
    ],

    "business_analyst": [
        "dashboard.view",
        "analytics.advanced",
        "reports.view",
        "reports.create",
        "reports.edit",
        "data.view",
    ],

    "data_engineer": [
        "dashboard.view",
        "data.view",
        "data.create",
        "data.edit",
        "data.delete",
        "reports.view",
    ],

    "client_user": [
        "dashboard.view",
        "reports.view",
        "data.view",
    ],
}


ROLE_DESCRIPTIONS = {
    "admin": "Full system access",
    "executive": "Executive dashboard and reporting access",
    "business_analyst": "Business analysis and reporting access",
    "data_engineer": "Data engineering and data management access",
    "client_user": "Client access to dashboards, reports and permitted data",
}


ROLE_MIGRATIONS = {
    "user": "client_user",
    "data_analyst": "data_engineer",
}

ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "Admin@123"
VIEWER_EMAIL = "user@edabip.com"
VIEWER_PASSWORD = "User@123"


def _is_production() -> bool:
    return (settings.app_env or "").lower() == "production"


def _upsert_dev_user(db, *, email: str, password: str, role: Role, full_name: str, label: str) -> None:
    user = db.query(User).filter(User.email == email).first()
    fields = dict(
        role_id=role.id,
        full_name=full_name,
        password_hash=hash_password(password),
        is_active=True,
        is_verified=True,
        email_verified=True,
        failed_login_attempts=0,
        locked_until=None,
    )
    if user is None:
        db.add(User(email=email, **fields))
        print(f"[ok] {label} created: {email} / {password}")
    else:
        for key, value in fields.items():
            setattr(user, key, value)
        print(f"[ok] {label} refreshed: {email} / {password}")
    db.commit()


def _ensure_shared_admin(db) -> None:
    """Shared local admin for the team (billing:manage, user admin, etc.).

    Matches README. Skipped in production so this well-known password
    cannot be created or reset there.
    """
    if _is_production():
        return
    role = db.query(Role).filter(Role.name == "admin").first()
    if not role:
        return
    _upsert_dev_user(
        db,
        email=ADMIN_EMAIL,
        password=ADMIN_PASSWORD,
        role=role,
        full_name="EDABIP Admin",
        label="Shared admin",
    )


def _ensure_billing_viewer(db) -> None:
    """View-only billing login for frontend RBAC checks."""
    role = (
        db.query(Role).filter(Role.name == "client_user").first()
        or db.query(Role).filter(Role.name == "user").first()
    )
    if not role:
        return

    _upsert_dev_user(
        db,
        email=VIEWER_EMAIL,
        password=VIEWER_PASSWORD,
        role=role,
        full_name="Billing Viewer",
        label="View-only billing user",
    )


def main():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Create permissions
        for name, description in PERMISSIONS.items():
            permission = (
                db.query(Permission)
                .filter(Permission.name == name)
                .first()
            )

            if not permission:
                db.add(
                    Permission(
                        name=name,
                        description=description,
                    )
                )

        db.commit()

        permissions = {
            permission.name: permission
            for permission in db.query(Permission).all()
        }

        # Migrate old role names
        for old_name, new_name in ROLE_MIGRATIONS.items():
            old_role = (
                db.query(Role)
                .filter(Role.name == old_name)
                .first()
            )

            new_role = (
                db.query(Role)
                .filter(Role.name == new_name)
                .first()
            )

            if old_role and not new_role:
                old_role.name = new_name

        db.commit()

        # Create/update roles
        for name, description in ROLE_DESCRIPTIONS.items():
            role = (
                db.query(Role)
                .filter(Role.name == name)
                .first()
            )

            if not role:
                role = Role(
                    name=name,
                    description=description,
                )
                db.add(role)
                db.flush()

            role.description = description
            role.permissions = [
                permissions[p]
                for p in ROLE_PERMISSIONS[name]
            ]

        db.commit()

        # Remove obsolete roles if they have no users
        obsolete_roles = ["user", "data_analyst"]

        for role_name in obsolete_roles:
            role = (
                db.query(Role)
                .filter(Role.name == role_name)
                .first()
            )

            if role and not role.users:
                db.delete(role)

        db.commit()

        _ensure_shared_admin(db)
        _ensure_billing_viewer(db)

        print("\n[ok] RBAC ready")
        print(
            "Roles: admin, executive, business_analyst, "
            "data_engineer, client_user"
        )
        if not _is_production():
            print(f"Shared admin: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
            print(f"View-only:    {VIEWER_EMAIL} / {VIEWER_PASSWORD}")

    finally:
        db.close()


if __name__ == "__main__":
    main()
