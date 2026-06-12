import { FaFileAlt } from "react-icons/fa";

function EmptyState({ title = "Belum ada data", description, action = null }) {
  return (
    <div style={wrapStyle}>
      <div style={iconWrapStyle} aria-hidden>
        <FaFileAlt style={iconStyle} />
      </div>
      <h4 style={titleStyle}>{title}</h4>
      {description && <p style={descStyle}>{description}</p>}
      {action && <div style={actionStyle}>{action}</div>}
    </div>
  );
}

const wrapStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "var(--space-6) var(--space-4)",
  minHeight: "200px",
};

const iconWrapStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "48px",
  height: "48px",
  borderRadius: "var(--radius-lg)",
  background: "var(--neutral-subtle)",
  color: "var(--text-muted)",
  marginBottom: "var(--space-3)",
};

const iconStyle = {
  fontSize: "22px",
};

const titleStyle = {
  margin: 0,
  fontSize: "15px",
  fontWeight: 700,
  color: "var(--text-primary)",
  lineHeight: 1.3,
};

const descStyle = {
  margin: "var(--space-2) 0 0",
  fontSize: "13px",
  color: "var(--text-secondary)",
  lineHeight: 1.5,
  maxWidth: "320px",
};

const actionStyle = {
  marginTop: "var(--space-4)",
};

export default EmptyState;
