function getInitials(name = "") {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "PD";

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function TenantBrand({ logo, name = "Pesantren Demo", location = "Kabupaten Kuningan" }) {
  const initials = getInitials(name);

  return (
    <div style={containerStyle}>
      {logo ? (
        <img src={logo} alt={name} style={logoStyle} />
      ) : (
        <div style={avatarStyle}>{initials}</div>
      )}

      <div style={{ minWidth: 0 }}>
        <div style={nameStyle}>{name}</div>
        <div style={locationStyle}>{location}</div>
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
  width: "44px",
  height: "44px",
  borderRadius: "var(--radius-md)",
  objectFit: "cover",
  border: "1px solid var(--border)",
  flexShrink: 0,
};

const avatarStyle = {
  width: "44px",
  height: "44px",
  borderRadius: "var(--radius-md)",
  background: "#DCFCE7",
  color: "var(--primary)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: "14px",
  flexShrink: 0,
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

export default TenantBrand;
