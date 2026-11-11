import { appConfig } from '@/config/appConfig';

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  const at = trimmed.indexOf('@');
  if (at <= 0 || at !== trimmed.lastIndexOf('@')) return false;

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const dot = domain.lastIndexOf('.');
  if (!local || local.includes(' ') || local.includes('\t')) return false;
  if (dot < 1 || domain.length - dot < 3) return false;
  return !domain.includes(' ') && !domain.includes('\t');
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export interface PasswordRule {
  id: string;
  label: string;
  passed: boolean;
}

/**
 * Mirrors `validate_password_strength` in `edabip-backend/utils/security.py`
 * so the UI never lets through a password the API will reject.
 */
export function getPasswordRules(password: string): PasswordRule[] {
  return [
    {
      id: 'length',
      label: `At least ${appConfig.auth.minPasswordLength} characters`,
      passed: password.length >= appConfig.auth.minPasswordLength,
    },
    { id: 'lowercase', label: 'One lowercase letter', passed: /[a-z]/.test(password) },
    { id: 'uppercase', label: 'One uppercase letter', passed: /[A-Z]/.test(password) },
    { id: 'number', label: 'One number', passed: /\d/.test(password) },
    { id: 'special', label: 'One special character', passed: /[^A-Za-z0-9]/.test(password) },
  ];
}

export function isValidPassword(password: string): boolean {
  return (
    password.length <= appConfig.auth.maxPasswordLength &&
    getPasswordRules(password).every((rule) => rule.passed)
  );
}

export function isValidOtp(value: string): boolean {
  return new RegExp(String.raw`^\d{${appConfig.auth.otpLength}}$`).test(value);
}

export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}
