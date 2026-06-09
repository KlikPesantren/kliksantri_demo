import api from './client';
import { ENDPOINTS } from '../constants/endpoints';

export const pinApi = {
  async changePin({ pin_lama, pin_baru, konfirmasi_pin }) {
    const res = await api.put(ENDPOINTS.CHANGE_PIN, {
      pin_lama: String(pin_lama),
      pin_baru: String(pin_baru),
      konfirmasi_pin: String(konfirmasi_pin),
    });
    return res.data;
  },
};
