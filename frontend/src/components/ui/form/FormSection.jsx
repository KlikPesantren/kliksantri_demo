function FormSection({ title, description, children, className = "" }) {
  return (
    <section className={`form-section-v3${className ? ` ${className}` : ""}`}>
      {(title || description) && (
        <header className="form-section-v3__header">
          {title && <h3 className="form-section-v3__title">{title}</h3>}
          {description && <p className="form-section-v3__desc">{description}</p>}
        </header>
      )}
      {children}
    </section>
  );
}

export default FormSection;
