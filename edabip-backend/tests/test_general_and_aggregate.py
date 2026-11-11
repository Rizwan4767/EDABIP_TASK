from app.models import User


def test_get_my_settings_aggregated(client):
    response = client.get("/settings/me")
    assert response.status_code == 200
    data = response.json()

    assert "general" in data
    assert "notifications" in data
    assert "security" in data
    assert "integrations" in data
    assert "roles" in data
    assert "options" in data

    assert data["general"]["firstName"] == "Dev"
    assert data["general"]["emailNotifications"] is True
    assert data["notifications"]["smsNotifications"] is False
    assert data["security"]["twoFactorEnabled"] is True
    assert len(data["options"]["timezones"]) > 0
    assert len(data["options"]["companySizes"]) > 0
    # The Permission Matrix's column headers: 8 modules, matching
    # PERMISSION_MODULES in the frontend's data/permissionMatrix.js.
    assert len(data["options"]["modules"]) == 8

    # Every seeded integration provider should appear, defaulted to disconnected.
    assert len(data["integrations"]) == 4
    assert all(i["connected"] is False for i in data["integrations"])

    # Every seeded role should appear, each with a full permission matrix —
    # not a paginated envelope, since the frontend's RoleManagement component
    # paginates client-side over the full list.
    assert len(data["roles"]) == 7
    admin = next(r for r in data["roles"] if r["name"] == "Admin")
    assert admin["permissions"]["users"]["manage"] == "access"
    assert admin["permissions"]["dashboard"]["view"] == "access"
    client_user = next(r for r in data["roles"] if r["name"] == "Client User")
    assert client_user["permissions"]["users"]["manage"] == "view"


def test_update_my_general_settings(client):
    payload = {
        "firstName": "Alin",
        "lastName": "Updated",
        "mobileNumber": "1234567890",
        "applicationName": "AppUpdated",
        "timezone": "UTC",
        "companySize": "1-50",
        "industry": "healthcare",
        "emailNotifications": False,
    }
    response = client.put("/settings/general/me", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["firstName"] == "Alin"
    assert data["applicationName"] == "AppUpdated"
    assert data["emailNotifications"] is False


def test_update_my_general_settings_rejects_invalid_mobile(client):
    response = client.put("/settings/general/me", json={"mobileNumber": "not-a-phone-#!"})
    assert response.status_code == 422


def test_mobile_number_rule_matches_frontend_digit_count_not_format(client):
    """validateGeneral() in the frontend only strips non-digits and checks
    for >= 10 digits — no format requirement beyond that. These would have
    been wrongly rejected by an earlier charset-based regex."""
    # 9 digits: too few, invalid on both sides.
    assert client.put("/settings/general/me", json={"mobileNumber": "123456789"}).status_code == 422
    # 10 digits with extension text mixed in: frontend counts digits only.
    ok = client.put("/settings/general/me", json={"mobileNumber": "123-456-7890 x123"})
    assert ok.status_code == 200
    assert ok.json()["mobileNumber"] == "123-456-7890 x123"
    # International formatting with a leading +: valid.
    intl = client.put("/settings/general/me", json={"mobileNumber": "+91 98765 43210"})
    assert intl.status_code == 200


def test_general_settings_name_fields_required_and_length_capped(client):
    assert client.put("/settings/general/me", json={"firstName": "   "}).status_code == 422
    assert client.put("/settings/general/me", json={"firstName": "x" * 81}).status_code == 422
    assert client.put("/settings/general/me", json={"firstName": "x" * 80}).status_code == 200
    assert client.put("/settings/general/me", json={"applicationName": ""}).status_code == 422


def test_update_general_settings_email_uniqueness(client, db_session):
    # /me can no longer change the email at all (see test_email_identity.py),
    # so uniqueness is only reachable through the admin by-id route.
    other = User(first_name="Other", last_name="Person", email="taken@edabip.com")
    target = User(first_name="Tar", last_name="Get", email="target2@edabip.com")
    db_session.add_all([other, target])
    db_session.commit()

    response = client.put(f"/settings/general/{target.id}", json={"email": "Taken@edabip.com"})
    assert response.status_code == 400
    assert "already in use" in response.json()["detail"]


def test_admin_get_and_update_general_settings_by_id(client, db_session):
    user = User(first_name="Target", last_name="User", email="target@edabip.com")
    db_session.add(user)
    db_session.commit()

    get_resp = client.get(f"/settings/general/{user.id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["email"] == "target@edabip.com"

    put_resp = client.put(f"/settings/general/{user.id}", json={"firstName": "Renamed"})
    assert put_resp.status_code == 200
    assert put_resp.json()["firstName"] == "Renamed"


def test_general_settings_404_for_unknown_user(client):
    response = client.get("/settings/general/999999")
    assert response.status_code == 404


# ---------- Email changes are Admin-only (same rule as PUT /users/{id}) ----------


def test_admin_general_settings_email_change_refused_for_users_write_without_admin_role(
    user_manager_client, db_session
):
    user = User(first_name="Mail", last_name="Target", email="gs.mailtarget@edabip.com")
    db_session.add(user)
    db_session.commit()

    response = user_manager_client.put(
        f"/settings/general/{user.id}", json={"email": "hijack@edabip.com"}
    )
    assert response.status_code == 403

    db_session.refresh(user)
    assert user.email == "gs.mailtarget@edabip.com"


def test_admin_general_settings_other_fields_allowed_for_users_write(
    user_manager_client, db_session
):
    """Only the email is Admin-only; users:write still covers the rest, and
    resending the unchanged email (as the form does) is not an email change."""
    user = User(first_name="Old", last_name="Name", email="gs.namechange@edabip.com")
    db_session.add(user)
    db_session.commit()

    response = user_manager_client.put(
        f"/settings/general/{user.id}",
        json={"firstName": "New", "email": "gs.namechange@edabip.com"},
    )
    assert response.status_code == 200
    assert response.json()["firstName"] == "New"


def test_admin_general_settings_email_change_allowed_for_admin(client, db_session):
    user = User(first_name="Mail", last_name="Target", email="gs.adminchange@edabip.com")
    db_session.add(user)
    db_session.commit()

    response = client.put(
        f"/settings/general/{user.id}", json={"email": "gs.adminchanged@edabip.com"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "gs.adminchanged@edabip.com"
