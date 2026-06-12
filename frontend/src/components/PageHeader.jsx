import { FaBars } from "react-icons/fa";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
}

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
  const user = getStoredUser();
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
          {breadcrumb && <div style={breadcrumbStyle}>{breadcrumb}</div>}
          {title && <h1 style={titleStyle}>{title}</h1>}
          {description && <p style={descriptionStyle}>{description}</p>}
        </div>
      </div>

      <div className="page-header-user">
        <div style={avatarStyle}>{getInitials(userName)}</div>
        <div style={{ minWidth: 0 }}>
          <div style={userNameStyle}>{userName}</div>
          <div style={roleStyle}>{role}</div>
        </div>
      </div>
    </header>
  );
}

const breadcrumbStyle = {
  color: "var(--text-secondary)",
  fontSize: "12px",
  fontWeight: 600,
  marginBottom: "var(--space-2)",
};

const titleStyle = {
  margin: 0,
  color: "var(--text-primary)",
  fontSize: "24px",
  fontWeight: 700,
  lineHeight: 1.25,
};

const descriptionStyle = {
  margin: "var(--space-2) 0 0",
  color: "var(--text-secondary)",
  fontSize: "14px",
  lineHeight: 1.5,
};

const avatarStyle = {
  width: "40px",
  height: "40px",
  borderRadius: "999px",
  background: "#DCFCE7",
  color: "var(--primary)",
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
  color: "var(--text-secondary)",
  fontSize: "12px",
  fontWeight: 500,
  lineHeight: 1.35,
  marginTop: "2px",
};

export default PageHeader;
