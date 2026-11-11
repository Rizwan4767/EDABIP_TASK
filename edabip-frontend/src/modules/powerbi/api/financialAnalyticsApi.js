const MOCK_DATA = {
  totalRevenue: '$4.2M',
  netProfit: '$1.1M',
  operatingExpenses: '$3.1M',
  cashFlow: '$890K',
};

export function getFinancialAnalyticsData() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_DATA), 750);
  });
}
