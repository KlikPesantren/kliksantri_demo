import { useState, useEffect, useCallback, useRef } from 'react';
import { pengumumanApi } from '../api/pengumuman.api';

export function usePengumuman() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const reqRef = useRef(0);

  const fetchList = useCallback(async ({ silent = false } = {}) => {
    const reqId = ++reqRef.current;

    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    setError(null);

    try {
      const res = await pengumumanApi.getList({ limit: 50 });

      if (reqId !== reqRef.current) return;

      setData(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      if (reqId !== reqRef.current) return;
      setError(
        err.response?.data?.error ??
          'Gagal memuat pengumuman. Periksa koneksi Anda.'
      );
    } finally {
      if (reqId === reqRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchList({ silent: false });
  }, [fetchList]);

  return {
    data,
    total,
    isLoading,
    isRefreshing,
    error,
    refresh: () => fetchList({ silent: true }),
  };
}
