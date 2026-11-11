import { ROUTES } from '@/navigation/routes';
import { ApiError } from '@/services/api/apiError';
import type { FieldErrors } from '@/types/api';
import { normalizeEmail } from '@/utils/validation';

type AuthRouter = {
  push: (href: { pathname: string; params?: Record<string, string> }) => void;
  replace: (href: { pathname: string; params?: Record<string, string> }) => void;
};

/** FastAPI register validation uses snake_case field names. */
const SIGNUP_FIELD_ALIASES: Record<string, string> = {
  first_name: 'first_name',
  last_name: 'last_name',
  email: 'email',
  password: 'password',
};

export function isEmailAlreadyRegistered(error: unknown): boolean {
  return error instanceof ApiError && error.status === 400 && /email/i.test(error.message);
}

export function isEmailVerificationRequired(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403;
}

/** Backend returns 423 (`utils/security.py: is_account_locked`) after too many failed logins. */
export function isAccountLocked(error: unknown): error is ApiError {
  return error instanceof ApiError && error.code === 'account_locked';
}

export function mapSignupFieldErrors(fieldErrors: FieldErrors): FieldErrors {
  const mapped: FieldErrors = {};
  for (const [key, message] of Object.entries(fieldErrors)) {
    const target = SIGNUP_FIELD_ALIASES[key] ?? key;
    mapped[target] = message;
  }
  return mapped;
}

export function signupOtpRoute(email: string) {
  return {
    pathname: ROUTES.auth.otp,
    params: { flow: 'signup', email: normalizeEmail(email) },
  } as const;
}

export function goToSignupOtp(router: AuthRouter, email: string, replace = false) {
  const target = signupOtpRoute(email);
  if (replace) {
    router.replace(target);
    return;
  }
  router.push(target);
}

export function accountLockedRoute(email: string, message?: string) {
  return {
    pathname: ROUTES.auth.accountLocked,
    params: { email: normalizeEmail(email), ...(message ? { message } : {}) },
  } as const;
}

export function goToAccountLocked(router: AuthRouter, email: string, message?: string) {
  router.replace(accountLockedRoute(email, message));
}
