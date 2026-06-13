import Card from "../ui/Card";
import { formatCurrency } from "../../utils/formatCurrency";
import { DASHBOARD_PANEL, ExecSectionTitle } from "./dashboardShared.jsx";

const CHART_BAR_MAX = 130;

function DashboardFinanceChart({ grafikKas }) {
  if (grafikKas.length === 0) return null;

  const maxBar = Math.max(...grafikKas.map((i) => Math.max(i.masuk, i.keluar)), 1);

  return (
    <div className="dashboard-panel dashboard-panel-cashflow">
      <Card {...DASHBOARD_PANEL}>
        <ExecSectionTitle title="Arus Keuangan" subtitle="Pemasukan vs pengeluaran bulanan" />
        <div className="dashboard-cashflow-wrap">
          <div className="dashboard-cashflow-bars">
            {grafikKas.map((item) => (
              <div key={item.bulan} className="dashboard-cashflow-month">
                <div className="dashboard-cashflow-bar-group">
                  <div
                    title={`Masuk: ${formatCurrency(item.masuk)}`}
                    className="dashboard-cashflow-bar dashboard-cashflow-bar--in"
                    style={{
                      height: `${Math.max((item.masuk / maxBar) * CHART_BAR_MAX, 3)}px`,
                    }}
                  />
                  <div
                    title={`Keluar: ${formatCurrency(item.keluar)}`}
                    className="dashboard-cashflow-bar dashboard-cashflow-bar--out"
                    style={{
                      height: `${Math.max((item.keluar / maxBar) * CHART_BAR_MAX, 3)}px`,
                    }}
                  />
                </div>
                <span className="dashboard-cashflow-label">{item.bulan}</span>
              </div>
            ))}
          </div>
          <div className="dashboard-cashflow-legend">
            <span className="dashboard-cashflow-legend-item">
              <span className="dashboard-cashflow-legend-dot dashboard-cashflow-legend-dot--in" />
              Pemasukan
            </span>
            <span className="dashboard-cashflow-legend-item">
              <span className="dashboard-cashflow-legend-dot dashboard-cashflow-legend-dot--out" />
              Pengeluaran
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default DashboardFinanceChart;
