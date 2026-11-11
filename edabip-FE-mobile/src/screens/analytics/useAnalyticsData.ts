import { useCallback, useState } from 'react';

import { ANALYTICS_DATA, type AnalyticsData } from '@/screens/analytics/analyticsData';

export function useAnalyticsData() {
  const [data, setData] = useState<AnalyticsData>(ANALYTICS_DATA);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setData(ANALYTICS_DATA);
    } catch {
      setError('Unable to load analytics. Pull to try again.');
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
