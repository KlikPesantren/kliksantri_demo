const ACCENT_PRESETS = {
  teal: "var(--accent-teal)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  "danger-strong": "#DC2626",
  purple: "#8B5CF6",
  blue: "#3B82F6",
  sky: "#0EA5E9",
  orange: "#F97316",
  yellow: "#EAB308",
  indigo: "#6366F1",
  info: "var(--info)",
};

function resolveAccent(accent, layout) {
  if (!accent) {
    return layout === "classic" ? ACCENT_PRESETS.teal : ACCENT_PRESETS.teal;
  }
  return ACCENT_PRESETS[accent] || accent;
}

function KpiCard({
  label,
  value,
  icon = null,
  accent = "teal",
  layout = "metric",
  accentPosition,
  size,
  onClick,
}) {
  const resolvedAccent = resolveAccent(accent, layout);
  const isInteractive = typeof onClick === "function";

  if (layout === "dot") {
    return (
      <div
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onClick={onClick}
        onKeyDown={isInteractive ? (e) => e.key === "Enter" && onClick(e) : undefined}
        style={{
          ...dotCardStyle,
          cursor: isInteractive ? "pointer" : undefined,
        }}
      >
        <div
          style={{
            width: "16px",
            height: "16px",
            borderRadius: "999px",
            background: resolvedAccent,
            flexShrink: 0,
          }}
        />
        <p style={dotLabelStyle}>{label}</p>
        <div style={dotValueStyle}>{value}</div>
      </div>
    );
  }

  if (layout === "classic") {
    const classicSize = size === "lg" || !size ? "lg" : "md";

    return (
      <div
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onClick={onClick}
        onKeyDown={isInteractive ? (e) => e.key === "Enter" && onClick(e) : undefined}
        style={{
          ...classicCardStyle,
          minWidth: classicSize === "lg" ? "220px" : undefined,
          cursor: isInteractive ? "pointer" : undefined,
          borderTop: `var(--accent-width) solid ${resolvedAccent}`,
        }}
      >
        {icon && (
          <span style={{ ...classicIconStyle, color: resolvedAccent }}>
            {icon}
          </span>
        )}
        <h3 style={classicLabelStyle}>{label}</h3>
        <div style={classicValueStyle}>{value}</div>
      </div>
    );
  }

  const position = accentPosition || "left";

  return (
    <div
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={isInteractive ? (e) => e.key === "Enter" && onClick(e) : undefined}
      style={{
        ...metricCardStyle,
        cursor: isInteractive ? "pointer" : undefined,
        ...(position === "left"
          ? { borderLeft: `var(--accent-width) solid ${resolvedAccent}` }
          : { borderTop: `var(--accent-width) solid ${resolvedAccent}` }),
      }}
    >
      {icon && (
        <span style={{ ...metricIconStyle, color: resolvedAccent }}>
          {icon}
        </span>
      )}
      <span style={metricValueStyle}>{value}</span>
      <span style={metricLabelStyle}>{label}</span>
    </div>
  );
}

const metricCardStyle = {
  background: "var(--surface)",
  borderRadius: "var(--radius-xl)",
  boxShadow: "var(--shadow-card)",
  padding: "var(--space-3) var(--space-4)",
  minHeight: "128px",
  maxHeight: "140px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: "2px",
  boxSizing: "border-box",
};

const metricIconStyle = {
  fontSize: "14px",
  lineHeight: 1,
  display: "inline-flex",
  alignItems: "center",
  marginBottom: "2px",
};

const metricValueStyle = {
  fontSize: "clamp(1.375rem, 2.5vw, 1.75rem)",
  fontWeight: 800,
  color: "var(--text-primary)",
  lineHeight: 1.1,
  letterSpacing: "-0.02em",
};

const metricLabelStyle = {
  fontSize: "11px",
  fontWeight: 600,
  color: "var(--text-secondary)",
  lineHeight: 1.3,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const classicCardStyle = {
  background: "var(--surface)",
  borderRadius: "var(--radius-xl)",
  boxShadow: "var(--shadow-card)",
  padding: "var(--space-4) var(--space-5)",
  minHeight: "128px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: "var(--space-1)",
  boxSizing: "border-box",
};

const classicIconStyle = {
  fontSize: "14px",
  lineHeight: 1,
  display: "inline-flex",
  alignItems: "center",
};

const classicLabelStyle = {
  margin: 0,
  fontSize: "12px",
  fontWeight: 700,
  color: "var(--text-secondary)",
  lineHeight: 1.3,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const classicValueStyle = {
  margin: 0,
  fontSize: "clamp(1.375rem, 2.5vw, 1.75rem)",
  fontWeight: 800,
  color: "var(--text-primary)",
  lineHeight: 1.1,
  letterSpacing: "-0.02em",
};

const dotCardStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-xl)",
  boxShadow: "var(--shadow-card)",
  padding: "var(--space-4)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-2)",
};

const dotLabelStyle = {
  margin: "var(--space-3) 0 0",
  fontSize: "12px",
  color: "var(--text-muted)",
  lineHeight: 1.4,
};

const dotValueStyle = {
  margin: "var(--space-1) 0 0",
  fontSize: "1.75rem",
  fontWeight: 700,
  color: "var(--text-primary)",
  lineHeight: 1.2,
};

export default KpiCard;
