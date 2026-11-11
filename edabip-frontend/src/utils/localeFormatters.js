/**
 * Presentation formatters.
 * Locale is for display only — never derive currency or timezone from UI language.
 */

import { DEFAULT_LOCALE, normalizeLocale } from "../i18n/localeConfig.js";

function resolveLocale(locale) {
  return normalizeLocale(locale || DEFAULT_LOCALE);
}

export function formatNumber(value, locale, options = {}) {
  return new Intl.NumberFormat(resolveLocale(locale), options).format(value);
}

export function formatPercent(value, locale, options = {}) {
  return new Intl.NumberFormat(resolveLocale(locale), {
    style: "percent",
    ...options,
  }).format(value);
}

export function formatCurrency(value, locale, currency, options = {}) {
  if (!currency) {
    throw new Error("formatCurrency requires an explicit currency code.");
  }

  return new Intl.NumberFormat(resolveLocale(locale), {
    style: "currency",
    currency,
    ...options,
  }).format(value);
}

export function formatDate(value, locale, options = {}) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(resolveLocale(locale), {
    dateStyle: "medium",
    ...options,
  }).format(date);
}

export function formatDateTime(value, locale, options = {}) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(resolveLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
  }).format(date);
}

const RELATIVE_DIVISIONS = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

export function formatRelativeTime(value, locale, options = {}) {
  const date = value instanceof Date ? value : new Date(value);
  const now = options.now instanceof Date ? options.now : new Date();
  let duration = (date.getTime() - now.getTime()) / 1000;

  for (const division of RELATIVE_DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return new Intl.RelativeTimeFormat(resolveLocale(locale), {
        numeric: "auto",
        ...options,
      }).format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  return new Intl.RelativeTimeFormat(resolveLocale(locale), {
    numeric: "auto",
    ...options,
  }).format(0, "second");
}
