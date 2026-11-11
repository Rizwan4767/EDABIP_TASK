/**
 * Local cache of the signed-in user's General Settings, keyed by email.
 *
 * This exists for ONE reason: `isProfileComplete()` in
 * modules/profile-completion/utils/profileCompleteness.js is synchronous —
 * it's called during render and cannot await a request. So whenever the
 * Settings API hands us a fresh profile, we mirror it here and that check
 * keeps working.
 *
 * The server is the source of truth. This is a read-through copy, never
 * something to save into on its own. (Before the API existed, the mock wrote
 * here directly and this WAS the storage — the key is unchanged so existing
 * browsers don't lose their data on the switch.)
 */
const GENERAL_SETTINGS_STORAGE_KEY = "edabip_general_settings_by_email";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readMap() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(GENERAL_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/** Mirror a general-settings object (from the API or the mock) into the cache. */
export function cacheGeneralSettings(general) {
  const email = normalizeEmail(general?.email);
  if (!email || typeof window === "undefined") {
    return;
  }

  try {
    const map = readMap();
    map[email] = clone(general);
    window.localStorage.setItem(GENERAL_SETTINGS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Best-effort. A full/blocked localStorage must never break a save.
  }
}

/** The cached profile for a user, or null. Safe to call during render. */
export function getPersistedGeneralSettings(user) {
  const email = normalizeEmail(user?.email);
  if (!email) {
    return null;
  }

  const saved = readMap()[email];
  return saved && typeof saved === "object" ? clone(saved) : null;
}
