import type { ImageSourcePropType } from 'react-native';

import {
  PbiCustomerIcon,
  PbiFinanceIcon,
  PbiHrIcon,
  PbiOpsIcon,
  PbiSalesIcon,
} from '@/assets/dashboard';
import {
  ArrowDownGreenIcon,
  ArrowUpGreenIcon,
  ArrowUpRedIcon,
  KpiActiveIncidentsIcon,
  KpiAvgOrderIcon,
  KpiAvgResponseIcon,
  KpiCashFlowIcon,
  KpiChurnRateIcon,
  KpiCustomersIcon,
  KpiEnpsScoreIcon,
  KpiEstClvIcon,
  KpiGrowthIcon,
  KpiNetProfitIcon,
  KpiOperatingExpensesIcon,
  KpiProfitIcon,
  KpiRevenueIcon,
  KpiSecurityComplianceIcon,
  KpiSystemUptimeIcon,
  KpiTimeToHireIcon,
  KpiTotalCustomersIcon,
  KpiTotalHeadcountIcon,
  KpiTotalRevenueIcon,
  KpiTurnoverRateIcon,
} from '@/assets/powerbi';

export type PowerBiTabId = 'sales' | 'financial' | 'customer' | 'hr' | 'operations';
export type SalesKpiTone = 'up' | 'info' | 'down';

export interface PowerBiReport {
  id: PowerBiTabId;
  title: string;
  description: string;
  refreshed: string;
  icon: ImageSourcePropType;
}

export interface PowerBiAnalyticsTab {
  id: PowerBiTabId;
  label: string;
}

export interface SalesKpi {
  id: string;
  title: string;
  value: string;
  change: string;
  tone: SalesKpiTone;
  icon: ImageSourcePropType;
  badgeIcon?: ImageSourcePropType;
  iconWidth?: number;
  iconHeight?: number;
}

export interface DailySalesPoint {
  day: string;
  current: number;
  previous: number;
}

export interface MonthlyRevenueBar {
  month: string;
  value: number;
  total: number;
}

export interface SalesRegion {
  name: string;
  value: string;
  amount: number;
  x: number;
  y: number;
}

export interface SalesRep {
  id: string;
  name: string;
  revenue: string;
}

export interface SalesAnalyticsData {
  kpis: SalesKpi[];
  dailyTrend: DailySalesPoint[];
  monthlyRevenue: MonthlyRevenueBar[];
  regions: SalesRegion[];
  topReps: SalesRep[];
}

export interface PowerBiDonutSlice {
  id: string;
  name: string;
  percent: number;
  color: string;
  /** Visual arc share when it should differ from the labeled percent. */
  arcWeight?: number;
}

export interface PowerBiCategoryBar {
  id: string;
  label: string;
  value: number;
  displayValue: string;
  color: string;
  total?: number;
  capColor?: string;
}

export interface PowerBiHealthRow {
  id: string;
  name: string;
  meta: string;
  status: 'Healthy' | 'Critical';
}

export interface FinancialAnalyticsData {
  kpis: SalesKpi[];
  revenueVsExpenses: DailySalesPoint[];
  expenseSlices: PowerBiDonutSlice[];
}

export interface CustomerAnalyticsData {
  kpis: SalesKpi[];
  forecast: DailySalesPoint[];
  demand: PowerBiCategoryBar[];
  segments: PowerBiDonutSlice[];
  segmentsCenterValue: number;
}

export interface HrAnalyticsData {
  kpis: SalesKpi[];
  engagement: DailySalesPoint[];
  diversity: PowerBiCategoryBar[];
}

export interface OperationsAnalyticsData {
  kpis: SalesKpi[];
  performance: DailySalesPoint[];
  serverLoad: PowerBiCategoryBar[];
  incidents: PowerBiDonutSlice[];
  health: PowerBiHealthRow[];
}

export const POWER_BI_TAB_IDS: PowerBiTabId[] = [
  'sales',
  'financial',
  'customer',
  'hr',
  'operations',
];

