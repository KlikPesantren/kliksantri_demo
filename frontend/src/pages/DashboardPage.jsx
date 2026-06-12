import { useEffect, useState } from "react";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import KpiCard from "../components/ui/KpiCard";
import KpiGrid from "../components/ui/KpiGrid";
import SectionHeading from "../components/ui/SectionHeading";
import Card from "../components/ui/Card";

const DASHBOARD_CARD = { padding: "md", shadow: "card", border: false, radius: "xl" };
const SECTION_GAP = { marginTop: "var(--space-6)" };
const GRID_GAP = { gap: "var(--space-4)" };

const METRIC_STRIP_ITEM = {
  height: "90px",
  background: "var(--surface)",
  borderRadius: "var(--radius-xl)",
  boxShadow: "var(--shadow-card)",
  padding: "14px 18px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  boxSizing: "border-box",
};

const METRIC_LABEL = {
  fontSize: "11px",
  fontWeight: 600,
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  lineHeight: 1.2,
};

const METRIC_VALUE = {
  fontSize: "22px",
  fontWeight: 800,
  color: "var(--text-primary)",
  marginTop: "4px",
  lineHeight: 1.1,
  letterSpacing: "-0.02em",
};

function ExecSectionTitle({ title, subtitle }) {
  return (
    <div style={{ marginBottom: "var(--space-3)" }}>
      <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function buildSahriyahDonut(pembayaranList, totalPembayaran, totalTunggakan) {
  const counts = { sudah: 0, cicilan: 0, belum: 0 };

  pembayaranList.forEach((p) => {
    const s = String(p.status || "").toLowerCase();
    if (s === "lunas") counts.sudah += 1;
    else if (s.includes("cicil")) counts.cicilan += 1;
    else counts.belum += 1;
  });

  const countTotal = counts.sudah + counts.cicilan + counts.belum;

  const slices = countTotal > 0
    ? [
        { label: "Sudah Bayar", value: counts.sudah, color: "#16A34A" },
        { label: "Cicilan", value: counts.cicilan, color: "#64748B" },
        { label: "Belum Bayar", value: counts.belum, color: "#CBD5E1" },
      ]
    : [
        { label: "Sudah Bayar", value: Number(totalPembayaran) || 0, color: "#16A34A" },
        { label: "Cicilan", value: 0, color: "#64748B" },
        { label: "Belum Bayar", value: Number(totalTunggakan) || 0, color: "#CBD5E1" },
      ];

  const sliceTotal = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;

  return {
    slices: slices.map((slice) => ({
      ...slice,
      pct: Math.round((slice.value / sliceTotal) * 100),
    })),
    totalPembayaran: Number(totalPembayaran) || 0,
  };
}

function DonutChart({ slices, size = 148 }) {
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
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: gradientStops ? `conic-gradient(${gradientStops})` : "#E5E7EB",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: size * 0.58,
          height: size * 0.58,
          borderRadius: "50%",
          background: "var(--surface)",
        }}
      />
    </div>
  );
}

function DashboardResponsiveStyles() {
  return (
    <style>{`
      .dashboard-page {
        min-width: 0;
        max-width: 100%;
      }

      .dashboard-metric-strip {
        display: grid;
        gap: var(--space-4);
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .dashboard-metric-item {
        min-width: 0;
      }

      .dashboard-metric-value {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .dashboard-row-2 {
        display: grid;
        gap: var(--space-4);
        grid-template-columns: minmax(0, 65fr) minmax(0, 35fr);
      }

      .dashboard-donut-layout {
        display: flex;
        align-items: center;
        gap: var(--space-5);
        flex-wrap: wrap;
        min-width: 0;
      }

      .dashboard-donut-legend {
        flex: 1;
        min-width: 0;
      }

      .dashboard-cashflow-wrap {
        min-width: 0;
      }

      .dashboard-cashflow-bars {
        display: flex;
        gap: 4px;
        align-items: flex-end;
        flex: 1;
        min-width: 0;
      }

      .dashboard-pelanggar-name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .dashboard-cashflow-month {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        min-width: 0;
        height: 100%;
      }

      @media (max-width: 1024px) {
        .dashboard-metric-strip {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .dashboard-row-2 {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 767px) {
        .dashboard-metric-strip {
          grid-template-columns: minmax(0, 1fr);
        }

        .dashboard-metric-item {
          height: auto !important;
          min-height: 72px;
        }

        .dashboard-metric-value {
          font-size: 18px !important;
          white-space: normal;
          overflow: visible;
          text-overflow: unset;
          word-break: break-word;
        }

        .dashboard-donut-layout {
          flex-direction: column;
          align-items: stretch;
        }

        .dashboard-donut-chart {
          align-self: center;
        }

        .dashboard-cashflow-wrap {
          height: auto !important;
        }

        .dashboard-cashflow-bars {
          gap: 2px;
        }

        .dashboard-cashflow-month span {
          font-size: 9px !important;
        }

        .dashboard-pelanggar-name {
          white-space: normal;
          overflow: visible;
          text-overflow: unset;
          word-break: break-word;
        }
      }
    `}</style>
  );
}

