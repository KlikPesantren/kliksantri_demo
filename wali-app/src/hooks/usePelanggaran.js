import { useState, useEffect, useCallback, useRef } from 'react';
import { pelanggaranApi } from '../api/pelanggaran.api';

export function usePelanggaran(activeSantriId) {
  const [data, setData] = useState([]);
  const [ringkasan, setRingkasan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Guard against race condition: store latest request id
  const reqRef = useRef(0);

  const fetchPelanggaran = useCallback(
    async ({ silent = false } = {}) => {
      if (!activeSantriId) return;

      const reqId = ++reqRef.current;

      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      setError(null);

      try {
        const res = await pelanggaranApi.getPelanggaran({ limit: 50 });

        // Abandon stale responses from previous santri
        if (reqId !== reqRef.current) return;

        setData(res.data ?? []);
        setRingkasan(res.ringkasan ?? null);
      } catch (err) {
        if (reqId !== reqRef.current) return;
        setError(
          err.response?.data?.error ??
            'Gagal memuat data pelanggaran. Periksa koneksi Anda.'
        );
      } finally {
        if (reqId === reqRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [activeSantriId]
  );

  // Reset state saat santri berubah, lalu fetch ulang
  useEffect(() => {
    setData([]);
    setRingkasan(null);
    setError(null);
    fetchPelanggaran({ silent: false });
  }, [fetchPelanggaran]);

  return {
    data,
    ringkasan,
    isLoading,
    isRefreshing,
    error,
    refresh: () => fetchPelanggaran({ silent: true }),
  };
}
