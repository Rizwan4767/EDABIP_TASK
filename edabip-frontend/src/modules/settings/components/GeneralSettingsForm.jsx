import { useEffect, useState } from 'react';
import { SETTINGS_GENERAL_SECTION_ID } from '../../profile-completion/utils/constants.js';
import CollapsibleSection from './CollapsibleSection.jsx';
import { SettingsField, SettingsSelect, ToggleSwitch } from './SettingsControls.jsx';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

function validateGeneral(form) {
  const errors = {};

  if (!form.firstName.trim()) errors.firstName = 'Enter a first name.';
  else if (form.firstName.trim().length > 80) errors.firstName = 'First name must be 80 characters or fewer.';

  if (!form.lastName.trim()) errors.lastName = 'Enter a last name.';
  else if (form.lastName.trim().length > 80) errors.lastName = 'Last name must be 80 characters or fewer.';

  if (!form.email.trim()) errors.email = 'Enter an email address.';
  else if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter a valid email address.';

  if (form.mobileNumber.trim() && form.mobileNumber.replace(/\D/g, '').length < 10) {
    errors.mobileNumber = 'Enter a valid mobile number.';
  }

  if (!form.applicationName.trim()) errors.applicationName = 'Enter an application name.';

  return errors;
}

function GeneralSettingsForm({ value, options, onSave }) {
  const [form, setForm] = useState(value);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');
  const [statusIsError, setStatusIsError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(value);
  }, [value]);

  const update = (field) => (event) => {
    const nextValue = event.target.value;
    setForm((prev) => ({ ...prev, [field]: nextValue }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setStatus('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
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
      setStatusIsError(false);
    } catch (error) {
      // The server validates the same rules the form does, so a rejection can
      // name the exact field (e.g. an email that's already taken).
      if (error?.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...error.fieldErrors }));
      }
      setStatus(error?.message || 'Could not save general settings. Try again.');
      setStatusIsError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <CollapsibleSection id={SETTINGS_GENERAL_SECTION_ID} title="General Settings">
      <form className="st-form" onSubmit={handleSubmit} noValidate>
        <div className="st-grid">
          <SettingsField id="st-first-name" label="First Name" error={errors.firstName}>
            <input
              id="st-first-name"
              className={`st-input${errors.firstName ? ' is-invalid' : ''}`}
              value={form.firstName}
              onChange={update('firstName')}
              autoComplete="given-name"
              aria-invalid={errors.firstName ? 'true' : 'false'}
              aria-describedby={errors.firstName ? 'st-first-name-error' : undefined}
            />
          </SettingsField>
          <SettingsField id="st-last-name" label="Last Name" error={errors.lastName}>
            <input
              id="st-last-name"
              className={`st-input${errors.lastName ? ' is-invalid' : ''}`}
              value={form.lastName}
              onChange={update('lastName')}
              autoComplete="family-name"
              aria-invalid={errors.lastName ? 'true' : 'false'}
            />
          </SettingsField>
          <SettingsField id="st-email" label="Email" error={errors.email}>
            <input
              id="st-email"
              type="email"
              className={`st-input${errors.email ? ' is-invalid' : ''}`}
              value={form.email}
              readOnly
              autoComplete="email"
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby="st-email-hint"
            />
            {/* The backend refuses email changes on /me: the email is the login identity. */}
            <p className="st-field__hint" id="st-email-hint">
              Managed by your login account.
            </p>
          </SettingsField>
          <SettingsField id="st-mobile" label="Mobile Number" error={errors.mobileNumber}>
            <input
              id="st-mobile"
              type="tel"
              className={`st-input${errors.mobileNumber ? ' is-invalid' : ''}`}
              value={form.mobileNumber}
              onChange={update('mobileNumber')}
              placeholder="Enter your mobile number"
              autoComplete="tel"
              aria-invalid={errors.mobileNumber ? 'true' : 'false'}
            />
          </SettingsField>
          <SettingsField id="st-app-name" label="Application Name" error={errors.applicationName}>
            <input
              id="st-app-name"
              className={`st-input${errors.applicationName ? ' is-invalid' : ''}`}
              value={form.applicationName}
              onChange={update('applicationName')}
              aria-invalid={errors.applicationName ? 'true' : 'false'}
            />
          </SettingsField>
          <SettingsSelect
            id="st-timezone"
            label="Timezone"
            value={form.timezone}
            options={options.timezones}
            onChange={(timezone) => {
              setForm((prev) => ({ ...prev, timezone }));
              setStatus('');
            }}
          />
          <SettingsSelect
            id="st-company-size"
            label="Company Size"
            value={form.companySize}
            options={options.companySizes}
            placeholder="Company Size"
            onChange={(companySize) => {
              setForm((prev) => ({ ...prev, companySize }));
              setStatus('');
            }}
          />
          <SettingsSelect
            id="st-industry"
            label="Industry"
            value={form.industry}
            options={options.industries}
            placeholder="Industry"
            onChange={(industry) => {
              setForm((prev) => ({ ...prev, industry }));
              setStatus('');
            }}
          />
          <ToggleSwitch
            id="st-email-notifications"
            label="Enable Email Notification"
            checked={form.emailNotifications}
            onChange={(emailNotifications) => {
              setForm((prev) => ({ ...prev, emailNotifications }));
              setStatus('');
            }}
          />
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
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </CollapsibleSection>
  );
}

export default GeneralSettingsForm;
