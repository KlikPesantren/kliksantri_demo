const VARIANTS = {
  success: {
    background: "#DCFCE7",
    color: "var(--success)",
  },
  warning: {
    background: "#FEF3C7",
    color: "var(--warning)",
  },
  danger: {
    background: "#FEE2E2",
    color: "var(--danger)",
  },
};

function Badge({ children, variant = "success" }) {
  const variantStyle = VARIANTS[variant] || VARIANTS.success;

  return (
    <span
      style={{
        ...badgeStyle,
        ...variantStyle,
      }}
    >
      {children}
    </span>
  );
}

const badgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  padding: "4px 10px",
  fontSize: "12px",
  fontWeight: 700,
  lineHeight: 1,
  whiteSpace: "nowrap",
};

export default Badge;
