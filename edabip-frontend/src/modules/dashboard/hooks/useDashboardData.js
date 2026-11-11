import { useCallback, useEffect, useState } from 'react';
import { getDashboardData } from '../api/dashboardApi.js';

const EMPTY_DASHBOARD = {
  kpis: null,
  userStats: [],
  sourceStats: [],
  dataSources: [],
  scheduledReports: [],
  recentActivity: [],
};

export function useDashboardData() {
  const [data, setData] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const next = await getDashboardData();
      setData(next);
    } catch {
      setError('Unable to load dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');
    getDashboardData()
      .then((next) => {
        if (active) setData(next);
      })
      .catch(() => {
        if (active) setError('Unable to load dashboard. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    reload: load,
  };
}
