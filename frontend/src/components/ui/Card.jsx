const PADDING = {
  none: "0",
  sm: "var(--space-4)",
  md: "var(--space-5) var(--space-6)",
  lg: "var(--space-6)",
};

const SHADOW = {
  none: "none",
  sm: "var(--shadow-sm)",
  md: "var(--shadow-md)",
  kpi: "var(--shadow-kpi)",
  card: "var(--shadow-card)",
};

const RADIUS = {
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
};

const ACCENT_COLORS = {
  teal: "var(--accent-teal)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  info: "var(--info)",
};

function resolveAccent(accent) {
  if (!accent) return null;
  return ACCENT_COLORS[accent] || accent;
}

function Card({
  children,
  padding,
  shadow = "sm",
  radius = "lg",
  border = true,
  accent = null,
  accentPosition = "top",
  header = null,
}) {
  const accentColor = resolveAccent(accent);

  const style = {
    background: "var(--surface)",
    borderRadius: RADIUS[radius] || RADIUS.lg,
    boxShadow: SHADOW[shadow] || SHADOW.sm,
    border: border ? "1px solid var(--border)" : "none",
  };

  if (accentColor) {
    if (accentPosition === "left") {
      style.borderLeft = `var(--accent-width) solid ${accentColor}`;
    } else {
      style.borderTop = `var(--accent-width) solid ${accentColor}`;
    }
  }

  const hasPadding = Boolean(padding);
  const hasHeader = Boolean(header);

  if (!hasPadding && !hasHeader) {
    return <div style={style}>{children}</div>;
  }

  const contentPadding = hasPadding ? PADDING[padding] || PADDING.md : undefined;

  return (
    <div style={{ ...style, overflow: padding === "none" ? "hidden" : undefined }}>
      {hasHeader && (
        <div style={getHeaderStyle(padding)}>
          <div style={{ minWidth: 0 }}>
            {header.title && <div style={headerTitleStyle}>{header.title}</div>}
            {header.description && (
              <div style={headerDescriptionStyle}>{header.description}</div>
            )}
          </div>
          {header.action && <div style={headerActionStyle}>{header.action}</div>}
        </div>
      )}
      <div style={contentPadding ? { padding: contentPadding } : undefined}>
        {children}
      </div>
    </div>
  );
}

function getHeaderStyle(padding) {
  const horizontal = padding === "sm" ? "var(--space-4)" : "var(--space-6)";
  const top = padding === "sm" ? "var(--space-4)" : padding === "lg" ? "var(--space-6)" : "var(--space-5)";

  return {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "var(--space-4)",
    padding: `${top} ${horizontal} 0`,
  };
}

const headerTitleStyle = {
  margin: 0,
  fontSize: "15px",
  fontWeight: 700,
  color: "var(--text-primary)",
  lineHeight: 1.3,
};

const headerDescriptionStyle = {
  marginTop: "var(--space-1)",
  fontSize: "13px",
  color: "var(--text-secondary)",
  lineHeight: 1.4,
};

const headerActionStyle = {
  flexShrink: 0,
};

export default Card;
