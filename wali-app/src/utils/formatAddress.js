export function formatShortAddress(alamat) {
  if (!alamat) return null;
  const parts = alamat
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return parts.slice(-2).join(', ');
  }
  if (alamat.length > 52) {
    return `${alamat.slice(0, 52).trim()}…`;
  }
  return alamat;
}
