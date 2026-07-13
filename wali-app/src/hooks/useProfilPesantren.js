import { useState, useEffect, useCallback, useRef } from 'react';
import { profilPesantrenApi } from '../api/profilPesantren.api';
import { normalizeBrandingCache } from '../utils/branding';
import { storage } from '../utils/storage';
import { getApiErrorMessage } from '../utils/apiError';

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

      const profil = res.data ?? null;
      setData(profil);
      if (profil?.nama_pesantren) {
        storage
          .savePesantrenBranding(normalizeBrandingCache(profil))
          .catch(() => {});
      }
    } catch (err) {
      if (reqId !== reqRef.current) return;
      try {
        const cached = await storage.getPesantrenBranding();
        if (cached?.nama_pesantren) {
          setData(cached);
        }
      } catch {
        // ignore cache read errors
      }
      setError(getApiErrorMessage(err, 'Gagal memuat profil pesantren. Silakan coba lagi.'));
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
