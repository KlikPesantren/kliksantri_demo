import api from './client';
import { ENDPOINTS } from '../constants/endpoints';

export const pushApi = {
  async registerDeviceToken({ expo_push_token, platform, device_name }) {
    try {
      console.log('[push] POST', ENDPOINTS.DEVICE_TOKEN, {
        token_prefix: expo_push_token ? `${String(expo_push_token).slice(0, 24)}...` : null,
        platform,
        device_name,
      });

      const res = await api.post(ENDPOINTS.DEVICE_TOKEN, {
        expo_push_token,
        platform,
        device_name,
      });

      console.log('[push] POST /wali-app/device-token response', {
        status: res.status,
        data: res.data,
      });

      return res.data;
    } catch (err) {
      console.error('[push] POST /wali-app/device-token failed', {
        message: err?.message,
        code: err?.code,
        status: err?.response?.status,
        data: err?.response?.data,
      });
      throw err;
    }
  },

  async unregisterDeviceToken({ expo_push_token }) {
    const res = await api.delete(ENDPOINTS.DEVICE_TOKEN, {
      data: { expo_push_token },
    });
    return res.data;
  },

  async sendTestNotification({ title, body }) {
    const res = await api.post(ENDPOINTS.TEST_NOTIFICATION, {
      title,
      body,
    });
    return res.data;
  },
};
