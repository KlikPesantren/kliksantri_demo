import { useState, useEffect, useCallback, useRef } from 'react';
import { nilaiApi } from '../api/nilai.api';
import { getApiErrorMessage } from '../utils/apiError';

export function useNilai(activeSantriId, bulan, tahun) {
  const [data, setData] = useState([]);
  const [ringkasan, setRingkasan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Race condition guard — setiap santri/bulan/tahun change buat id baru
  const reqRef = useRef(0);

  const fetchNilai = useCallback(
    async ({ silent = false } = {}) => {
      if (!activeSantriId) return;

      const reqId = ++reqRef.current;

      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      setError(null);

      try {
        const res = await nilaiApi.getNilai({ bulan, tahun });

        if (reqId !== reqRef.current) return;

        setData(res.data ?? []);
        setRingkasan(res.ringkasan ?? null);
      } catch (err) {
        if (reqId !== reqRef.current) return;
        setError(getApiErrorMessage(err, 'Gagal memuat data nilai. Silakan coba lagi.'));
      } finally {
        if (reqId === reqRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [activeSantriId, bulan, tahun]
  );

  // Reset state penuh saat santri atau periode berubah
  useEffect(() => {
    setData([]);
    setRingkasan(null);
    setError(null);
    fetchNilai({ silent: false });
  }, [fetchNilai]);

  return {
    data,
    ringkasan,
    isLoading,
    isRefreshing,
    error,
    refresh: () => fetchNilai({ silent: true }),
  };
}
