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

      .dashboard-kpi-wrap .kpi-card-v3 {
        position: relative;
        border-radius: 20px !important;
        border: 1px solid #E5E7EB !important;
        box-shadow: 0 2px 16px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.04) !important;
        padding: var(--space-4) var(--space-5) !important;
        min-height: 108px !important;
        height: auto !important;
        gap: var(--space-2) !important;
        transition: box-shadow 180ms ease, transform 180ms ease;
      }

      .dashboard-kpi-wrap .kpi-card-v3:hover {
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(15, 23, 42, 0.04) !important;
        transform: translateY(-1px);
      }

      .dashboard-kpi-wrap .kpi-card-v3__value {
        font-size: clamp(1.375rem, 2.4vw, 1.75rem) !important;
        font-weight: 800 !important;
        letter-spacing: -0.03em !important;
      }

      .dashboard-kpi-wrap .kpi-card-v3__label {
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
        width: 38px;
        height: 38px;
        border-radius: 12px;
        font-size: 15px;
        margin-bottom: var(--space-1);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
      }

      .dashboard-kpi-icon--green {
        background: linear-gradient(145deg, #ECFDF5 0%, #DCFCE7 100%);
        color: #15803D;
        border: 1px solid rgba(21, 128, 61, 0.12);
      }

      .dashboard-kpi-icon--amber {
        background: linear-gradient(145deg, #FFFBEB 0%, #FEF3C7 100%);
        color: #D97706;
        border: 1px solid rgba(245, 158, 11, 0.18);
      }

      .dashboard-kpi-icon--blue {
        background: linear-gradient(145deg, #EFF6FF 0%, #DBEAFE 100%);
        color: #2563EB;
        border: 1px solid rgba(59, 130, 246, 0.16);
      }

      .dashboard-kpi-icon--red {
        background: linear-gradient(145deg, #FEF2F2 0%, #FEE2E2 100%);
        color: #DC2626;
        border: 1px solid rgba(239, 68, 68, 0.16);
      }

      @media (max-width: 767px) {
        .dashboard-kpi-wrap .kpi-card-v3 {
          min-height: 100px !important;
        }
      }
    `}</style>
  );
}

function MetricIcon({ children, tone = "green" }) {
  return (
    <span className={`dashboard-kpi-icon dashboard-kpi-icon--${tone}`}>
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
        <div className="dashboard-kpi-wrap dashboard-kpi-wrap--santri">
          <KpiCard
            icon={<MetricIcon tone="green"><FaUsers /></MetricIcon>}
            label="Total Santri"
            value={formatNumber(summary.total_santri)}
            accent="primary"
          />
        </div>
        <div className="dashboard-kpi-wrap dashboard-kpi-wrap--kembali">
          <KpiCard
            icon={<MetricIcon tone="amber"><FaExclamationCircle /></MetricIcon>}
            label="Santri Belum Kembali"
            value={formatNumber(belumKembali)}
            accent={belumKembali > 0 ? "danger" : "primary"}
          />
        </div>
        <div className="dashboard-kpi-wrap dashboard-kpi-wrap--kas">
          <KpiCard
            icon={<MetricIcon tone="blue"><FaWallet /></MetricIcon>}
            label="Saldo Buku Kas"
            value={formatCurrency(summary.saldo_kas)}
            accent="success"
          />
        </div>
        <div className="dashboard-kpi-wrap dashboard-kpi-wrap--tunggakan">
          <KpiCard
            icon={<MetricIcon tone="red"><FaExclamationCircle /></MetricIcon>}
            label="Total Tunggakan"
            value={formatCurrency(tunggakan)}
            accent={tunggakan > 0 ? "danger" : "primary"}
          />
        </div>
      </KpiGrid>
    </>
  );
}

export default DashboardMetrics;
