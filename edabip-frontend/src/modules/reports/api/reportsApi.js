const baseReports = [
  { name: 'Sales Performance Report', module: 'Sales', type: 'Scheduled', lastRun: 'May 31,2025 10:30 AM', owner: 'Anita Varma', status: 'Completed' },
  { name: 'Financial Summary Report', module: 'Financial', type: 'On Demand', lastRun: 'May 31,2025 9:19 AM', owner: 'Karan Mehta', status: 'Failed' },
  { name: 'Executive Overview Report', module: 'Executive', type: 'Scheduled', lastRun: 'May 31,2025 10:00 AM', owner: 'Rohith Shrma', status: 'Completed' },
  { name: 'Customer Insights Report', module: 'Customer', type: 'On Demand', lastRun: 'May 30,2025 04:30 PM', owner: 'Priya Nair', status: 'Completed' },
  { name: 'Operation Report', module: 'Operation', type: 'Scheduled', lastRun: 'May 30,2025 9:20 PM', owner: 'Vikram Singh', status: 'Completed' },
  { name: 'Inventory Analysis Report', module: 'Inventory', type: 'Scheduled', lastRun: 'May 20,2025 10:30 AM', owner: 'Anita Varma', status: 'Completed' },
  { name: 'Marketing Campaign Report', module: 'Marketing', type: 'On Demand', lastRun: 'May 29,2025 06:30 PM', owner: 'Karan Mehta', status: 'Completed' },
  { name: 'Risk Analysis Report', module: 'Risk', type: 'On Demand', lastRun: 'May 29,2025 13:30 PM', owner: 'Rohith Shrma', status: 'Completed' },
  { name: 'Risk Analysis Report', module: 'Risk', type: 'On Demand', lastRun: 'May 29,2025 13:30 PM', owner: 'Rohith Shrma', status: 'Completed' },
  { name: 'Risk Analysis Report', module: 'Risk', type: 'On Demand', lastRun: 'May 29,2025 13:30 PM', owner: 'Rohith Shrma', status: 'Completed' }
];

const activityData = Array.from({ length: 132 }, (_, i) => {
  const base = baseReports[i % baseReports.length];
  return {
    id: i + 1,
    ...base
  };
});

export const getReportsData = async () => {
  await new Promise((resolve) => setTimeout(resolve, 750));
  return {
    kpis: {
      totalReports: 24,
      completed: 18,
      failed: 3,
      scheduled: 8,
      avgRunTime: "02 : 35 mins"
    },
    activityData
  };
};