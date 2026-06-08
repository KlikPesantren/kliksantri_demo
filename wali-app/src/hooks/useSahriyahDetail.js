import { useState, useEffect, useCallback } from 'react';
import { sahriyahApi } from '../api/sahriyah.api';

export function useSahriyahDetail(tagihanId) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(
    async ({ silent = false } = {}) => {
      if (!tagihanId) return;

      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      setError(null);

      try {
        const res = await sahriyahApi.getRiwayat(tagihanId);
        setData(res.data ?? []);
      } catch (err) {
        setError(
          err.response?.data?.error ??
            'Gagal memuat riwayat pembayaran.'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [tagihanId]
  );

  useEffect(() => {
    fetchDetail({ silent: false });
  }, [fetchDetail]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh: () => fetchDetail({ silent: true }),
  };
}
