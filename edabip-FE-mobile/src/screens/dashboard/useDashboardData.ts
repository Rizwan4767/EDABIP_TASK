import { useCallback, useState } from 'react';

import { DASHBOARD_DATA, type DashboardData } from '@/screens/dashboard/dashboardData';

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>(DASHBOARD_DATA);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setData(DASHBOARD_DATA);
    } catch {
      setError('Unable to load dashboard. Pull to try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return {
    data,
    isLoading: isRefreshing,
    error,
    reload,
  };
}
