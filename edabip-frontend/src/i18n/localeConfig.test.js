import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_LOCALE,
  getLocaleDirection,
  isSupportedLocale,
  normalizeLocale,
} from "./localeConfig.js";

test("default locale is en-US", () => {
  assert.equal(DEFAULT_LOCALE, "en-US");
});

test("isSupportedLocale accepts known codes only", () => {
  assert.equal(isSupportedLocale("ar-SA"), true);
  assert.equal(isSupportedLocale("Arabic"), false);
  assert.equal(isSupportedLocale(""), false);
});

test("normalizeLocale maps aliases and unsupported tags", () => {
  assert.equal(normalizeLocale("en"), "en-US");
  assert.equal(normalizeLocale("en-GB"), "en-US");
  assert.equal(normalizeLocale("hi"), "hi-IN");
  assert.equal(normalizeLocale("ja"), "ja-JP");
  assert.equal(normalizeLocale("ko"), "ko-KR");
  assert.equal(normalizeLocale("de"), "de-DE");
  assert.equal(normalizeLocale("fr"), "fr-FR");
  assert.equal(normalizeLocale("es"), "es-ES");
  assert.equal(normalizeLocale("zh"), "zh-CN");
  assert.equal(normalizeLocale("zh-Hans"), "zh-CN");
  assert.equal(normalizeLocale("ar"), "ar-SA");
  assert.equal(normalizeLocale("it"), "it-IT");
  assert.equal(normalizeLocale("pt-BR"), "en-US");
  assert.equal(normalizeLocale("zh-TW"), "en-US");
  assert.equal(normalizeLocale("zh-Hant"), "en-US");
});

test("Arabic uses rtl direction", () => {
  assert.equal(getLocaleDirection("ar-SA"), "rtl");
  assert.equal(getLocaleDirection("en-US"), "ltr");
  assert.equal(getLocaleDirection("de-DE"), "ltr");
});
