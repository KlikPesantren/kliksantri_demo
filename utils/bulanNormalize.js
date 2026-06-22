const BULAN_NAMA = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function normalizeBulanToName(input) {
  const raw = String(input || "").trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();
  const asNumber = Number.parseInt(raw, 10);

  if (!Number.isNaN(asNumber) && asNumber >= 1 && asNumber <= 12) {
    return BULAN_NAMA[asNumber - 1];
  }

  const byName = BULAN_NAMA.find((nama) => nama.toLowerCase() === lower);
  return byName || raw;
}

function getBulanFilterVariants(input) {
  const raw = String(input || "").trim();
  if (!raw) return [];

  const canonical = normalizeBulanToName(raw);
  const variants = new Set([raw.toLowerCase(), raw]);

  if (canonical) {
    variants.add(canonical.toLowerCase());
    variants.add(canonical);
    const monthIndex = BULAN_NAMA.indexOf(canonical) + 1;
    if (monthIndex > 0) {
      variants.add(String(monthIndex));
      variants.add(String(monthIndex).padStart(2, "0"));
    }
  }

  return [...variants].map((value) => value.toLowerCase());
}

module.exports = {
  BULAN_NAMA,
  normalizeBulanToName,
  getBulanFilterVariants,
};
