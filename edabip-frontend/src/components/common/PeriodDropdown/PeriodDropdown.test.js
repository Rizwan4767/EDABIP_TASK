import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCustomDate, parseCustomDate } from '../DateRangePicker/dateRange.js';

test('formatCustomDate formats JS Date correctly', () => {
  const d = new Date(2026, 8, 3);
  assert.equal(formatCustomDate(d), 'Sep 3, 2026');
});

test('parseCustomDate parses formatted custom date correctly', () => {
  const parsed = parseCustomDate('Sep 3, 2026');
  assert.notEqual(parsed, null);
  assert.equal(parsed.getFullYear(), 2026);
  assert.equal(parsed.getMonth(), 8);
  assert.equal(parsed.getDate(), 3);
});

test('parseCustomDate returns null for preset options', () => {
  assert.equal(parseCustomDate('Last 3 Months'), null);
  assert.equal(parseCustomDate('Last 6 Months'), null);
  assert.equal(parseCustomDate('Custom'), null);
});
