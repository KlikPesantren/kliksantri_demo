const VARIANTS = {
  success: {
    background: "var(--primary-subtle)",
    color: "var(--success)",
  },
  warning: {
    background: "#FEF3C7",
    color: "var(--warning)",
  },
  danger: {
    background: "#FEE2E2",
    color: "#DC2626",
  },
  info: {
    background: "var(--info-subtle)",
    color: "var(--info)",
  },
  neutral: {
    background: "var(--neutral-subtle)",
    color: "var(--text-secondary)",
  },
};

const SIZE = {
  sm: {
    padding: "2px 8px",
    fontSize: "11px",
  },
  md: {
    padding: "4px 10px",
    fontSize: "12px",
  },
};

function Badge({ children, variant = "success", size = "md", pill = true }) {
  const variantStyle = VARIANTS[variant] || VARIANTS.success;
  const sizeStyle = SIZE[size] || SIZE.md;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: pill ? "999px" : "var(--radius-sm)",
        fontWeight: 700,
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...sizeStyle,
        ...variantStyle,
      }}
    >
      {children}
    </span>
  );
}

export default Badge;
