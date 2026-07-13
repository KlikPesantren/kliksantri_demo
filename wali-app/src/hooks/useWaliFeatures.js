import { useCallback, useEffect, useState } from 'react';
import { featuresApi } from '../api/features.api';

export const WALI_FEATURE_FALLBACK = {
  absensi: true,
  nilai: true,
  hafalan: true,
  perizinan: true,
  pelanggaran: true,
  kesehatan: true,
  sahriyah: true,
  rfid: false,
  pengumuman: true,
};

export function useWaliFeatures() {
  const [features, setFeatures] = useState(WALI_FEATURE_FALLBACK);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFeatures = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await featuresApi.getFeatures();
      setFeatures({
        ...WALI_FEATURE_FALLBACK,
        ...(res.data || {}),
      });
    } catch {
      setFeatures(WALI_FEATURE_FALLBACK);
      setError('Konfigurasi fitur belum dapat dimuat.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  return {
    features,
    isLoading,
    error,
    refresh: fetchFeatures,
  };
}
