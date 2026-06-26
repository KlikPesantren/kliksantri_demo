import { useCallback, useEffect, useState } from 'react';
import { notificationsApi } from '../api/notifications.api';

export function useNotifications({ limit = 30 } = {}) {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setIsLoading(true);
      setError('');
      const res = await notificationsApi.getNotifications({ limit, offset: 0 });
      setItems(res.data || []);
      setUnreadCount(Number(res.unread_count || 0));
    } catch (err) {
      console.warn('[notifications] gagal memuat:', err?.message || err);
      setError('Gagal memuat notifikasi.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [limit]);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await notificationsApi.getUnreadCount();
      setUnreadCount(Number(res.unread_count || 0));
    } catch (err) {
      console.warn('[notifications] gagal memuat jumlah:', err?.message || err);
    }
  }, []);

  const markRead = useCallback(async (id) => {
    await notificationsApi.markRead(id);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, read_at: item.read_at || new Date().toISOString() } : item,
      ),
    );
    setUnreadCount((prev) => Math.max(prev - 1, 0));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllRead();
    const now = new Date().toISOString();
    setItems((prev) => prev.map((item) => ({ ...item, read_at: item.read_at || now })));
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    items,
    unreadCount,
    isLoading,
    error,
    refresh,
    refreshUnreadCount,
    markRead,
    markAllRead,
  };
}
