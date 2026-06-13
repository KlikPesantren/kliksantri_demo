import { useState, useEffect, useCallback, useRef } from 'react';
import { profilPesantrenApi } from '../api/profilPesantren.api';
import { storage } from '../utils/storage';

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
          .savePesantrenBranding({
            nama_pesantren: profil.nama_pesantren,
            logo_url: profil.logo_url ?? null,
            alamat: profil.alamat ?? null,
            banner_url: profil.banner_url ?? null,
            banner_active: profil.banner_active !== false,
          })
          .catch(() => {});
      }
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
