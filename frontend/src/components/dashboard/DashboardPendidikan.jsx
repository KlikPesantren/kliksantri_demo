import { useEffect, useState } from "react";
import api from "../../services/api";
import KpiCard from "../ui/KpiCard";
import KpiGrid from "../ui/KpiGrid";
import Card from "../ui/Card";
import { DASHBOARD_PANEL, ExecSectionTitle } from "./dashboardShared.jsx";
import { formatNumber } from "../../utils/formatCurrency";

function DashboardPendidikan({ summary }) {
  const [totalGuru, setTotalGuru] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadGuru = async () => {
      try {
        const res = await api.get("/guru");
        if (!cancelled) {
          setTotalGuru((res.data.data || []).length);
        }
      } catch {
        if (!cancelled) setTotalGuru(0);
      }
    };

    loadGuru();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="dashboard-role-v3">
      <KpiGrid>
        <KpiCard
          label="Total Santri"
          value={formatNumber(summary.total_santri || 0)}
          accent="primary"
        />
        <KpiCard
          label="Total Guru"
          value={totalGuru === null ? "—" : formatNumber(totalGuru)}
          accent="info"
        />
        <KpiCard
          label="Kehadiran Hari Ini"
          value={formatNumber(summary.absensi_hari_ini || 0)}
          accent="success"
        />
        <KpiCard
          label="Hafalan Minggu Ini"
          value={formatNumber(summary.total_hafalan || 0)}
          accent="primary"
        />
      </KpiGrid>

      <div className="dashboard-monitor-grid">
        <Card {...DASHBOARD_PANEL}>
          <ExecSectionTitle title="Absensi" subtitle="Monitoring kehadiran santri" />
          <div className="dashboard-monitor-stat">
            <span className="dashboard-monitor-stat__value">
              {formatNumber(summary.absensi_hari_ini || 0)}
            </span>
            <span className="dashboard-monitor-stat__label">Hadir hari ini</span>
          </div>
          <p className="dashboard-monitor-meta">
            {summary.persentase_kehadiran_santri || 0}% kehadiran ·{" "}
            {summary.persentase_kehadiran_guru || 0}% kehadiran guru
          </p>
        </Card>

        <Card {...DASHBOARD_PANEL}>
          <ExecSectionTitle title="Hafalan" subtitle="Capaian hafalan periode berjalan" />
          <div className="dashboard-monitor-stat">
            <span className="dashboard-monitor-stat__value">
              {formatNumber(summary.total_hafalan || 0)}
            </span>
            <span className="dashboard-monitor-stat__label">Setoran tercatat</span>
          </div>
          <p className="dashboard-monitor-meta">
            Pantau progres hafalan santri di menu Hafalan.
          </p>
        </Card>

        <Card {...DASHBOARD_PANEL}>
          <ExecSectionTitle title="Nilai" subtitle="Rata-rata nilai mingguan" />
          <div className="dashboard-monitor-stat">
            <span className="dashboard-monitor-stat__value">
              {formatNumber(summary.rata_nilai || 0)}
            </span>
            <span className="dashboard-monitor-stat__label">Rata-rata nilai</span>
          </div>
          <p className="dashboard-monitor-meta">
            {formatNumber(summary.nilai_terisi || 0)} entri nilai terisi bulan ini.
          </p>
        </Card>
      </div>
    </div>
  );
}

export default DashboardPendidikan;
