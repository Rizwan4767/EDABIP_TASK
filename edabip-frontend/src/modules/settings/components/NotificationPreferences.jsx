import { useEffect, useState } from 'react';
import CollapsibleSection from './CollapsibleSection.jsx';
import { SettingsSelect, ToggleSwitch } from './SettingsControls.jsx';

function NotificationPreferences({ value, options, onSave }) {
  const [form, setForm] = useState(value);
  const [status, setStatus] = useState('');
  const [statusIsError, setStatusIsError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(value);
  }, [value]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus('');
    try {
      await onSave(form);
      setStatus('Notification preferences updated.');
      setStatusIsError(false);
    } catch (error) {
      setStatus(error?.message || 'Could not update preferences. Try again.');
      setStatusIsError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <CollapsibleSection title="Notification Preferences">
      <form className="st-form" onSubmit={handleSubmit}>
        <div className="st-notify">
          <div className="st-notify__fields">
            <SettingsSelect
              id="st-dashboard-alerts"
              label="Dashboard Alerts"
              value={form.dashboardAlerts}
              options={options.dashboardAlerts}
              onChange={(dashboardAlerts) => {
                setForm((prev) => ({ ...prev, dashboardAlerts }));
                setStatus('');
              }}
            />
            <SettingsSelect
              id="st-report-updates"
              label="Report Updates"
              value={form.reportUpdates}
              options={options.reportUpdates}
              onChange={(reportUpdates) => {
                setForm((prev) => ({ ...prev, reportUpdates }));
                setStatus('');
              }}
            />
            <ToggleSwitch
              id="st-sms-notifications"
              label="Enable SMS Notification"
              checked={form.smsNotifications}
              onChange={(smsNotifications) => {
                setForm((prev) => ({ ...prev, smsNotifications }));
                setStatus('');
              }}
            />
          </div>
        </div>
        <div className="st-form__footer">
          {status ? (
            <output
              className={`st-status${statusIsError ? ' is-error' : ' is-success'}`}
            >
              {status}
            </output>
          ) : (
            <span />
          )}
          <button type="submit" className="db-btn db-btn--solid st-save-btn" disabled={saving}>
            {saving ? 'Updating…' : 'Update Preferences'}
          </button>
        </div>
      </form>
    </CollapsibleSection>
  );
}

export default NotificationPreferences;
