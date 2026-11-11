import { useCallback, useState } from 'react';

import { TABLEAU_DATA, type TableauData } from '@/screens/tableau/tableauData';

export function useTableauData() {
  const [data, setData] = useState<TableauData>(TABLEAU_DATA);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setData(TABLEAU_DATA);
    } catch {
      setError('Unable to load Tableau. Pull to try again.');
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
