import Button from "../ui/Button";

const PLATFORM_VARIANTS = {
  primary: {
    background: "#166534",
    color: "#FFFFFF",
    border: "1px solid #166534",
    hoverBackground: "#14532D",
    hoverBorder: "#14532D",
  },
  success: {
    background: "#166534",
    color: "#FFFFFF",
    border: "1px solid #166534",
    hoverBackground: "#14532D",
    hoverBorder: "#14532D",
  },
  danger: {
    background: "#DC2626",
    color: "#FFFFFF",
    border: "1px solid #DC2626",
    hoverBackground: "#B91C1C",
    hoverBorder: "#B91C1C",
  },
  secondary: {
    background: "var(--surface)",
    color: "var(--text-primary)",
    border: "1px solid var(--border)",
    hoverBackground: "var(--neutral-subtle)",
    hoverBorder: "var(--border-hover)",
  },
  outline: {
    background: "var(--surface)",
    color: "var(--text-primary)",
    border: "1px solid var(--border)",
    hoverBackground: "var(--neutral-subtle)",
    hoverBorder: "var(--border-hover)",
  },
};

function PlatformButton({ variant = "primary", style, ...props }) {
  const colors = PLATFORM_VARIANTS[variant] || PLATFORM_VARIANTS.primary;

  return (
    <Button
      {...props}
      variant={
        variant === "danger"
          ? "danger"
          : variant === "secondary" || variant === "outline"
            ? "secondary"
            : "primary"
      }
      style={{
        background: colors.background,
        color: colors.color,
        border: colors.border,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (props.disabled || props.loading) return;
        e.currentTarget.style.background = colors.hoverBackground;
        e.currentTarget.style.borderColor = colors.hoverBorder;
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (props.disabled || props.loading) return;
        e.currentTarget.style.background = colors.background;
        e.currentTarget.style.borderColor = colors.border.split("solid ")[1];
        props.onMouseLeave?.(e);
      }}
    />
  );
}

export default PlatformButton;