export function isPowerBiTabId(value: string | undefined): value is PowerBiTabId {
  return POWER_BI_TAB_IDS.some((id) => id === value);
}

export const POWER_BI_TABS: PowerBiAnalyticsTab[] = [
  { id: 'sales', label: 'Sales analytics' },
  { id: 'financial', label: 'Financial Analytics' },
  { id: 'customer', label: 'Customer Analytics' },
  { id: 'hr', label: 'HR Analytics' },
  { id: 'operations', label: 'Operations Analytics' },
];

export const POWER_BI_REPORTS: PowerBiReport[] = [
  {
    id: 'sales',
    title: 'Sales Analytics 2026',
    description:
      'Comprehensive overview of YTD sales performance, regional breakdowns, and pipeline forecasting.',
    refreshed: '2h ago',
    icon: PbiSalesIcon,
  },
  {
    id: 'financial',
    title: 'Financial Analytics 2026',
    description:
      'Comprehensive overview of YTD sales performance, regional breakdowns, and pipeline forecasting.',
    refreshed: '2h ago',
    icon: PbiFinanceIcon,
  },
  {
    id: 'customer',
    title: 'Customer Analytics 2026',
    description:
      'Comprehensive overview of YTD sales performance, regional breakdowns, and pipeline forecasting.',
    refreshed: '2h ago',
    icon: PbiCustomerIcon,
  },
  {
    id: 'hr',
    title: 'HR Analytics 2026',
    description:
      'Comprehensive overview of YTD sales performance, regional breakdowns, and pipeline forecasting.',
    refreshed: '2h ago',
    icon: PbiHrIcon,
  },
  {
    id: 'operations',
    title: 'Operation Analytics 2026',
    description:
      'Comprehensive overview of YTD sales performance, regional breakdowns, and pipeline forecasting.',
    refreshed: '2h ago',
    icon: PbiOpsIcon,
  },
];

export const SALES_ANALYTICS_DATA: SalesAnalyticsData = {
  kpis: [
    {
      id: 'revenue',
      title: 'Total Revenue',
      value: '$4.2M',
      change: '+12% vs last week',
      tone: 'up',
      icon: KpiRevenueIcon,
    },
    {
      id: 'growth',
      title: 'Sales Growth',
      value: '8.5%',
      change: '+12% vs last week',
      tone: 'up',
      icon: KpiGrowthIcon,
    },
    {
      id: 'customers',
      title: 'Active Customers',
      value: '1,250',
      change: '+45 new this week',
      tone: 'info',
      icon: KpiCustomersIcon,
    },
    {
      id: 'profit',
      title: 'Profit Margin',
      value: '24%',
      change: '-2 vs last quarter',
      tone: 'down',
      icon: KpiProfitIcon,
    },
  ],
  // Web Sales-Analytics DAILY_TREND (USD, two samples per day).
  dailyTrend: [
    { day: 'Day 1', current: 5000, previous: 0 },
    { day: 'Day 1', current: 9000, previous: 10000 },
    { day: 'Day 2', current: 9000, previous: 12000 },
    { day: 'Day 2', current: 18000, previous: 12000 },
    { day: 'Day 3', current: 15000, previous: 10000 },
    { day: 'Day 3', current: 9000, previous: 16000 },
    { day: 'Day 4', current: 13000, previous: 13000 },
    { day: 'Day 4', current: 13000, previous: 5000 },
    { day: 'Day 5', current: 20000, previous: 4000 },
    { day: 'Day 5', current: 21000, previous: 15000 },
    { day: 'Day 6', current: 8000, previous: 11000 },
    { day: 'Day 6', current: 21000, previous: 25000 },
    { day: 'Day 7', current: 19000, previous: 26000 },
    { day: 'Day 7', current: 24000, previous: 32000 },
  ],
  // Web MONTHLY_REVENUE Jan–Jul in USD so both charts share one unit.
  monthlyRevenue: [
    { month: 'Jan', value: 28000, total: 45000 },
    { month: 'Feb', value: 18000, total: 20000 },
    { month: 'Mar', value: 29000, total: 45000 },
    { month: 'Apr', value: 13000, total: 42000 },
    { month: 'May', value: 13000, total: 52000 },
    { month: 'Jun', value: 45000, total: 48000 },
    { month: 'July', value: 26000, total: 28000 },
  ],
  regions: [
    { name: 'New York', value: '72K', amount: 72, x: 11, y: 32 },
    { name: 'San Francisco', value: '39K', amount: 39, x: 24, y: 38 },
    { name: 'Sydney', value: '25K', amount: 25, x: 83, y: 76 },
    { name: 'Singapore', value: '61K', amount: 61, x: 72, y: 58 },
  ],
  topReps: [
    { id: 'rep-1', name: 'Sarah Jenkins', revenue: '$840k' },
    { id: 'rep-2', name: 'Marcus Reed', revenue: '$720k' },
    { id: 'rep-3', name: 'Emma Lin', revenue: '$695k' },
    { id: 'rep-4', name: 'Sarah Jenkins', revenue: '$840k' },
    { id: 'rep-5', name: 'Marcus Reed', revenue: '$720k' },
    { id: 'rep-6', name: 'Emma Lin', revenue: '$695k' },
    { id: 'rep-7', name: 'Sarah Jenkins', revenue: '$840k' },
  ],
};

