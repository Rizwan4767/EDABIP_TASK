/**
 * Locale preference adapter.
 *
 * Mock mode: localStorage only (`edabip-locale`).
 * Backend mode: GET/PATCH user preferences, with local cache.
 *
 * Currency and timezone are intentionally separate from UI locale.
 */

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  isSupportedLocale,
  normalizeLocale,
} from "./localeConfig.js";

function readEnv(name) {
  try {
    return import.meta.env?.[name];
  } catch {
    return undefined;
  }
}

function readBooleanEnv(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  return String(value).toLowerCase() === "true";
}

export function isMockLocalePreferencesEnabled() {
  const explicit = readBooleanEnv(readEnv("VITE_USE_MOCK_LOCALE_PREFERENCES"));
  if (explicit !== null) {
    return explicit;
  }

  const mockAuth = readBooleanEnv(readEnv("VITE_ENABLE_MOCK_AUTH"));
  if (mockAuth !== null) {
    return mockAuth;
  }

  // Backend unavailable by default in this frontend-only phase.
  return true;
}

function getApiBaseUrl() {
  return String(readEnv("VITE_API_BASE_URL") || "/api").replace(/\/$/, "");
}

export function getLocalLocalePreference() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const normalized = normalizeLocale(raw);
    return isSupportedLocale(normalized) ? normalized : null;
  } catch {
    return null;
  }
}

export function saveLocalLocalePreference(locale) {
  const normalized = normalizeLocale(locale);
  if (typeof window === "undefined") {
    return normalized;
  }

  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, normalized);
  } catch {
    // Persistence may be blocked; in-memory i18n state still applies.
  }

  return normalized;
}

/**
 * Maps a future preferences API payload into a validated locale code.
 * Keep UI components away from raw response shapes.
 * Unsupported values return null (do not silently coerce to en-US).
 */
export function mapPreferencesResponse(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload.locale ?? payload.language ?? payload.preferredLocale;
  if (typeof candidate !== "string" || !candidate.trim()) {
    return null;
  }

  const trimmed = candidate.trim();
  if (isSupportedLocale(trimmed)) {
    return trimmed;
  }

  // Accept known aliases (e.g. "ar" → "ar-SA") but reject unrelated tags.
  const aliasHit = normalizeLocale(trimmed);
  const lower = trimmed.toLowerCase();
  const language = lower.split("-")[0];
  const knownFamilies = new Set([
    "en",
    "hi",
    "ja",
    "ko",
    "de",
    "fr",
    "es",
    "zh",
    "ar",
    "it",
  ]);

  if (!knownFamilies.has(language)) {
    return null;
  }

  // Traditional Chinese must not be coerced to Simplified Chinese.
  if (
    language === "zh" &&
    (lower.includes("hant") ||
      lower.endsWith("-tw") ||
      lower.endsWith("-hk") ||
      lower.endsWith("-mo"))
  ) {
    return null;
  }

  return isSupportedLocale(aliasHit) ? aliasHit : null;
}

export function buildPreferencesUpdatePayload(locale) {
  return { locale: normalizeLocale(locale) };
}

/**
 * Resolve the effective locale for an unauthenticated (or mock) session.
 * Priority: localStorage → browser → en-US
 */
export function resolveGuestLocale(browserLanguages = []) {
  const saved = getLocalLocalePreference();
  if (saved) {
    return saved;
  }

  const list = Array.isArray(browserLanguages)
    ? browserLanguages
    : [browserLanguages].filter(Boolean);

  for (const language of list) {
    if (!language) continue;
    return normalizeLocale(language);
  }

  return DEFAULT_LOCALE;
}

async function fetchBackendLocalePreference() {
  const response = await fetch(`${getApiBaseUrl()}/v1/users/me/preferences`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status === 404) {
    return { locale: null, source: "backend-empty" };
  }

  if (!response.ok) {
    const error = new Error("Failed to load locale preference.");
    error.status = response.status;
    throw error;
  }

  const payload = await response.json();
  return {
    locale: mapPreferencesResponse(payload),
    source: "backend",
    raw: payload,
  };
}

async function patchBackendLocalePreference(locale) {
  const response = await fetch(`${getApiBaseUrl()}/v1/users/me/preferences`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildPreferencesUpdatePayload(locale)),
  });

  if (!response.ok) {
    const error = new Error("Failed to update locale preference.");
    error.status = response.status;
    throw error;
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return {
    locale: mapPreferencesResponse(payload) || normalizeLocale(locale),
    source: "backend",
    raw: payload,
  };
}

/**
 * @param {{ authenticated?: boolean, browserLanguages?: string[] }} [options]
 */
export async function getLocalePreference(options = {}) {
  const { authenticated = false, browserLanguages } = options;
  const languages =
    browserLanguages ||
    (typeof navigator !== "undefined" ? navigator.languages || [navigator.language] : []);

  if (isMockLocalePreferencesEnabled() || !authenticated) {
    return {
      locale: resolveGuestLocale(languages),
      source: getLocalLocalePreference() ? "localStorage" : "browser-or-default",
      persistedRemotely: false,
    };
  }

  try {
    const remote = await fetchBackendLocalePreference();
    if (remote.locale) {
      saveLocalLocalePreference(remote.locale);
      return {
        locale: remote.locale,
        source: "backend",
        persistedRemotely: true,
        raw: remote.raw,
      };
    }

    // Backend has no preference — keep local / browser resolution.
    return {
      locale: resolveGuestLocale(languages),
      source: getLocalLocalePreference() ? "localStorage" : "browser-or-default",
      persistedRemotely: false,
    };
  } catch {
    return {
      locale: resolveGuestLocale(languages),
      source: "local-fallback",
      persistedRemotely: false,
    };
  }
}

/**
 * @param {string} locale
 * @param {{ authenticated?: boolean }} [options]
 */
export async function updateLocalePreference(locale, options = {}) {
  const { authenticated = false } = options;
  const normalized = normalizeLocale(locale);

  if (!isSupportedLocale(normalized)) {
    const error = new Error("Unsupported locale.");
    error.code = "UNSUPPORTED_LOCALE";
    throw error;
  }

  // Always mirror locally so refresh / logout keep the last UI choice.
  saveLocalLocalePreference(normalized);

  if (isMockLocalePreferencesEnabled() || !authenticated) {
    return {
      locale: normalized,
      source: "localStorage",
      persistedRemotely: false,
    };
  }

  try {
    const remote = await patchBackendLocalePreference(normalized);
    saveLocalLocalePreference(remote.locale);
    return {
      locale: remote.locale,
      source: "backend",
      persistedRemotely: true,
      raw: remote.raw,
    };
  } catch (error) {
    error.code = error.code || "LOCALE_PREFERENCE_UPDATE_FAILED";
    throw error;
  }
}
