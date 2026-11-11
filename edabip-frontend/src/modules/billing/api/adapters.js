/**
 * Translates billing API responses into the shapes the billing components
 * already render.
 *
 * All backend field names live in this file. The components keep using the
 * names they were written against (`id`, `cadence`, `currentPlanId`), so
 * wiring a section to the API never means editing its JSX.
 */
import { formatCurrency, formatDate, formatNumber } from '../../../utils/localeFormatters.js';

// The invoice endpoint sends an amount but no currency code — only /plans
// carries one. The backend default is INR (BILLING_DEFAULT_CURRENCY), so that
// is the assumption here. One place to change if pricing moves to USD.
const INVOICE_CURRENCY = 'INR';

/**
 * The API returns naive UTC ("2025-04-30T00:00:00"). JavaScript parses a
 * date-time with no zone as *local* time, which can shift the day. Adding the
 * Z keeps it UTC.
 */
function parseApiDate(value) {
  if (typeof value !== 'string') return new Date(value);
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value);
  return new Date(hasZone ? value : `${value}Z`);
}

function toTitleCase(value) {
  const text = String(value || '');
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

function formatPlanPrice(price, currency) {
  // The plan cards show a whole number ("$29"), not "₹29.00".
  return formatCurrency(price, undefined, String(currency || 'inr').toUpperCase(), {
    maximumFractionDigits: 0,
  });
}

/**
 * GET /api/billing/plans -> { plans, currentPlanId }
 *
 * The API flags the active plan per-item with `is_current`; PlanSelector
 * wants a single id, so it's derived here. Returns null while the org has
 * no subscription, which is the correct "no Current Plan card" state.
 */
export function toPlans(payload) {
  const source = payload?.plans || [];

  const plans = source.map((plan) => ({
    id: plan.code,
    name: plan.name,
    description: plan.description,
    price: formatPlanPrice(plan.price, plan.currency),
    cadence: `/${plan.billing_cycle}`,
    features: plan.features || [],
    featured: Boolean(plan.featured),
  }));

  const current = source.find((plan) => plan.is_current);

  return { plans, currentPlanId: current ? current.code : null };
}

/**
 * POST /api/billing/plans/{code}/select -> { planId, message }
 *
 * The response says which plan the org actually ended up on, so the page can
 * set its current-plan marker from that rather than assuming the clicked card
 * won. `message` is already user-facing copy written by the API ("Subscription
 * upgraded to the Enterprise plan.", or "This is already your current plan."
 * when nothing changed), so the toast can show it as-is.
 */
export function toPlanChange(payload) {
  return {
    planId: payload?.plan?.code || null,
    message: payload?.message || '',
  };
}

/**
 * GET /api/billing/invoices -> { rows, total }
 *
 * Callers that still page invoices client-side fetch one large page rather
 * than one page at a time. `total` is returned so they can tell when the API
 * is holding more than it asked for.
 */
export function toInvoiceRows(payload) {
  const items = payload?.items || [];

  const rows = items.map((invoice) => ({
    // The API sends no id. Invoice numbers are unique, and the table uses
    // this for React keys, row selection and export.
    id: invoice.invoice_number,
    invoiceNumber: invoice.invoice_number,
    date: formatDate(parseApiDate(invoice.date)),
    period: invoice.period_label,
    amount: formatCurrency(invoice.amount, undefined, INVOICE_CURRENCY, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    status: toTitleCase(invoice.status),
    downloadAvailable: Boolean(invoice.download_available),
    issuedAt: invoice.date ? parseApiDate(invoice.date) : null,
  }));

  return { rows, total: payload?.total ?? rows.length };
}

function formatPaymentDate(value) {
  if (!value) return '—';
  const date = parseApiDate(value);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${date.getUTCFullYear()}`;
}

function toPaymentStatus(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'successful') return 'Completed';
  if (value === 'failed') return 'Failed';
  return toTitleCase(value);
}

function last4FromLabel(label) {
  const match = String(label || '').match(/(\d{4})\s*$/);
  return match ? match[1] : null;
}

function paymentMethodName(label) {
  const text = String(label || '').trim();
  if (!text) return '—';
  return text.replace(/\s+ending in\s+\d{4}$/i, '').trim() || text;
}

/**
 * GET /api/billing/payment-history -> table rows / transaction details
 *
 * The API has no cardholder name, so "Name on Card" is a dash unless a later
 * payload adds one. Card number is reconstructed from "ending in 4242".
 */
export function toPaymentHistory(payload) {
  const items = payload?.items || [];

  const rows = items.map((payment) => {
    const methodLabel = payment.payment_method_label || '';
    const last4 = last4FromLabel(methodLabel);
    return {
      id: payment.transaction_id,
      name: payment.invoice_number || payment.transaction_id,
      amount: money(payment.amount),
      status: toPaymentStatus(payment.status),
      date: formatPaymentDate(payment.payment_date),
      transactionId: payment.transaction_id,
      paymentMethod: paymentMethodName(methodLabel),
      cardNumber: last4 ? `****-****-****-${last4}` : '—',
      nameOnCard: '—',
      invoiceNumber: payment.invoice_number || null,
      paidAt: payment.payment_date ? parseApiDate(payment.payment_date) : null,
    };
  });

  return { rows, total: payload?.total ?? rows.length };
}

/**
 * GET /api/billing/payment-methods -> rows for PaymentMethodForm
 *
 * This endpoint returns a bare array, not an object wrapper like /plans and
 * /invoices do.
 */
export function toPaymentMethods(payload) {
  const items = Array.isArray(payload) ? payload : [];

  return items.map((method) => ({
    id: method.id,
    brand: method.brand,
    method: method.method || (method.last4 ? 'card' : 'other'),
    label: method.display_label,
    // "Expires 04/2031", or "Expiry unavailable" for a card Razorpay never
    // gave us an expiry for - the server sends the label already worded.
    expiry: method.expires_label,
    isPrimary: Boolean(method.is_primary),
    // False for a card saved via the TEST-mode fallback: it can be listed,
    // made primary and removed, but never charged. Defaults to true so an
    // older API response without the field behaves as before.
    isChargeable: method.is_chargeable !== false,
  }));
}

// The bar colours the chart was designed with, reused in order and cycled if
// a longer range than six months is ever requested.
const CHART_COLORS = [
  '#D8BFF2',
  '#C8D8F9',
  '#446665',
  'rgba(19, 75, 74, 0.5)',
  'rgba(112, 169, 168, 0.7)',
  '#EFB2B3',
];

function money(amount) {
  return formatCurrency(amount ?? 0, undefined, INVOICE_CURRENCY, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Round up to a readable axis maximum: 1, 2, 2.5 or 5 times a power of ten. */
function niceCeiling(value) {
  if (!(value > 0)) return 0;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = [1, 2, 2.5, 5, 10].find((candidate) => normalized <= candidate) ?? 10;
  return step * magnitude;
}

/** "₹100K" — the compact form the chart's axis was designed around. */
function formatAxisAmount(amount) {
  return formatCurrency(amount, undefined, INVOICE_CURRENCY, {
    notation: 'compact',
    maximumFractionDigits: 1,
  });
}

/**
 * GET /api/billing/history -> the Billing History card and its bar chart.
 *
 * The chart's Y axis used to be hardcoded to $100K. Real amounts are nothing
 * like that, so the axis is derived from the data and returned as `ticks`,
 * highest first, one per gridline.
 */
export function toHistory(payload) {
  const monthly = payload?.monthly || [];
  const max = niceCeiling(Math.max(0, ...monthly.map((month) => month.amount || 0)));

  const bars = monthly.map((month, index) => ({
    month: month.month,
    value: formatNumber(month.amount || 0),
    height: max > 0 ? Math.round(((month.amount || 0) / max) * 100) : 0,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  // With no payments yet there is no meaningful scale, so only the baseline
  // is labelled rather than repeating "0" five times.
  const ticks =
    max > 0
      ? [1, 0.75, 0.5, 0.25, 0].map((f) => (f === 0 ? '0' : formatAxisAmount(max * f)))
      : ['', '', '', '', '0'];

  return {
    totalPaid: money(payload?.total_paid),
    // A count, not money. The mock rendered this with a leading "$".
    totalInvoices: String(payload?.total_invoices ?? 0),
    outstanding: money(payload?.outstanding_amount),
    bars,
    ticks,
  };
}

// Backend metric keys -> the ids UsageMeter looks its icons up by. Without
// this the lookup misses and every row silently renders the Users icon.
const USAGE_ID_BY_KEY = {
  active_users: 'users',
  storage: 'storage',
  reports: 'reports',
  dashboards: 'dashboards',
  data_processing: 'processing',
};

/**
 * "200 Users" -> "200", but "2 TB" stays whole.
 *
 * The used/limit line reads "86 / 200" and "1.2 TB / 2 TB": a trailing count
 * noun is dropped, a size unit is part of the number and stays.
 */
function shortLimit(metric) {
  const label = metric.display_limit || '';
  const unit = metric.unit || '';
  if (unit === 'TB' || unit === 'GB') return label;
  return label.replace(/\s+[A-Za-z]+$/, '');
}

/** GET /api/billing/usage -> rows for UsageMeter. */
export function toUsageItems(payload) {
  const metrics = payload?.metrics || [];

  return metrics.map((metric) => ({
    id: USAGE_ID_BY_KEY[metric.key] || metric.key,
    label: metric.label,
    percent: Math.round(metric.percentage || 0),
    value: `${metric.display_used} / ${shortLimit(metric)}`,
    limit: `Limit: ${metric.display_limit}`,
  }));
}

/**
 * Formats a raw metric amount the way the API formats its own display values.
 *
 * `used` and `limit` are always the metric's base unit — gigabytes for storage
 * and data processing — while `unit` is the unit the API chose to *show* them
 * in. So a plan with 2 TB of storage reports limit 2048 and unit "TB", and a
 * remaining figure has to divide before it can be labelled.
 */
function formatUsageAmount(value, unit) {
  if (unit === 'TB') return `${(value / 1024).toFixed(1)} TB`;
  if (unit === 'GB') return `${formatNumber(Math.round(value))} GB`;
  if (unit) return `${formatNumber(Math.round(value))} ${unit}`;
  return formatNumber(Math.round(value));
}

/**
 * GET /api/billing/usage -> the detail behind the meter's "View All".
 *
 * The meter itself shows a percentage and a "used / limit" line. This keeps
 * the period the figures cover and works out what is left, neither of which
 * fits in a meter tile.
 */
export function toUsageDetail(payload) {
  if (!payload) return null;

  const metrics = (payload.metrics || []).map((metric) => {
    const used = Number(metric.used) || 0;
    const limit = Number(metric.limit) || 0;

    return {
      id: USAGE_ID_BY_KEY[metric.key] || metric.key,
      label: metric.label,
      percent: Math.round(metric.percentage || 0),
      used: metric.display_used,
      limit: metric.display_limit,
      // Clamped: an over-limit metric is "nothing left", not a negative
      // allowance. The percentage still shows how far over it went.
      remaining: formatUsageAmount(Math.max(limit - used, 0), metric.unit),
    };
  });

  return {
    period: formatPeriod(payload.period_start, payload.period_end),
    metrics,
  };
}

/**
 * GET /api/billing/storage -> the storage panel behind "View All".
 *
 * `status` is the server's own verdict ("normal" | "warning" | "critical"),
 * judged against the two thresholds it also sends, so the panel labels the
 * state rather than deciding it here.
 */
export function toStorageDetail(payload) {
  if (!payload) return null;

  const unit = Number(payload.total_gb) >= 1024 ? 'TB' : 'GB';

  return {
    total: formatUsageAmount(Number(payload.total_gb) || 0, unit),
    used: formatUsageAmount(Number(payload.used_gb) || 0, unit),
    available: formatUsageAmount(Number(payload.available_gb) || 0, unit),
    percent: Math.round(payload.percentage || 0),
    warningAt: Math.round(payload.warning_threshold_pct || 0),
    criticalAt: Math.round(payload.critical_threshold_pct || 0),
    status: payload.status || 'normal',
  };
}

/** "May 1 – May 31, 2025", collapsing the month and year when they match. */
function formatPeriod(start, end) {
  if (!start || !end) return '';
  const from = parseApiDate(start);
  const to = parseApiDate(end);
  const sameMonth = from.getUTCFullYear() === to.getUTCFullYear() && from.getUTCMonth() === to.getUTCMonth();

  return sameMonth
    ? `${formatDate(from, undefined, { month: 'short', day: 'numeric' })} – ${formatDate(to)}`
    : `${formatDate(from)} – ${formatDate(to)}`;
}

/** GET /api/billing/overview -> the four KPI cards and the refreshed label. */
export function toOverview(payload) {
  if (!payload) return null;

  const lastPaidAt = payload.last_payment_date;

  return {
    plan: payload.plan_name,
    billingCadence: payload.billing_cycle_label,
    period: formatPeriod(payload.period_start, payload.period_end),
    daysRemaining: payload.days_remaining,
    amountDue: money(payload.amount_due),
    // Already rendered by the API: "Due on May 31, 2025" / "No payment due".
    dueOn: payload.amount_due_label,
    lastPayment: payload.last_payment_amount != null ? money(payload.last_payment_amount) : '—',
    lastPaymentOn: lastPaidAt ? `paid on ${formatDate(parseApiDate(lastPaidAt))}` : 'No payments yet',
    lastRefreshed: payload.last_refreshed ? parseApiDate(payload.last_refreshed) : null,
  };
}
