"""
Canonical Role & Permissions matrix.

Mirrors the EDABIP frontend's `src/modules/settings/data/permissionMatrix.js`
module-for-module, so the Roles Overview + Permission Matrix tabs on the
Settings page get exactly the modules/actions/role defaults the UI already
renders. If the frontend's permission matrix ever changes, update this file
to match.

Access levels
-------------
Every (module, action) pair has exactly two levels:
    - ACCESS ("access"): full access
    - VIEW   ("view"):   view-only (the default/lowest level)

No "level" column is stored anywhere: a role has ACCESS to an action
if-and-only-if the matching Permission (code "<module>:<action>") is linked
to that role via `role_permissions`. Anything not linked is VIEW by default.
`seed.py` / `tests/conftest.py` are responsible for seeding realistic
starting data; `app/routers/roles.py` is responsible for reading/writing it
through this catalog.
"""
from typing import Dict, List, TypedDict

ACCESS = "access"
VIEW = "view"

# Matches MATRIX_ROLE_ORDER in permissionMatrix.js — roles outside this list
# simply sort to the end on the frontend and get VIEW-only defaults here.
MATRIX_ROLE_ORDER: List[str] = [
    "Admin",
    "Executive",
    "Business Analyst",
    "Data Engineer",
    "Client User",
]

_ALL_ROLES = MATRIX_ROLE_ORDER
_ADMIN_ONLY = ["Admin"]
_ADMIN_EXEC_ENGINEER = ["Admin", "Executive", "Data Engineer"]


class ActionDef(TypedDict):
    id: str
    access_roles: List[str]


class ModuleDef(TypedDict):
    id: str
    label: str
    actions: List[ActionDef]


# Same 8 modules / 10 actions as PERMISSION_MODULES in permissionMatrix.js, in
# the same order.
PERMISSION_MODULES: List[ModuleDef] = [
    {
        "id": "dashboard",
        "label": "Dashboard",
        "actions": [
            {"id": "view", "access_roles": _ALL_ROLES},
            {"id": "edit", "access_roles": _ADMIN_EXEC_ENGINEER},
        ],
    },
    {
        "id": "powerbi",
        "label": "Power BI",
        "actions": [{"id": "manage", "access_roles": _ADMIN_ONLY}],
    },
    {
        "id": "tableau",
        "label": "Tableau",
        "actions": [{"id": "manage", "access_roles": _ADMIN_ONLY}],
    },
    {
        "id": "analytics",
        "label": "Analytics",
        "actions": [{"id": "advanced", "access_roles": _ADMIN_ONLY}],
    },
    {
        "id": "reports",
        "label": "Reports",
        "actions": [{"id": "generate", "access_roles": _ADMIN_ONLY}],
    },
    {
        "id": "billing",
        "label": "Billing",
        "actions": [
            {"id": "view", "access_roles": _ALL_ROLES},
            {"id": "edit", "access_roles": _ADMIN_ONLY},
        ],
    },
    {
        "id": "users",
        "label": "Users",
        "actions": [{"id": "manage", "access_roles": _ADMIN_ONLY}],
    },
    {
        "id": "settings",
        "label": "Settings",
        "actions": [{"id": "view", "access_roles": _ADMIN_ONLY}],
    },
]


def permission_code(module_id: str, action_id: str) -> str:
    """The Permission.code that represents ACCESS to one (module, action)."""
    return f"{module_id}:{action_id}"


def all_codes() -> List[str]:
    """Every canonical permission code, in matrix order."""
    return [
        permission_code(module["id"], action["id"])
        for module in PERMISSION_MODULES
        for action in module["actions"]
    ]


def is_known_module_action(module_id: str, action_id: str) -> bool:
    for module in PERMISSION_MODULES:
        if module["id"] != module_id:
            continue
        return any(action["id"] == action_id for action in module["actions"])
    return False


def default_level_for(role_name: str, module_id: str, action_id: str) -> str:
    """ACCESS if role_name is in that action's default access list, else VIEW.

    Mirrors defaultLevelFor()/buildDefaultPermissions() in permissionMatrix.js.
    Used only to seed sensible defaults for a fresh role — once a role's
    permissions are stored, the stored link (present/absent) is authoritative.
    """
    for module in PERMISSION_MODULES:
        if module["id"] != module_id:
            continue
        for action in module["actions"]:
            if action["id"] == action_id:
                return ACCESS if role_name in action["access_roles"] else VIEW
    return VIEW


def build_default_permissions(role_name: str) -> Dict[str, Dict[str, str]]:
    """The full {module: {action: level}} matrix a fresh role of this name
    would show on the frontend before anyone customizes it."""
    return {
        module["id"]: {
            action["id"]: default_level_for(role_name, module["id"], action["id"])
            for action in module["actions"]
        }
        for module in PERMISSION_MODULES
    }


def default_access_codes(role_name: str) -> List[str]:
    """Permission codes that should be linked (ACCESS) for a freshly seeded
    role of this name."""
    return [
        permission_code(module["id"], action["id"])
        for module in PERMISSION_MODULES
        for action in module["actions"]
        if role_name in action["access_roles"]
    ]


def module_options() -> List[Dict[str, str]]:
    """[{id, label}, ...] — the `modules` list the frontend expects under
    settings.options (used to render the matrix's column headers)."""
    return [{"id": module["id"], "label": module["label"]} for module in PERMISSION_MODULES]


# ---------- Enforcement: the coarse codes the routers actually check ----------
#
# The routers gate themselves with four coarse codes (`users:read`,
# `users:write`, `roles:read`, `roles:write` — see the require_permission(...)
# call sites) that are deliberately NOT cells in the matrix above. The matrix
# is what an admin ticks in the UI; these are what the code asks for.
#
# Mapping each coarse code onto the matrix cell that grants it keeps a role's
# stored matrix the single source of truth, so there is no second, invisible
# permission set for an admin to keep in sync. Roles and the Permission Matrix
# live on the Users & Access Management screen (see app/routers/roles.py's
# module docstring), which is why they are governed by the same `users:manage`
# cell as user administration itself.
GRANTED_BY: Dict[str, str] = {
    "users:read": "users:manage",
    "users:write": "users:manage",
    "roles:read": "users:manage",
    "roles:write": "users:manage",
}


def granting_codes(code: str) -> frozenset:
    """Every permission code that satisfies a `require_permission(code)` check.

    Always includes `code` itself, so a deployment that chooses to link the
    coarse code to a role directly still works, plus the matrix cell that
    implies it (if any).
    """
    matrix_code = GRANTED_BY.get(code)
    return frozenset({code} if matrix_code is None else {code, matrix_code})
