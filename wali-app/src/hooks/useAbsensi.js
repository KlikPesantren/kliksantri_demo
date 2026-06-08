import { useState, useEffect, useCallback } from 'react';
import { absensiApi } from '../api/absensi.api';

export function useAbsensi(activeSantriId, bulan, tahun) {
  const [ringkasan, setRingkasan] = useState(null);
  const [riwayat, setRiwayat] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchAbsensi = useCallback(
    async ({ silent = false } = {}) => {
      if (!activeSantriId) return;

      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      setError(null);

      try {
        const res = await absensiApi.getAbsensi({ bulan, tahun });
        setRingkasan(res.ringkasan ?? null);
        setRiwayat(res.riwayat ?? []);
      } catch (err) {
        setError(
          err.response?.data?.error ??
            'Gagal memuat data absensi. Periksa koneksi Anda.'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
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
