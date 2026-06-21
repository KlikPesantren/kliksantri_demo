import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import Card from "../components/ui/Card";
import KpiCard from "../components/ui/KpiCard";
import KpiGrid from "../components/ui/KpiGrid";
import SectionHeading from "../components/ui/SectionHeading";
import StatusBadge from "../components/ui/StatusBadge";
import { KeuanganPageStyles } from "../components/shared/PageResponsiveStyles";
import { FormField, Select, FilterBar } from "../components/ui/form";
import { formatCurrency, formatNumber } from "../utils/formatCurrency";

const BULAN_OPTIONS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const TAHUN_OPTIONS = [2025, 2026, 2027, 2028];

function KasCard({ title, subtitle, data, accent = "neutral", badge = null }) {
  if (!data) return null;

  return (
    <Card padding="md" shadow="card" border={false} radius="xl">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <div>
          <SectionHeading variant="eyebrow" spacing="first">
            {title}
          </SectionHeading>
          {subtitle && (
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
              {subtitle}
            </p>
          )}
        </div>
        {badge}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "var(--space-4)",
          marginTop: "var(--space-4)",
        }}
      >
        <div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
            Pemasukan Bulan
          </div>
          <div style={{ fontWeight: 700, color: "var(--success)" }}>
            {formatCurrency(data.pemasukan_bulan)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
            Pengeluaran Bulan
          </div>
          <div style={{ fontWeight: 700, color: "var(--danger)" }}>
            {formatCurrency(data.pengeluaran_bulan)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
            Saldo Bulan
          </div>
          <div style={{ fontWeight: 700, color: "var(--primary)" }}>
            {formatCurrency(data.saldo_bulan)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
            Saldo All Time
          </div>
          <div style={{ fontWeight: 700 }}>{formatCurrency(data.saldo_akhir_alltime)}</div>
        </div>
      </div>
    </Card>
  );
}

function KasInstansiKonsolidasiPage() {
  const [data, setData] = useState(null);
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/kas-instansi/konsolidasi", {
        params: { bulan, tahun },
      });
      setData(res.data?.data || null);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Gagal memuat konsolidasi yayasan");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [bulan, tahun]);

  useEffect(() => {
    load();
  }, [load]);

  const bulanLabel = BULAN_OPTIONS[bulan - 1];
  const allKasCards = data
    ? [data.kas_pondok, ...(data.units || [])]
    : [];

  return (
    <AppShell
      title="Konsolidasi Yayasan"
      breadcrumb="Keuangan / Konsolidasi Yayasan"
    >
      <KeuanganPageStyles />
      <div className="keuangan-page">
        <Card padding="md" shadow="card" border={false} radius="xl">
          <FilterBar label="Periode">
            <FormField label="Bulan" htmlFor="konsolidasi-bulan">
              <Select
                id="konsolidasi-bulan"
                value={bulan}
                onChange={(e) => setBulan(Number(e.target.value))}
                aria-label="Bulan"
              >
                {BULAN_OPTIONS.map((label, i) => (
                  <option key={label} value={i + 1}>
                    {label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Tahun" htmlFor="konsolidasi-tahun">
              <Select
                id="konsolidasi-tahun"
                value={tahun}
                onChange={(e) => setTahun(Number(e.target.value))}
                aria-label="Tahun"
              >
                {TAHUN_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </FormField>
          </FilterBar>
          <p
            style={{
              marginTop: "var(--space-3)",
              fontSize: "13px",
              color: "var(--text-secondary)",
            }}
          >
            Mode lihat saja — agregat Kas Pondok + seluruh unit pendidikan.{" "}
            <Link to="/kas-instansi" style={{ color: "var(--primary)" }}>
              Kelola transaksi unit →
            </Link>
          </p>
        </Card>

        {error && (
          <div
            style={{
              marginTop: "var(--space-4)",
              padding: "12px 16px",
              borderRadius: "var(--radius-lg)",
              background: "rgba(239, 68, 68, 0.08)",
              color: "var(--danger)",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div
            style={{
              marginTop: "var(--space-6)",
              color: "var(--text-secondary)",
              padding: "var(--space-4)",
            }}
          >
            Memuat konsolidasi yayasan...
          </div>
        ) : data ? (
          <>
            <div style={{ marginTop: "var(--space-6)" }}>
              <SectionHeading variant="eyebrow" spacing="first">
                KPI Yayasan — {bulanLabel} {tahun}
              </SectionHeading>
              <div style={{ marginTop: "var(--space-4)" }}>
                <KpiGrid>
                  <KpiCard
                    label="Total Kas Yayasan"
                    value={formatCurrency(data.kpi?.total_kas_yayasan ?? 0)}
                    accent="primary"
                  />
                  <KpiCard
                    label="Total Pemasukan Bulan"
                    value={formatCurrency(data.kpi?.total_pemasukan_bulan ?? 0)}
                    accent="success"
                  />
                  <KpiCard
                    label="Total Pengeluaran Bulan"
                    value={formatCurrency(data.kpi?.total_pengeluaran_bulan ?? 0)}
                    accent="danger"
                  />
                  <KpiCard
                    label="Unit Instansi Aktif"
                    value={formatNumber(data.kpi?.jumlah_unit_aktif ?? 0)}
                    accent="neutral"
                  />
                </KpiGrid>
              </div>
            </div>

            <div style={{ marginTop: "var(--space-6)" }}>
              <SectionHeading variant="eyebrow" spacing="first">
                Kartu Kas
              </SectionHeading>
              <div
                style={{
                  display: "grid",
                  gap: "var(--space-4)",
                  marginTop: "var(--space-4)",
                }}
              >
                {allKasCards.map((item) => (
                  <KasCard
                    key={item.kode}
                    title={item.label || item.nama}
                    subtitle={
                      item.source === "buku_kas"
                        ? "Sumber: Buku Kas Pesantren (read-only)"
                        : `Unit ${item.kode}`
                    }
                    data={item}
                    badge={
                      <StatusBadge status="aktif">Read-only</StatusBadge>
                    }
                  />
                ))}
              </div>
            </div>

            <div style={{ marginTop: "var(--space-6)" }}>
              <SectionHeading variant="eyebrow" spacing="first">
                Ringkasan Keuangan per Kas
              </SectionHeading>
              <div style={{ marginTop: "var(--space-4)" }}>
              <Card padding="md" shadow="card" border={false} radius="xl">
                <div style={{ overflowX: "auto" }}>
                  <table className="table-v3" style={{ width: "100%", minWidth: "640px" }}>
                    <thead>
                      <tr>
                        <th>Kas</th>
                        <th>Pemasukan Bulan</th>
                        <th>Pengeluaran Bulan</th>
                        <th>Saldo Bulan</th>
                        <th>Saldo All Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allKasCards.map((item) => (
                        <tr key={item.kode}>
                          <td className="table-v3__cell--strong">
                            {item.label || item.nama}
                          </td>
                          <td>{formatCurrency(item.pemasukan_bulan)}</td>
                          <td>{formatCurrency(item.pengeluaran_bulan)}</td>
                          <td>{formatCurrency(item.saldo_bulan)}</td>
                          <td>{formatCurrency(item.saldo_akhir_alltime)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
              </div>
            </div>

            <div style={{ marginTop: "var(--space-6)" }}>
              <SectionHeading variant="eyebrow" spacing="first">
                Total Yayasan
              </SectionHeading>
              <div style={{ marginTop: "var(--space-4)" }}>
                <KpiGrid>
                  <KpiCard
                    label="Total Pemasukan Bulan"
                    value={formatCurrency(data.total_yayasan?.pemasukan_bulan ?? 0)}
                    accent="success"
                  />
                  <KpiCard
                    label="Total Pengeluaran Bulan"
                    value={formatCurrency(data.total_yayasan?.pengeluaran_bulan ?? 0)}
                    accent="danger"
                  />
                  <KpiCard
                    label="Total Saldo Bulan"
                    value={formatCurrency(data.total_yayasan?.saldo_bulan ?? 0)}
                    accent="primary"
                  />
                  <KpiCard
                    label="Total Kas Yayasan (All Time)"
                    value={formatCurrency(data.total_yayasan?.saldo_akhir_alltime ?? 0)}
                    accent="neutral"
                  />
                </KpiGrid>
              </div>
              <p
                style={{
                  marginTop: "var(--space-3)",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                }}
              >
                Total Yayasan = Kas Pondok + seluruh unit pendidikan aktif. Agregat organisasi,
                bukan rekening tunggal.
              </p>
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

export default KasInstansiKonsolidasiPage;
