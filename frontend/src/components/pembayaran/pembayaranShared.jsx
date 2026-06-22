export { KeuanganPageStyles as KeuanganResponsiveStyles } from "../shared/PageResponsiveStyles.jsx";

export const BULAN_NAMA = [
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

export function getBulanNamaBerjalan() {
  return BULAN_NAMA[new Date().getMonth()];
}

export function getTahunBerjalan() {
  return new Date().getFullYear();
}

export function getApiError(err, fallback = "Terjadi kesalahan. Silakan coba lagi.") {
  return err?.response?.data?.error || fallback;
}

export function isTagihanLunas(status) {
  return String(status || "").trim().toLowerCase() === "lunas";
}

export function tagihanHasPayment(row) {
  return Number(row?.nominal_bayar || 0) > 0;
}

export function getTagihanSisa(row) {
  const sisa = row?.sisa_tunggakan ?? row?.sisa_tagihan;
  if (sisa != null && sisa !== "") return Math.max(0, Number(sisa));
  const total = Number(row?.nominal_tagihan || 0);
  const dibayar = Number(row?.nominal_bayar || 0);
  return Math.max(0, total - dibayar);
}

export function normalizeBulanToName(input) {
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
