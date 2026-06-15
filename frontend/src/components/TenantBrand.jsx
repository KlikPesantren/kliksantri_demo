import { useState, useEffect } from "react";
import { getTenantInitial } from "../utils/tenantProfile";
import { resolveDisplayMediaUrl } from "../utils/mediaUrl";

function TenantBrand({
  logo,
  name = "Pesantren",
  location = "Lengkapi profil pesantren",
  variant = "light",
  size = "md",
}) {
  const [logoError, setLogoError] = useState(false);
  const safeLogo = resolveDisplayMediaUrl(logo);

  useEffect(() => {
    setLogoError(false);
  }, [safeLogo]);

  const initial = getTenantInitial(name);
  const isSidebar = variant === "sidebar" || variant === "preview-sidebar";
  const logoSize = size === "lg" ? 56 : 44;
  const showImage = Boolean(safeLogo) && !logoError;

  return (
    <div style={containerStyle}>
      <div
        style={{
          width: logoSize,
          height: logoSize,
          flexShrink: 0,
          position: "relative",
        }}
      >
        <div
          style={{
            ...avatarStyle,
            width: logoSize,
            height: logoSize,
            fontSize: size === "lg" ? "22px" : "14px",
            ...(isSidebar ? sidebarAvatarStyle : null),
          }}
        >
          {initial}
        </div>
        {showImage ? (
          <img
            src={safeLogo}
            alt={name}
            style={{
              ...logoStyle,
              position: "absolute",
              inset: 0,
              width: logoSize,
              height: logoSize,
              ...(isSidebar ? sidebarLogoStyle : null),
            }}
            onError={() => setLogoError(true)}
          />
        ) : null}
      </div>

      <div style={{ minWidth: 0 }} className="tenant-brand-text sidebar-brand-text">
        <div
          style={{
            ...nameStyle,
            ...(isSidebar ? sidebarNameStyle : null),
            ...(size === "lg" ? largeNameStyle : null),
          }}
        >
          {name}
        </div>
        <div
          style={{
            ...locationStyle,
            ...(isSidebar ? sidebarLocationStyle : null),
            ...(size === "lg" ? largeLocationStyle : null),
          }}
        >
          {location}
        </div>
      </div>
    </div>
  );
}

const containerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-3)",
  minWidth: 0,
};

const logoStyle = {
  borderRadius: "var(--radius-md)",
  objectFit: "cover",
  border: "1px solid var(--border)",
  backgroundColor: "#fff",
};

const sidebarLogoStyle = {
  border: "1px solid rgba(148, 163, 184, 0.2)",
};

const avatarStyle = {
  borderRadius: "var(--radius-md)",
  background: "var(--primary-subtle)",
  color: "var(--primary)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
};

const sidebarAvatarStyle = {
  background: "rgba(22, 163, 74, 0.18)",
  color: "#DCFCE7",
  border: "1px solid rgba(22, 163, 74, 0.35)",
};

const nameStyle = {
  color: "var(--text-primary)",
  fontWeight: 700,
  fontSize: "14px",
  lineHeight: 1.25,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const sidebarNameStyle = {
  color: "#F8FAFC",
};

const largeNameStyle = {
  fontSize: "20px",
  whiteSpace: "normal",
  overflow: "visible",
  textOverflow: "unset",
};

const locationStyle = {
  color: "var(--text-secondary)",
  fontWeight: 400,
  fontSize: "12px",
  lineHeight: 1.35,
  marginTop: "2px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const sidebarLocationStyle = {
  color: "#94A3B8",
  whiteSpace: "normal",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const largeLocationStyle = {
  fontSize: "13px",
  whiteSpace: "normal",
  overflow: "visible",
  textOverflow: "unset",
  WebkitLineClamp: "unset",
};

export default TenantBrand;
