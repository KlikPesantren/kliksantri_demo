// KPI Standard V3 — premium layout: optional icon → VALUE → label (no card accent lines).

function KpiCard({
  label,
  value,
  trend = null,
  icon = null,
  accent: _accent = "primary",
  onClick,
  // LEGACY — ignored; kept for backward compatibility during migration
  layout: _layout,
  accentPosition: _accentPosition,
  size: _size,
}) {
  const isInteractive = typeof onClick === "function";

  return (
    <div
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={isInteractive ? (e) => e.key === "Enter" && onClick(e) : undefined}
      className="kpi-card-v3"
      style={{
        ...cardStyle,
        cursor: isInteractive ? "pointer" : undefined,
      }}
    >
      {icon && (
        <span className="kpi-card-v3__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="kpi-card-v3__value">{value}</span>
      <span className="kpi-card-v3__label">{label}</span>
      {trend && <span className="kpi-card-v3__trend">{trend}</span>}
    </div>
  );
}

const cardStyle = {
  background: "var(--surface)",
  borderRadius: "20px",
  border: "1px solid var(--border)",
  boxShadow: "0 2px 16px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.04)",
  padding: "var(--space-4) var(--space-5)",
  minHeight: "96px",
  height: "auto",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: "var(--space-2)",
  boxSizing: "border-box",
  minWidth: 0,
};

export default KpiCard;
