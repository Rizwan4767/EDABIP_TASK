import { useState } from 'react';
import { Pressable } from 'react-native';

import { ChevronRightIcon } from '@/assets/settings';
import { Button } from '@/components/buttons/Button';
import { AppText } from '@/components/common/AppText';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import { ChangePasswordSheet } from '@/screens/settings/components/ChangePasswordSheet';
import { settingsControlsStyles } from '@/screens/settings/components/settingsControlsStyles';
import { SettingsSectionCard } from '@/screens/settings/components/SettingsSectionCard';
import { securityCardStyles as styles } from '@/screens/settings/components/securityCardStyles';
import { TwoFactorSheet } from '@/screens/settings/components/TwoFactorSheet';
import type { SecuritySettings } from '@/screens/settings/settingsData';

export function SecurityCard({
  value,
  expanded,
  onToggle,
  onSave,
  onChangePassword,
}: Readonly<{
  value: SecuritySettings;
  expanded: boolean;
  onToggle: () => void;
  onSave: (payload: SecuritySettings) => Promise<unknown>;
  onChangePassword: (password: string) => Promise<unknown>;
}>) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(value.twoFactorEnabled);
  const [source, setSource] = useState(value);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  if (value !== source) {
    setSource(value);
    setTwoFactorEnabled(value.twoFactorEnabled);
  }

  const submit = async () => {
    setSaving(true);
    setStatus('');
    try {
      await onSave({ twoFactorEnabled });
      setStatus('Security settings saved.');
    } catch {
      setStatus('Could not save security settings. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SettingsSectionCard title="Security" expanded={expanded} onToggle={onToggle}>
        <Pressable
          onPress={() => setPasswordOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Change Password"
          style={styles.row}
        >
          <AppText variant="body" style={styles.label}>
            Change Password
          </AppText>
          <DashboardIcon icon={ChevronRightIcon} size={12} />
        </Pressable>

        <Pressable
          onPress={() => setTwoFactorOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Two-Factor Authentication"
          style={[styles.row, styles.rowLast]}
        >
          <AppText variant="body" style={styles.label}>
            Two-Factor Authentication (2FA)
          </AppText>
          <DashboardIcon icon={ChevronRightIcon} size={12} />
        </Pressable>

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
          label={saving ? 'Saving…' : 'Save Security Settings'}
          onPress={() => void submit()}
          loading={saving}
        />
      </SettingsSectionCard>

      <ChangePasswordSheet
        visible={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        onSave={onChangePassword}
      />

      <TwoFactorSheet
        visible={twoFactorOpen}
        value={twoFactorEnabled}
        onClose={() => setTwoFactorOpen(false)}
        onChange={(next) => {
          setTwoFactorEnabled(next);
          setStatus('');
        }}
      />
    </>
  );
}
