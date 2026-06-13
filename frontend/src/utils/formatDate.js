export function formatDate(value, locale = "id-ID", options) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(locale, options);
}

export function formatDateShort(value, locale = "id-ID") {
  return formatDate(value, locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
