const KPI_CARDS = [
  {
    id: 'total-customers',
    label: 'Total Customers',
    value: '1,24,592',
    icon: 'bar-graph',
    spark: 'graph',
    badge: { type: 'positive', icon: 'up-black', text: '+12% vs last month' },
  },
  {
    id: 'churn-rate',
    label: 'Churn Rate (30D)',
    value: '2.4%',
    icon: 'arrow-graph',
    spark: 'line-graph',
    badge: { type: 'negative', icon: 'down-black', text: '+0.3% vs last month' },
  },
  {
    id: 'avg-order-value',
    label: 'Avg Order Value',
    value: '$142.50',
    icon: 'customers-tile',
    spark: 'graph',
    badge: { type: 'info', icon: 'up-black', text: '+45 new this week' },
  },
  {
    id: 'est-clv',
    label: 'EST.CLV',
    value: '$1,284%',
    icon: 'timer',
    spark: 'graph',
    badge: { type: 'positive',  text: '+8.1% vs last quarter' },
  },
];

const RETENTION_POINTS = [
  { month: 'Jan', value: 24 },
  { month: 'Feb', value: 20 },
  { month: 'Mar', value: 35 },
  { month: 'Apr', value: 29 },
  { month: 'May', value: 55 },
  { month: 'Jun', value: 50 },
  { month: 'Jul', value: 79 },
  { month: 'Aug', value: 83 },
  { month: 'Sep', value: 90 },
];

const ACQUISITION_BARS = [
  { key: 'Org', value: 47, displayValue: '59,000', color: '#a0bce8' },
  { key: 'Paid', value: 40, displayValue: '55,000', color: '#7dbbff' },
  { key: 'Ref', value: 30, displayValue: '45,000', color: '#6be6d3' },
  { key: 'Soc', value: 19, displayValue: '22,000', color: '#b899eb' },
];

const SEGMENTS = [
  { label: 'ENT', value: 50, color: '#134b4a' },
  { label: 'MID', value: 25, color: '#3e9593' },
  { label: 'SMB', value: 25, color: '#77fffd' },
];

const CUSTOMER_ANALYTICS_DATA = {
  kpis: KPI_CARDS,
  retention: RETENTION_POINTS,
  acquisition: ACQUISITION_BARS,
  segments: SEGMENTS,
  segmentsCenterValue: 45,
  lastRefreshed: '2h ago',
};

export const getCustomerAnalyticsData = async () => {
  await new Promise((resolve) => setTimeout(resolve, 750)); // matches billingApi.js
  return CUSTOMER_ANALYTICS_DATA;
};