const KPIS = {
  revenue: {
    value: '$2.84M',
    label: 'Total Revenue',
    change: '12.4 %',
    changeNote: 'vs last month',
  },
  customers: {
    value: '18,240',
    label: 'Total Customer',
    change: '5.2%',
    changeNote: 'vs last month',
    activeLabel: '94%',
    activeNote: 'Active Clients',
    activeProgress: 90,
  },
  reports: {
    value: '240',
    label: 'Generated Reports',
    badge: '45 Scheduled',
    rows: [
      { id: 'scheduled', label: 'Scheduled Reports', value: '45' },
      { id: 'pending', label: 'Pending Reports', value: '45' },
    ],
  },
  systemHealth: {
    value: '99.6%',
    label: 'All Systems Operational',
    badge: 'Healthy',
  },
};

const USER_STATS = [
  { id: 'growth', label: 'Total Growth', value: '8.4 %', tone: 'green' },
  { id: 'peak', label: 'Peak Day', value: 'Thursday' },
  { id: 'average', label: 'Daily Average', value: '85,811' },
  { id: 'updated', label: 'Updated', value: '2 mins ago' },
];

const SOURCE_STATS = [
  { id: 'total', label: 'Total Source', value: '28' },
  { id: 'healthy', label: 'Healthy', value: '22' },
  { id: 'warning', label: 'Warning', value: '4' },
  { id: 'inactive', label: 'Inactive', value: '28' },
];

const DATA_SOURCES = [
  { source: 'ERP System', status: 'Active', health: 95, sync: '2 mins ago', latency: '81 ms' },
  { source: 'CRM', status: 'Active', health: 95, sync: '2 mins ago', latency: '81 ms' },
  { source: 'HRMS', status: 'Active', health: 95, sync: '2 mins ago', latency: '81 ms' },
  { source: 'APIs', status: 'Inactive', health: 72, sync: '2 mins ago', latency: '81 ms' },
  { source: 'Cloud Systems', status: 'Active', health: 95, sync: '2 mins ago', latency: '81 ms' },
];

const SCHEDULED_REPORTS = [
  { id: 'sr-1', title: 'Monthly Finance Report', when: 'May 1st 2026 at 6 : 00 Am', status: 'Active' },
  { id: 'sr-2', title: 'Monthly Finance Report', when: 'May 1st 2026 at 6 : 00 Am', status: 'Active' },
  { id: 'sr-3', title: 'Monthly Finance Report', when: 'May 1st 2026 at 6 : 00 Am', status: 'Inactive' },
  { id: 'sr-4', title: 'Monthly Finance Report', when: 'May 1st 2026 at 6 : 00 Am', status: 'Active' },
];

// Rows are searched with Object.values(), so every field here is user-visible
// by design — do not add internal keys to these objects.
const RECENT_ACTIVITY = [
  { id: 'EDABIP-842', user: 'John Doe', module: 'Billing', action: 'Invoice Generated', time: '14:32', date: '05-05-2026', status: 'Active' },
  { id: 'EDABIP-842', user: 'Sarah Wong', module: 'Users', action: 'Permissions Updated', time: '15:12', date: '06-06-2026', status: 'Inactive' },
  { id: 'EDABIP-842', user: 'John Doe', module: 'Data Source (HRMS)', action: 'Sync Attempt', time: '16:52', date: '07-07-2026', status: 'Active' },
  { id: 'EDABIP-842', user: 'Sarah Wong', module: 'Billing', action: 'Exported CSV (Large)', time: '17:42', date: '08-08-2026', status: 'Active' },
  { id: 'EDABIP-842', user: 'John Doe', module: 'Data Source (HRMS)', action: 'Invoice Generated', time: '18:19', date: '09-09-2026', status: 'Active' },
];

const DASHBOARD_DATA = {
  kpis: KPIS,
  userStats: USER_STATS,
  sourceStats: SOURCE_STATS,
  dataSources: DATA_SOURCES,
  scheduledReports: SCHEDULED_REPORTS,
  recentActivity: RECENT_ACTIVITY,
};

export const getDashboardData = async () => {
  await new Promise((resolve) => setTimeout(resolve, 750));
  return DASHBOARD_DATA;
};
