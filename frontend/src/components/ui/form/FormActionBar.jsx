function FormActionBar({ children, className = "", align = "start" }) {
  const alignClass = align === "end" ? " form-action-bar-v3--end" : "";

  return (
    <div className={`form-action-bar-v3${alignClass}${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}

export default FormActionBar;
