import test from "node:test";
import assert from "node:assert/strict";

import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
} from "../utils/localeFormatters.js";

test("formatters use Intl and explicit currency", () => {
  assert.match(formatNumber(1234.5, "en-US"), /1,234/);
  assert.match(formatPercent(0.25, "en-US"), /25%/);
  assert.match(formatCurrency(10, "en-US", "USD"), /\$/);
  assert.ok(formatDate("2026-07-29", "en-US").length > 0);
  assert.throws(() => formatCurrency(10, "en-US"), /currency/);
});
