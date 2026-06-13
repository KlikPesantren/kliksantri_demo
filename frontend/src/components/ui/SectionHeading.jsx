const SPACING = {
  first: {
    marginTop: 0,
    marginBottom: "var(--space-3)",
  },
  compact: {
    marginTop: "var(--space-4)",
    marginBottom: "var(--space-3)",
  },
  default: {
    marginTop: "28px",
    marginBottom: "var(--space-3)",
  },
  none: {
    marginTop: 0,
    marginBottom: 0,
  },
};

function SectionHeading({
  children,
  variant = "eyebrow",
  as: Tag = "h2",
  icon = null,
  spacing = "default",
  action = null,
}) {
  const spacingStyle = SPACING[spacing] || SPACING.default;

  if (variant === "divider") {
    return (
      <Tag
        style={{
          fontSize: "14px",
          fontWeight: 700,
          color: "var(--text-primary)",
          margin: spacing === "first" ? "0 0 var(--space-1)" : `${spacingStyle.marginTop} 0 var(--space-1)`,
          paddingBottom: "var(--space-2)",
          borderBottom: "1px solid var(--border)",
          textTransform: "none",
          letterSpacing: "normal",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-3)",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          {icon && <span aria-hidden="true">{icon}</span>}
          {children}
        </span>
        {action && <span style={{ flexShrink: 0 }}>{action}</span>}
      </Tag>
    );
  }

  return (
    <Tag
      style={{
        fontSize: "11px",
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "var(--text-primary)",
        marginTop: spacingStyle.marginTop,
        marginBottom: spacingStyle.marginBottom,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-3)",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
        {icon && (
          <span
            aria-hidden="true"
            style={{
              display: "inline-flex",
              alignItems: "center",
              fontSize: "13px",
              color: "var(--primary)",
            }}
          >
            {icon}
          </span>
        )}
        {children}
      </span>
      {action && <span style={{ flexShrink: 0 }}>{action}</span>}
    </Tag>
  );
}

export default SectionHeading;