const FINANCIAL_KPI_ICON = { iconWidth: 22, iconHeight: 23 } as const;

export const FINANCIAL_ANALYTICS_DATA: FinancialAnalyticsData = {
  kpis: [
    {
      id: 'revenue',
      title: 'Total Revenue',
      value: '$4.2M',
      change: '+12% vs last month',
      tone: 'up',
      icon: KpiTotalRevenueIcon,
      ...FINANCIAL_KPI_ICON,
    },
    {
      id: 'profit',
      title: 'Net Profit',
      value: '$850K',
      change: '+12% vs last month',
      tone: 'up',
      icon: KpiNetProfitIcon,
      ...FINANCIAL_KPI_ICON,
    },
    {
      id: 'expenses',
      title: 'Operating Expenses',
      value: '$2.1M',
      change: '-3.1% vs last quarter',
      tone: 'down',
      icon: KpiOperatingExpensesIcon,
      ...FINANCIAL_KPI_ICON,
    },
    {
      id: 'cashflow',
      title: 'Cash Flow',
      value: '$1.1M',
      change: '+5.4% vs last quarter',
      tone: 'up',
      icon: KpiCashFlowIcon,
      ...FINANCIAL_KPI_ICON,
    },
  ],
  revenueVsExpenses: [
    { day: 'Jan', current: 27, previous: 24 },
    { day: 'Feb', current: 34, previous: 26 },
    { day: 'Mar', current: 30, previous: 23 },
    { day: 'Apr', current: 47, previous: 22 },
    { day: 'May', current: 54, previous: 24 },
    { day: 'Jun', current: 50, previous: 38 },
    { day: 'Jul', current: 62, previous: 37 },
    { day: 'Aug', current: 74, previous: 55 },
    { day: 'Sep', current: 80, previous: 95 },
  ],
  expenseSlices: [
    { id: 'rnd', name: 'R&D', percent: 45, arcWeight: 55, color: '#134B4A' },
    { id: 'marketing', name: 'Marketing', percent: 30, arcWeight: 15, color: '#3E9593' },
    { id: 'operating', name: 'Operating', percent: 25, arcWeight: 30, color: '#77FFFD' },
  ],
};

const CUSTOMER_KPI_ICON = { iconWidth: 22, iconHeight: 23 } as const;

