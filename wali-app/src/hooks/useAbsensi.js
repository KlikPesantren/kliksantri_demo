import { useState, useEffect, useCallback, useRef } from 'react';
import { absensiApi } from '../api/absensi.api';
import { getApiErrorMessage } from '../utils/apiError';

export function useAbsensi(activeSantriId, bulan, tahun) {
  const [ringkasan, setRingkasan] = useState(null);
  const [riwayat, setRiwayat] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const reqRef = useRef(0);

  const fetchAbsensi = useCallback(
    async ({ silent = false } = {}) => {
      if (!activeSantriId) return;

      const reqId = ++reqRef.current;

      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      setError(null);

      try {
        const res = await absensiApi.getAbsensi({ bulan, tahun });

        if (reqId !== reqRef.current) return;

        setRingkasan(res.ringkasan ?? null);
        setRiwayat(res.riwayat ?? []);
      } catch (err) {
        if (reqId !== reqRef.current) return;
        setError(getApiErrorMessage(err, 'Gagal memuat data absensi. Silakan coba lagi.'));
      } finally {
        if (reqId === reqRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [activeSantriId, bulan, tahun]
  );

  // Reset dan fetch ulang saat santri atau bulan/tahun berubah
  useEffect(() => {
    setRingkasan(null);
    setRiwayat([]);
    setError(null);
    fetchAbsensi({ silent: false });
  }, [fetchAbsensi]);

  return {
    ringkasan,
    riwayat,
    isLoading,
    isRefreshing,
    error,
    refresh: () => fetchAbsensi({ silent: true }),
  };
}
