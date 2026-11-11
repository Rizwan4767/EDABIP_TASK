from app.models import User


def test_update_my_notification_preferences(client):
    payload = {
        "dashboardAlerts": "critical",
        "reportUpdates": "weekly",
        "smsNotifications": True,
    }
    response = client.put("/settings/notifications/me", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["dashboardAlerts"] == "critical"
    assert data["reportUpdates"] == "weekly"
    assert data["smsNotifications"] is True


def test_update_notifications_rejects_invalid_frequency(client):
    response = client.put("/settings/notifications/me", json={"reportUpdates": "Fortnightly"})
    assert response.status_code == 422


def test_update_notifications_rejects_invalid_dashboard_alert_level(client):
    # "All Alerts" was the old (pre-frontend-alignment) value; only the
    # lowercase slugs from DASHBOARD_ALERT_OPTIONS are valid now.
    response = client.put("/settings/notifications/me", json={"dashboardAlerts": "All Alerts"})
    assert response.status_code == 422


def test_update_notifications_by_user_id(client, db_session):
    user = User(first_name="Notif", last_name="Test", email="notiftest@edabip.com")
    db_session.add(user)
    db_session.commit()

    payload = {
        "dashboardAlerts": "warnings",
        "reportUpdates": "realtime",
        "smsNotifications": True,
    }
    response = client.put(f"/settings/notifications/{user.id}", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["dashboardAlerts"] == "warnings"
    assert data["reportUpdates"] == "realtime"


def test_notifications_404_for_unknown_user(client):
    response = client.get("/settings/notifications/999999")
    assert response.status_code == 404
