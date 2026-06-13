import { useEffect, useState } from "react";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import { DashboardResponsiveStyles } from "../components/dashboard/DashboardResponsiveStyles";
import DashboardMetrics from "../components/dashboard/DashboardMetrics";
import DashboardAnnouncement from "../components/dashboard/DashboardAnnouncement";
import DashboardViolations from "../components/dashboard/DashboardViolations";
import DashboardFinanceChart from "../components/dashboard/DashboardFinanceChart";
import DashboardKeuangan from "../components/dashboard/DashboardKeuangan";
import DashboardPendidikan from "../components/dashboard/DashboardPendidikan";
import DashboardKeamanan from "../components/dashboard/DashboardKeamanan";
import DashboardSekretaris from "../components/dashboard/DashboardSekretaris";
import { getUser } from "../utils/storage";

function DashboardPage() {
  const user = getUser();

  const [summary, setSummary] = useState({
    total_santri: 0,
    santri_aktif: 0,
    santri_non_aktif: 0,
    total_kelas: 0,
    total_wali: 0,
    total_saldo: 0,
    persentase_kehadiran_santri: 0,
    persentase_kehadiran_guru: 0,
    total_hafalan: 0,
    rata_nilai: 0,
    absensi_hari_ini: 0,
    nilai_terisi: 0,
    total_wali_akun: 0,
    wali_belum_ganti_pin: 0,
    santri_poin_tertinggi: [],
    kas_masuk: 0,
    kas_keluar: 0,
    saldo_kas: 0,
    total_pembayaran: 0,
    total_tunggakan: 0,
    total_pelanggaran: 0,
    total_perizinan: 0,
    belum_kembali: 0,
    tamu_hari_ini: 0,
    tamu_bulan_ini: 0,
    tamu_masih_didalam: 0,
    grafik_kas: [],
    transaksi_terbaru: [],
    pembayaran_terbaru: [],
    top_tunggakan: [],
  });

  const pembayaranTerbaru = summary?.pembayaran_terbaru || [];

  const grafikKas = (summary?.grafik_kas || []).map((item) => ({
    bulan: ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][
      Number(item.bulan)
    ],
    masuk: Number(item.masuk),
    keluar: Number(item.keluar),
  }));

  const getSummary = async () => {
    try {
      const response = await api.get("/dashboard/summary");
      setSummary(response.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getSummary();
  }, []);

  return (
    <AppShell title="Dashboard" breadcrumb="Dashboard">
      <DashboardResponsiveStyles />
      {user?.role === "superadmin" && (
        <div className="dashboard-page dashboard-monitoring-v3">
          <DashboardMetrics summary={summary} />

          <div className="dashboard-row-2">
            <DashboardAnnouncement
              pembayaranTerbaru={pembayaranTerbaru}
              totalPembayaran={summary.total_pembayaran}
              totalTunggakan={summary.total_tunggakan}
            />
            <DashboardViolations
              topPelanggar={(summary.santri_poin_tertinggi || []).slice(0, 5)}
            />
          </div>

          <DashboardFinanceChart grafikKas={grafikKas} />
        </div>
      )}

      {user?.role === "keuangan" && <DashboardKeuangan summary={summary} />}

      {user?.role === "pendidikan" && <DashboardPendidikan summary={summary} />}

      {user?.role === "keamanan" && <DashboardKeamanan summary={summary} />}

      {user?.role === "sekretaris" && <DashboardSekretaris summary={summary} />}
    </AppShell>
  );
}

export default DashboardPage;
