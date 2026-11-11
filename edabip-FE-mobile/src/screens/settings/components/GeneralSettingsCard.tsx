import { useState } from 'react';

import { Button } from '@/components/buttons/Button';
import { AppText } from '@/components/common/AppText';
import { settingsControlsStyles } from '@/screens/settings/components/settingsControlsStyles';
import {
  SettingsSelect,
  SettingsTextField,
  SettingsToggle,
} from '@/screens/settings/components/SettingsControls';
import { SettingsSectionCard } from '@/screens/settings/components/SettingsSectionCard';
import type { GeneralSettings, SettingsOptions } from '@/screens/settings/settingsData';
import { isValidEmail } from '@/utils/validation';

function validateGeneral(form: GeneralSettings) {
  const errors: Partial<Record<keyof GeneralSettings, string>> = {};

  if (!form.firstName.trim()) errors.firstName = 'Enter a first name.';
  else if (form.firstName.trim().length > 80) {
    errors.firstName = 'First name must be 80 characters or fewer.';
  }

  if (!form.lastName.trim()) errors.lastName = 'Enter a last name.';
  else if (form.lastName.trim().length > 80) {
    errors.lastName = 'Last name must be 80 characters or fewer.';
  }

  if (!form.email.trim()) errors.email = 'Enter an email address.';
  else if (!isValidEmail(form.email.trim())) errors.email = 'Enter a valid email address.';

  if (form.mobileNumber.trim() && form.mobileNumber.replace(/\D/g, '').length < 10) {
    errors.mobileNumber = 'Enter a valid mobile number.';
  }

  if (!form.applicationName.trim()) errors.applicationName = 'Enter an application name.';

  return errors;
}

export function GeneralSettingsCard({
  value,
  options,
  expanded,
  onToggle,
  onSave,
}: Readonly<{
  value: GeneralSettings;
  options: SettingsOptions;
  expanded: boolean;
  onToggle: () => void;
  onSave: (payload: GeneralSettings) => Promise<unknown>;
}>) {
  const [form, setForm] = useState(value);
  const [source, setSource] = useState(value);
  const [errors, setErrors] = useState<Partial<Record<keyof GeneralSettings, string>>>({});
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  if (value !== source) {
    setSource(value);
    setForm(value);
    setErrors({});
    setStatus('');
  }

  const update = <K extends keyof GeneralSettings>(field: K, next: GeneralSettings[K]) => {
    setForm((current) => ({ ...current, [field]: next }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setStatus('');
  };

  const submit = async () => {
    const nextErrors = validateGeneral(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setStatus('');
    try {
      await onSave({
        ...form,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        mobileNumber: form.mobileNumber.trim(),
        applicationName: form.applicationName.trim(),
      });
      setStatus('General settings saved.');
    } catch {
      setStatus('Could not save general settings. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsSectionCard title="General Settings" expanded={expanded} onToggle={onToggle}>
      <SettingsTextField
        label="First Name"
        value={form.firstName}
        onChangeText={(firstName) => update('firstName', firstName)}
        placeholder="Enter your First Name"
        autoComplete="given-name"
        error={errors.firstName}
      />
      <SettingsTextField
        label="Last Name"
        value={form.lastName}
        onChangeText={(lastName) => update('lastName', lastName)}
        placeholder="Enter your Last Name"
        autoComplete="family-name"
        error={errors.lastName}
      />
      <SettingsTextField
        label="Email"
        value={form.email}
        onChangeText={(email) => update('email', email)}
        placeholder="Enter your Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={errors.email}
      />
      <SettingsTextField
        label="Mobile Number"
        value={form.mobileNumber}
        onChangeText={(mobileNumber) => update('mobileNumber', mobileNumber)}
        placeholder="Enter your Number"
        keyboardType="phone-pad"
        autoComplete="tel"
        error={errors.mobileNumber}
      />
      <SettingsTextField
        label="Application Name"
        value={form.applicationName}
        onChangeText={(applicationName) => update('applicationName', applicationName)}
        error={errors.applicationName}
      />
      <SettingsSelect
        label="Timezone"
        value={form.timezone}
        options={options.timezones}
        onChange={(timezone) => update('timezone', timezone)}
      />
      <SettingsSelect
        label="Company Size"
        value={form.companySize}
        options={options.companySizes}
        placeholder="Company Size"
        onChange={(companySize) => update('companySize', companySize)}
      />
      <SettingsSelect
        label="Industry"
        value={form.industry}
        options={options.industries}
        placeholder="Industry"
        onChange={(industry) => update('industry', industry)}
      />
      <SettingsToggle
        label="Enable Email Notification"
        value={form.emailNotifications}
        onChange={(emailNotifications) => update('emailNotifications', emailNotifications)}
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
        label={saving ? 'Saving…' : 'Save Changes'}
        onPress={() => void submit()}
        loading={saving}
      />
    </SettingsSectionCard>
  );
}
