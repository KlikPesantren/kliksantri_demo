function Select({ className = "", children, ...rest }) {
  return (
    <select
      className={`form-control-v3 form-select-v3${className ? ` ${className}` : ""}`}
      {...rest}
    >
      {children}
    </select>
  );
}

export default Select;
