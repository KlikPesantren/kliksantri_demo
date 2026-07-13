import { useState, useEffect, useCallback, useRef } from 'react';
import { sahriyahApi } from '../api/sahriyah.api';
import { getApiErrorMessage } from '../utils/apiError';

export function useSahriyah(activeSantriId) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const requestRef = useRef(0);

  const fetchList = useCallback(
    async ({ silent = false } = {}) => {
      if (!activeSantriId) return;
      const requestId = ++requestRef.current;

      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      setError(null);

      try {
        const res = await sahriyahApi.getList();
        if (requestId !== requestRef.current) return;
        setData(res.data ?? []);
      } catch (err) {
        if (requestId !== requestRef.current) return;
        setError(getApiErrorMessage(err, 'Gagal memuat data sahriyah. Silakan coba lagi.'));
      } finally {
        if (requestId === requestRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [activeSantriId]
  );

  // Reset + fetch ulang saat santri berganti
  useEffect(() => {
    setData([]);
    setError(null);
    fetchList({ silent: false });
  }, [fetchList]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh: () => fetchList({ silent: true }),
  };
}
