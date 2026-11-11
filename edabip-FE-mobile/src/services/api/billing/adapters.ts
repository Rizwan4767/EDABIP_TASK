/**
 * Translates billing API responses into the shapes mobile billing components
 * already render. Backend field names stay in this file.
 */
import type { ImageSourcePropType } from 'react-native';

import {
  KpiAmountDueIcon,
  KpiCurrentPeriodIcon,
  KpiCurrentPlanIcon,
  KpiLastPaymentIcon,
} from '@/assets/billing';
import type {
  BillingCardBrand,
  BillingHistory,
  BillingInvoice,
  BillingInvoiceStatus,
  BillingKpi,
  BillingPaymentMethod,
  BillingPlan,
  BillingPlanStatus,
  BillingUsageItem,
} from '@/screens/billing/billingData';
import { formatCurrency, formatDate } from '@/utils/localeFormat';

const INVOICE_CURRENCY = 'INR';

const CHART_COLORS = [
  '#D8BFF2',
  '#C8D8F9',
  '#446665',
  'rgba(19, 75, 74, 0.5)',
  'rgba(112, 169, 168, 0.7)',
  '#EFB2B3',
];

const USAGE_ID_BY_KEY: Record<string, string> = {
  active_users: 'users',
  storage: 'storage',
  reports: 'reports',
  dashboards: 'dashboards',
  data_processing: 'processing',
};

function parseApiDate(value: unknown): Date {
  if (typeof value !== 'string') return new Date(value as string | number | Date);
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value);
  return new Date(hasZone ? value : `${value}Z`);
}

