import { useState, useEffect, useCallback, useRef } from 'react';
import { profilPesantrenApi } from '../api/profilPesantren.api';

export function useProfilPesantren() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const reqRef = useRef(0);

  const fetchProfil = useCallback(async ({ silent = false } = {}) => {
    const reqId = ++reqRef.current;

    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    setError(null);

    try {
      const res = await profilPesantrenApi.get();

      if (reqId !== reqRef.current) return;

      setData(res.data ?? null);
    } catch (err) {
      if (reqId !== reqRef.current) return;
      setError(
        err.response?.data?.error ??
          'Gagal memuat profil pesantren. Periksa koneksi Anda.'
      );
    } finally {
      if (reqId === reqRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
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
