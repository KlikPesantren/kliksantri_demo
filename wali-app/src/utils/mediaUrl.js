const DEV_API_FALLBACK = 'http://10.10.2.140:3000';

const BASE = (
  process.env.EXPO_PUBLIC_API_BASE_URL || (__DEV__ ? DEV_API_FALLBACK : '')
).replace(/\/$/, '');

export function resolveMediaUrl(url, cacheBust) {
  if (!url) return null;
  if (!__DEV__ && url.startsWith('http://')) return null;

  let resolved = url;
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:')) {
    if (!BASE) return null;
    resolved = `${BASE}${url.startsWith('/') ? url : `/${url}`}`;
  }

  if (cacheBust != null && cacheBust !== '') {
    const sep = resolved.includes('?') ? '&' : '?';
    return `${resolved}${sep}v=${encodeURIComponent(String(cacheBust))}`;
  }

  return resolved;
}
