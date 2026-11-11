import type { ImageSourcePropType } from 'react-native';

import {
  ActivityShareIcon,
  KpiActiveProjectsIcon,
  KpiCustomerInsightsIcon,
  KpiCustomersIcon,
  KpiFolderIcon,
  KpiIncidentsIcon,
  KpiProfitIcon,
  KpiRevenueIcon,
  KpiSalesPerformanceIcon,
  KpiUptimeIcon,
  SparklineDownIcon,
  SparklineUpIcon,
} from '@/assets/tableau';

export type TableauKpiId = 'revenue' | 'profit' | 'customers' | 'projects' | 'incidents' | 'uptime';

export type TableauCategoryTone = 'executive' | 'sales' | 'finance' | 'customer' | 'operations';

export interface TableauKpi {
  id: TableauKpiId;
  title: string;
  value: string;
  change: string;
  changeNote: string;
  positive: boolean;
  icon: ImageSourcePropType;
}

export interface TableauTrendPoint {
  month: string;
  value: number;
}

export interface TableauCategorySlice {
  id: string;
  name: string;
  amount: number;
  color: string;
}

export interface TableauForecastPoint {
  month: string;
  thisMonth: number;
  lastMonth: number;
}

export interface TableauMatrixItem {
  id: string;
  label: string;
  value: string;
  change: string;
  positive: boolean;
  spark: ImageSourcePropType;
}

export interface TableauActivityItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  icon: ImageSourcePropType;
}

export interface TableauDashboardRow {
  id: string;
  name: string;
  category: string;
  tone: TableauCategoryTone;
  updated: string;
  views: string;
}

export interface TableauData {
  kpis: TableauKpi[];
  trend: TableauTrendPoint[];
  categories: TableauCategorySlice[];
  forecast: TableauForecastPoint[];
  matrix: TableauMatrixItem[];
  recentActivity: TableauActivityItem[];
  dashboards: TableauDashboardRow[];
}

/**
 * Design data transcribed from the mobile Tableau Figma screen and the web
 * Tableau visualization. Replaced by `tableauApi` once the backend router
 * exists — do not treat this as a live contract.
 */
export const TABLEAU_DATA: TableauData = {
  kpis: [
    {
      id: 'revenue',
      title: 'Total Revenue',
      value: '$123.8M',
      change: '12.4%',
      changeNote: 'vs last month',
      positive: true,
      icon: KpiRevenueIcon,
    },
    {
      id: 'profit',
      title: 'Total Profit',
      value: '$48.2M',
      change: '8.7%',
      changeNote: 'vs last month',
      positive: true,
      icon: KpiProfitIcon,
    },
    {
      id: 'customers',
      title: 'Total Customers',
      value: '12,863',
      change: '6.3%',
      changeNote: 'vs last month',
      positive: true,
      icon: KpiCustomersIcon,
    },
    {
      id: 'projects',
      title: 'Active Projects',
      value: '86',
      change: '4.0%',
      changeNote: 'vs last month',
      positive: true,
      icon: KpiActiveProjectsIcon,
    },
    {
      id: 'incidents',
      title: 'Open Incidents',
      value: '23',
      change: '18.2%',
      changeNote: 'vs last month',
      positive: false,
      icon: KpiIncidentsIcon,
    },
    {
      id: 'uptime',
      title: 'System Uptime',
      value: '99.92%',
      change: '0.02%',
      changeNote: 'vs last month',
      positive: true,
      icon: KpiUptimeIcon,
    },
  ],
  trend: [
    { month: 'Jan', value: 28 },
    { month: 'Feb', value: 35 },
    { month: 'Mar', value: 31 },
    { month: 'Apr', value: 48 },
    { month: 'May', value: 55 },
    { month: 'Jun', value: 51 },
    { month: 'Jul', value: 63 },
    { month: 'Aug', value: 75 },
    { month: 'Sep', value: 81 },
  ],
  categories: [
    { id: 'sales', name: 'Sales', amount: 56.7, color: '#134B4A' },
    { id: 'services', name: 'Services', amount: 31.8, color: '#5BA8A3' },
    { id: 'products', name: 'Products', amount: 23.6, color: '#3EE0E8' },
    { id: 'subscriptions', name: 'Subscriptions', amount: 13.6, color: '#C4E85A' },
  ],
  forecast: [
    { month: 'Jan', thisMonth: 23000, lastMonth: 65000 },
    { month: 'Feb', thisMonth: 22000, lastMonth: 40000 },
    { month: 'Mar', thisMonth: 48000, lastMonth: 51000 },
    { month: 'Apr', thisMonth: 73000, lastMonth: 82000 },
    { month: 'May', thisMonth: 46000, lastMonth: 81000 },
    { month: 'Jun', thisMonth: 28000, lastMonth: 42000 },
    { month: 'Jul', thisMonth: 35000, lastMonth: 58000 },
  ],
  matrix: [
    {
      id: 'margin',
      label: 'Gross Margin',
      value: '22.6%',
      change: '2.4%',
      positive: true,
      spark: SparklineUpIcon,
    },
    {
      id: 'retention',
      label: 'Customer Retention',
      value: '22.6%',
      change: '1.2%',
      positive: true,
      spark: SparklineUpIcon,
    },
    {
      id: 'deal',
      label: 'Avg. Deal Size',
      value: '15.7K',
      change: '2.4%',
      positive: true,
      spark: SparklineUpIcon,
    },
    {
      id: 'cost',
      label: 'Cost to Serve',
      value: '2.18K',
      change: '1.8%',
      positive: false,
      spark: SparklineDownIcon,
    },
  ],
  recentActivity: [
    {
      id: 'sales',
      title: 'Sales Performance Dashboard',
      subtitle: 'Viewed by Anita Jones',
      time: '10:20 AM',
      icon: KpiSalesPerformanceIcon,
    },
    {
      id: 'finance',
      title: 'Financial Summary Dashboard',
      subtitle: 'Viewed by Karan Mehta',
      time: '10:20 AM',
      icon: KpiFolderIcon,
    },
    {
      id: 'executive',
      title: 'Executive Overview Dashboard',
      subtitle: 'Viewed by Priya Nair',
      time: '09:45 AM',
      icon: ActivityShareIcon,
    },
    {
      id: 'customer',
      title: 'Customer Insights Dashboard',
      subtitle: 'Viewed by Rohit Sharma',
      time: '09:12 AM',
      icon: KpiCustomerInsightsIcon,
    },
  ],
  dashboards: [
    {
      id: 'executive',
      name: 'Executive Overview',
      category: 'Executive',
      tone: 'executive',
      updated: 'May 31, 2025',
      views: '12.4k views',
    },
    {
      id: 'sales',
      name: 'Sales Performance',
      category: 'Sales',
      tone: 'sales',
      updated: 'Jun 30, 2025',
      views: '9.8k views',
    },
    {
      id: 'finance',
      name: 'Financial Summary',
      category: 'Finance',
      tone: 'finance',
      updated: 'Jul 31, 2025',
      views: '8.1k views',
    },
    {
      id: 'customer',
      name: 'Customer Insights',
      category: 'Customer',
      tone: 'customer',
      updated: 'Aug 31, 2025',
      views: '7.2k views',
    },
    {
      id: 'operations',
      name: 'Operations Dashboard',
      category: 'Operations',
      tone: 'operations',
      updated: 'Sep 30, 2025',
      views: '6.5k views',
    },
  ],
};
