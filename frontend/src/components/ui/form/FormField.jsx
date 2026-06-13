function FormField({
  label,
  htmlFor,
  required = false,
  helper,
  error,
  children,
  className = "",
  fullWidth = false,
}) {
  return (
    <div
      className={`form-field-v3${fullWidth ? " form-field-v3--full" : ""}${className ? ` ${className}` : ""}`}
    >
      {label && (
        <label className="form-field-v3__label" htmlFor={htmlFor}>
          {label}
          {required && <span className="form-field-v3__required"> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="form-field-v3__error" role="alert">
          {error}
        </p>
      ) : helper ? (
        <p className="form-field-v3__helper">{helper}</p>
      ) : null}
    </div>
  );
}

export default FormField;
