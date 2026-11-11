import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import {
  ACTIVE_NAMESPACES,
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALE_CODES,
  applyDocumentLocale,
  normalizeLocale,
} from "./localeConfig.js";
import { getLocalLocalePreference } from "./localePreferenceService.js";

import enUS_common from "./locales/en-US/common.json";
import enUS_landing from "./locales/en-US/landing.json";
import enUS_explore from "./locales/en-US/explore.json";
import enUS_validation from "./locales/en-US/validation.json";
import enUS_errors from "./locales/en-US/errors.json";
import enUS_bookDemo from "./locales/en-US/bookDemo.json";

import hiIN_common from "./locales/hi-IN/common.json";
import hiIN_landing from "./locales/hi-IN/landing.json";
import hiIN_explore from "./locales/hi-IN/explore.json";
import hiIN_validation from "./locales/hi-IN/validation.json";
import hiIN_errors from "./locales/hi-IN/errors.json";
import hiIN_bookDemo from "./locales/hi-IN/bookDemo.json";

import jaJP_common from "./locales/ja-JP/common.json";
import jaJP_landing from "./locales/ja-JP/landing.json";
import jaJP_explore from "./locales/ja-JP/explore.json";
import jaJP_validation from "./locales/ja-JP/validation.json";
import jaJP_errors from "./locales/ja-JP/errors.json";
import jaJP_bookDemo from "./locales/ja-JP/bookDemo.json";

import koKR_common from "./locales/ko-KR/common.json";
import koKR_landing from "./locales/ko-KR/landing.json";
import koKR_explore from "./locales/ko-KR/explore.json";
import koKR_validation from "./locales/ko-KR/validation.json";
import koKR_errors from "./locales/ko-KR/errors.json";
import koKR_bookDemo from "./locales/ko-KR/bookDemo.json";

import deDE_common from "./locales/de-DE/common.json";
import deDE_landing from "./locales/de-DE/landing.json";
import deDE_explore from "./locales/de-DE/explore.json";
import deDE_validation from "./locales/de-DE/validation.json";
import deDE_errors from "./locales/de-DE/errors.json";
import deDE_bookDemo from "./locales/de-DE/bookDemo.json";

import frFR_common from "./locales/fr-FR/common.json";
import frFR_landing from "./locales/fr-FR/landing.json";
import frFR_explore from "./locales/fr-FR/explore.json";
import frFR_validation from "./locales/fr-FR/validation.json";
import frFR_errors from "./locales/fr-FR/errors.json";
import frFR_bookDemo from "./locales/fr-FR/bookDemo.json";

import esES_common from "./locales/es-ES/common.json";
import esES_landing from "./locales/es-ES/landing.json";
import esES_explore from "./locales/es-ES/explore.json";
import esES_validation from "./locales/es-ES/validation.json";
import esES_errors from "./locales/es-ES/errors.json";
import esES_bookDemo from "./locales/es-ES/bookDemo.json";

import zhCN_common from "./locales/zh-CN/common.json";
import zhCN_landing from "./locales/zh-CN/landing.json";
import zhCN_explore from "./locales/zh-CN/explore.json";
import zhCN_validation from "./locales/zh-CN/validation.json";
import zhCN_errors from "./locales/zh-CN/errors.json";
import zhCN_bookDemo from "./locales/zh-CN/bookDemo.json";

import arSA_common from "./locales/ar-SA/common.json";
import arSA_landing from "./locales/ar-SA/landing.json";
import arSA_explore from "./locales/ar-SA/explore.json";
import arSA_validation from "./locales/ar-SA/validation.json";
import arSA_errors from "./locales/ar-SA/errors.json";
import arSA_bookDemo from "./locales/ar-SA/bookDemo.json";

