"""
Seed reference/catalog data: default roles, the integration provider catalog,
and a starter permission set (including the fixed '<module>:<action>' catalog
the Permission Matrix is built from — see app/core/permissions_catalog.py).
Idempotent — safe to run repeatedly.

    python seed_settings.py
"""
from app.core.database import Base, SessionLocal, engine
from app.core.permissions_catalog import all_codes, default_access_codes
from app.models import IntegrationProvider, Permission, Role

ROLES = [
    ("Admin", "Full access to all features and settings"),
    ("Business Analyst", "Access to analytics, reports and dashboards"),
    ("Editor", "Can edit reports and dashboards"),
    ("Viewer", "View only access to reports and dashboards"),
    # These three, plus Admin and Business Analyst above, are the five
    # MATRIX_ROLE_ORDER names from the frontend's permissionMatrix.js.
    # Seeding all five means the Roles Overview / Permission Matrix tabs
    # show a fully realistic starting state instead of three empty rows.
    ("Executive", "High-level visibility across dashboards and billing"),
    ("Data Engineer", "Builds and maintains dashboards and pipelines"),
    ("Client User", "External client with limited, view-focused access"),
]

INTEGRATION_PROVIDERS = [
    ("Salesforce CRM", "Sync leads, contacts and opportunities"),
    ("Google Analytics", "Import web analytics into dashboards"),
    ("Slack", "Post alerts and notifications to Slack channels"),
    ("Microsoft Teams", "Post alerts and reports to Teams channels"),
]

# The coarse codes the routers pass to require_permission(...). Seeded so the
# catalog is complete and self-documenting, but deliberately NOT linked to any
# role: permissions_catalog.GRANTED_BY maps each onto the matrix cell that
# grants it, so access follows the Permission Matrix an admin actually edits
# rather than a second, invisible set of links. See app/core/security.py.
_ADMIN_PERMISSIONS = [
    ("users:read", "View user accounts"),
    ("users:write", "Create, update, deactivate, or delete user accounts"),
    ("roles:read", "View roles and the permission matrix"),
    ("roles:write", "Create, update, or delete roles and permissions"),
    ("dashboards:view", "View dashboards"),
    ("reports:manage", "Create, edit, or delete reports"),
    ("billing:manage", "Manage subscription, plans, and payment methods"),
    ("settings:manage", "Manage application-wide settings"),
]

# Human-readable descriptions for the fixed matrix catalog. Codes themselves
# come from all_codes() (not hand-typed here) so this can never drift out of
# sync with app/core/permissions_catalog.py.
_MATRIX_PERMISSION_DESCRIPTIONS = {
    "dashboard:view": "View the Dashboard module",
    "dashboard:edit": "Edit dashboards",
    "powerbi:manage": "Manage the Power BI integration",
    "tableau:manage": "Manage the Tableau integration",
    "analytics:advanced": "Use advanced analytics features",
    "reports:generate": "Generate reports",
    "billing:view": "View billing information",
    "billing:edit": "Edit billing and payment details",
    "users:manage": "Manage user accounts and role assignments",
    "settings:view": "View application settings",
}

PERMISSIONS = _ADMIN_PERMISSIONS + [
    (code, _MATRIX_PERMISSION_DESCRIPTIONS.get(code, "")) for code in all_codes()
]


def run() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        role_created = {}
        for name, description in ROLES:
            role = db.query(Role).filter(Role.name == name).first()
            if role:
                role.description = description
                role_created[name] = (role, False)
            else:
                role = Role(name=name, description=description)
                db.add(role)
                db.flush()  # assign an id so it can be linked to permissions below
                role_created[name] = (role, True)

        for name, description in INTEGRATION_PROVIDERS:
            provider = db.query(IntegrationProvider).filter(IntegrationProvider.name == name).first()
            if provider:
                provider.description = description
            else:
                db.add(IntegrationProvider(name=name, description=description))

        permission_by_code = {}
        for code, description in PERMISSIONS:
            perm = db.query(Permission).filter(Permission.code == code).first()
            if perm:
                perm.description = description
            else:
                perm = Permission(code=code, description=description)
                db.add(perm)
            permission_by_code[code] = perm
        db.flush()  # assign ids before linking role_permissions below

        # Only wire up default ACCESS links the first time a canonical role
        # is created. If it already existed, an admin may have since
        # customized its permissions in the Permission Matrix UI, and
        # re-running this idempotent script must never clobber that.
        for name, (role, is_new) in role_created.items():
            if not is_new:
                continue
            role.permissions = [
                permission_by_code[code]
                for code in default_access_codes(name)
                if code in permission_by_code
            ]

        db.commit()
        print("Seed data inserted/updated successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
