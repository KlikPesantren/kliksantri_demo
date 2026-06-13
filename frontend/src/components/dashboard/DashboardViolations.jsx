import Card from "../ui/Card";
import { DASHBOARD_PANEL, ExecSectionTitle } from "./dashboardShared.jsx";

function DashboardViolations({ topPelanggar }) {
  return (
    <div className="dashboard-panel dashboard-panel-violations">
      <Card {...DASHBOARD_PANEL}>
        <ExecSectionTitle title="Top 5 Pelanggar" />
        {topPelanggar.length === 0 ? (
          <p className="dashboard-empty-note">Belum ada data pelanggaran.</p>
        ) : (
          <div className="dashboard-violations-list">
            {topPelanggar.map((item, index, arr) => (
              <div
                key={`${item.nama}-${index}`}
                className={`dashboard-violation-row${index < arr.length - 1 ? " dashboard-violation-row--bordered" : ""}`}
              >
                <span className="dashboard-pelanggar-name">{item.nama}</span>
                <span className="dashboard-violation-poin">{item.jumlah_pelanggaran} poin</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default DashboardViolations;
