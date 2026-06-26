import api from './client';
import { ENDPOINTS } from '../constants/endpoints';

export const notificationsApi = {
  async getNotifications({ limit = 30, offset = 0, unreadOnly = false } = {}) {
    const res = await api.get(ENDPOINTS.NOTIFICATIONS, {
      params: {
        limit,
        offset,
        unread_only: unreadOnly ? 'true' : undefined,
      },
    });
    return res.data;
  },

  async getUnreadCount() {
    const res = await api.get(ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT);
    return res.data;
  },

  async markRead(id) {
    const res = await api.put(ENDPOINTS.NOTIFICATION_READ(id));
    return res.data;
  },

  async markAllRead() {
    const res = await api.put(ENDPOINTS.NOTIFICATIONS_READ_ALL);
    return res.data;
  },
};
