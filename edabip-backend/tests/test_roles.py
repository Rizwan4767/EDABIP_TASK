from app.models import Permission, Role, User


def test_list_roles_paginated(client, db_session):
    response = client.get("/settings/roles?page=1&page_size=2")
    assert response.status_code == 200
    data = response.json()

    # Admin, Business Analyst, Editor, Viewer, Executive, Data Engineer,
    # Client User — see tests/conftest.py.
    assert data["total"] == 7
    assert len(data["items"]) == 2
    assert data["page"] == 1
    assert data["pageSize"] == 2
    # Every role in the page carries its full permission matrix + user count,
    # not just name/description.
    assert "permissions" in data["items"][0]
    assert "userCount" in data["items"][0]


def test_create_role(client, db_session):
    payload = {"name": "NewRole", "description": "New Description"}
    response = client.post("/settings/roles", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "NewRole"
    assert data["description"] == "New Description"
    assert data["userCount"] == 0
    # A brand new role starts fully VIEW — no implicit access anywhere.
    assert data["permissions"]["dashboard"]["view"] == "view"

    role = db_session.query(Role).filter(Role.name == "NewRole").first()
    assert role is not None


def test_create_role_duplicate_name_rejected(client, db_session):
    client.post("/settings/roles", json={"name": "DupRole", "description": "First"})
    response = client.post("/settings/roles", json={"name": "DupRole", "description": "Second"})
    assert response.status_code == 400


def test_update_role(client, db_session):
    role = db_session.query(Role).filter(Role.name == "Viewer").first()

    response = client.put(f"/settings/roles/{role.id}", json={"description": "Updated Viewer description"})
    assert response.status_code == 200
    assert response.json()["description"] == "Updated Viewer description"

    db_session.refresh(role)
    assert role.description == "Updated Viewer description"


def test_delete_role_in_use_is_blocked(client, db_session):
    viewer_role = db_session.query(Role).filter(Role.name == "Viewer").first()

    dummy = User(first_name="Dummy", last_name="User", email="dummyrole@edabip.com", role_id=viewer_role.id)
    db_session.add(dummy)
    db_session.commit()

    response = client.delete(f"/settings/roles/{viewer_role.id}")
    assert response.status_code == 400
    assert response.json()["detail"] == "Cannot delete a role assigned to users"


def test_delete_unused_role(client, db_session):
    role = Role(name="UnusedRole", description="No users here")
    db_session.add(role)
    db_session.commit()

    response = client.delete(f"/settings/roles/{role.id}")
    assert response.status_code == 204
    assert db_session.query(Role).filter(Role.id == role.id).first() is None


def test_permissions_list_and_create(client, db_session):
    response = client.get("/settings/permissions")
    assert response.status_code == 200
    # 4 free-form admin codes (users:read, users:write, roles:write,
    # dashboards:view) + the 10 canonical '<module>:<action>' codes that
    # back the Permission Matrix (app/core/permissions_catalog.py).
    assert len(response.json()) == 14

    create_resp = client.post(
        "/settings/permissions", json={"code": "reports:delete", "description": "Can delete reports"}
    )
    assert create_resp.status_code == 201
    assert create_resp.json()["code"] == "reports:delete"
    assert db_session.query(Permission).filter(Permission.code == "reports:delete").first() is not None


def test_permission_matrix_reflects_seeded_defaults(client, db_session):
    """Admin should show full access almost everywhere; a role outside the
    canonical five (Editor) should default entirely to view."""
    matrix_resp = client.get("/settings/permissions/matrix")
    assert matrix_resp.status_code == 200
    rows = {item["name"]: item for item in matrix_resp.json()}

    assert rows["Admin"]["permissions"]["users"]["manage"] == "access"
    assert rows["Admin"]["permissions"]["dashboard"]["edit"] == "access"
    assert rows["Editor"]["permissions"]["dashboard"]["view"] == "view"
    assert rows["Editor"]["permissions"]["users"]["manage"] == "view"


def test_set_role_permissions_partial_update(client, db_session):
    """Only the module/action present in the payload should change; every
    other cell in the matrix keeps its previously-stored level."""
    role = db_session.query(Role).filter(Role.name == "Business Analyst").first()

    before = next(
        item
        for item in client.get("/settings/permissions/matrix").json()
        if item["name"] == "Business Analyst"
    )
    assert before["permissions"]["reports"]["generate"] == "view"  # not Admin-only by default
    assert before["permissions"]["dashboard"]["view"] == "access"  # every canonical role gets this

    update_resp = client.put(
        f"/settings/permissions/{role.id}",
        json={"permissions": {"reports": {"generate": "access"}}},
    )
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["permissions"]["reports"]["generate"] == "access"
    # Untouched cells are unaffected by the partial payload.
    assert updated["permissions"]["dashboard"]["view"] == "access"
    assert updated["permissions"]["billing"]["edit"] == "view"

    after = next(
        item
        for item in client.get("/settings/permissions/matrix").json()
        if item["name"] == "Business Analyst"
    )
    assert after["permissions"]["reports"]["generate"] == "access"


def test_set_role_permissions_can_revoke_access(client, db_session):
    role = db_session.query(Role).filter(Role.name == "Admin").first()
    assert role is not None

    response = client.put(
        f"/settings/permissions/{role.id}",
        json={"permissions": {"users": {"manage": "view"}}},
    )
    assert response.status_code == 200
    assert response.json()["permissions"]["users"]["manage"] == "view"


def test_set_role_permissions_rejects_unknown_module_or_action(client, db_session):
    role = db_session.query(Role).filter(Role.name == "Admin").first()
    response = client.put(
        f"/settings/permissions/{role.id}",
        json={"permissions": {"not-a-real-module": {"view": "access"}}},
    )
    assert response.status_code == 400


def test_set_role_permissions_rejects_invalid_level(client, db_session):
    """Only 'access'/'view' are valid levels — anything else should be a
    clean 422 (Pydantic Literal validation), not a 500 or a silent no-op."""
    role = db_session.query(Role).filter(Role.name == "Admin").first()
    response = client.put(
        f"/settings/permissions/{role.id}",
        json={"permissions": {"dashboard": {"view": "full-admin"}}},
    )
    assert response.status_code == 422


def test_set_role_permissions_404_for_unknown_role(client):
    response = client.put(
        "/settings/permissions/999999",
        json={"permissions": {"dashboard": {"view": "access"}}},
    )
    assert response.status_code == 404
