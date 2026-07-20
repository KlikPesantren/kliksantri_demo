import { useCallback, useEffect, useMemo, useState } from 'react';
import { featuresApi } from '../api/features.api';
import { getUnitFeatureFallback } from '../utils/unitFeatures';

export const WALI_FEATURE_FALLBACK = getUnitFeatureFallback();

export function useWaliFeatures(activeChild = null) {
  const fallback = useMemo(
    () => getUnitFeatureFallback(activeChild),
    [activeChild],
  );
  const [features, setFeatures] = useState(fallback);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFeatures = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await featuresApi.getFeatures();
      setFeatures({
        ...fallback,
        ...(res.data || {}),
      });
    } catch {
      setFeatures(fallback);
      setError('Konfigurasi fitur belum dapat dimuat.');
    } finally {
      setIsLoading(false);
    }
  }, [fallback]);

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
