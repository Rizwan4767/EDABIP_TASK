const MOCK_DATA = {
  systemUptime: '99.9%',
  activeIncidents: '12',
  avgResponseTime: '180MS',
  securityCompliance: '98%',
};

export function getOperationsAnalyticsData() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_DATA), 750);
  });
}
