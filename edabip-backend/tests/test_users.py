from app.models import Role, User


def test_create_user_success(client, db_session):
    role = db_session.query(Role).filter(Role.name == "Viewer").first()
    payload = {"first_name": "Test", "last_name": "User", "email": "testuser@edabip.com", "role_id": role.id}
    response = client.post("/users", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["first_name"] == "Test"
    assert data["email"] == "testuser@edabip.com"
    assert data["role_id"] == role.id
    assert data["role_name"] == "Viewer"


def test_create_user_duplicate_email(client, db_session):
    payload = {"first_name": "First", "last_name": "User", "email": "dup@edabip.com"}
    client.post("/users", json=payload)
    response = client.post("/users", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_list_users_pagination_and_search(client, db_session):
    u1 = User(first_name="Alice", last_name="Smith", email="alice@edabip.com")
    u2 = User(first_name="Bob", last_name="Jones", email="bob@edabip.com")
    u3 = User(first_name="Charlie", last_name="Brown", email="charlie@edabip.com")
    db_session.add_all([u1, u2, u3])
    db_session.commit()

    response = client.get("/users?page=1&page_size=2")
    assert response.status_code == 200
    data = response.json()
    # Four, not three: the signed-in admin making the request is a user row
    # too (see the client fixture in conftest.py).
    assert data["total"] == 4
    assert len(data["items"]) == 2

    search_response = client.get("/users?search=Bob")
    assert search_response.status_code == 200
    assert search_response.json()["total"] == 1
    assert search_response.json()["items"][0]["first_name"] == "Bob"


def test_update_user(client, db_session):
    user = User(first_name="Old", last_name="Name", email="old@edabip.com")
    db_session.add(user)
    db_session.commit()

    response = client.put(f"/users/{user.id}", json={"first_name": "New", "email": "new@edabip.com"})
    assert response.status_code == 200
    assert response.json()["first_name"] == "New"
    assert response.json()["email"] == "new@edabip.com"


def test_assign_role(client, db_session):
    user = User(first_name="User", last_name="RoleTest", email="roletest@edabip.com")
    db_session.add(user)
    db_session.commit()

    role = db_session.query(Role).filter(Role.name == "Admin").first()
    response = client.put(f"/users/{user.id}/role", json={"role_id": role.id})
    assert response.status_code == 200
    assert response.json()["role_id"] == role.id
    assert response.json()["role_name"] == "Admin"


def test_assign_unknown_role_rejected(client, db_session):
    user = User(first_name="User", last_name="RoleTest2", email="roletest2@edabip.com")
    db_session.add(user)
    db_session.commit()

    response = client.put(f"/users/{user.id}/role", json={"role_id": 999999})
    assert response.status_code == 400


def test_deactivate_and_reactivate_user(client, db_session):
    user = User(first_name="Active", last_name="User", email="active@edabip.com", is_active=True)
    db_session.add(user)
    db_session.commit()

    response = client.post(f"/users/{user.id}/deactivate")
    assert response.status_code == 200
    assert response.json()["is_active"] is False

    response = client.post(f"/users/{user.id}/reactivate")
    assert response.status_code == 200
    assert response.json()["is_active"] is True


def test_delete_user(client, db_session):
    user = User(first_name="Delete", last_name="Me", email="delete@edabip.com")
    db_session.add(user)
    db_session.commit()

    response = client.delete(f"/users/{user.id}")
    assert response.status_code == 204
    assert db_session.query(User).filter(User.id == user.id).first() is None


def test_get_unknown_user_404s(client):
    response = client.get("/users/999999")
    assert response.status_code == 404


# ---------- Email changes are Admin-only ----------


def test_update_user_email_refused_for_users_write_without_admin_role(
    user_manager_client, db_session
):
    user = User(first_name="Mail", last_name="Target", email="mailtarget@edabip.com")
    db_session.add(user)
    db_session.commit()

    response = user_manager_client.put(f"/users/{user.id}", json={"email": "hijack@edabip.com"})
    assert response.status_code == 403

    db_session.refresh(user)
    assert user.email == "mailtarget@edabip.com"


def test_update_user_other_fields_allowed_for_users_write(user_manager_client, db_session):
    """Only the email is Admin-only; users:write still covers the rest."""
    user = User(first_name="Old", last_name="Name", email="namechange@edabip.com")
    db_session.add(user)
    db_session.commit()

    response = user_manager_client.put(
        f"/users/{user.id}", json={"first_name": "New", "email": "namechange@edabip.com"}
    )
    assert response.status_code == 200
    assert response.json()["first_name"] == "New"
