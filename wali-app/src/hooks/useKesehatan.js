import { useState, useEffect, useCallback, useRef } from 'react';
import { kesehatanApi } from '../api/kesehatan.api';

export function useKesehatan(activeSantriId) {
  const [current, setCurrent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const reqRef = useRef(0);

  const fetchKesehatan = useCallback(async ({ silent = false } = {}) => {
    if (!activeSantriId) return;

    const reqId = ++reqRef.current;
    if (!silent) setIsLoading(true);
    setError(null);

    try {
      const res = await kesehatanApi.getKesehatan();
      if (reqId !== reqRef.current) return;
      setCurrent(res.current ?? null);
      setTimeline(res.timeline ?? []);
    } catch (err) {
      if (reqId !== reqRef.current) return;
      setError(
        err.response?.data?.error ??
          'Gagal memuat data kesehatan. Periksa koneksi Anda.'
      );
    } finally {
      if (reqId === reqRef.current) {
        setIsLoading(false);
      }
    }
  }, [activeSantriId]);

  useEffect(() => {
    setCurrent(null);
    setTimeline([]);
    setError(null);
    fetchKesehatan({ silent: false });
  }, [fetchKesehatan]);

  return {
    current,
    timeline,
    isLoading,
    error,
    refresh: () => fetchKesehatan({ silent: true }),
  };
}
