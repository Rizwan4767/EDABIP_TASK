/**
 * Translation resource validation.
 * English failures exit non-zero. Incomplete beta locales warn only.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesRoot = path.resolve(__dirname, "../src/i18n/locales");

const REQUIRED_LOCALES = [
  "en-US",
  "hi-IN",
  "ja-JP",
  "ko-KR",
  "de-DE",
  "fr-FR",
  "es-ES",
  "zh-CN",
  "ar-SA",
  "it-IT",
];

const REQUIRED_NAMESPACES = [
  "common",
  "landing",
  "explore",
  "validation",
  "errors",
];

function flattenKeys(value, prefix = "", out = new Set()) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, nested] of Object.entries(value)) {
      flattenKeys(nested, prefix ? `${prefix}.${key}` : key, out);
    }
  } else if (prefix) {
    out.add(prefix);
  }
  return out;
}

function collectInterpolationVars(value, prefix = "", out = new Map()) {
  if (typeof value === "string") {
    const matches = value.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g);
    const vars = [...matches].map((match) => match[1]).sort();
    out.set(prefix, vars.join(","));
    return out;
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, nested] of Object.entries(value)) {
      collectInterpolationVars(nested, prefix ? `${prefix}.${key}` : key, out);
    }
  }

  return out;
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

const errors = [];
const warnings = [];

for (const locale of REQUIRED_LOCALES) {
  const dir = path.join(localesRoot, locale);
  if (!fs.existsSync(dir)) {
    errors.push(`Missing locale folder: ${locale}`);
    continue;
  }

  for (const ns of REQUIRED_NAMESPACES) {
    const filePath = path.join(dir, `${ns}.json`);
    if (!fs.existsSync(filePath)) {
      const message = `Missing namespace file: ${locale}/${ns}.json`;
      if (locale === "en-US") errors.push(message);
      else warnings.push(message);
    }
  }
}

const enResources = {};
for (const ns of REQUIRED_NAMESPACES) {
  const filePath = path.join(localesRoot, "en-US", `${ns}.json`);
  try {
    enResources[ns] = readJson(filePath);
  } catch (error) {
    errors.push(`Invalid JSON en-US/${ns}.json: ${error.message}`);
  }
}

const enKeys = Object.fromEntries(
  Object.entries(enResources).map(([ns, data]) => [ns, flattenKeys(data)])
);
const enVars = Object.fromEntries(
  Object.entries(enResources).map(([ns, data]) => [ns, collectInterpolationVars(data)])
);

for (const locale of REQUIRED_LOCALES) {
  if (locale === "en-US") continue;

  for (const ns of REQUIRED_NAMESPACES) {
    const filePath = path.join(localesRoot, locale, `${ns}.json`);
    if (!fs.existsSync(filePath)) continue;

    let data;
    try {
      data = readJson(filePath);
    } catch (error) {
      const message = `Invalid JSON ${locale}/${ns}.json: ${error.message}`;
      if (locale === "en-US") errors.push(message);
      else warnings.push(message);
      continue;
    }

    const keys = flattenKeys(data);
    const expected = enKeys[ns] || new Set();

    for (const key of expected) {
      if (!keys.has(key)) {
        warnings.push(`Missing key ${locale}/${ns}:${key}`);
      }
    }

    for (const key of keys) {
      if (!expected.has(key)) {
        warnings.push(`Extra key ${locale}/${ns}:${key}`);
      }
    }

    const vars = collectInterpolationVars(data);
    for (const [key, signature] of enVars[ns] || []) {
      if (vars.has(key) && vars.get(key) !== signature) {
        warnings.push(
          `Interpolation mismatch ${locale}/${ns}:${key} (expected {{${signature}}})`
        );
      }
    }
  }
}

if (REQUIRED_LOCALES.length !== new Set(REQUIRED_LOCALES).size) {
  errors.push("Duplicate locale entries detected.");
}

console.log("Translation validation");
console.log(`Errors: ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);

for (const error of errors) {
  console.error(`ERROR: ${error}`);
}
for (const warning of warnings.slice(0, 40)) {
  console.warn(`WARN: ${warning}`);
}
if (warnings.length > 40) {
  console.warn(`WARN: …and ${warnings.length - 40} more`);
}

if (errors.length > 0) {
  process.exit(1);
}

console.log("Validation passed (English resources OK).");
