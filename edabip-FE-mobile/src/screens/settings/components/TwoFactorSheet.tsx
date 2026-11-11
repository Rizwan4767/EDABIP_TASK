import { View } from 'react-native';

import { Button } from '@/components/buttons/Button';
import { BottomSheet } from '@/components/modals/BottomSheet';
import { SettingsToggle } from '@/screens/settings/components/SettingsControls';

export function TwoFactorSheet({
  visible,
  value,
  onClose,
  onChange,
}: Readonly<{
  visible: boolean;
  value: boolean;
  onClose: () => void;
  onChange: (value: boolean) => void;
}>) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Two-Factor Authentication"
      footer={<Button label="Done" onPress={onClose} />}
    >
      <View>
        <SettingsToggle
          label="Enable two-factor authentication"
          value={value}
          onChange={onChange}
        />
      </View>
    </BottomSheet>
  );
}