export const CUSTOMER_ANALYTICS_DATA: CustomerAnalyticsData = {
  kpis: [
    {
      id: 'customers',
      title: 'Total Customers',
      value: '124.6K',
      change: '+12% vs last month',
      tone: 'up',
      icon: KpiTotalCustomersIcon,
      ...CUSTOMER_KPI_ICON,
    },
    {
      id: 'churn',
      title: 'Churn Rate (30D)',
      value: '2.4%',
      change: '+0.3% vs last month',
      tone: 'down',
      icon: KpiChurnRateIcon,
      ...CUSTOMER_KPI_ICON,
    },
    {
      id: 'aov',
      title: 'Avg Order Value',
      value: '$142.5',
      change: '+45 new this week',
      tone: 'up',
      icon: KpiAvgOrderIcon,
      ...CUSTOMER_KPI_ICON,
    },
    {
      id: 'clv',
      title: 'EST.CLV',
      value: '$1.28K',
      change: '+5.4% vs last quarter',
      tone: 'up',
      icon: KpiEstClvIcon,
      ...CUSTOMER_KPI_ICON,
    },
  ],
  forecast: [
    { day: 'Jan', current: 24, previous: 0 },
    { day: 'Feb', current: 32, previous: 0 },
    { day: 'Mar', current: 38, previous: 0 },
    { day: 'Apr', current: 42, previous: 0 },
    { day: 'May', current: 54, previous: 0 },
    { day: 'Jun', current: 50, previous: 0 },
    { day: 'Jul', current: 63, previous: 0 },
    { day: 'Aug', current: 76, previous: 0 },
  ],
  demand: [
    { id: 'mon', label: 'Mon', value: 23000, displayValue: '23,000', color: '#3E9593' },
    { id: 'fri', label: 'Fri', value: 35000, displayValue: '35,000', color: '#7DBBFF' },
    { id: 'sat', label: 'Sat', value: 95000, displayValue: '95,000', color: '#77FFFD' },
    { id: 'sun', label: 'Sun', value: 60000, displayValue: '60,000', color: '#C4A5E8' },
  ],
  segments: [
    { id: 'ent', name: 'ENT', percent: 50, color: '#134B4A' },
    { id: 'mid', name: 'MID', percent: 25, color: '#5EFCE8' },
    { id: 'smb', name: 'SMB', percent: 25, color: '#358E8D' },
  ],
  segmentsCenterValue: 45,
};

const HR_KPI_ICON = { iconWidth: 22, iconHeight: 23 } as const;

export const HR_ANALYTICS_DATA: HrAnalyticsData = {
  kpis: [
    {
      id: 'headcount',
      title: 'Total Headcount',
      value: '4,821',
      change: '+2.4% vs last period',
      tone: 'up',
      icon: KpiTotalHeadcountIcon,
      badgeIcon: ArrowUpGreenIcon,
      ...HR_KPI_ICON,
    },
    {
      id: 'turnover',
      title: 'Turnover Rate',
      value: '8.5 %',
      change: '+0.8% vs last period',
      tone: 'down',
      icon: KpiTurnoverRateIcon,
      badgeIcon: ArrowUpRedIcon,
      ...HR_KPI_ICON,
    },
    {
      id: 'enps',
      title: 'ENPS Score',
      value: '42',
      change: '-3.1% vs last quarter',
      tone: 'up',
      icon: KpiEnpsScoreIcon,
      badgeIcon: ArrowUpGreenIcon,
      ...HR_KPI_ICON,
    },
    {
      id: 'hire',
      title: 'Time to Hire (Avg)',
      value: '34 Days',
      change: '-3 days vs last period',
      tone: 'up',
      icon: KpiTimeToHireIcon,
      badgeIcon: ArrowDownGreenIcon,
      ...HR_KPI_ICON,
    },
  ],
  engagement: [
    { day: 'Jan', current: 31000, previous: 0 },
    { day: 'Feb', current: 38000, previous: 0 },
    { day: 'Mar', current: 34000, previous: 0 },
    { day: 'Apr', current: 51000, previous: 0 },
    { day: 'May', current: 58000, previous: 0 },
    { day: 'Jun', current: 54000, previous: 0 },
    { day: 'Jul', current: 66000, previous: 0 },
    { day: 'Aug', current: 80000, previous: 0 },
  ],
  diversity: [
    {
      id: 'engineering',
      label: 'Engineering',
      value: 38000,
      total: 45000,
      displayValue: '38K',
      color: '#A0BCE8',
      capColor: '#C9DCFC',
    },
    {
      id: 'sales',
      label: 'Sales',
      value: 75000,
      total: 82000,
      displayValue: '75K',
      color: '#7DBBFF',
      capColor: '#C6E1FF',
    },
    {
      id: 'marketing',
      label: 'Marketing',
      value: 62000,
      total: 70000,
      displayValue: '62K',
      color: '#6BE6D8',
      capColor: '#C1FCF5',
    },
    {
      id: 'product',
      label: 'Product',
      value: 25000,
      total: 32000,
      displayValue: '25K',
      color: '#B899EB',
      capColor: '#DCC4FF',
    },
  ],
};

