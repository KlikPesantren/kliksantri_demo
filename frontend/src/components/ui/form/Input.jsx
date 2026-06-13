function Input({ className = "", ...rest }) {
  return (
    <input
      className={`form-control-v3${className ? ` ${className}` : ""}`}
      {...rest}
    />
  );
}

export default Input;
