import Badge from "./Badge";

const STATUS_MAP = {
  aktif: "success",
  nonaktif: "neutral",
  pending: "warning",
  ditolak: "danger",
  lunas: "success",
  "belum lunas": "danger",
  cicilan: "warning",
};

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function resolveVariant(status) {
  const key = normalizeStatus(status);
  return STATUS_MAP[key] || "neutral";
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
