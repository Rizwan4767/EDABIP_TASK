import { useCallback, useEffect, useState } from 'react';

import { SALES_ANALYTICS_DATA, type SalesAnalyticsData } from '@/screens/powerbi/powerBiData';
import { getSalesAnalyticsData } from '@/services/api/powerbiApi';

export function usePowerBiAnalytics() {
  const [data, setData] = useState<SalesAnalyticsData>(SALES_ANALYTICS_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const next = await getSalesAnalyticsData();
        if (cancelled) return;
        setData(next);
        setError(null);
      } catch {
        if (!cancelled) {
          setError('Unable to load Power BI analytics. Pull to try again.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const reload = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      setData(await getSalesAnalyticsData());
    } catch {
      setError('Unable to load Power BI analytics. Pull to try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    reload,
  };
}
