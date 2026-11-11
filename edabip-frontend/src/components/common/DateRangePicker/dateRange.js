export const DATE_RANGE_PRESETS = ["Last 30 Days", "3 Months", "6 Months", "9 Months"];

export const CUSTOM_RANGE_LABEL = 'Custom';
export const DEFAULT_DATE_RANGE = DATE_RANGE_PRESETS[0];

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CUSTOM_DATE_RE = /^([A-Z][a-z]{2}) (\d{1,2}), (\d{4})$/;

export function formatCustomDate(date) {
  return `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function parseCustomDate(value) {
  if (!value || DATE_RANGE_PRESETS.includes(value) || value === CUSTOM_RANGE_LABEL) {
    return null;
  }
  const match = CUSTOM_DATE_RE.exec(value);
  if (!match) return null;
  const month = MONTHS_SHORT.indexOf(match[1]);
  if (month < 0) return null;
  const parsed = new Date(Number(match[3]), month, Number(match[2]));
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.getDate() !== Number(match[2]) || parsed.getMonth() !== month) return null;
  return parsed;
}

export { MONTHS_SHORT };
