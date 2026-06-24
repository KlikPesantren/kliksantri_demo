function Table({ children, className = "", ...rest }) {
  return (
    <table className={`table-v3${className ? ` ${className}` : ""}`} {...rest}>
      {children}
    </table>
  );
}

export default Table;
