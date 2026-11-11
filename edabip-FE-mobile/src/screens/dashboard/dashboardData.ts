export type SourceStatus = 'Active' | 'Inactive';
export type ActivityModule = 'Billing' | 'Users' | 'Data Source' | 'Marketing';

export interface DashboardKpis {
  revenue: { value: string; label: string; change: string; changeNote: string };
  customers: { value: string; label: string; change: string; changeNote: string };
  reports: { value: string; label: string; badge: string };
  systemHealth: { value: string; label: string; badge: string };
}

export interface UserStat {
  id: 'growth' | 'peak' | 'average' | 'updated';
  label: string;
  value: string;
  tone?: 'green';
}

export interface SourceStat {
  id: 'total' | 'healthy' | 'warning' | 'inactive';
  label: string;
  value: string;
}

export interface DataSource {
  source: string;
  status: SourceStatus;
  health: number;
  healthLabel: string;
  refreshed: string;
}

export interface ProductInsight {
  id: string;
  title: string;
  when: string;
  status: SourceStatus;
}

export interface ActivityRow {
  id: string;
  title: string;
  user: string;
  module: ActivityModule;
  action: string;
  when: string;
  status: SourceStatus;
}

export interface RevenuePoint {
  month: string;
  value: number;
}

export interface ActiveUserPoint {
  day: string;
  value: number;
}

export interface DashboardData {
  kpis: DashboardKpis;
  revenueForecast: RevenuePoint[];
  activeUsers: ActiveUserPoint[];
  userStats: UserStat[];
  sourceStats: SourceStat[];
  dataSources: DataSource[];
  productInsights: ProductInsight[];
  recentActivity: ActivityRow[];
}

/**
 * Design data transcribed from the mobile Figma dashboard (node 149:28) and
 * the matching web dashboard mock. Replaced by `dashboardApi` once the backend
 * router exists — do not treat this as a live contract.
 */
export const DASHBOARD_DATA: DashboardData = {
  kpis: {
    revenue: {
      value: '$2.84M',
      label: 'Total Revenue',
      change: '12.4 %',
      changeNote: 'vs last month',
    },
    customers: {
      value: '18,240',
      label: 'Total Customers',
      change: '5.2 %',
      changeNote: 'vs last month',
    },
    reports: {
      value: '240',
      label: 'Total Reports',
      badge: '45 Scheduled',
    },
    systemHealth: {
      value: '99.6%',
      label: 'All Systems Operational',
      badge: 'Healthy',
    },
  },
  revenueForecast: [
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
  activeUsers: [
    { day: 'Sun', value: 50000 },
    { day: 'Mon', value: 69749 },
    { day: 'Tue', value: 34910 },
    { day: 'Wed', value: 59101 },
    { day: 'Thu', value: 85811 },
    { day: 'Fri', value: 71311 },
    { day: 'Sat', value: 47590 },
  ],
  userStats: [
    { id: 'growth', label: 'Total Growth', value: '8.4 %', tone: 'green' },
    { id: 'peak', label: 'Peak Day', value: 'Thursday' },
    { id: 'average', label: 'Daily Average', value: '85,811' },
    { id: 'updated', label: 'Updated', value: '2 mins ago' },
  ],
  sourceStats: [
    { id: 'total', label: 'Total Source', value: '28' },
    { id: 'healthy', label: 'Healthy', value: '22' },
    { id: 'warning', label: 'Warning', value: '4' },
    { id: 'inactive', label: 'Inactive', value: '2' },
  ],
  dataSources: [
    {
      source: 'ERP System',
      status: 'Active',
      health: 95,
      healthLabel: 'Optimal Performance',
      refreshed: 'Last Refreshed: 2h ago',
    },
    {
      source: 'CRM',
      status: 'Active',
      health: 95,
      healthLabel: 'Optimal Performance',
      refreshed: 'Last Refreshed: 2h ago',
    },
    {
      source: 'APIs',
      status: 'Inactive',
      health: 95,
      healthLabel: 'Attention Required',
      refreshed: 'Last Refreshed: 2h ago',
    },
  ],
  productInsights: [
    {
      id: 'pi-1',
      title: 'Monthly Finance Report',
      when: 'May 1st 2026 at 6 : 00 Am',
      status: 'Active',
    },
    {
      id: 'pi-2',
      title: 'Monthly Finance Report',
      when: 'May 1st 2026 at 6 : 00 Am',
      status: 'Inactive',
    },
    {
      id: 'pi-3',
      title: 'Monthly Finance Report',
      when: 'May 1st 2026 at 6 : 00 Am',
      status: 'Active',
    },
  ],
  recentActivity: [
    {
      id: 'EDABIP-842',
      title: 'EDABIP-842',
      user: 'John Doe',
      module: 'Billing',
      action: 'Invoice Generated',
      when: 'Jan 6, 2025 12:30 AM',
      status: 'Inactive',
    },
    {
      id: 'EDABIP-843',
      title: 'EDABIP-842',
      user: 'Sarah Wong',
      module: 'Users',
      action: 'Permissions Updated',
      when: 'May 31, 2025 10:30 AM',
      status: 'Active',
    },
    {
      id: 'EDABIP-844',
      title: 'EDABIP-842',
      user: 'John Doe',
      module: 'Data Source',
      action: 'Sync Attempt',
      when: 'Oct 4, 2025 9:00 AM',
      status: 'Active',
    },
    {
      id: 'EDABIP-845',
      title: 'EDABIP-842',
      user: 'Sarah Wong',
      module: 'Billing',
      action: 'Exported CSV (Large)',
      when: 'Jun 23, 2025 6:30 PM',
      status: 'Active',
    },
    {
      id: 'EDABIP-846',
      title: 'EDABIP-842',
      user: 'John Doe',
      module: 'Data Source',
      action: 'Invoice Generated',
      when: 'Nov 3, 2025 5:30 PM',
      status: 'Active',
    },
    {
      id: 'EDABIP-847',
      title: 'Inventory Analysis Report',
      user: 'Anita Varma',
      module: 'Marketing',
      action: 'Scheduled',
      when: 'Nov 3, 2025 5:30 PM',
      status: 'Active',
    },
  ],
};
