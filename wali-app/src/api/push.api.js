import api from './client';
import { ENDPOINTS } from '../constants/endpoints';

export const pushApi = {
  async registerDeviceToken({ expo_push_token, platform, device_name }) {
    const res = await api.post(ENDPOINTS.DEVICE_TOKEN, {
      expo_push_token,
      platform,
      device_name,
    });
    return res.data;
  },

  async unregisterDeviceToken({ expo_push_token }) {
    const res = await api.delete(ENDPOINTS.DEVICE_TOKEN, {
      data: { expo_push_token },
    });
    return res.data;
  },
};