function toTitleCase(value: unknown): string {
  const text = String(value || '');
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

function money(amount: unknown): string {
  return formatCurrency(Number(amount) || 0, INVOICE_CURRENCY, undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPlanPrice(price: unknown, currency: unknown): string {
  return formatCurrency(Number(price) || 0, String(currency || 'inr').toUpperCase(), undefined, {
    maximumFractionDigits: 0,
  });
}

function formatPeriod(start: unknown, end: unknown): string {
  if (!start || !end) return '';
  const from = parseApiDate(start);
  const to = parseApiDate(end);
  const sameMonth =
    from.getUTCFullYear() === to.getUTCFullYear() && from.getUTCMonth() === to.getUTCMonth();

  return sameMonth
    ? `${formatDate(from, undefined, { month: 'short', day: 'numeric' })} – ${formatDate(to)}`
    : `${formatDate(from)} – ${formatDate(to)}`;
}

function niceCeiling(value: number): number {
  if (!(value > 0)) return 0;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = [1, 2, 2.5, 5, 10].find((candidate) => normalized <= candidate) ?? 10;
  return step * magnitude;
}

function formatAxisAmount(amount: number): string {
  return formatCurrency(amount, INVOICE_CURRENCY, undefined, {
    notation: 'compact',
    maximumFractionDigits: 1,
  });
}

function shortLimit(metric: { display_limit?: string; unit?: string }): string {
  const label = metric.display_limit || '';
  const unit = metric.unit || '';
  if (unit === 'TB' || unit === 'GB') return label;
  return label.replace(/\s+[A-Za-z]+$/, '');
}

function normalizeBrand(brand: unknown): BillingCardBrand {
  const value = String(brand || '').toLowerCase();
  if (value.includes('master')) return 'mastercard';
  return 'visa';
}

function last4FromLabel(label: string): string {
  const match = String(label || '').match(/(\d{4})\s*$/);
  return match?.[1] ?? '••••';
}

function paymentMethodName(label: string): string {
  const text = String(label || '').trim();
  if (!text) return '—';
  return text.replace(/\s+ending in\s+\d{4}$/i, '').trim() || text;
}

function toPaymentStatus(status: unknown): 'Completed' | 'Failed' | string {
  const value = String(status || '').toLowerCase();
  if (value === 'successful') return 'Completed';
  if (value === 'failed') return 'Failed';
  return toTitleCase(value);
}

function formatPaymentDate(value: unknown): string {
  if (!value) return '—';
  const date = parseApiDate(value);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${date.getUTCFullYear()}`;
}

function invoiceStatus(status: unknown): BillingInvoiceStatus {
  const value = toTitleCase(status);
  if (value.toLowerCase() === 'due' || value.toLowerCase() === 'open') return 'Due';
  return 'Paid';
}

export interface OverviewView {
  plan: string;
  billingCadence: string;
  period: string;
  daysRemaining: number;
  amountDue: string;
  dueOn: string;
  lastPayment: string;
  lastPaymentOn: string;
  subscriptionStatus: string;
}

export function toOverview(
  payload: Record<string, unknown> | null | undefined,
): OverviewView | null {
  if (!payload) return null;

  const lastPaidAt = payload.last_payment_date;

  return {
    plan: String(payload.plan_name || ''),
    billingCadence: String(payload.billing_cycle_label || ''),
    period: formatPeriod(payload.period_start, payload.period_end),
    daysRemaining: Number(payload.days_remaining) || 0,
    amountDue: money(payload.amount_due),
    dueOn: String(payload.amount_due_label || ''),
    lastPayment: payload.last_payment_amount != null ? money(payload.last_payment_amount) : '—',
    lastPaymentOn: lastPaidAt
      ? `Paid on ${formatDate(parseApiDate(lastPaidAt))}`
      : 'No payments yet',
    subscriptionStatus: String(payload.subscription_status || 'active').toLowerCase(),
  };
}

export function toKpis(overview: OverviewView | null, planStatus: BillingPlanStatus): BillingKpi[] {
  const deactivated = planStatus === 'deactivated';
  const cards: {
    id: string;
    title: string;
    value: string;
    badge: string;
    tone: BillingKpi['tone'];
    icon: ImageSourcePropType;
  }[] = [
    {
      id: 'plan',
      title: 'Current Plan',
      value: overview?.plan || '—',
      badge: deactivated ? 'Deactivated' : overview?.billingCadence || 'No plan',
      tone: deactivated ? 'danger' : 'success',
      icon: KpiCurrentPlanIcon,
    },
    {
      id: 'period',
      title: 'Current Period',
      value: overview?.period || '—',
      badge: overview ? `${overview.daysRemaining} Days Remaining` : '—',
      tone: 'success',
      icon: KpiCurrentPeriodIcon,
    },
    {
      id: 'due',
      title: 'Amount Due',
      value: overview?.amountDue || '—',
      badge: overview?.dueOn || '—',
      tone: 'danger',
      icon: KpiAmountDueIcon,
    },
    {
      id: 'last',
      title: 'Last payment',
      value: overview?.lastPayment || '—',
      badge: overview?.lastPaymentOn || '—',
      tone: 'success',
      icon: KpiLastPaymentIcon,
    },
  ];

  return cards;
}

export function toPlans(payload: { plans?: Record<string, unknown>[] } | null | undefined): {
  plans: BillingPlan[];
  currentPlanId: string;
} {
  const source = payload?.plans || [];

  const plans = source.map((plan) => ({
    id: String(plan.code || ''),
    name: String(plan.name || ''),
    description: String(plan.description || ''),
    price: formatPlanPrice(plan.price, plan.currency),
    cadence: `/${String(plan.billing_cycle || 'monthly')}`,
    features: Array.isArray(plan.features) ? plan.features.map(String) : [],
  }));

  const current = source.find((plan) => plan.is_current);

  return { plans, currentPlanId: current ? String(current.code) : '' };
}

export function toPlanChange(payload: { plan?: { code?: string }; message?: string } | null): {
  planId: string;
  message: string;
} {
  return {
    planId: payload?.plan?.code ? String(payload.plan.code) : '',
    message: payload?.message || '',
  };
}

export function toUsageItems(
  payload: { metrics?: Record<string, unknown>[] } | null | undefined,
): BillingUsageItem[] {
  const metrics = payload?.metrics || [];

  return metrics.map((metric) => ({
    id: USAGE_ID_BY_KEY[String(metric.key)] || String(metric.key || ''),
    label: String(metric.label || ''),
    percent: Math.round(Number(metric.percentage) || 0),
    value: `${String(metric.display_used || '')} / ${shortLimit({
      display_limit: String(metric.display_limit || ''),
      unit: String(metric.unit || ''),
    })}`,
    limit: `Limit: ${String(metric.display_limit || '')}`,
  }));
}

export function toInvoiceRows(
  payload: { items?: Record<string, unknown>[]; total?: number } | null,
): {
  rows: BillingInvoice[];
  total: number;
} {
  const items = payload?.items || [];

  const rows = items.map((invoice) => ({
    id: String(invoice.invoice_number || ''),
    number: String(invoice.invoice_number || ''),
    date: formatDate(parseApiDate(invoice.date)),
    amount: formatCurrency(Number(invoice.amount) || 0, INVOICE_CURRENCY, undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    status: invoiceStatus(invoice.status),
  }));

  return { rows, total: payload?.total ?? rows.length };
}

export function toHistory(payload: Record<string, unknown> | null | undefined): BillingHistory {
  const monthly = Array.isArray(payload?.monthly)
    ? (payload.monthly as Record<string, unknown>[])
    : [];
  const max = niceCeiling(Math.max(0, ...monthly.map((month) => Number(month.amount) || 0)));

  const bars = monthly.map((month, index) => ({
    month: String(month.month || ''),
    value: Number(month.amount) || 0,
    color: CHART_COLORS[index % CHART_COLORS.length] ?? CHART_COLORS[0]!,
  }));

  const ticks =
    max > 0
      ? [1, 0.75, 0.5, 0.25, 0].map((f) => (f === 0 ? '0' : formatAxisAmount(max * f)))
      : ['', '', '', '', '0'];

  return {
    totalPaid: money(payload?.total_paid),
    totalInvoices: String(payload?.total_invoices ?? 0),
    outstanding: money(payload?.outstanding_amount),
    bars,
    axisMax: max,
    yTickLabels: ticks,
  };
}

export function toPaymentMethods(payload: unknown): BillingPaymentMethod[] {
  const items = Array.isArray(payload) ? payload : [];

  return items.map((method) => {
    const row = method as Record<string, unknown>;
    return {
      id: String(row.id),
      brand: normalizeBrand(row.brand),
      last4: String(row.last4 || last4FromLabel(String(row.display_label || ''))),
      expiry: String(row.expires_label || 'Expiry unavailable'),
      isPrimary: Boolean(row.is_primary),
      isChargeable: row.is_chargeable !== false,
      label: String(row.display_label || ''),
    };
  });
}

export interface PaymentHistoryRow {
  id: string;
  name: string;
  amount: string;
  status: 'Completed' | 'Failed' | string;
  date: string;
  transactionId: string;
  paymentMethod: string;
  cardNumber: string;
  nameOnCard: string;
  invoiceNumber: string | null;
}

export function toPaymentHistory(
  payload: { items?: Record<string, unknown>[]; total?: number } | null,
): {
  rows: PaymentHistoryRow[];
  total: number;
} {
  const items = payload?.items || [];

  const rows = items.map((payment) => {
    const methodLabel = String(payment.payment_method_label || '');
    const last4 = last4FromLabel(methodLabel);
    return {
      id: String(payment.transaction_id || ''),
      name: String(payment.invoice_number || payment.transaction_id || ''),
      amount: money(payment.amount),
      status: toPaymentStatus(payment.status),
      date: formatPaymentDate(payment.payment_date),
      transactionId: String(payment.transaction_id || ''),
      paymentMethod: paymentMethodName(methodLabel),
      cardNumber: last4 && last4 !== '••••' ? `****-****-****-${last4}` : '—',
      nameOnCard: '—',
      invoiceNumber: payment.invoice_number ? String(payment.invoice_number) : null,
    };
  });

  return { rows, total: payload?.total ?? rows.length };
}
