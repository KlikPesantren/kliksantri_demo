function FormGrid({ children, className = "", columns = "auto", style }) {
  const colClass =
    columns === "single"
      ? " form-grid-v3--single"
      : columns === "modal"
        ? " form-grid-v3--modal"
        : "";

  return (
    <div
      className={`form-grid-v3${colClass}${className ? ` ${className}` : ""}`}
      style={style}
    >
      {children}
    </div>
  );
}

export default FormGrid;
