import Card from "./Card";

function DataTableCard({
  title,
  subtitle,
  actions = null,
  children,
  padding = "md",
  shadow = "card",
  radius = "xl",
  border = false,
}) {
  const contentPadding =
    padding === "md"
      ? "var(--space-5) var(--space-6)"
      : padding === "sm"
        ? "var(--space-4)"
        : padding === "lg"
          ? "var(--space-6)"
          : undefined;

  return (
    <Card padding="none" shadow={shadow} radius={radius} border={border}>
      {(title || subtitle || actions) && (
        <div style={headerStyle}>
          <div style={{ minWidth: 0, flex: 1 }}>
            {title && <h3 style={titleStyle}>{title}</h3>}
            {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
          </div>
          {actions && <div style={actionsStyle}>{actions}</div>}
        </div>
      )}
      <div
        style={{
          borderTop: title || subtitle || actions ? "1px solid var(--border)" : "none",
          padding: contentPadding,
        }}
      >
        {children}
      </div>
    </Card>
  );
}

const headerStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "var(--space-4)",
  padding: "var(--space-5) var(--space-6) 0",
};

const titleStyle = {
  margin: 0,
  fontSize: "15px",
  fontWeight: 700,
  color: "var(--text-primary)",
  lineHeight: 1.3,
};

const subtitleStyle = {
  margin: "var(--space-1) 0 0",
  fontSize: "13px",
  color: "var(--text-secondary)",
  lineHeight: 1.4,
};

const actionsStyle = {
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  gap: "var(--space-2)",
};

export default DataTableCard;
