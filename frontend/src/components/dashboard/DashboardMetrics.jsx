import { FaExclamationCircle, FaUsers, FaWallet } from "react-icons/fa";
import KpiCard from "../ui/KpiCard";
import KpiGrid from "../ui/KpiGrid";
import { formatCurrency, formatNumber } from "../../utils/formatCurrency";

function DashboardMetricsStyles() {
  return (
    <style>{`
      .dashboard-metrics-grid {
        margin-bottom: 0;
      }

      .dashboard-metrics-grid .kpi-card-v3 {
        position: relative;
        border-radius: 20px !important;
        border: 1px solid #E5E7EB !important;
        border-left-width: 1px !important;
        box-shadow: 0 2px 16px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.04) !important;
        padding: var(--space-4) var(--space-5) !important;
        min-height: 112px !important;
        height: auto !important;
        gap: var(--space-2) !important;
        transition: box-shadow 180ms ease, transform 180ms ease;
      }

      .dashboard-metrics-grid .kpi-card-v3:hover {
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(15, 23, 42, 0.04) !important;
        transform: translateY(-1px);
      }

      .dashboard-metrics-grid .kpi-card-v3__value {
        font-size: clamp(1.375rem, 2.4vw, 1.75rem) !important;
        font-weight: 800 !important;
        letter-spacing: -0.03em !important;
      }

      .dashboard-metrics-grid .kpi-card-v3__label {
        font-size: 12px !important;
        font-weight: 600 !important;
        color: var(--text-secondary) !important;
        letter-spacing: 0.03em !important;
        text-transform: uppercase;
      }

      .dashboard-kpi-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 12px;
        background: #DCFCE7;
        color: #15803D;
        font-size: 15px;
        margin-bottom: var(--space-1);
      }

      .dashboard-kpi-icon--danger {
        background: #FEE2E2;
        color: #EF4444;
      }

      @media (max-width: 767px) {
        .dashboard-metrics-grid .kpi-card-v3 {
          min-height: 104px !important;
        }
      }
    `}</style>
  );
}

function MetricIcon({ children, danger = false }) {
  return (
    <span className={`dashboard-kpi-icon${danger ? " dashboard-kpi-icon--danger" : ""}`}>
      {children}
    </span>
  );
}

function DashboardMetrics({ summary }) {
  const belumKembali = summary.belum_kembali || 0;
  const tunggakan = summary.total_tunggakan;

  return (
    <>
      <DashboardMetricsStyles />
      <KpiGrid className="dashboard-metrics-grid">
        <KpiCard
          icon={<MetricIcon><FaUsers /></MetricIcon>}
          label="Total Santri"
          value={formatNumber(summary.total_santri)}
          accent="primary"
        />
        <KpiCard
          icon={<MetricIcon danger={belumKembali > 0}><FaExclamationCircle /></MetricIcon>}
          label="Santri Belum Kembali"
          value={formatNumber(belumKembali)}
          accent={belumKembali > 0 ? "danger" : "primary"}
        />
        <KpiCard
          icon={<MetricIcon><FaWallet /></MetricIcon>}
          label="Saldo Buku Kas"
          value={formatCurrency(summary.saldo_kas)}
          accent="success"
        />
        <KpiCard
          icon={<MetricIcon danger={tunggakan > 0}><FaExclamationCircle /></MetricIcon>}
          label="Total Tunggakan"
          value={formatCurrency(tunggakan)}
          accent={tunggakan > 0 ? "danger" : "primary"}
        />
      </KpiGrid>
    </>
  );
}

export default DashboardMetrics;
