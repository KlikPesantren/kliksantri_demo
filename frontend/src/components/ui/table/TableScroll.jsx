function TableScroll({ children, className = "", sticky = false, matrix = false }) {
  const classes = [
    "table-scroll-v3",
    sticky ? "table-scroll-v3--sticky" : "",
    matrix ? "table-scroll-v3--matrix" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
}

export default TableScroll;
