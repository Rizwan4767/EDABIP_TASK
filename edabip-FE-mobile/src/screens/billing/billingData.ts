import type { ImageSourcePropType } from 'react-native';

import {
  KpiAmountDueIcon,
  KpiCurrentPeriodIcon,
  KpiCurrentPlanIcon,
  KpiLastPaymentIcon,
} from '@/assets/billing';

export type BillingKpiTone = 'success' | 'danger';
export type BillingCardBrand = 'visa' | 'mastercard';
export type BillingInvoiceStatus = 'Paid' | 'Due';

export interface BillingKpi {
  id: string;
  title: string;
  value: string;
  badge: string;
  tone: BillingKpiTone;
  icon: ImageSourcePropType;
}

export interface BillingUsageItem {
  id: string;
  label: string;
  percent: number;
  value: string;
  limit: string;
}

export interface BillingInvoice {
  id: string;
  number: string;
  date: string;
  amount: string;
  status: BillingInvoiceStatus;
}

export interface BillingHistoryBar {
  month: string;
  value: number;
  color: string;
}

export interface BillingHistory {
  totalPaid: string;
  totalInvoices: string;
  outstanding: string;
  bars: BillingHistoryBar[];
  /** Chart Y-axis ceiling derived from data; 0 when empty. */
  axisMax?: number;
  /** Highest-first labels for the five gridlines. */
  yTickLabels?: string[];
}

export interface BillingPaymentMethod {
  id: string;
  brand: BillingCardBrand;
  last4: string;
  expiry: string;
  holderName?: string;
  isPrimary: boolean;
  /** False for TEST-mode fallback cards that cannot be charged. */
  isChargeable?: boolean;
  label?: string;
}

export interface BillingPlan {
  id: string;
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
}

export type BillingPlanStatus = 'active' | 'deactivated';

export interface BillingData {
  kpis: BillingKpi[];
  usage: BillingUsageItem[];
  invoices: BillingInvoice[];
  history: BillingHistory;
  paymentMethods: BillingPaymentMethod[];
  plans: BillingPlan[];
  currentPlanId: string;
  planStatus: BillingPlanStatus;
}

export const EMPTY_HISTORY: BillingHistory = {
  totalPaid: '₹0.00',
  totalInvoices: '0',
  outstanding: '₹0.00',
  bars: [],
  axisMax: 0,
  yTickLabels: ['', '', '', '', '0'],
};

export const EMPTY_KPIS: BillingKpi[] = [
  {
    id: 'plan',
    title: 'Current Plan',
    value: '—',
    badge: 'No plan',
    tone: 'success',
    icon: KpiCurrentPlanIcon,
  },
  {
    id: 'period',
    title: 'Current Period',
    value: '—',
    badge: '—',
    tone: 'success',
    icon: KpiCurrentPeriodIcon,
  },
  {
    id: 'due',
    title: 'Amount Due',
    value: '—',
    badge: '—',
    tone: 'danger',
    icon: KpiAmountDueIcon,
  },
  {
    id: 'last',
    title: 'Last payment',
    value: '—',
    badge: '—',
    tone: 'success',
    icon: KpiLastPaymentIcon,
  },
];

export const EMPTY_BILLING_DATA: BillingData = {
  kpis: EMPTY_KPIS,
  usage: [],
  invoices: [],
  history: EMPTY_HISTORY,
  paymentMethods: [],
  plans: [],
  currentPlanId: '',
  planStatus: 'active',
};

/** @deprecated Prefer EMPTY_BILLING_DATA — kept so older imports keep compiling. */
export const BILLING_DATA = EMPTY_BILLING_DATA;
