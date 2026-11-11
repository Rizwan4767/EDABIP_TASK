export const MOCK_AUTH_STORAGE_KEY = "edabip_mock_auth";
export const MOCK_AUTH_UNAVAILABLE_MESSAGE =
  "Authentication service is not available yet.";

const MOCK_SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour — used when NOT remembered
// duration for a "remembered" session. Using 30 days as a placeholder.
const MOCK_REMEMBERED_SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export const isMockAuthEnabled =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCK_AUTH === "true";

function persistMockSession(raw) {
  window.sessionStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
  window.localStorage.setItem(MOCK_AUTH_STORAGE_KEY, raw);
}

export function createMockSession(user, { rememberMe = false, provider = "google" } = {}) {
  const authenticatedAt = Date.now();
  const duration = rememberMe
    ? MOCK_REMEMBERED_SESSION_DURATION_MS
    : MOCK_SESSION_DURATION_MS;

  return {
    user,
    provider,
    isMock: true,
    rememberMe,
    authenticatedAt,
    expiresAt: authenticatedAt + duration,
  };
}

export function isValidMockSession(session) {
  return Boolean(
    session &&
      typeof session === "object" &&
      session.user &&
      typeof session.user === "object" &&
      typeof session.user.email === "string" &&
      session.user.email.trim() !== "" &&
      session.isMock === true &&
      Number.isFinite(session.expiresAt) &&
      session.expiresAt > Date.now()
  );
}

export function readMockSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {

    const fromLocal = window.localStorage.getItem(MOCK_AUTH_STORAGE_KEY);
    const fromSession = window.sessionStorage.getItem(MOCK_AUTH_STORAGE_KEY);
    const raw = fromLocal || fromSession;

    if (!raw) {
      return null;
    }

    const session = JSON.parse(raw);

    if (!isValidMockSession(session)) {
      clearMockSession();
      return null;
    }

    if (!fromLocal && fromSession) {
      try {
        persistMockSession(raw);
      } catch {
        // Keep the tab-scoped session if localStorage is unavailable.
      }
    }

    return session;
  } catch {
    clearMockSession();
    return null;
  }
}

export function saveMockSession(session) {
  if (typeof window === "undefined") {
    throw new Error("Browser session storage is unavailable.");
  }

  persistMockSession(JSON.stringify(session));
}

export function clearMockSession() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
    window.sessionStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
  } catch {
    // Storage may be unavailable; React authentication state is still cleared.
  }
}