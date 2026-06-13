import Badge from "./Badge";

const STATUS_MAP = {
  aktif: "success",
  nonaktif: "neutral",
  pending: "warning",
  ditolak: "danger",
  lunas: "success",
  "belum lunas": "danger",
  "belum bayar": "danger",
  tunggakan: "danger",
  cicilan: "warning",
  online: "success",
  offline: "neutral",
  keluar: "warning",
  kembali: "success",
  synced: "success",
  failed: "danger",
  sync: "warning",
  create: "success",
  update: "warning",
  delete: "danger",
  urgent: "danger",
  penting: "warning",
  normal: "neutral",
  hadir: "success",
  izin: "warning",
  sakit: "warning",
  alfa: "danger",
  h: "success",
  izin: "warning",
  i: "warning",
  sakit: "warning",
  s: "warning",
  alfa: "danger",
  a: "danger",
  pembayaran: "danger",
  payment: "danger",
  topup: "success",
  refund: "warning",
  sistem: "info",
  custom: "success",
  terbaru: "success",
  masuk: "success",
};

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function resolveVariant(status) {
  const key = normalizeStatus(status);
  if (STATUS_MAP[key]) return STATUS_MAP[key];
  if (key.includes("lunas")) return "success";
  if (key.includes("belum") || key.includes("tunggak")) return "danger";
  if (key.includes("cicil")) return "warning";
  if (key.includes("aktif") && !key.includes("non")) return "success";
  if (key.includes("nonaktif")) return "neutral";
  return "neutral";
}

function StatusBadge({ status, children, size = "md" }) {
  const label = children ?? status ?? "—";
  return (
    <Badge variant={resolveVariant(status)} size={size}>
      {label}
    </Badge>
  );
}

export default StatusBadge;
