export default function Modal({ open, title, onClose, children, width = 480 }) {
  if (!open) return null;

  return (
    <div className="modal-v3__overlay" style={overlayStyle} onClick={onClose}>
      <div
        className="modal-v3__panel"
        style={{ ...panelStyle, maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-v3-title"
      >
        <div className="modal-v3__header">
          <h3 id="modal-v3-title" className="modal-v3__title">
            {title}
          </h3>
          <button type="button" onClick={onClose} className="modal-v3__close" aria-label="Tutup">
            ×
          </button>
        </div>
        <div className="modal-v3__body">{children}</div>
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
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  width: "100%",
  boxShadow: "var(--shadow-lg)",
  maxHeight: "90vh",
  overflowY: "auto",
  color: "var(--text-primary)",
};
