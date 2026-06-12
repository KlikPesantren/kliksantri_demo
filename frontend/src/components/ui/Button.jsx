const VARIANTS = {
  primary: {
    background: "var(--accent-teal-dark)",
    color: "#FFFFFF",
    border: "1px solid var(--accent-teal-dark)",
    hoverBackground: "var(--accent-teal)",
    hoverBorder: "var(--accent-teal)",
  },
  secondary: {
    background: "var(--neutral-subtle)",
    color: "var(--text-secondary)",
    border: "1px solid var(--border)",
    hoverBackground: "#E2E8F0",
    hoverBorder: "#CBD5E1",
  },
  success: {
    background: "var(--success)",
    color: "#FFFFFF",
    border: "1px solid var(--success)",
    hoverBackground: "#16A34A",
    hoverBorder: "#16A34A",
  },
  danger: {
    background: "var(--danger)",
    color: "#FFFFFF",
    border: "1px solid var(--danger)",
    hoverBackground: "#DC2626",
    hoverBorder: "#DC2626",
  },
  outline: {
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid var(--border)",
    hoverBackground: "var(--neutral-subtle)",
    hoverBorder: "#CBD5E1",
  },
};

const SIZES = {
  sm: {
    padding: "4px 12px",
    fontSize: "12px",
    gap: "6px",
    iconSize: "14px",
  },
  md: {
    padding: "9px 18px",
    fontSize: "14px",
    gap: "8px",
    iconSize: "16px",
  },
  lg: {
    padding: "12px 24px",
    fontSize: "15px",
    gap: "10px",
    iconSize: "18px",
  },
};

function Button({
  children,
  variant = "primary",
  size = "md",
  icon = null,
  loading = false,
  disabled = false,
  type = "button",
  onClick,
  style,
  ...rest
}) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;
  const isDisabled = disabled || loading;

  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: s.gap,
    padding: s.padding,
    fontSize: s.fontSize,
    fontWeight: 600,
    fontFamily: "inherit",
    lineHeight: 1.2,
    borderRadius: "var(--radius-sm)",
    border: v.border,
    background: v.background,
    color: v.color,
    cursor: isDisabled ? "not-allowed" : "pointer",
    opacity: isDisabled ? 0.65 : 1,
    whiteSpace: "nowrap",
    transition: "background 0.15s ease, border-color 0.15s ease",
    ...style,
  };

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      style={baseStyle}
      onMouseEnter={(e) => {
        if (isDisabled) return;
        e.currentTarget.style.background = v.hoverBackground;
        e.currentTarget.style.borderColor = v.hoverBorder;
      }}
      onMouseLeave={(e) => {
        if (isDisabled) return;
        e.currentTarget.style.background = v.background;
        e.currentTarget.style.borderColor = v.border.split("solid ")[1];
      }}
      {...rest}
    >
      {loading ? (
        <span
          style={{
            width: s.iconSize,
            height: s.iconSize,
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "button-spin 0.6s linear infinite",
            flexShrink: 0,
          }}
        />
      ) : icon ? (
        <span style={{ display: "inline-flex", alignItems: "center", fontSize: s.iconSize, lineHeight: 1 }}>
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
}

export default Button;

export const actionBarStyle = {
  display: "flex",
  gap: "var(--space-3)",
  flexWrap: "wrap",
  alignItems: "center",
};
