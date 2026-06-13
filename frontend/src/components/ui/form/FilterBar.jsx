function FilterBar({ label = "Filter", children, className = "", actions = null }) {
  return (
    <div className={`filter-bar-v3${className ? ` ${className}` : ""}`}>
      <div className="filter-bar-v3__label">{label}</div>
      <div className="filter-bar-v3__fields">{children}</div>
      {actions && <div className="filter-bar-v3__actions">{actions}</div>}
    </div>
  );
}

export default FilterBar;
