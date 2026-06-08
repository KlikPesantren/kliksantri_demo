import { useState, useEffect, useCallback } from 'react';
import { perizinanApi } from '../api/perizinan.api';

export function usePerizinan(activeSantriId) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchPerizinan = useCallback(
    async ({ silent = false } = {}) => {
      if (!activeSantriId) return;

      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      setError(null);

      try {
        const res = await perizinanApi.getPerizinan({ limit: 50 });
        setData(res.data ?? []);
        setTotal(res.pagination?.total ?? 0);
      } catch (err) {
        setError(
          err.response?.data?.error ??
            'Gagal memuat data perizinan. Periksa koneksi Anda.'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeSantriId]
  );

  useEffect(() => {
    setData([]);
    setTotal(0);
    setError(null);
    fetchPerizinan({ silent: false });
  }, [fetchPerizinan]);

  return {
    data,
    total,
    isLoading,
    isRefreshing,
    error,
    refresh: () => fetchPerizinan({ silent: true }),
  };
}
