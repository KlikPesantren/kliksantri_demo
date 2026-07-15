import { FaBars } from "react-icons/fa";
import ThemeToggle from "./ThemeToggle";
import { getUser } from "../utils/storage";

function getInitials(name = "") {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "AS";

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function formatRole(role = "") {
  if (!role) return "Superadmin";

  return role
    .split(/[_-]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function PageHeader({
  title,
  description,
  breadcrumb,
  onMenuClick,
  hideUserCard = false,
  compact = false,
  dashboardMode = false,
}) {
  const user = getUser();
  const userName = user?.nama || user?.username || "Admin Sistem";
  const role = formatRole(user?.role);
  const showUserCard = !hideUserCard && !dashboardMode;

  return (
    <header
      className={`page-header${dashboardMode ? " page-header--dashboard" : ""}`}
      style={dashboardMode || compact ? compactHeaderStyle : headerStyle}
    >
      <div className="page-header-leading">
        {onMenuClick && (
          <button
            type="button"
            className="page-header-menu-btn"
            aria-label="Buka menu navigasi"
            onClick={onMenuClick}
          >
            <FaBars size={16} />
          </button>
        )}

        {!dashboardMode && (
          <div className="page-header-copy">
            {breadcrumb && <div style={breadcrumbStyle}>{breadcrumb}</div>}
            {title && <h1 style={titleStyle}>{title}</h1>}
            {description && <p style={descriptionStyle}>{description}</p>}
          </div>
        )}
      </div>

      <div className="page-header-actions">
        <ThemeToggle size="sm" />
        {showUserCard && (
          <div className="page-header-user" style={userCardStyle}>
            <div style={avatarStyle}>{getInitials(userName)}</div>
            <div style={{ minWidth: 0 }}>
              <div style={userNameStyle}>{userName}</div>
              <div style={roleStyle}>{role}</div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

const headerStyle = {
  marginBottom: "var(--space-3)",
};

const compactHeaderStyle = {
  marginBottom: 0,
  minHeight: 0,
};

const breadcrumbStyle = {
  color: "var(--text-muted)",
  fontSize: "11px",
  fontWeight: 500,
  marginBottom: "4px",
  letterSpacing: "0.01em",
};

const titleStyle = {
  margin: 0,
  color: "var(--text-primary)",
  fontSize: "22px",
  fontWeight: 800,
  lineHeight: 1.2,
  letterSpacing: "-0.02em",
};

const descriptionStyle = {
  margin: "var(--space-1) 0 0",
  color: "var(--text-secondary)",
  fontSize: "13px",
  lineHeight: 1.45,
  maxWidth: "640px",
};

const userCardStyle = {
  padding: "6px var(--space-3)",
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  boxShadow: "var(--shadow-sm)",
};

const avatarStyle = {
  width: "38px",
  height: "38px",
  borderRadius: "999px",
  background: "var(--primary-subtle)",
  color: "var(--primary)",
  border: "2px solid rgba(21, 128, 61, 0.16)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
  fontWeight: 700,
  flexShrink: 0,
};

const userNameStyle = {
  color: "var(--text-primary)",
  fontSize: "13px",
  fontWeight: 700,
  lineHeight: 1.25,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const roleStyle = {
  color: "var(--text-muted)",
  fontSize: "11px",
  fontWeight: 500,
  lineHeight: 1.3,
  marginTop: "1px",
};

export default PageHeader;