const OPERATIONS_KPI_ICON = { iconWidth: 22, iconHeight: 23 } as const;

export const OPERATIONS_ANALYTICS_DATA: OperationsAnalyticsData = {
  kpis: [
    {
      id: 'uptime',
      title: 'System Up Time',
      value: '99.9%',
      change: '+0.8% vs last period',
      tone: 'up',
      icon: KpiSystemUptimeIcon,
      badgeIcon: ArrowUpGreenIcon,
      ...OPERATIONS_KPI_ICON,
    },
    {
      id: 'incidents',
      title: 'Active Incidents',
      value: '12',
      change: '+0.8% vs last period',
      tone: 'down',
      icon: KpiActiveIncidentsIcon,
      badgeIcon: ArrowUpRedIcon,
      ...OPERATIONS_KPI_ICON,
    },
    {
      id: 'response',
      title: 'Avg Response Time',
      value: '180MS',
      change: '-3.1% vs last quarter',
      tone: 'up',
      icon: KpiAvgResponseIcon,
      badgeIcon: ArrowDownGreenIcon,
      ...OPERATIONS_KPI_ICON,
    },
    {
      id: 'security',
      title: 'Security Compliance',
      value: '98%',
      change: '+3 days vs last period',
      tone: 'up',
      icon: KpiSecurityComplianceIcon,
      badgeIcon: ArrowUpGreenIcon,
      ...OPERATIONS_KPI_ICON,
    },
  ],
  performance: [
    { day: '00.00', current: 90, previous: 88 },
    { day: '04.00', current: 105, previous: 90 },
    { day: '08.00', current: 96, previous: 88 },
    { day: '12.00', current: 130, previous: 82 },
    { day: '16.00', current: 144, previous: 85 },
    { day: '20.00', current: 137, previous: 137 },
    { day: '24.00', current: 160, previous: 112 },
    { day: '28.00', current: 184, previous: 148 },
    { day: '32.00', current: 196, previous: 230 },
  ],
  serverLoad: [
    {
      id: 'na',
      label: 'North America',
      value: 65000,
      displayValue: '65,000',
      color: '#A9B8ED',
    },
    {
      id: 'emea',
      label: 'EMEA',
      value: 95000,
      displayValue: '95,000',
      color: '#7EB2F0',
    },
    {
      id: 'apac',
      label: 'APAC',
      value: 55000,
      displayValue: '55,000',
      color: '#6BE6D3',
    },
  ],
  incidents: [
    { id: 'infra', name: 'Infrastructure', percent: 50, color: '#53BDBB' },
    { id: 'network', name: 'Network', percent: 25, color: '#A4CEFC' },
    { id: 'security', name: 'Security', percent: 25, color: '#FA7C7C' },
  ],
  health: [
    { id: 'erp', name: 'ERP System', meta: 'v4.2.1 - Global', status: 'Healthy' },
    { id: 'hris', name: 'HRIS Portal', meta: 'v1.9.4 - NA', status: 'Critical' },
    { id: 'crm', name: 'CRM Platform', meta: 'v2.1.0 - EMEA/APAC', status: 'Healthy' },
    { id: 'crm-2', name: 'CRM Platform', meta: 'v2.1.0 - EMEA/APAC', status: 'Healthy' },
  ],
};
