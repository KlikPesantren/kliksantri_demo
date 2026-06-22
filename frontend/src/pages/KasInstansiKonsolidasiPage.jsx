import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaCalendarAlt } from "react-icons/fa";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import Card from "../components/ui/Card";
import KpiCard from "../components/ui/KpiCard";
import KpiGrid from "../components/ui/KpiGrid";
import SectionHeading from "../components/ui/SectionHeading";
import StatusBadge from "../components/ui/StatusBadge";
import { KeuanganPageStyles } from "../components/shared/PageResponsiveStyles";
import { OperationalPageStyles } from "../components/shared/OperationalPageStyles";
import { Select } from "../components/ui/form";
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

function KonsolidasiPageStyles() {
  return (
    <style>{`
      .konsolidasi-page {
        min-width: 0;
        max-width: 100%;
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .konsolidasi-page__toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-3);
      }

      .konsolidasi-page__filter.filter-bar-v3 {
        width: fit-content;
        max-width: 100%;
        flex: 0 0 auto;
        margin: 0;
        padding: 10px var(--space-4);
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 20px;
        box-shadow: 0 2px 16px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.04);
        gap: var(--space-3);
      }

      .konsolidasi-page__filter .filter-bar-v3__label {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        margin: 0;
      }

      .konsolidasi-page__filter .filter-bar-v3__fields {
        flex: 0 0 auto;
        gap: var(--space-2);
      }

      .konsolidasi-page__filter .form-select-v3 {
        flex: 0 0 auto;
        width: auto;
        min-width: 0;
        max-width: none;
      }

      .konsolidasi-page__filter .form-select-v3--bulan {
        min-width: 148px;
        max-width: 180px;
      }

      .konsolidasi-page__filter .form-select-v3--tahun {
        min-width: 88px;
        max-width: 108px;
      }

      .konsolidasi-page__hint {
        margin: 0;
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.45;
        flex: 1 1 220px;
        min-width: 0;
      }

      .konsolidasi-page__section {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      @media (max-width: 767px) {
        .konsolidasi-page__toolbar {
          flex-direction: column;
          align-items: stretch;
        }

        .konsolidasi-page__filter.filter-bar-v3 {
          width: 100%;
        }

        .konsolidasi-page__filter .filter-bar-v3__fields {
          flex: 1 1 auto;
        }

        .konsolidasi-page__filter .form-select-v3--bulan,
        .konsolidasi-page__filter .form-select-v3--tahun {
          flex: 1 1 calc(50% - var(--space-1));
          max-width: none;
        }
      }
    `}</style>
  );
}

function KonsolidasiPeriodFilter({ bulan, tahun, onBulanChange, onTahunChange }) {
  return (
    <div className="konsolidasi-page__filter filter-bar-v3" role="group" aria-label="Filter periode">
      <span className="filter-bar-v3__label">
        <FaCalendarAlt size={10} aria-hidden />
        Periode
      </span>
      <div className="filter-bar-v3__fields">
        <Select
          id="konsolidasi-bulan"
          className="form-select-v3--bulan"
          value={bulan}
          onChange={(e) => onBulanChange(Number(e.target.value))}
          aria-label="Bulan"
        >
          {BULAN_OPTIONS.map((label, i) => (
            <option key={label} value={i + 1}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          id="konsolidasi-tahun"
          className="form-select-v3--tahun"
          value={tahun}
          onChange={(e) => onTahunChange(Number(e.target.value))}
          aria-label="Tahun"
        >
          {TAHUN_OPTIONS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

function KasCard({ title, subtitle, data, badge = null }) {
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
      <OperationalPageStyles />
      <KonsolidasiPageStyles />
      <div className="konsolidasi-page ops-page">
        <div className="konsolidasi-page__toolbar">
          <KonsolidasiPeriodFilter
            bulan={bulan}
            tahun={tahun}
            onBulanChange={setBulan}
            onTahunChange={setTahun}
          />
          <p className="konsolidasi-page__hint">
            Mode lihat saja — agregat Kas Pondok + seluruh unit pendidikan.{" "}
            <Link to="/kas-instansi" style={{ color: "var(--primary)" }}>
              Kelola transaksi unit →
            </Link>
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "20px",
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
              color: "var(--text-secondary)",
              padding: "var(--space-2) 0",
            }}
          >
            Memuat konsolidasi yayasan...
          </div>
        ) : data ? (
          <>
            <div className="konsolidasi-page__section">
              <SectionHeading variant="eyebrow" spacing="first">
                KPI Yayasan — {bulanLabel} {tahun}
              </SectionHeading>
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

            <div className="konsolidasi-page__section">
              <SectionHeading variant="eyebrow" spacing="first">
                Kartu Kas
              </SectionHeading>
              <div
                style={{
                  display: "grid",
                  gap: "var(--space-4)",
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

            <div className="konsolidasi-page__section">
              <SectionHeading variant="eyebrow" spacing="first">
                Ringkasan Keuangan per Kas
              </SectionHeading>
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

            <div className="konsolidasi-page__section">
              <SectionHeading variant="eyebrow" spacing="first">
                Total Yayasan
              </SectionHeading>
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
              <p
                style={{
                  margin: 0,
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
