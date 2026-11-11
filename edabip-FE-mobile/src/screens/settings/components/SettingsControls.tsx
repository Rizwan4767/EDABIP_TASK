import { useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { ChevronDownIcon } from '@/assets/settings';
import { AppText } from '@/components/common/AppText';
import { BottomSheet } from '@/components/modals/BottomSheet';
import { useTheme } from '@/hooks/useTheme';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import { settingsControlsStyles as styles } from '@/screens/settings/components/settingsControlsStyles';
import type { SettingsOption } from '@/screens/settings/settingsData';
import { optionLabel } from '@/screens/settings/settingsData';

export function SettingsTextField({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  ...rest
}: Readonly<
  {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    error?: string;
  } & Omit<TextInputProps, 'value' | 'onChangeText' | 'style'>
>) {
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <AppText variant="label" style={styles.label}>
        {label}
      </AppText>
      <View style={[styles.inputWrap, error ? styles.inputWrapInvalid : null]}>
        <TextInput
          {...rest}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          accessibilityLabel={rest.accessibilityLabel ?? label}
          underlineColorAndroid="transparent"
          style={[
            styles.input,
            { fontFamily: theme.typography.fontFamily.regular },
            !value && placeholder ? styles.placeholder : null,
          ]}
        />
      </View>
      {error ? (
        <AppText variant="caption" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

export function SettingsSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select',
}: Readonly<{
  label: string;
  value: string;
  options: SettingsOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}>) {
  const [open, setOpen] = useState(false);
  const selected = optionLabel(options, value, '');
  const display = selected || placeholder;

  return (
    <View style={styles.field}>
      <AppText variant="label" style={styles.label}>
        {label}
      </AppText>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        style={styles.inputWrap}
      >
        <AppText
          variant="caption"
          style={[styles.selectValue, selected ? null : styles.placeholder]}
          numberOfLines={1}
        >
          {display}
        </AppText>
        <DashboardIcon icon={ChevronDownIcon} size={12} />
      </Pressable>
      <BottomSheet visible={open} onClose={() => setOpen(false)} title={label}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => {
              onChange(option.value);
              setOpen(false);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: option.value === value }}
            style={styles.option}
          >
            <AppText
              variant={option.value === value ? 'bodyStrong' : 'body'}
              color={option.value === value ? 'brand' : 'text'}
            >
              {option.label}
            </AppText>
          </Pressable>
        ))}
      </BottomSheet>
    </View>
  );
}

export function SettingsToggle({
  label,
  value,
  onChange,
}: Readonly<{
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}>) {
  return (
    <View style={styles.toggleField}>
      <AppText variant="label" style={styles.label}>
        {label}
      </AppText>
      <Pressable
        onPress={() => onChange(!value)}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        accessibilityLabel={label}
        style={[styles.switch, value ? styles.switchOn : styles.switchOff]}
      >
        <View style={[styles.thumb, value ? styles.thumbOn : styles.thumbOff]} />
        <AppText
          variant="caption"
          style={[styles.switchLabel, value ? styles.switchLabelOn : styles.switchLabelOff]}
        >
          {value ? 'ON' : 'OFF'}
        </AppText>
      </Pressable>
    </View>
  );
}
