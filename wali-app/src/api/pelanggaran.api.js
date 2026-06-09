import api from './client';
import { ENDPOINTS } from '../constants/endpoints';

export const pelanggaranApi = {
  async getPelanggaran({ limit = 30, offset = 0 } = {}) {
    const res = await api.get(ENDPOINTS.PELANGGARAN, {
      params: { limit, offset },
    });
    return res.data;
  },
};
