export const PLATFORM_COLORS = {
  navy: "#0F172A",
  navySecondary: "#1E293B",
  green: "#166534",
  greenHover: "#14532D",
  danger: "#DC2626",
  dangerHover: "#B91C1C",
  background: "#F8FAFC",
  border: "#E2E8F0",
  text: "#334155",
  textMuted: "#64748B",
  link: "#166534",
};

export function PlatformThemeStyles() {
  return (
    <style>{`
      .platform-shell {
        --platform-navy: #0F172A;
        --platform-navy-secondary: #1E293B;
        --platform-green: var(--primary);
        --platform-green-hover: var(--primary-hover);
        --platform-danger: var(--danger);
        --platform-bg: var(--background);
        --platform-border: var(--border);
        --platform-link: var(--primary);
        --platform-text: var(--text-primary);
        --platform-text-muted: var(--text-muted);
      }

      .platform-shell a:not(.platform-nav__link):not(.platform-console__button) {
        color: var(--platform-link);
      }

      .platform-page-title {
        margin: 0;
        font-size: 22px;
        font-weight: 800;
        color: var(--platform-text);
        letter-spacing: -0.02em;
      }

      .platform-page-subtitle {
        margin: 6px 0 16px;
        color: var(--platform-text-muted);
        font-size: 13px;
        line-height: 1.5;
      }

      .platform-compact-card {
        border: 1px solid var(--platform-border);
        border-radius: var(--radius-md);
        background: var(--card);
        box-shadow: var(--shadow-sm);
        padding: 18px 20px;
      }
    `}</style>
  );
}

export { default as PlatformButton } from "./PlatformButton";
