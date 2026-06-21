import { FaBars } from "react-icons/fa";
import { getUser } from "../utils/storage";
import { useTenantProfile } from "../context/TenantProfileContext";

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

function PageHeader({ title, description, breadcrumb, onMenuClick }) {
  const user = getUser();
  const { display } = useTenantProfile();
  const userName = user?.nama || user?.username || "Admin Sistem";
  const role = formatRole(user?.role);

  return (
    <header className="page-header">
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

        <div className="page-header-copy">
          {display.hasCustomName && (
            <div style={tenantNameStyle}>{display.name}</div>
          )}
          {breadcrumb && <div style={breadcrumbStyle}>{breadcrumb}</div>}
          {title && <h1 style={titleStyle}>{title}</h1>}
          {description && <p style={descriptionStyle}>{description}</p>}
        </div>
      </div>

      <div className="page-header-user" style={userCardStyle}>
        <div style={avatarStyle}>{getInitials(userName)}</div>
        <div style={{ minWidth: 0 }}>
          <div style={userNameStyle}>{userName}</div>
          <div style={roleStyle}>{role}</div>
        </div>
      </div>
    </header>
  );
}

const tenantNameStyle = {
  color: "var(--primary)",
  fontSize: "11px",
  fontWeight: 700,
  marginBottom: "var(--space-1)",
  lineHeight: 1.35,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const breadcrumbStyle = {
  color: "var(--text-muted)",
  fontSize: "12px",
  fontWeight: 500,
  marginBottom: "var(--space-2)",
  letterSpacing: "0.01em",
};

const titleStyle = {
  margin: 0,
  color: "var(--text-primary)",
  fontSize: "26px",
  fontWeight: 800,
  lineHeight: 1.2,
  letterSpacing: "-0.025em",
};

const descriptionStyle = {
  margin: "var(--space-2) 0 0",
  color: "var(--text-secondary)",
  fontSize: "14px",
  lineHeight: 1.55,
  maxWidth: "640px",
};

const userCardStyle = {
  padding: "var(--space-2) var(--space-3)",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--shadow-sm)",
};

const avatarStyle = {
  width: "42px",
  height: "42px",
  borderRadius: "999px",
  background: "var(--primary-subtle)",
  color: "var(--primary)",
  border: "2px solid rgba(21, 128, 61, 0.18)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "13px",
  fontWeight: 700,
  flexShrink: 0,
};

const userNameStyle = {
  color: "var(--text-primary)",
  fontSize: "14px",
  fontWeight: 700,
  lineHeight: 1.25,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const roleStyle = {
  color: "var(--text-muted)",
  fontSize: "12px",
  fontWeight: 500,
  lineHeight: 1.35,
  marginTop: "2px",
};

export default PageHeader;
