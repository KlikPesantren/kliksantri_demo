export function formatNumber(value, locale = "id-ID") {
  return Number(value || 0).toLocaleString(locale);
}

export function formatCurrency(value, { prefix = "Rp ", locale = "id-ID" } = {}) {
  return `${prefix}${formatNumber(value, locale)}`;
}
