export default function Modal({ open, title, onClose, children, width = 480 }) {
  if (!open) return null;

  return (
    <div
      style={overlayStyle}
      onClick={onClose}
    >
      <div
        style={{ ...panelStyle, maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={headerStyle}>
          <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#0f172a" }}>
            {title}
          </h3>
          <button type="button" onClick={onClose} style={closeBtnStyle} aria-label="Tutup">
            ×
          </button>
        </div>
        <div style={{ padding: "20px 24px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: "20px",
};

const panelStyle = {
  background: "white",
  borderRadius: "14px",
  width: "100%",
  boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
  maxHeight: "90vh",
  overflowY: "auto",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "18px 24px",
  borderBottom: "1px solid #e2e8f0",
};

const closeBtnStyle = {
  background: "none",
  border: "none",
  fontSize: "24px",
  lineHeight: 1,
  cursor: "pointer",
  color: "#64748b",
  padding: "0 4px",
};
