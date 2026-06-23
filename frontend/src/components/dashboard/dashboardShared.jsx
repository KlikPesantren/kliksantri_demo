export const DASHBOARD_CARD = { padding: "md", shadow: "card", border: false, radius: "xl" };
export const DASHBOARD_PANEL = { padding: "sm", shadow: "card", border: false, radius: "xl" };
export const GRID_GAP = { gap: "var(--space-3)" };

export function ExecSectionTitle({ title, subtitle }) {
  return (
    <div className="dashboard-section-title">
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

function isToday(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getDate() === now.getDate()
    && date.getMonth() === now.getMonth()
    && date.getFullYear() === now.getFullYear()
  );
}

export function computePembayaranHariIni(transaksiList) {
  return (transaksiList || [])
    .filter((item) => isToday(item.tanggal) && String(item.jenis || "").toLowerCase() === "masuk")
    .reduce((sum, item) => sum + Number(item.nominal || 0), 0);
}

export function computeTagihanBelumLunas(pembayaranList) {
  return (pembayaranList || []).filter((item) => {
    const status = String(item.status || "").toLowerCase();
    return status !== "lunas" && !status.includes("lunas");
  }).length;
}

export function DashboardCompactList({ items, emptyNote = "Belum ada data." }) {
  if (!items.length) {
    return <p className="dashboard-empty-note">{emptyNote}</p>;
  }

  return (
    <div className="dashboard-violations-list">
      {items.map((item, index, arr) => (
        <div
          key={item.key}
          className={`dashboard-violation-row${index < arr.length - 1 ? " dashboard-violation-row--bordered" : ""}`}
        >
          <div className="dashboard-compact-list-main">
            <span className="dashboard-pelanggar-name">{item.title}</span>
            {item.subtitle && (
              <span className="dashboard-compact-list-sub">{item.subtitle}</span>
            )}
          </div>
          {item.meta && (
            <span className="dashboard-violation-poin">{item.meta}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export function buildSahriyahDonut(pembayaranList, totalPembayaran, totalTunggakan) {
  const counts = { lunas: 0, cicilan: 0, belum: 0 };

  pembayaranList.forEach((p) => {
    const s = String(p.status || "").toLowerCase();
    if (s === "lunas") counts.lunas += 1;
    else if (s.includes("cicil")) counts.cicilan += 1;
    else counts.belum += 1;
  });

  const countTotal = counts.lunas + counts.cicilan + counts.belum;

  const slices = countTotal > 0
    ? [
        { label: "Lunas", value: counts.lunas, color: "var(--primary)" },
        { label: "Cicilan", value: counts.cicilan, color: "var(--warning)" },
        { label: "Belum Bayar", value: counts.belum, color: "var(--danger)" },
      ]
    : [
        { label: "Lunas", value: Number(totalPembayaran) || 0, color: "var(--primary)" },
        { label: "Cicilan", value: 0, color: "var(--warning)" },
        { label: "Belum Bayar", value: Number(totalTunggakan) || 0, color: "var(--danger)" },
      ];

  const sliceTotal = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  const mappedSlices = slices.map((slice) => ({
    ...slice,
    pct: Math.round((slice.value / sliceTotal) * 100),
  }));

  const lunasPct = mappedSlices.find((s) => s.label === "Lunas")?.pct ?? 0;

  return {
    slices: mappedSlices,
    totalPembayaran: Number(totalPembayaran) || 0,
    lunasPct,
  };
}

export function DonutChart({ slices, size = 120, centerLabel }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  let cursor = 0;
  const gradientStops = slices
    .map((slice) => {
      const start = cursor;
      cursor += (slice.value / total) * 100;
      return `${slice.color} ${start}% ${cursor}%`;
    })
    .join(", ");

  return (
    <div
      className="dashboard-donut-chart-ring"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: gradientStops ? `conic-gradient(${gradientStops})` : "var(--border)",
        position: "relative",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: `${size * 0.21}px`,
          borderRadius: "50%",
          background: "var(--card)",
        }}
      />
      {centerLabel && (
        <div className="dashboard-donut-center">
          <span className="dashboard-donut-center__value">{centerLabel.value}</span>
          {centerLabel.subtitle && (
            <span className="dashboard-donut-center__subtitle">{centerLabel.subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}
