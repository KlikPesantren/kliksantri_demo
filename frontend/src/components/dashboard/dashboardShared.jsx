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

export function buildSahriyahDonut(_pembayaranList, sahriyahStatus, totalPembayaran, _totalTunggakan) {
  const counts = {
    lunas: Number(sahriyahStatus?.lunas || 0),
    cicilan: Number(sahriyahStatus?.cicilan || 0),
    belum: Number(sahriyahStatus?.belum_bayar || 0),
  };

  const slices = [
    { label: "Lunas", value: counts.lunas, color: "var(--primary)" },
    { label: "Cicilan", value: counts.cicilan, color: "var(--warning)" },
    { label: "Belum Bayar", value: counts.belum, color: "var(--danger)" },
  ];

  const totalSantri = Number(sahriyahStatus?.total_santri || 0);
  const denominator = totalSantri || slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  const mappedSlices = slices.map((slice) => ({
    ...slice,
    pct: Math.round((slice.value / denominator) * 100),
  }));

  const lunasPct = mappedSlices.find((s) => s.label === "Lunas")?.pct ?? 0;

  return {
    slices: mappedSlices,
    totalSantri,
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
