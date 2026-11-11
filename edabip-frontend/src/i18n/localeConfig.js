/**
 * Supported UI locales and helpers.
 * Locale identity is always a standardized BCP 47 code (e.g. ar-SA), never a display label.
 */

export const DEFAULT_LOCALE = "en-US";

export const LOCALE_STORAGE_KEY = "edabip-locale";

export const SUPPORTED_LOCALES = [
  {
    code: "en-US",
    short: "EN",
    label: "English",
    nativeLabel: "English",
    direction: "ltr",
    flagKey: "us",
    status: "production",
    enabled: true,
  },
  {
    code: "hi-IN",
    short: "IN",
    label: "Hindi",
    nativeLabel: "हिन्दी",
    direction: "ltr",
    flagKey: "in",
    status: "beta",
    enabled: true,
  },
  {
    code: "ja-JP",
    short: "JP",
    label: "Japanese",
    nativeLabel: "日本語",
    direction: "ltr",
    flagKey: "jp",
    status: "beta",
    enabled: true,
  },
  {
    code: "ko-KR",
    short: "KR",
    label: "Korean",
    nativeLabel: "한국어",
    direction: "ltr",
    flagKey: "kr",
    status: "beta",
    enabled: true,
  },
  {
    code: "de-DE",
    short: "DE",
    label: "German",
    nativeLabel: "Deutsch",
    direction: "ltr",
    flagKey: "de",
    status: "beta",
    enabled: true,
  },
  {
    code: "fr-FR",
    short: "FR",
    label: "French",
    nativeLabel: "Français",
    direction: "ltr",
    flagKey: "fr",
    status: "beta",
    enabled: true,
  },
  {
    code: "es-ES",
    short: "ES",
    label: "Spanish",
    nativeLabel: "Español",
    direction: "ltr",
    flagKey: "es",
    status: "beta",
    enabled: true,
  },
  {
    code: "zh-CN",
    short: "CN",
    label: "Chinese",
    nativeLabel: "简体中文",
    direction: "ltr",
    flagKey: "cn",
    status: "beta",
    enabled: true,
  },
  {
    code: "ar-SA",
    short: "AR",
    label: "Arabic",
    nativeLabel: "العربية",
    direction: "rtl",
    flagKey: "sa",
    status: "beta",
    enabled: true,
  },
  {
    code: "it-IT",
    short: "IT",
    label: "Italian",
    nativeLabel: "Italiano",
    direction: "ltr",
    flagKey: "it",
    status: "beta",
    enabled: true,
  },
];

export const SUPPORTED_LOCALE_CODES = SUPPORTED_LOCALES.map((locale) => locale.code);

export const I18N_NAMESPACES = [
  "common",
  "landing",
  "explore",
  "validation",
  "errors",
  "bookDemo",
];

/** Phase-1 namespaces bundled and actively maintained. */
export const ACTIVE_NAMESPACES = [
  "common",
  "landing",
  "explore",
  "validation",
  "errors",
  "bookDemo",
];

const LOCALE_BY_CODE = Object.fromEntries(
  SUPPORTED_LOCALES.map((locale) => [locale.code, locale])
);

/**
 * Maps common browser / OS language tags onto supported product locales.
 * Traditional Chinese variants are intentionally NOT mapped to zh-CN.
 */
const LOCALE_ALIASES = {
  en: "en-US",
  "en-us": "en-US",
  "en-gb": "en-US",
  "en-au": "en-US",
  "en-ca": "en-US",
  hi: "hi-IN",
  "hi-in": "hi-IN",
  ja: "ja-JP",
  "ja-jp": "ja-JP",
  ko: "ko-KR",
  "ko-kr": "ko-KR",
  de: "de-DE",
  "de-de": "de-DE",
  fr: "fr-FR",
  "fr-fr": "fr-FR",
  es: "es-ES",
  "es-es": "es-ES",
  zh: "zh-CN",
  "zh-cn": "zh-CN",
  "zh-hans": "zh-CN",
  "zh-hans-cn": "zh-CN",
  ar: "ar-SA",
  "ar-sa": "ar-SA",
  it: "it-IT",
  "it-it": "it-IT",
};

export function isSupportedLocale(locale) {
  if (typeof locale !== "string" || !locale.trim()) {
    return false;
  }
  return Object.prototype.hasOwnProperty.call(LOCALE_BY_CODE, locale.trim());
}

export function normalizeLocale(locale) {
  if (typeof locale !== "string" || !locale.trim()) {
    return DEFAULT_LOCALE;
  }

  const trimmed = locale.trim();
  if (isSupportedLocale(trimmed)) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(LOCALE_ALIASES, lower)) {
    return LOCALE_ALIASES[lower];
  }

  const language = lower.split("-")[0];
  if (Object.prototype.hasOwnProperty.call(LOCALE_ALIASES, language)) {
    // Do not map zh-Hant / zh-TW / zh-HK to Simplified Chinese.
    if (language === "zh") {
      const isTraditional =
        lower.includes("hant") ||
        lower.endsWith("-tw") ||
        lower.endsWith("-hk") ||
        lower.endsWith("-mo");
      if (isTraditional) {
        return DEFAULT_LOCALE;
      }
    }
    return LOCALE_ALIASES[language];
  }

  return DEFAULT_LOCALE;
}

export function getLocaleConfig(locale) {
  const normalized = normalizeLocale(locale);
  return LOCALE_BY_CODE[normalized] || LOCALE_BY_CODE[DEFAULT_LOCALE];
}

export function getLocaleDirection(locale) {
  return getLocaleConfig(locale).direction;
}

export function applyDocumentLocale(locale) {
  if (typeof document === "undefined") {
    return;
  }

  const config = getLocaleConfig(locale);
  document.documentElement.lang = config.code;
  document.documentElement.dir = config.direction;
}
