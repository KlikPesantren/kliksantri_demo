import api from './client';
import { ENDPOINTS } from '../constants/endpoints';

export const pushApi = {
  async registerToken({ expo_push_token, device_id, platform }) {
    const res = await api.post(ENDPOINTS.PUSH_TOKEN, {
      expo_push_token,
      device_id,
      platform,
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
