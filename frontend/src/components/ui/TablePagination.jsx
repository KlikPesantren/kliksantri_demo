import Button from "./Button";

function TablePagination({
  page = 1,
  pageSize = 10,
  totalItems = 0,
  onPageChange,
  siblingCount = 1,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalItems);

  const go = (next) => {
    if (typeof onPageChange === "function") {
      onPageChange(Math.min(Math.max(1, next), totalPages));
    }
  };

  const pages = buildPageRange(safePage, totalPages, siblingCount);

  return (
    <div style={wrapStyle}>
      <span style={summaryStyle}>
        Menampilkan {start}-{end} dari {totalItems}
      </span>
      <div style={controlsStyle}>
        <Button
          variant="outline"
          size="sm"
          disabled={safePage <= 1}
          onClick={() => go(safePage - 1)}
        >
          Prev
        </Button>
        {pages.map((p, index) =>
          p === "..." ? (
            <span key={`ellipsis-${index}`} style={ellipsisStyle}>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => go(p)}
              style={{
                ...pageButtonStyle,
                ...(p === safePage ? pageButtonActiveStyle : {}),
              }}
            >
              {p}
            </button>
          ),
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={safePage >= totalPages}
          onClick={() => go(safePage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function buildPageRange(current, total, siblingCount) {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set([1, total, current]);
  for (let i = 1; i <= siblingCount; i += 1) {
    if (current - i > 1) pages.add(current - i);
    if (current + i < total) pages.add(current + i);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];

  sorted.forEach((p, index) => {
    const prev = sorted[index - 1];
    if (prev && p - prev > 1) result.push("...");
    result.push(p);
  });

  return result;
}

const wrapStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--space-3)",
  flexWrap: "wrap",
  marginTop: "var(--space-4)",
  paddingTop: "var(--space-4)",
  borderTop: "1px solid var(--border)",
};

const summaryStyle = {
  fontSize: "13px",
  color: "var(--text-secondary)",
};

const controlsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-2)",
  flexWrap: "wrap",
};

const pageButtonStyle = {
  minWidth: "32px",
  height: "32px",
  padding: "0 8px",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  background: "var(--surface)",
  color: "var(--text-secondary)",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};

const pageButtonActiveStyle = {
  background: "var(--primary-subtle)",
  color: "var(--accent-teal-dark)",
  borderColor: "var(--accent-teal-dark)",
};

const ellipsisStyle = {
  padding: "0 4px",
  color: "var(--text-muted)",
  fontSize: "13px",
};

export default TablePagination;
