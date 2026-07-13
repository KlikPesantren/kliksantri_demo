import { useCallback, useEffect, useState } from 'react';
import { homeLinksApi } from '../api/homeLinks.api';

export function useHomeLinks() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHomeLinks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await homeLinksApi.getHomeLinks();
      setData(res.data || []);
    } catch {
      setData([]);
      setError('Gagal memuat tautan pesantren.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeLinks();
  }, [fetchHomeLinks]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchHomeLinks,
  };
}
