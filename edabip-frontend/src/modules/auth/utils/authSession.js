export const AUTH_STORAGE_KEY = "edabip_auth";

const SESSION_DURATION_MS = 60 * 60 * 1000;
const REMEMBERED_SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

function persistAuthSession(raw) {
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
  window.localStorage.setItem(AUTH_STORAGE_KEY, raw);
}

export function mapBackendUser(user) {
  if (!user || typeof user !== "object") {
    return null;
  }

  return {
    id: String(user.id),
    fullName: user.full_name || user.fullName || "",
    email: user.email || "",
    mobileNumber: user.mobile_number || user.mobileNumber || "",
    applicationName: user.application_name || user.applicationName || "",
    timezone: user.timezone || "",
    companySize: user.company_size || user.companySize || "",
    industry: user.industry || "",
    emailNotifications:
      user.email_notifications ?? user.emailNotifications ?? true,
    role: user.role || "user",
    isVerified: Boolean(user.is_verified ?? user.isVerified),
    emailVerified: Boolean(user.email_verified ?? user.emailVerified),
    phoneVerified: Boolean(user.phone_verified ?? user.phoneVerified),
    avatarUrl: user.avatar_url || user.avatarUrl || "",
  };
}

export function normalizePhoneForBackend(mobileNumber) {
  const digits = String(mobileNumber || "")
    .replace(/[\s\-+]/g, "")
    .replace(/^91/, "");

  if (digits.length === 10) {
    return `+91-${digits}`;
  }

  return String(mobileNumber || "").trim();
}

export function createAuthSession({
  user,
  accessToken,
  refreshToken,
  rememberMe = false,
  provider = "credentials",
}) {
  const authenticatedAt = Date.now();
  const duration = rememberMe ? REMEMBERED_SESSION_DURATION_MS : SESSION_DURATION_MS;

  return {
    user,
    accessToken,
    refreshToken,
    provider,
    rememberMe,
    authenticatedAt,
    expiresAt: authenticatedAt + duration,
  };
}

function hasSessionIdentity(session) {
  return Boolean(
    session &&
      typeof session === "object" &&
      session.user &&
      typeof session.user.email === "string" &&
      session.user.email.trim() !== "" &&
      typeof session.accessToken === "string" &&
      session.accessToken.trim() !== "" &&
      Number.isFinite(session.expiresAt)
  );
}

function hasRefreshToken(session) {
  return (
    typeof session?.refreshToken === "string" && session.refreshToken.trim() !== ""
  );
}

/** True once the client-side clock says the access token is past its window. */
export function isAuthSessionExpired(session) {
  return !Number.isFinite(session?.expiresAt) || session.expiresAt <= Date.now();
}

export function isValidAuthSession(session) {
  return hasSessionIdentity(session) && !isAuthSessionExpired(session);
}

/**
 * A session worth keeping in storage. An expired session is still restorable
 * as long as it carries a refresh token: `expiresAt` is only a client-side
 * guess at the access token's life, and discarding the record on that guess
 * throws away the one credential that could renew it. The backend stays the
 * authority — the stored tokens are dropped when a refresh actually fails.
 */
export function isRestorableAuthSession(session) {
  if (!hasSessionIdentity(session)) {
    return false;
  }

  return !isAuthSessionExpired(session) || hasRefreshToken(session);
}

export function readAuthSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const fromLocal = window.localStorage.getItem(AUTH_STORAGE_KEY);
    const fromSession = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
    const raw = fromLocal || fromSession;

    if (!raw) {
      return null;
    }

    const session = JSON.parse(raw);

    if (!isRestorableAuthSession(session)) {
      clearAuthSession();
      return null;
    }

    if (!fromLocal && fromSession) {
      try {
        persistAuthSession(raw);
      } catch {
        // Keep the tab-scoped session if localStorage is unavailable.
      }
    }

    return session;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function saveAuthSession(session) {
  if (typeof window === "undefined") {
    throw new Error("Browser session storage is unavailable.");
  }

  persistAuthSession(JSON.stringify(session));
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Storage may be unavailable; React authentication state is still cleared.
  }
}

export function getStoredAccessToken() {
  return readAuthSession()?.accessToken ?? null;
}

export function getStoredRefreshToken() {
  return readAuthSession()?.refreshToken ?? null;
}

/**
 * Stores tokens handed back by `/auth/refresh`. The expiry window is rolled
 * forward as well: a refreshed session that kept the old `expiresAt` would
 * still read as expired, so every later request would spend a 401 and a
 * refresh round trip before it could succeed.
 */
export function updateStoredTokens({ accessToken, refreshToken }) {
  const session = readAuthSession();
  if (!session) {
    return null;
  }

  const refreshedAt = Date.now();
  const duration = session.rememberMe
    ? REMEMBERED_SESSION_DURATION_MS
    : SESSION_DURATION_MS;

  const next = {
    ...session,
    accessToken: accessToken ?? session.accessToken,
    refreshToken: refreshToken ?? session.refreshToken,
    expiresAt: refreshedAt + duration,
  };

  saveAuthSession(next);
  return next;
}
