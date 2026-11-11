export type ReportStatus = 'Completed' | 'Failed' | 'Scheduled';
export type TriggerType = 'Scheduled' | 'On Demand';
export type ReportCategory =
  'Sales' | 'Financial' | 'Executive' | 'Customer' | 'Inventory' | 'Marketing';

export interface KpiTrend {
  value: string;
  direction: 'up' | 'down';
  note: string;
}

export interface ReportsKpis {
  totalReports: { value: string; label: string; trend: KpiTrend };
  completed: { value: string; label: string; trend: KpiTrend };
  avgRunTime: { value: string; label: string; subtitle?: string };
  failed: { value: string; label: string; trend: KpiTrend };
  scheduled: { value: string; label: string; trend: KpiTrend };
}

/** Shape of a single KPI card, derived from `ReportsKpis` so it can never drift out of sync. */
export type ReportsKpi = ReportsKpis[keyof ReportsKpis];

export interface DemandPoint {
  day: string;
  value: number;
  color: string;
}

export interface StatusSlice {
  id: ReportStatus;
  label: string;
  value: number;
  color: string;
}

export interface ReportTemplate {
  id: string;
  title: string;
  when: string;
}

export interface RecentReport {
  id: string;
  title: string;
  subtitle: string;
  status: ReportStatus;
}

export interface ActivityRow {
  id: string;
  title: string;
  when: string;
  author: string;
  trigger: TriggerType;
  category: ReportCategory;
  status: ReportStatus;
}

export interface ReportsData {
  kpis: ReportsKpis;
  demandPrediction: DemandPoint[];
  statusBreakdown: StatusSlice[];
  templates: ReportTemplate[];
  recentReports: RecentReport[];
  recentActivity: ActivityRow[];
}

/**
 * Design data transcribed from the mobile Figma reports screen and the
 * matching web reports mock. Replaced by `reportsApi` once the backend
 * router exists — do not treat this as a live contract.
 */
export const REPORTS_DATA: ReportsData = {
  kpis: {
    totalReports: {
      value: '24',
      label: 'Total Reports',
      trend: { value: '+14', direction: 'up', note: 'vs 30 last days' },
    },
    completed: {
      value: '18',
      label: 'Completed',
      trend: { value: '+12%', direction: 'up', note: 'vs 30 last days' },
    },
    avgRunTime: {
      value: '02:35 Mins',
      label: 'Avg, Run Time',
      subtitle: 'Total Revenue',
    },
    failed: {
      value: '03',
      label: 'Failed',
      trend: { value: '+25%', direction: 'down', note: 'vs 30 last days' },
    },
    scheduled: {
      value: '08',
      label: 'Scheduled',
      trend: { value: '+6%', direction: 'up', note: 'vs 30 last days' },
    },
  },
  demandPrediction: [
    { day: 'Mon', value: 23000, color: '#A0F0E4' },
    { day: 'Fri', value: 35000, color: '#D8BFF2' },
    { day: 'Sat', value: 95000, color: '#3D605D' },
    { day: 'Sun', value: 60000, color: '#F2AFB1' },
  ],
  statusBreakdown: [
    { id: 'Completed', label: 'Completed', value: 75, color: '#67C5C2' },
    { id: 'Scheduled', label: 'Scheduled', value: 11, color: '#B4D8FF' },
    { id: 'Failed', label: 'Failed', value: 13, color: '#FC888A' },
  ],
  templates: [
    { id: 'tpl-1', title: 'Financial Report Template', when: 'Use 14 Min ago' },
    { id: 'tpl-2', title: 'Financial Report Template', when: 'Use 14 Min ago' },
    { id: 'tpl-3', title: 'Financial Report Template', when: 'Use 14 Min ago' },
  ],
  recentReports: [
    {
      id: 'rr-1',
      title: 'Sales Performance Report',
      subtitle: 'Sales Performance Report',
      status: 'Completed',
    },
    {
      id: 'rr-2',
      title: 'Financial Summary Report',
      subtitle: 'May 1st 2026 at 6 : 00 Am',
      status: 'Completed',
    },
    {
      id: 'rr-3',
      title: 'Executive Overview Report',
      subtitle: 'May 1st 2026 at 6 : 00 Am',
      status: 'Completed',
    },
  ],
  recentActivity: [
    {
      id: 'act-1',
      title: 'Sales Performance Report',
      when: 'May 31,2025 10:30 AM',
      author: 'Anita Varma',
      trigger: 'Scheduled',
      category: 'Sales',
      status: 'Completed',
    },
    {
      id: 'act-2',
      title: 'Financial Summary Report',
      when: 'May 31,2025 9:19 AM',
      author: 'Karan Mehta',
      trigger: 'On Demand',
      category: 'Financial',
      status: 'Failed',
    },
    {
      id: 'act-3',
      title: 'Executive Overview Report',
      when: 'May 31,2025 10:00 AM',
      author: 'Rohith Shrma',
      trigger: 'On Demand',
      category: 'Executive',
      status: 'Completed',
    },
    {
      id: 'act-4',
      title: 'Customer Insights Report',
      when: 'May 30,2025 04:30 PM',
      author: 'Priya Nair',
      trigger: 'On Demand',
      category: 'Customer',
      status: 'Completed',
    },
    {
      id: 'act-5',
      title: 'Operation Report',
      when: 'May 30,2025 9:20 PM',
      author: 'Vikram Singh',
      trigger: 'Scheduled',
      category: 'Inventory',
      status: 'Completed',
    },
    {
      id: 'act-6',
      title: 'Inventory Analysis Report',
      when: 'May 20,2025 10:30 AM',
      author: 'Anita Varma',
      trigger: 'Scheduled',
      category: 'Marketing',
      status: 'Completed',
    },
  ],
};
