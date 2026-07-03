import api from './client';
import { ENDPOINTS } from '../constants/endpoints';

export const pushApi = {
  async registerDeviceToken({ expo_push_token, platform, device_name }) {
    try {
      console.log('[PUSH] register request api', ENDPOINTS.DEVICE_TOKEN, {
        token_prefix: expo_push_token ? `${String(expo_push_token).slice(0, 24)}...` : null,
        platform,
        device_name,
      });

      const res = await api.post(ENDPOINTS.DEVICE_TOKEN, {
        expo_push_token,
        platform,
        device_name,
      });

      console.log('[PUSH] register response api', {
        status: res.status,
        data: res.data,
      });

      return res.data;
    } catch (err) {
      console.error('[PUSH] register error api', {
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

  async getDeviceTokenStatus() {
    const res = await api.get(ENDPOINTS.DEVICE_TOKEN_STATUS);
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
