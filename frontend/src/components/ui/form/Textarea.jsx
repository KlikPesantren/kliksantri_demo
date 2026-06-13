function Textarea({ className = "", rows = 3, ...rest }) {
  return (
    <textarea
      rows={rows}
      className={`form-control-v3 form-textarea-v3${className ? ` ${className}` : ""}`}
      {...rest}
    />
  );
}

export default Textarea;
