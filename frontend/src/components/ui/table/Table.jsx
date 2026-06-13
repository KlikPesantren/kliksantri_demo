function Table({ children, className = "" }) {
  return (
    <table className={`table-v3${className ? ` ${className}` : ""}`}>
      {children}
    </table>
  );
}

export default Table;
