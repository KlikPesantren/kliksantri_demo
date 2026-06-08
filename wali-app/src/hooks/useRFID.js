import { useState, useEffect, useCallback, useRef } from 'react';
import { rfidApi } from '../api/rfid.api';

const PAGE_LIMIT = 20;

export function useRFID(activeSantriId) {
  const [saldo, setSaldo] = useState(null);
  const [mutasi, setMutasi] = useState([]);
  const [total, setTotal] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingFirst, setIsLoadingFirst] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Guard: jangan trigger loadMore saat sudah fetch
  const isFetchingMore = useRef(false);

  const fetchAll = useCallback(
    async ({ silent = false } = {}) => {
      if (!activeSantriId) return;

      if (!silent) setIsLoadingFirst(true);
      else setIsRefreshing(true);

      setError(null);

      try {
        const [saldoRes, mutasiRes] = await Promise.all([
          rfidApi.getSaldo(),
          rfidApi.getMutasi({ limit: PAGE_LIMIT, offset: 0 }),
        ]);

        setSaldo(saldoRes.data ?? null);
        setMutasi(mutasiRes.data ?? []);
        setTotal(mutasiRes.pagination?.total ?? 0);
      } catch (err) {
        setError(
          err.response?.data?.error ??
            'Gagal memuat data RFID. Periksa koneksi Anda.'
        );
      } finally {
        setIsLoadingFirst(false);
        setIsRefreshing(false);
      }
    },
    [activeSantriId]
  );

  const loadMore = useCallback(async () => {
    if (isFetchingMore.current) return;
    if (mutasi.length >= total) return; // Semua data sudah di-load
    if (!activeSantriId) return;

    isFetchingMore.current = true;
    setIsLoadingMore(true);

    try {
      const res = await rfidApi.getMutasi({
        limit: PAGE_LIMIT,
        offset: mutasi.length,
      });
      const newItems = res.data ?? [];
      setMutasi((prev) => [...prev, ...newItems]);
      setTotal(res.pagination?.total ?? total);
    } catch {
      // load-more silently fails — user bisa scroll lagi untuk retry
    } finally {
      setIsLoadingMore(false);
      isFetchingMore.current = false;
    }
  }, [activeSantriId, mutasi.length, total]);

  const refresh = useCallback(() => fetchAll({ silent: true }), [fetchAll]);

  // Reset dan fetch ulang setiap kali santri aktif berganti
  useEffect(() => {
    setSaldo(null);
    setMutasi([]);
    setTotal(0);
    setError(null);
    fetchAll({ silent: false });
  }, [fetchAll]);

  const hasMore = mutasi.length < total;

  return {
    saldo,
    mutasi,
    total,
    hasMore,
    isLoadingFirst,
    isRefreshing,
    isLoadingMore,
    error,
    refresh,
    loadMore,
  };
}
