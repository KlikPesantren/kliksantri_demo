import Card from "../ui/Card";
import { formatCurrency } from "../../utils/formatCurrency";
import {
  DASHBOARD_PANEL,
  DonutChart,
  ExecSectionTitle,
  buildSahriyahDonut,
} from "./dashboardShared.jsx";

function DashboardAnnouncement({ pembayaranTerbaru, totalPembayaran, totalTunggakan }) {
  const sahriyahDonut = buildSahriyahDonut(
    pembayaranTerbaru,
    totalPembayaran,
    totalTunggakan,
  );

  return (
    <div className="dashboard-panel dashboard-panel-donut">
      <Card {...DASHBOARD_PANEL}>
        <ExecSectionTitle
          title="Status Sahriyah"
          subtitle={`Total pembayaran ${formatCurrency(sahriyahDonut.totalPembayaran)}`}
        />
        <div className="dashboard-donut-layout">
          <DonutChart
            slices={sahriyahDonut.slices}
            size={120}
            centerLabel={{
              value: `${sahriyahDonut.lunasPct}%`,
              subtitle: "Lunas",
            }}
          />
          <div className="dashboard-donut-legend">
            {sahriyahDonut.slices.map((slice) => (
              <div key={slice.label} className="dashboard-donut-legend-row">
                <span className="dashboard-donut-legend-label">
                  <span className="dashboard-donut-legend-dot" style={{ background: slice.color }} />
                  {slice.label}
                </span>
                <span className="dashboard-donut-legend-pct">{slice.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

export default DashboardAnnouncement;
