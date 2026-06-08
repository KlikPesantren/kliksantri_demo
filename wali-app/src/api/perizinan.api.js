import api from './client';
import { ENDPOINTS } from '../constants/endpoints';

export const perizinanApi = {
  async getPerizinan({ limit = 20, offset = 0 } = {}) {
    const res = await api.get(ENDPOINTS.PERIZINAN, {
      params: { limit, offset },
    });
    return res.data;
  },
};
