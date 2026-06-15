import { API_BASE_URL } from "../services/api";

export function isStableMediaUrl(url) {
  if (!url || typeof url !== "string") return false;
  if (url.startsWith("blob:") || url.startsWith("data:")) return false;
  return true;
}

export function resolveMediaUrl(url) {
  if (!url) return null;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

/** Safe src for <img>: never return revoked or transient blob URLs from saved state. */
export function resolveDisplayMediaUrl(url) {
  if (!isStableMediaUrl(url)) return null;
  return resolveMediaUrl(url);
}
