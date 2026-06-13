import { useEffect, useMemo, useState } from "react";
import AppShell from "../layouts/AppShell";
import api from "../services/api";
import KpiCard from "../components/ui/KpiCard";
import KpiGrid from "../components/ui/KpiGrid";
import Card from "../components/ui/Card";
import { DashboardResponsiveStyles } from "../components/dashboard/DashboardResponsiveStyles";
import {
  DASHBOARD_PANEL,
  ExecSectionTitle,
  DashboardCompactList,
} from "../components/dashboard/dashboardShared.jsx";
import { formatCurrency, formatNumber } from "../utils/formatCurrency";

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

function trxTypeLabel(trxType) {
  if (trxType === "payment") return "Pembayaran";
  if (trxType === "topup") return "Topup";
  if (trxType === "refund") return "Refund";
  return String(trxType || "Transaksi");
}

function computeTopMerchant(transactions) {
  const counts = {};
  (transactions || []).forEach((item) => {
    const name = item.nama_merchant || "Merchant";
    counts[name] = (counts[name] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0] ? { name: sorted[0][0], count: sorted[0][1] } : null;
}

function RFIDDashboardPage() {
  const [dashboard, setDashboard] = useState({});
  const [transactions, setTransactions] = useState([]);

  const loadData = async () => {
    try {
      const [dashRes, trxRes] = await Promise.all([
        api.get("/rfid/dashboard"),
        api.get("/rfid/transactions"),
      ]);
      setDashboard(dashRes.data || {});
      setTransactions(trxRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const todayTransactions = useMemo(
    () => transactions.filter((item) => isToday(item.created_at)),
    [transactions],
  );

  const refundHariIni = useMemo(
    () => todayTransactions.filter(
      (item) => String(item.trx_type || "").toLowerCase() === "refund",
    ).length,
    [todayTransactions],
  );

  const topMerchant = useMemo(() => computeTopMerchant(transactions), [transactions]);

  const recentActivity = useMemo(
    () => transactions.slice(0, 5).map((item) => ({
      key: `rfid-${item.id}`,
      title: item.nama_santri || `Santri #${item.santri_id}`,
      subtitle: `${trxTypeLabel(item.trx_type)} · ${item.nama_merchant || "—"}`,
      meta: formatCurrency(item.nominal),
    })),
    [transactions],
  );

  const syncQueue = (Number(dashboard.pending_sync) || 0) + (Number(dashboard.failed_sync) || 0);

  return (
    <AppShell
      title="RFID Dashboard"
      description="Pusat monitoring transaksi RFID pesantren"
      breadcrumb="Keuangan / RFID Dashboard"
    >
      <DashboardResponsiveStyles />
      <div className="dashboard-role-v3">
        <KpiGrid>
          <KpiCard
            label="Total Saldo RFID"
            value={formatCurrency(dashboard.total_saldo || 0)}
            accent="primary"
          />
          <KpiCard
            label="Total Belanja"
            value={formatCurrency(dashboard.belanja_hari_ini || 0)}
            accent="info"
          />
          <KpiCard
            label="Merchant Aktif"
            value={formatNumber(dashboard.merchant_aktif || 0)}
            accent="success"
          />
          <KpiCard
            label="Device Online"
            value={formatNumber(dashboard.device_online || 0)}
            accent={dashboard.device_offline > 0 ? "warning" : "success"}
          />
        </KpiGrid>

        <div className="dashboard-monitor-grid dashboard-monitor-grid--rfid">
          <Card {...DASHBOARD_PANEL}>
            <ExecSectionTitle title="Sinkronisasi Hari Ini" subtitle="Antrian sync perangkat RFID" />
            <div className="dashboard-monitor-stat">
              <span className="dashboard-monitor-stat__value">{formatNumber(syncQueue)}</span>
              <span className="dashboard-monitor-stat__label">Antrian sync</span>
            </div>
            <p className="dashboard-monitor-meta">
              {formatNumber(dashboard.pending_sync || 0)} pending ·{" "}
              {formatNumber(dashboard.failed_sync || 0)} gagal
            </p>
          </Card>

          <Card {...DASHBOARD_PANEL}>
            <ExecSectionTitle title="Transaksi Hari Ini" subtitle="Volume belanja RFID hari ini" />
            <div className="dashboard-monitor-stat">
              <span className="dashboard-monitor-stat__value">
                {formatNumber(todayTransactions.length)}
              </span>
              <span className="dashboard-monitor-stat__label">Transaksi</span>
            </div>
            <p className="dashboard-monitor-meta">
              Total {formatCurrency(dashboard.belanja_hari_ini || 0)}
            </p>
          </Card>

          <Card {...DASHBOARD_PANEL}>
            <ExecSectionTitle title="Refund Hari Ini" subtitle="Pengembalian saldo RFID" />
            <div className="dashboard-monitor-stat">
              <span className="dashboard-monitor-stat__value">{formatNumber(refundHariIni)}</span>
              <span className="dashboard-monitor-stat__label">Refund</span>
            </div>
            <p className="dashboard-monitor-meta">
              Pantau refund di menu RFID Refund.
            </p>
          </Card>

          <Card {...DASHBOARD_PANEL}>
            <ExecSectionTitle title="Top Merchant" subtitle="Merchant paling aktif" />
            <div className="dashboard-monitor-stat">
              <span className="dashboard-monitor-stat__value dashboard-monitor-stat__value--text">
                {topMerchant?.name || "—"}
              </span>
              <span className="dashboard-monitor-stat__label">Merchant teratas</span>
            </div>
            <p className="dashboard-monitor-meta">
              {topMerchant
                ? `${formatNumber(topMerchant.count)} transaksi tercatat`
                : "Belum ada transaksi merchant."}
            </p>
          </Card>
        </div>

        <div className="dashboard-panel">
          <Card {...DASHBOARD_PANEL}>
            <ExecSectionTitle
              title="Aktivitas RFID Terbaru"
              subtitle="5 transaksi RFID terakhir"
            />
            <DashboardCompactList
              items={recentActivity}
              emptyNote="Belum ada aktivitas RFID tercatat."
            />
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

export default RFIDDashboardPage;
