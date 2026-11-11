import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPreferencesUpdatePayload,
  getLocalLocalePreference,
  mapPreferencesResponse,
  resolveGuestLocale,
  saveLocalLocalePreference,
} from "./localePreferenceService.js";

const memory = new Map();

globalThis.window = {
  localStorage: {
    getItem(key) {
      return memory.has(key) ? memory.get(key) : null;
    },
    setItem(key, value) {
      memory.set(key, String(value));
    },
    removeItem(key) {
      memory.delete(key);
    },
  },
};

test("mapPreferencesResponse validates supported locale codes", () => {
  assert.equal(mapPreferencesResponse({ locale: "it-IT" }), "it-IT");
  assert.equal(mapPreferencesResponse({ locale: "pt-BR" }), null);
  assert.equal(mapPreferencesResponse({}), null);
  assert.equal(mapPreferencesResponse({ language: "ar" }), "ar-SA");
});

test("buildPreferencesUpdatePayload stores standardized codes", () => {
  assert.deepEqual(buildPreferencesUpdatePayload("de"), { locale: "de-DE" });
});

test("local preference save and restore uses edabip-locale", () => {
  memory.clear();
  saveLocalLocalePreference("ja-JP");
  assert.equal(window.localStorage.getItem("edabip-locale"), "ja-JP");
  assert.equal(getLocalLocalePreference(), "ja-JP");
});

test("resolveGuestLocale priority: localStorage → browser → en-US", () => {
  memory.clear();
  assert.equal(resolveGuestLocale(["hi-IN"]), "hi-IN");
  saveLocalLocalePreference("de-DE");
  assert.equal(resolveGuestLocale(["hi-IN"]), "de-DE");
  memory.clear();
  assert.equal(resolveGuestLocale(["xx-YY"]), "en-US");
});
