import { API_BASE_URL as ENV_API_BASE_URL } from '@env';

const BASE = (ENV_API_BASE_URL || 'http://10.161.70.56:3000').replace(/\/$/, '');

export function resolveMediaUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  return `${BASE}${url.startsWith('/') ? url : `/${url}`}`;
}
