import { useState, useEffect, useCallback, useRef } from 'react';
import { hafalanApi } from '../api/hafalan.api';

export function useHafalan(activeSantriId, bulan, tahun) {
  const [data, setData] = useState([]);
  const [ringkasan, setRingkasan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const reqRef = useRef(0);

  const fetchHafalan = useCallback(
    async ({ silent = false } = {}) => {
      if (!activeSantriId) return;

      const reqId = ++reqRef.current;

      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      setError(null);

      try {
        const res = await hafalanApi.getHafalan({ bulan, tahun });

        if (reqId !== reqRef.current) return;

        setData(res.data ?? []);
        setRingkasan(res.ringkasan ?? null);
      } catch (err) {
        if (reqId !== reqRef.current) return;
        setError(
          err.response?.data?.error ??
            'Gagal memuat data hafalan. Periksa koneksi Anda.'
        );
      } finally {
        if (reqId === reqRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [activeSantriId, bulan, tahun]
  );

  useEffect(() => {
    setData([]);
    setRingkasan(null);
    setError(null);
    fetchHafalan({ silent: false });
  }, [fetchHafalan]);

  return {
    data,
    ringkasan,
    isLoading,
    isRefreshing,
    error,
    refresh: () => fetchHafalan({ silent: true }),
  };
}
