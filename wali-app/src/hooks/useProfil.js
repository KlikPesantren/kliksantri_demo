import { useState, useEffect, useCallback } from 'react';
import { santriApi } from '../api/santri.api';

export function useProfil(activeSantriId) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfil = useCallback(
    async ({ silent = false } = {}) => {
      if (!activeSantriId) return;

      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      setError(null);

      try {
        const res = await santriApi.getProfil();
        setData(res.data ?? null);
      } catch (err) {
        setError(
          err.response?.data?.error ??
            'Gagal memuat profil santri. Periksa koneksi Anda.'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeSantriId]
  );

  useEffect(() => {
    setData(null);
    setError(null);
    fetchProfil({ silent: false });
  }, [fetchProfil]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh: () => fetchProfil({ silent: true }),
  };
}
