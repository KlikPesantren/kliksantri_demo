function KpiGrid({
  children,
  minColumnWidth = 210,
  gap = 16,
  columns = "auto",
}) {
  const gapValue = typeof gap === "number" ? `${gap}px` : gap;

  const gridTemplateColumns =
    columns === "auto"
      ? `repeat(auto-fit, minmax(${minColumnWidth}px, 1fr))`
      : `repeat(${columns}, minmax(0, 1fr))`;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns,
        gap: gapValue,
        marginBottom: "var(--space-2)",
      }}
    >
      {children}
    </div>
  );
}

export default KpiGrid;
