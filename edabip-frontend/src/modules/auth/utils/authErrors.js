/**
 * Maps provider/internal auth errors to safe user-facing messages.
 * Never surface AADSTS codes, stack traces, or challenge IDs to users.
 */

export const AUTH_ERROR_CODES = {
  MICROSOFT_UNAVAILABLE: "MICROSOFT_UNAVAILABLE",
  MICROSOFT_POPUP_CLOSED: "MICROSOFT_POPUP_CLOSED",
  MICROSOFT_POPUP_BLOCKED: "MICROSOFT_POPUP_BLOCKED",
  MICROSOFT_NETWORK: "MICROSOFT_NETWORK",
  MICROSOFT_CONSENT_REQUIRED: "MICROSOFT_CONSENT_REQUIRED",
  MICROSOFT_ACCOUNT_NOT_PERMITTED: "MICROSOFT_ACCOUNT_NOT_PERMITTED",
  MICROSOFT_EXCHANGE_FAILED: "MICROSOFT_EXCHANGE_FAILED",
  MICROSOFT_ACCOUNT_CONFLICT: "MICROSOFT_ACCOUNT_CONFLICT",
  MICROSOFT_CANCELLED: "MICROSOFT_CANCELLED",
  MFA_INVALID_CODE: "MFA_INVALID_CODE",
  MFA_EXPIRED: "MFA_EXPIRED",
  MFA_TOO_MANY_ATTEMPTS: "MFA_TOO_MANY_ATTEMPTS",
  MFA_CHALLENGE_MISSING: "MFA_CHALLENGE_MISSING",
  MFA_RESEND_COOLDOWN: "MFA_RESEND_COOLDOWN",
  NETWORK: "NETWORK",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  UNKNOWN: "UNKNOWN",
};

const SAFE_MESSAGES = {
  [AUTH_ERROR_CODES.MICROSOFT_UNAVAILABLE]:
    "Microsoft sign-in is currently unavailable. Please use another sign-in method.",
  [AUTH_ERROR_CODES.MICROSOFT_POPUP_CLOSED]:
    "Microsoft sign-in was cancelled.",
  [AUTH_ERROR_CODES.MICROSOFT_POPUP_BLOCKED]:
    "Your browser blocked the Microsoft sign-in window. Allow popups and try again.",
  [AUTH_ERROR_CODES.MICROSOFT_NETWORK]:
    "We could not reach Microsoft. Check your connection and try again.",
  [AUTH_ERROR_CODES.MICROSOFT_CONSENT_REQUIRED]:
    "Additional Microsoft consent is required before you can continue.",
  [AUTH_ERROR_CODES.MICROSOFT_ACCOUNT_NOT_PERMITTED]:
    "This Microsoft account is not permitted to sign in.",
  [AUTH_ERROR_CODES.MICROSOFT_EXCHANGE_FAILED]:
    "Microsoft sign-in could not be completed. Please try again.",
  [AUTH_ERROR_CODES.MICROSOFT_ACCOUNT_CONFLICT]:
    "This Microsoft account conflicts with an existing EDABIP account. Contact support.",
  [AUTH_ERROR_CODES.MICROSOFT_CANCELLED]:
    "Microsoft sign-in was cancelled.",
  [AUTH_ERROR_CODES.MFA_INVALID_CODE]:
    "The verification code is incorrect.",
  [AUTH_ERROR_CODES.MFA_EXPIRED]:
    "This code has expired. Request a new code.",
  [AUTH_ERROR_CODES.MFA_TOO_MANY_ATTEMPTS]:
    "Too many attempts. Please try again later.",
  [AUTH_ERROR_CODES.MFA_CHALLENGE_MISSING]:
    "Your verification session is no longer available. Please sign in again.",
  [AUTH_ERROR_CODES.MFA_RESEND_COOLDOWN]:
    "Please wait before requesting another code.",
  [AUTH_ERROR_CODES.NETWORK]:
    "A network error occurred. Please try again.",
  [AUTH_ERROR_CODES.SESSION_EXPIRED]:
    "Your session expired. Please sign in again.",
  [AUTH_ERROR_CODES.UNKNOWN]:
    "Something went wrong. Please try again.",
};

export function getSafeAuthErrorMessage(code, fallback) {
  if (code && SAFE_MESSAGES[code]) {
    return SAFE_MESSAGES[code];
  }

  if (typeof fallback === "string" && fallback.trim()) {
    return fallback.trim();
  }

  return SAFE_MESSAGES[AUTH_ERROR_CODES.UNKNOWN];
}

export function createAuthError(code, details) {
  const error = new Error(getSafeAuthErrorMessage(code));
  error.code = code || AUTH_ERROR_CODES.UNKNOWN;
  error.details = details;
  return error;
}

/**
 * Normalize MSAL / network / unknown errors without leaking provider codes.
 */
export function mapMicrosoftError(error) {
  const raw =
    (error && (error.errorCode || error.code || error.name || error.message)) ||
    "";
  const text = String(raw).toLowerCase();

  if (
    text.includes("user_cancelled") ||
    text.includes("popup_closed") ||
    text.includes("user_closed")
  ) {
    return createAuthError(AUTH_ERROR_CODES.MICROSOFT_POPUP_CLOSED);
  }

  if (text.includes("popup_window_error") || text.includes("blocked")) {
    return createAuthError(AUTH_ERROR_CODES.MICROSOFT_POPUP_BLOCKED);
  }

  if (text.includes("consent_required") || text.includes("interaction_required")) {
    return createAuthError(AUTH_ERROR_CODES.MICROSOFT_CONSENT_REQUIRED);
  }

  if (
    text.includes("access_denied") ||
    text.includes("not permitted") ||
    text.includes("unauthorized_client")
  ) {
    return createAuthError(AUTH_ERROR_CODES.MICROSOFT_ACCOUNT_NOT_PERMITTED);
  }

  if (
    text.includes("network") ||
    text.includes("fetch") ||
    text.includes("failed to fetch")
  ) {
    return createAuthError(AUTH_ERROR_CODES.MICROSOFT_NETWORK);
  }

  if (import.meta.env.DEV && error) {
    // Developer-only detail; never shown in the UI.
    console.warn("[Microsoft auth]", error);
  }

  return createAuthError(AUTH_ERROR_CODES.MICROSOFT_EXCHANGE_FAILED);
}
