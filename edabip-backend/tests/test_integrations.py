from app.models import User


def test_list_my_integrations_auto_creates_inactive_rows(client):
    response = client.get("/settings/integrations/me")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 4
    assert all(item["connected"] is False for item in data)
    # The frontend uses `id` straight from this list as the id it toggles by
    # (see setIntegrationConnected(id, connected) in settingsApi.js) — this
    # only works if `id` is directly usable as the toggle endpoint's
    # {provider_id} path segment, so there's no separate id to translate.
    assert all(isinstance(item["id"], int) for item in data)


def test_toggle_my_integration_connect_and_disconnect(client):
    listing = client.get("/settings/integrations/me").json()
    provider_id = listing[0]["id"]

    connect_resp = client.post(f"/settings/integrations/me/{provider_id}/toggle", json={"connected": True})
    assert connect_resp.status_code == 200
    assert connect_resp.json()["connected"] is True
    assert connect_resp.json()["id"] == provider_id
    assert connect_resp.json()["connectedAt"] is not None

    disconnect_resp = client.post(f"/settings/integrations/me/{provider_id}/toggle", json={"connected": False})
    assert disconnect_resp.status_code == 200
    assert disconnect_resp.json()["connected"] is False
    assert disconnect_resp.json()["connectedAt"] is None


def test_toggle_integration_unknown_provider_404s(client):
    response = client.post("/settings/integrations/me/999999/toggle", json={"connected": True})
    assert response.status_code == 404


def test_toggle_integration_by_user_id(client, db_session):
    user = User(first_name="Integration", last_name="Test", email="inttest@edabip.com")
    db_session.add(user)
    db_session.commit()

    listing = client.get(f"/settings/integrations/{user.id}").json()
    provider_id = listing[0]["id"]

    toggle_resp = client.post(
        f"/settings/integrations/{user.id}/{provider_id}/toggle", json={"connected": True}
    )
    assert toggle_resp.status_code == 200
    assert toggle_resp.json()["connected"] is True
