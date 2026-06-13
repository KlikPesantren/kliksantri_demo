// KPI Standard V3 — single layout: VALUE → label, small left accent.

const ACCENT_PRESETS = {
  primary: "var(--primary)",
  neutral: "var(--neutral)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  info: "var(--info)",
  teal: "var(--primary)",
};

function resolveAccent(accent) {
  if (!accent) return ACCENT_PRESETS.primary;
  return ACCENT_PRESETS[accent] || accent;
}

function KpiCard({
  label,
  value,
  trend = null,
  icon = null,
  accent = "primary",
  onClick,
  // LEGACY — ignored; kept for backward compatibility during migration
  layout: _layout,
  accentPosition: _accentPosition,
  size: _size,
}) {
  const resolvedAccent = resolveAccent(accent);
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
        borderLeftColor: resolvedAccent,
        cursor: isInteractive ? "pointer" : undefined,
      }}
    >
      {icon && (
        <span style={iconStyle} aria-hidden="true">
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
  borderRadius: "var(--radius-xl)",
  boxShadow: "var(--shadow-card)",
  padding: "var(--space-3) var(--space-4)",
  minHeight: "96px",
  height: "96px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: "2px",
  boxSizing: "border-box",
  borderLeft: "3px solid var(--primary)",
  minWidth: 0,
};

const iconStyle = {
  fontSize: "12px",
  lineHeight: 1,
  display: "inline-flex",
  alignItems: "center",
  color: "var(--text-muted)",
  marginBottom: "2px",
};

export default KpiCard;
