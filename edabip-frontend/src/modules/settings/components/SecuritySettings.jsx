import { useEffect, useState } from 'react';
import { ToggleSwitch } from './SettingsControls.jsx';

function getPasswordError(password) {
  if (!password) return 'Enter a new password.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter.';
  if (!/\d/.test(password)) return 'Password must contain a number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain a special character.';
  return '';
}

function SecuritySettings({ value, onSave, onChangePassword }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(value.twoFactorEnabled);
  const [status, setStatus] = useState('');
  const [statusIsError, setStatusIsError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    setTwoFactorEnabled(value.twoFactorEnabled);
  }, [value]);

  const handlePasswordChange = async (event) => {
    event.preventDefault();

    // Presence only. Whether it's actually correct is the server's call —
    // the browser has no way to know, and shouldn't.
    const missingCurrent = currentPassword ? '' : 'Enter your current password.';
    const error = getPasswordError(password);
    setCurrentPasswordError(missingCurrent);
    setPasswordError(error);
    if (missingCurrent || error) return;

    setChangingPassword(true);
    setStatus('');
    try {
      await onChangePassword({ currentPassword, newPassword: password });
      setCurrentPassword('');
      setPassword('');
      setStatus('Password updated.');
      setStatusIsError(false);
    } catch (error) {
      const message = error?.message || 'Could not update password. Try again.';
      // The server uses exactly two codes to point at a field: 400 means the
      // current password was rejected, 422 means the new one was (too weak,
      // or the same as the current one). Anything else — 429 rate limited,
      // 401 expired session, 503 auth service down — is about the request,
      // not a field, so it belongs in the status line alone.
      if (error?.status === 400) {
        setCurrentPasswordError(message);
      } else if (error?.status === 422) {
        setPasswordError(message);
      }
      setStatus(message);
      setStatusIsError(true);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus('');
    try {
      await onSave({ twoFactorEnabled });
      setStatus('Security settings saved.');
      setStatusIsError(false);
    } catch (error) {
      setStatus(error?.message || 'Could not save security settings. Try again.');
      setStatusIsError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="st-card st-security" aria-labelledby="st-security-heading">
      <header className="st-card__header st-card__header--stack">
        <div className="st-card__heading">
          <h2 id="st-security-heading">Security</h2>
          <p>Manage security settings for your organization.</p>
        </div>
      </header>

      <form className="st-password" onSubmit={handlePasswordChange}>
        <div className="st-field st-password__field">
          <label className="st-field__label" htmlFor="st-current-password">
            Current Password
          </label>
          <input
            id="st-current-password"
            type="password"
            className={`st-input${currentPasswordError ? ' is-invalid' : ''}`}
            value={currentPassword}
            onChange={(event) => {
              setCurrentPassword(event.target.value);
              setCurrentPasswordError('');
              setStatus('');
            }}
            placeholder="********"
            autoComplete="current-password"
            aria-invalid={currentPasswordError ? 'true' : 'false'}
            aria-describedby={currentPasswordError ? 'st-current-password-error' : undefined}
          />
          {currentPasswordError ? (
            <p className="st-field__error" id="st-current-password-error" role="alert">
              {currentPasswordError}
            </p>
          ) : null}
        </div>

        <div className="st-field st-password__field">
          <label className="st-field__label" htmlFor="st-new-password">
            Change Password
          </label>
          <div className="st-password__row">
            <input
              id="st-new-password"
              type="password"
              className={`st-input${passwordError ? ' is-invalid' : ''}`}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setPasswordError('');
                setStatus('');
              }}
              placeholder="********"
              autoComplete="new-password"
              aria-invalid={passwordError ? 'true' : 'false'}
              aria-describedby={passwordError ? 'st-new-password-error' : undefined}
            />
            <button
              type="submit"
              className="db-btn db-btn--solid st-password__btn"
              disabled={changingPassword}
            >
              {changingPassword ? 'Updating…' : 'Change Password'}
            </button>
          </div>
          {passwordError ? (
            <p className="st-field__error" id="st-new-password-error" role="alert">
              {passwordError}
            </p>
          ) : null}
        </div>
      </form>

      <ToggleSwitch
        id="st-2fa"
        className="st-switch--lg"
        label="Two-Factor Authentication (2FA)"
        checked={twoFactorEnabled}
        onChange={(next) => {
          setTwoFactorEnabled(next);
          setStatus('');
        }}
      />

      <div className="st-form__footer st-security__footer">
        {status ? (
          <output
            className={`st-status${statusIsError ? ' is-error' : ' is-success'}`}
          >
            {status}
          </output>
        ) : (
          <span />
        )}
        <button
          type="button"
          className="db-btn db-btn--solid st-save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save Security Settings'}
        </button>
      </div>
    </section>
  );
}

export default SecuritySettings;
