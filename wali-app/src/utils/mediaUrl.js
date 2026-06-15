import { API_BASE_URL as ENV_API_BASE_URL } from '@env';

const DEV_API_FALLBACK = 'http://localhost:3000';

const BASE = (
  ENV_API_BASE_URL || (__DEV__ ? DEV_API_FALLBACK : '')
).replace(/\/$/, '');

export function resolveMediaUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  if (!BASE) return null;
  return `${BASE}${url.startsWith('/') ? url : `/${url}`}`;
}