import itIT_common from "./locales/it-IT/common.json";
import itIT_landing from "./locales/it-IT/landing.json";
import itIT_explore from "./locales/it-IT/explore.json";
import itIT_validation from "./locales/it-IT/validation.json";
import itIT_errors from "./locales/it-IT/errors.json";
import itIT_bookDemo from "./locales/it-IT/bookDemo.json";

const resources = {
  "en-US": {
    common: enUS_common,
    landing: enUS_landing,
    explore: enUS_explore,
    validation: enUS_validation,
    errors: enUS_errors,
    bookDemo: enUS_bookDemo,
  },
  "hi-IN": {
    common: hiIN_common,
    landing: hiIN_landing,
    explore: hiIN_explore,
    validation: hiIN_validation,
    errors: hiIN_errors,
    bookDemo: hiIN_bookDemo,
  },
  "ja-JP": {
    common: jaJP_common,
    landing: jaJP_landing,
    explore: jaJP_explore,
    validation: jaJP_validation,
    errors: jaJP_errors,
    bookDemo: jaJP_bookDemo,
  },
  "ko-KR": {
    common: koKR_common,
    landing: koKR_landing,
    explore: koKR_explore,
    validation: koKR_validation,
    errors: koKR_errors,
    bookDemo: koKR_bookDemo,
  },
  "de-DE": {
    common: deDE_common,
    landing: deDE_landing,
    explore: deDE_explore,
    validation: deDE_validation,
    errors: deDE_errors,
    bookDemo: deDE_bookDemo,
  },
  "fr-FR": {
    common: frFR_common,
    landing: frFR_landing,
    explore: frFR_explore,
    validation: frFR_validation,
    errors: frFR_errors,
    bookDemo: frFR_bookDemo,
  },
  "es-ES": {
    common: esES_common,
    landing: esES_landing,
    explore: esES_explore,
    validation: esES_validation,
    errors: esES_errors,
    bookDemo: esES_bookDemo,
  },
  "zh-CN": {
    common: zhCN_common,
    landing: zhCN_landing,
    explore: zhCN_explore,
    validation: zhCN_validation,
    errors: zhCN_errors,
    bookDemo: zhCN_bookDemo,
  },
  "ar-SA": {
    common: arSA_common,
    landing: arSA_landing,
    explore: arSA_explore,
    validation: arSA_validation,
    errors: arSA_errors,
    bookDemo: arSA_bookDemo,
  },
  "it-IT": {
    common: itIT_common,
    landing: itIT_landing,
    explore: itIT_explore,
    validation: itIT_validation,
    errors: itIT_errors,
    bookDemo: itIT_bookDemo,
  },
};

function detectInitialLocale() {
  const saved = getLocalLocalePreference();
  if (saved) {
    return saved;
  }

  if (typeof navigator !== "undefined") {
    const candidates = navigator.languages?.length
      ? navigator.languages
      : [navigator.language];
    for (const candidate of candidates) {
      if (candidate) {
        return normalizeLocale(candidate);
      }
    }
  }

  return DEFAULT_LOCALE;
}

const initialLocale = detectInitialLocale();
applyDocumentLocale(initialLocale);

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLocale,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: SUPPORTED_LOCALE_CODES,
    nonExplicitSupportedLngs: false,
    load: "currentOnly",
    ns: ACTIVE_NAMESPACES,
    defaultNS: "common",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LOCALE_STORAGE_KEY,
      caches: ["localStorage"],
      convertDetectedLanguage: (lng) => normalizeLocale(lng),
    },
    react: {
      useSuspense: false,
    },
    returnNull: false,
    returnEmptyString: false,
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: import.meta.env.DEV
      ? (lngs, ns, key) => {
          // Development-only signal; never surface raw missing-key text to users.
          console.warn(`[i18n] Missing key: ${ns}:${key} (${lngs.join(", ")})`);
        }
      : undefined,
  });

i18n.on("languageChanged", (lng) => {
  applyDocumentLocale(normalizeLocale(lng));
});

export default i18n;
