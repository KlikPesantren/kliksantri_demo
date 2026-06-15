import api from './client';
import { ENDPOINTS } from '../constants/endpoints';

export const kesehatanApi = {
  async getKesehatan() {
    const res = await api.get(ENDPOINTS.KESEHATAN);
    return res.data;
  },
};
