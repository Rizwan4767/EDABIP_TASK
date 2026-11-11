import { useState, useEffect } from 'react';
import { getReportsData } from '../api/reportsApi.js';

export function useReportsData() {
  const [reportsInfo, setReportsInfo] = useState({
    kpis: {
      totalReports: 0,
      completed: 0,
      failed: 0,
      scheduled: 0,
      avgRunTime: "00 : 00 mins"
    },
    activityData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getReportsData().then((res) => {
      if (isMounted) {
        setReportsInfo(res);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return { reportsInfo, loading };
}
