import api from './client';
import { ENDPOINTS } from '../constants/endpoints';

export const homeLinksApi = {
  async getHomeLinks() {
    const res = await api.get(ENDPOINTS.HOME_LINKS);
    return res.data;
  },
};
