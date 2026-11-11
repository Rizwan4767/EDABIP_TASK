import { useCallback, useState } from 'react';

import { REPORTS_DATA, type ReportsData } from '@/screens/reports/reportsData';

export function useReportsData() {
  const [data, setData] = useState<ReportsData>(REPORTS_DATA);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setData(REPORTS_DATA);
    } catch {
      setError('Unable to load reports. Pull to try again.');
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
