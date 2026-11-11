const DAILY_TREND = [
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
];

const MONTHLY_REVENUE = [
  { month: 'Jan', value: 28, total: 45 },
  { month: 'Feb', value: 18, total: 20 },
  { month: 'Mar', value: 29, total: 45 },
  { month: 'Apr', value: 13, total: 42 },
  { month: 'May', value: 13, total: 52 },
  { month: 'Jun', value: 45, total: 48 },
  { month: 'Jul', value: 26, total: 28 },
  { month: 'Aug', value: 32, total: 50 },
  { month: 'Sep', value: 21, total: 38 },
  { month: 'Oct', value: 38, total: 55 },
  { month: 'Nov', value: 24, total: 44 },
  { month: 'Dec', value: 41, total: 60 },
];

const REGIONS = [
  { name: 'New York', value: '72K', x: 20, y: 38 },
  { name: 'San Francisco', value: '39K', x: 27, y: 45 },
  { name: 'Sydney', value: '25K', x: 78, y: 78 },
  { name: 'Singapore', value: '61K', x: 70, y: 61 },
];

const TOP_REPS = [
  { name: 'Sarah Jenkins', revenue: '$840k' },
  { name: 'Marcus Reed', revenue: '$720k' },
  { name: 'Emma Lin', revenue: '$695k' },
  { name: 'Sarah Jenkins', revenue: '$840k' },
  { name: 'Marcus Reed', revenue: '$720k' },
  { name: 'Emma Lin', revenue: '$695k' },
  { name: 'Sarah Jenkins', revenue: '$840k' },
];

const STATS = {
  totalRevenue: { value: '$4.2M', changeLabel: '+12% vs last month', trend: 'up' },
  salesGrowth: { value: '8.5%', changeLabel: '+10% vs last month', trend: 'up' },
  activeCustomers: { value: '1,250', changeLabel: '+45 new this week', trend: 'neutral' },
  profitMargin: { value: '24%', changeLabel: '-2% vs last quarter', trend: 'down' },
};

const SALES_ANALYTICS_DATA = {
  stats: STATS,
  dailyTrend: DAILY_TREND,
  monthlyRevenue: MONTHLY_REVENUE,
  regions: REGIONS,
  topReps: TOP_REPS,
};

export const getSalesAnalyticsData = async () => {
  await new Promise((resolve) => setTimeout(resolve, 750));
  return SALES_ANALYTICS_DATA;
};