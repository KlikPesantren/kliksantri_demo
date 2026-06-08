import api from './client';
import { ENDPOINTS } from '../constants/endpoints';

export const rfidApi = {
  async getSaldo() {
    const res = await api.get(ENDPOINTS.RFID_SALDO);
    return res.data;
  },

  async getMutasi({ limit = 20, offset = 0 } = {}) {
    const res = await api.get(ENDPOINTS.RFID_MUTASI, {
      params: { limit, offset },
    });
    return res.data;
  },
};
