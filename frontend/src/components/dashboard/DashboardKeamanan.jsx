import { useEffect, useState } from "react";
import api from "../../services/api";
import KpiCard from "../ui/KpiCard";
import KpiGrid from "../ui/KpiGrid";
import Card from "../ui/Card";
import DashboardViolations from "./DashboardViolations";
import {
  DASHBOARD_PANEL,
  ExecSectionTitle,
  DashboardCompactList,
} from "./dashboardShared.jsx";
import { formatNumber } from "../../utils/formatCurrency";
import { formatDateShort } from "../../utils/formatDate";

function DashboardKeamanan({ summary }) {
  const [perizinanAktifCount, setPerizinanAktifCount] = useState(0);
  const [perizinanAktif, setPerizinanAktif] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadPerizinan = async () => {
      try {
        const res = await api.get("/perizinan");
        if (cancelled) return;
        const active = (res.data.data || []).filter(
          (item) => String(item.status || "").toLowerCase() === "keluar",
        );
        setPerizinanAktifCount(active.length);
        setPerizinanAktif(active.slice(0, 5));
      } catch {
        if (!cancelled) {
          setPerizinanAktifCount(0);
          setPerizinanAktif([]);
        }
      }
    };

    loadPerizinan();
    return () => {
      cancelled = true;
    };
  }, []);

  const perizinanItems = perizinanAktif.map((item) => ({
    key: `izin-${item.id}`,
    title: item.nama || `Santri #${item.santri_id}`,
    subtitle: `${formatDateShort(item.tanggal)} · ${item.keterangan || item.alasan || "Perizinan aktif"}`,
    meta: "Keluar",
  }));

  return (
    <div className="dashboard-role-v3">
      <KpiGrid>
        <KpiCard
          label="Santri Belum Kembali"
          value={formatNumber(summary.belum_kembali || 0)}
          accent={summary.belum_kembali > 0 ? "danger" : "primary"}
        />
        <KpiCard
          label="Perizinan Aktif"
          value={formatNumber(perizinanAktifCount || summary.belum_kembali || 0)}
          accent={(perizinanAktifCount || summary.belum_kembali) > 0 ? "warning" : "primary"}
        />
        <KpiCard
          label="Pelanggaran Bulan Ini"
          value={formatNumber(summary.total_pelanggaran || 0)}
          accent="warning"
        />
        <KpiCard
          label="Tamu Hari Ini"
          value={formatNumber(summary.tamu_hari_ini || 0)}
          accent="info"
        />
      </KpiGrid>

      <div className="dashboard-row-full">
        <DashboardViolations
          topPelanggar={(summary.santri_poin_tertinggi || []).slice(0, 5)}
        />
      </div>

      <div className="dashboard-panel">
        <Card {...DASHBOARD_PANEL}>
          <ExecSectionTitle
            title="Perizinan Aktif"
            subtitle="Santri yang masih berada di luar pesantren"
          />
          <DashboardCompactList
            items={perizinanItems}
            emptyNote="Tidak ada perizinan aktif saat ini."
          />
        </Card>
      </div>
    </div>
  );
}

export default DashboardKeamanan;
