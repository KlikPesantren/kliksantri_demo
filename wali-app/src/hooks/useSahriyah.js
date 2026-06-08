import { useState, useEffect, useCallback } from 'react';
import { sahriyahApi } from '../api/sahriyah.api';

export function useSahriyah(activeSantriId) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchList = useCallback(
    async ({ silent = false } = {}) => {
      if (!activeSantriId) return;

      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      setError(null);

      try {
        const res = await sahriyahApi.getList();
        setData(res.data ?? []);
      } catch (err) {
        setError(
          err.response?.data?.error ??
            'Gagal memuat data sahriyah. Periksa koneksi Anda.'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
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
