/** `jane.doe@edabip.com` -> `j******e@edabip.com` */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0] ?? ''}*@${domain}`;
  return `${local[0]}${'*'.repeat(Math.max(local.length - 2, 1))}${local.at(-1)}@${domain}`;
}

/** Seconds -> `m:ss`, for OTP and lockout countdowns. */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** Seconds -> `MM:SS`, for the auth OTP resend timer. */
export function formatOtpResendCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** First token of a display name, used in greetings like "Welcome Back, Alin!". */
export function getFirstName(fullName: string, fallback = 'there'): string {
  const first = fullName.trim().split(/\s+/).find(Boolean);
  return first || fallback;
}

/** Full name for chrome such as the sidebar; falls back to the email local part. */
export function getDisplayName(fullName: string, email = '', fallback = 'User'): string {
  const named = fullName.trim().replace(/\s+/g, ' ');
  if (named) return named;
  const local = email.split('@')[0]?.trim();
  return local || fallback;
}

/** First + last name for the sidebar; falls back to fullName, then email. */
export function getPersonName(
  firstName: string,
  lastName: string,
  fullName = '',
  email = '',
  fallback = 'User',
): string {
  const fromParts = `${firstName} ${lastName}`.replace(/\s+/g, ' ').trim();
  return getDisplayName(fromParts || fullName, email, fallback);
}

export function getInitials(fullName: string, fallback = '?'): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase() || fallback;
}

/** Splits a single name field into the `first_name` / `last_name` the API wants. */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0] ?? '', lastName: parts[0] ?? '' };
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
}
