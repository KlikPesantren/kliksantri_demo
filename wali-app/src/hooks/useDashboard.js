import { useState, useEffect, useCallback } from 'react';
import { santriApi } from '../api/santri.api';

export function useDashboard(activeSantriId) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    if (!activeSantriId) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await santriApi.getDashboard();
      setData(res.data);
    } catch (err) {
      const msg =
        err.response?.data?.error ??
        'Gagal memuat data dashboard. Periksa koneksi Anda.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [activeSantriId]);

  // Fetch ulang setiap kali santri aktif berganti
  useEffect(() => {
    setData(null);
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchDashboard,
  };
}
