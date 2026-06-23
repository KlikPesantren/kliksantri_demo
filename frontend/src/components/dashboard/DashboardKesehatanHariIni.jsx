import Card from "../ui/Card";
import { formatNumber } from "../../utils/formatCurrency";
import { DASHBOARD_PANEL, ExecSectionTitle } from "./dashboardShared.jsx";

const HEALTH_STATS = [
  { key: "sehat", label: "Sehat", tone: "success" },
  { key: "sakit", label: "Sakit", tone: "danger" },
  { key: "perlu", label: "Tindak Lanjut", tone: "warning" },
];

export default function DashboardKesehatanHariIni({ summary }) {
  const values = {
    sehat: summary?.kesehatan_sehat ?? 0,
    sakit: summary?.kesehatan_sakit ?? 0,
    perlu: summary?.kesehatan_perlu_tindak_lanjut ?? 0,
  };

  return (
    <div className="dashboard-panel dashboard-panel-health">
      <Card {...DASHBOARD_PANEL}>
        <ExecSectionTitle title="Kesehatan Santri" subtitle="Status hari ini" />
        <div className="dashboard-health-mini-grid">
          {HEALTH_STATS.map((item) => (
            <div
              className={`dashboard-health-mini dashboard-health-mini--${item.tone}`}
              key={item.key}
            >
              <strong>{formatNumber(values[item.key])}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
