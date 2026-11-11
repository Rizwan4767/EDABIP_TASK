import { useCallback, useEffect, useState } from 'react';

import { POWER_BI_REPORTS, type PowerBiReport } from '@/screens/powerbi/powerBiData';
import { getPowerBIReports } from '@/services/api/powerbiApi';

export function usePowerBiReports() {
  const [reports, setReports] = useState<PowerBiReport[]>(POWER_BI_REPORTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await getPowerBIReports();
        if (cancelled) return;
        setReports(POWER_BI_REPORTS);
        setError(null);
      } catch {
        if (!cancelled) {
          setError('Unable to load Power BI reports. Pull to try again.');
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
      await getPowerBIReports();
      setReports(POWER_BI_REPORTS);
    } catch {
      setError('Unable to load Power BI reports. Pull to try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return {
    reports,
    isLoading,
    isRefreshing,
    error,
    reload,
  };
}
