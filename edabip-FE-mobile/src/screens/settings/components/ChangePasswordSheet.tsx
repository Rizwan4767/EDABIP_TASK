import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/buttons/Button';
import { AppText } from '@/components/common/AppText';
import { TextField } from '@/components/inputs/TextField';
import { BottomSheet } from '@/components/modals/BottomSheet';
import { getPasswordRules, isValidPassword } from '@/utils/validation';

export function ChangePasswordSheet({
  visible,
  onClose,
  onSave,
}: Readonly<{
  visible: boolean;
  onClose: () => void;
  onSave: (password: string) => Promise<unknown>;
}>) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const close = () => {
    setPassword('');
    setError('');
    setStatus('');
    onClose();
  };

  const submit = async () => {
    if (!isValidPassword(password)) {
      const failed = getPasswordRules(password).find((rule) => !rule.passed);
      setError(failed?.label ?? 'Enter a new password.');
      return;
    }

    setSaving(true);
    setStatus('');
    try {
      await onSave(password);
      setPassword('');
      setError('');
      setStatus('Password updated.');
    } catch {
      setStatus('Could not update password. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={close}
      title="Change Password"
      footer={
        <Button
          label={saving ? 'Updating…' : 'Change Password'}
          onPress={() => void submit()}
          loading={saving}
        />
      }
    >
      <View style={{ gap: 12 }}>
        <TextField
          label="New Password"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setError('');
            setStatus('');
          }}
          isPassword
          placeholder="********"
          autoComplete="new-password"
          error={error}
        />
        {status ? (
          <AppText variant="caption" color={status.startsWith('Could') ? 'danger' : 'success'}>
            {status}
          </AppText>
        ) : null}
      </View>
    </BottomSheet>
  );
}
