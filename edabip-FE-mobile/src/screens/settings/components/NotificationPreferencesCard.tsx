import { useState } from 'react';

import { Button } from '@/components/buttons/Button';
import { AppText } from '@/components/common/AppText';
import { settingsControlsStyles } from '@/screens/settings/components/settingsControlsStyles';
import { SettingsSelect, SettingsToggle } from '@/screens/settings/components/SettingsControls';
import { SettingsSectionCard } from '@/screens/settings/components/SettingsSectionCard';
import type { NotificationSettings, SettingsOptions } from '@/screens/settings/settingsData';

export function NotificationPreferencesCard({
  value,
  options,
  expanded,
  onToggle,
  onSave,
}: Readonly<{
  value: NotificationSettings;
  options: SettingsOptions;
  expanded: boolean;
  onToggle: () => void;
  onSave: (payload: NotificationSettings) => Promise<unknown>;
}>) {
  const [form, setForm] = useState(value);
  const [source, setSource] = useState(value);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  if (value !== source) {
    setSource(value);
    setForm(value);
    setStatus('');
  }

  const update = <K extends keyof NotificationSettings>(
    field: K,
    next: NotificationSettings[K],
  ) => {
    setForm((current) => ({ ...current, [field]: next }));
    setStatus('');
  };

  const submit = async () => {
    setSaving(true);
    setStatus('');
    try {
      await onSave(form);
      setStatus('Notification preferences updated.');
    } catch {
      setStatus('Could not update preferences. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsSectionCard title="Notification Preferences" expanded={expanded} onToggle={onToggle}>
      <SettingsSelect
        label="Dashboard Alerts"
        value={form.dashboardAlerts}
        options={options.dashboardAlerts}
        onChange={(dashboardAlerts) => update('dashboardAlerts', dashboardAlerts)}
      />
      <SettingsSelect
        label="Report Updates"
        value={form.reportUpdates}
        options={options.reportUpdates}
        onChange={(reportUpdates) => update('reportUpdates', reportUpdates)}
      />
      <SettingsToggle
        label="Enable SMS Notifications"
        value={form.smsNotifications}
        onChange={(smsNotifications) => update('smsNotifications', smsNotifications)}
      />
      {status ? (
        <AppText
          variant="caption"
          style={[
            settingsControlsStyles.status,
            { color: status.startsWith('Could') ? '#DD2D30' : '#2DA20A' },
          ]}
        >
          {status}
        </AppText>
      ) : null}
      <Button
        label={saving ? 'Updating…' : 'Update Preferences'}
        onPress={() => void submit()}
        loading={saving}
      />
    </SettingsSectionCard>
  );
}