function MetricStrip({ metrics }) {
  return (
    <div className="dashboard-metric-strip">
      {metrics.map((metric) => (
        <div key={metric.label} style={METRIC_STRIP_ITEM} className="dashboard-metric-item">
          <span style={METRIC_LABEL}>{metric.label}</span>
          <span style={METRIC_VALUE} className="dashboard-metric-value">
            {metric.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function DashboardPage() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [summary, setSummary] = useState({
    total_santri: 0,
    santri_aktif: 0,
    santri_non_aktif: 0,
    total_kelas: 0,
    total_wali: 0,
    total_saldo: 0,
    persentase_kehadiran_santri: 0,
    persentase_kehadiran_guru: 0,
    total_hafalan: 0,
    rata_nilai: 0,
    absensi_hari_ini: 0,
    nilai_terisi: 0,
    total_wali_akun: 0,
    wali_belum_ganti_pin: 0,
    santri_poin_tertinggi: [],
    kas_masuk: 0,
    kas_keluar: 0,
    saldo_kas: 0,
    total_pembayaran: 0,
    total_tunggakan: 0,
    total_pelanggaran: 0,
    total_perizinan: 0,
    belum_kembali: 0,
    tamu_hari_ini: 0,
    tamu_bulan_ini: 0,
    tamu_masih_didalam: 0,
    grafik_kas: [],
    transaksi_terbaru: [],
    pembayaran_terbaru: [],
    top_tunggakan: [],
  });

  const transaksiTerbaru = summary?.transaksi_terbaru || [];
  const pembayaranTerbaru = summary?.pembayaran_terbaru || [];
  const topTunggakan = summary?.top_tunggakan || [];

  const grafikKas = (summary?.grafik_kas || []).map((item) => ({
    bulan: ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][
      Number(item.bulan)
    ],
    masuk: Number(item.masuk),
    keluar: Number(item.keluar),
  }));

  const getSummary = async () => {
    try {
      const response = await api.get("/dashboard/summary");
      console.log("SUMMARY:", response.data);
      setSummary(response.data.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getSummary();
  }, []);

  const fmtRp = (n) => Number(n || 0).toLocaleString("id-ID");

  return (
    <AppShell title="Dashboard" breadcrumb="Dashboard">
      <DashboardResponsiveStyles />
      {user?.role === "superadmin" && (() => {
        const maxBar = Math.max(...grafikKas.map((i) => Math.max(i.masuk, i.keluar)), 1);
        const chartBarHeight = 200;
        const sahriyahDonut = buildSahriyahDonut(
          pembayaranTerbaru,
          summary.total_pembayaran,
          summary.total_tunggakan,
        );
        const topPelanggar = (summary.santri_poin_tertinggi || []).slice(0, 5);

        return (
          <div className="dashboard-page" style={{ display: "flex", flexDirection: "column", ...GRID_GAP }}>
            {/* Row 1 — KPI strip */}
            <MetricStrip
              metrics={[
                { label: "Total Santri", value: summary.total_santri },
                { label: "Santri Belum Kembali", value: summary.belum_kembali || 0 },
                { label: "Saldo Buku Kas", value: `Rp ${fmtRp(summary.saldo_kas)}` },
                { label: "Total Tunggakan", value: `Rp ${fmtRp(summary.total_tunggakan)}` },
              ]}
            />

            {/* Row 2 — Sahriyah donut + Top pelanggar */}
            <div className="dashboard-row-2" style={{ ...GRID_GAP, ...SECTION_GAP, marginTop: 0 }}>
              <Card {...DASHBOARD_CARD}>
                <ExecSectionTitle title="Status Pembayaran Sahriyah" />
                <div className="dashboard-donut-layout">
                  <div className="dashboard-donut-chart">
                    <DonutChart slices={sahriyahDonut.slices} />
                  </div>
                  <div className="dashboard-donut-legend">
                    {sahriyahDonut.slices.map((slice) => (
                      <div
                        key={slice.label}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px 0",
                          fontSize: "13px",
                          color: "var(--text-primary)",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: slice.color,
                              flexShrink: 0,
                            }}
                          />
                          {slice.label}
                        </span>
                        <span style={{ fontWeight: 700, color: "var(--text-secondary)" }}>{slice.pct}%</span>
                      </div>
                    ))}
                    <div
                      style={{
                        marginTop: "var(--space-3)",
                        paddingTop: "var(--space-3)",
                        borderTop: "1px solid var(--border)",
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Total pembayaran{" "}
                      <strong style={{ color: "var(--text-primary)" }}>
                        Rp {fmtRp(sahriyahDonut.totalPembayaran)}
                      </strong>
                    </div>
                  </div>
                </div>
              </Card>

              <Card {...DASHBOARD_CARD}>
                <ExecSectionTitle title="Top 5 Pelanggar" />
                {topPelanggar.length === 0 ? (
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
                    Belum ada data pelanggaran.
                  </p>
                ) : (
                  topPelanggar.map((item, index, arr) => (
                    <div
                      key={`${item.nama}-${index}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 0",
                        borderBottom: index < arr.length - 1 ? "1px solid var(--border)" : "none",
                        fontSize: "13px",
                      }}
                    >
                      <span className="dashboard-pelanggar-name" style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                        {item.nama}
                      </span>
                      <span style={{ fontWeight: 700, color: "var(--text-secondary)" }}>
                        {item.jumlah_pelanggaran} poin
                      </span>
                    </div>
                  ))
                )}
              </Card>
            </div>

            {/* Row 3 — Arus Keuangan */}
            {grafikKas.length > 0 && (
              <div style={SECTION_GAP}>
                <ExecSectionTitle title="Arus Keuangan" />
                <Card {...DASHBOARD_CARD}>
                  <div
                    className="dashboard-cashflow-wrap"
                    style={{ height: "260px", display: "flex", flexDirection: "column" }}
                  >
                    <div
                      className="dashboard-cashflow-bars"
                      style={{ minHeight: chartBarHeight }}
                    >
                      {grafikKas.map((item) => (
                        <div key={item.bulan} className="dashboard-cashflow-month">
                          <div
                            style={{
                              display: "flex",
                              gap: "2px",
                              alignItems: "flex-end",
                              flex: 1,
                              width: "100%",
                              justifyContent: "center",
                            }}
                          >
                            <div
                              title={`Masuk: Rp ${fmtRp(item.masuk)}`}
                              style={{
                                width: "10px",
                                maxWidth: "40%",
                                background: "#22C55E",
                                height: `${Math.max((item.masuk / maxBar) * chartBarHeight, 3)}px`,
                                borderRadius: "3px 3px 0 0",
                              }}
                            />
                            <div
                              title={`Keluar: Rp ${fmtRp(item.keluar)}`}
                              style={{
                                width: "10px",
                                maxWidth: "40%",
                                background: "#94A3B8",
                                height: `${Math.max((item.keluar / maxBar) * chartBarHeight, 3)}px`,
                                borderRadius: "3px 3px 0 0",
                              }}
                            />
                          </div>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "6px" }}>
                            {item.bulan}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "var(--space-4)",
                        marginTop: "var(--space-3)",
                        paddingTop: "var(--space-2)",
                        borderTop: "1px solid var(--border)",
                      }}
                    >
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "5px" }}>
                        <span style={{ width: "8px", height: "8px", background: "#22C55E", borderRadius: "2px" }} />
                        Pemasukan
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "5px" }}>
                        <span style={{ width: "8px", height: "8px", background: "#94A3B8", borderRadius: "2px" }} />
                        Pengeluaran
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        );
      })()}

      {user?.role === "sekretaris" && (
        <KpiGrid minColumnWidth={250} gap={20}>
          <KpiCard layout="classic" label="Total Santri" value={summary.total_santri} />
          <KpiCard layout="classic" label="Total Kelas" value={summary.total_kelas} />
          <KpiCard layout="classic" label="Total Wali" value={summary.total_wali || 0} />
        </KpiGrid>
      )}

      {user?.role === "keuangan" && (
        <KpiGrid minColumnWidth={250} gap={20}>
          <KpiCard layout="classic" label="Kas Masuk Bulan Ini" value={`Rp ${Number(summary.kas_masuk || 0).toLocaleString()}`} />
          <KpiCard layout="classic" label="Kas Keluar Bulan Ini" value={`Rp ${Number(summary.kas_keluar || 0).toLocaleString()}`} />
          <KpiCard layout="classic" label="Saldo Kas" value={`Rp ${Number(summary.saldo_kas || 0).toLocaleString()}`} />
          <KpiCard layout="classic" label="Pembayaran Sahriyah" value={`Rp ${Number(summary.total_pembayaran || 0).toLocaleString()}`} />
          <KpiCard layout="classic" label="Tunggakan Sahriyah" value={`Rp ${Number(summary.total_tunggakan || 0).toLocaleString()}`} />
        </KpiGrid>
      )}

      {user?.role === "keuangan" && (
        <div style={{ marginTop: "var(--space-5)" }}>
          <Card {...DASHBOARD_CARD}>
            <SectionHeading variant="eyebrow" spacing="first">Transaksi Terbaru</SectionHeading>
            <div style={{ overflowX: "auto", marginTop: "var(--space-4)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Jenis</th>
                    <th>Kategori</th>
                    <th>Keterangan</th>
                    <th>Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {transaksiTerbaru.map((item) => (
                    <tr key={item.id}>
                      <td>{new Date(item.tanggal).toLocaleDateString("id-ID")}</td>
                      <td>{item.jenis}</td>
                      <td>{item.kategori}</td>
                      <td>{item.keterangan}</td>
                      <td>Rp {Number(item.nominal).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {user?.role === "keuangan" && (
        <div style={{ marginTop: "var(--space-5)" }}>
          <Card {...DASHBOARD_CARD}>
            <SectionHeading variant="eyebrow" spacing="first">Pembayaran Terbaru</SectionHeading>
            <div style={{ overflowX: "auto", marginTop: "var(--space-4)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th>Santri</th>
                    <th>Tagihan</th>
                    <th>Dibayar</th>
                    <th>Sisa</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pembayaranTerbaru.map((item) => (
                    <tr key={item.id}>
                      <td>{item.nama}</td>
                      <td>{item.nama_tagihan}</td>
                      <td>Rp {Number(item.nominal_bayar).toLocaleString()}</td>
                      <td>Rp {Number(item.sisa_tunggakan).toLocaleString()}</td>
                      <td>{item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {user?.role === "keuangan" && (
        <div style={{ marginTop: "var(--space-5)" }}>
          <Card {...DASHBOARD_CARD}>
            <SectionHeading variant="eyebrow" spacing="first">Top 10 Tunggakan Terbesar</SectionHeading>
            <div style={{ overflowX: "auto", marginTop: "var(--space-4)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Tunggakan</th>
                  </tr>
                </thead>
                <tbody>
                  {topTunggakan.map((item, index) => (
                    <tr key={index}>
                      <td>{item.nama}</td>
                      <td>Rp {Number(item.sisa_tagihan).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {user?.role === "pendidikan" && (
        <KpiGrid minColumnWidth={250} gap={20}>
          <KpiCard layout="classic" label="Kehadiran Santri" value={`${summary.persentase_kehadiran_santri}%`} />
          <KpiCard layout="classic" label="Kehadiran Guru" value={`${summary.persentase_kehadiran_guru}%`} />
          <KpiCard layout="classic" label="Total Hafalan" value={summary.total_hafalan} />
          <KpiCard layout="classic" label="Rata-rata Nilai" value={summary.rata_nilai} />
        </KpiGrid>
      )}

      {user?.role === "keamanan" && (
        <KpiGrid minColumnWidth={250} gap={20}>
          <KpiCard layout="classic" label="Belum Kembali" value={summary.belum_kembali} />
          <KpiCard layout="classic" label="Perizinan Bulan Ini" value={summary.total_perizinan} />
          <KpiCard layout="classic" label="Pelanggaran Bulan Ini" value={summary.total_pelanggaran} />
          <KpiCard layout="classic" label="Santri Melanggar" value={`${summary.persentase_melanggar}%`} />
          <KpiCard layout="classic" label="Tamu Hari Ini" value={summary.tamu_hari_ini || 0} />
          <KpiCard layout="classic" label="Tamu Bulan Ini" value={summary.tamu_bulan_ini || 0} />
          <KpiCard layout="classic" label="Tamu Masih Di Dalam" value={summary.tamu_masih_didalam || 0} />
        </KpiGrid>
      )}
    </AppShell>
  );
}

export default DashboardPage;
