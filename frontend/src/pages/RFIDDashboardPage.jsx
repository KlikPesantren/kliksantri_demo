import { useEffect, useState } from "react";
import AppShell from "../layouts/AppShell";
import api from "../services/api";
import KpiCard from "../components/ui/KpiCard";
import KpiGrid from "../components/ui/KpiGrid";

function RFIDDashboardPage() {
  const [dashboard, setDashboard] = useState({});

  const loadData = async () => {
    try {
      const res = await api.get("/rfid/dashboard");
      setDashboard(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AppShell
      title="RFID Dashboard"
      description="Pusat monitoring transaksi RFID pesantren"
      breadcrumb="Keamanan / RFID Dashboard"
    >
      <div style={headerStyle}>
        <p style={headerTitleStyle}>Ringkasan Operasional</p>
        <p style={headerSubtitleStyle}>
          Monitor saldo, transaksi, merchant, dan status perangkat RFID secara real-time.
        </p>
      </div>

      <KpiGrid minColumnWidth={200} gap={16}>
        <KpiCard
          layout="metric"
          label="Saldo Santri"
          value={`Rp ${Number(dashboard.total_saldo || 0).toLocaleString()}`}
          accent="teal"
        />
        <KpiCard
          layout="metric"
          label="Belanja Hari Ini"
          value={`Rp ${Number(dashboard.belanja_hari_ini || 0).toLocaleString()}`}
          accent="teal"
        />
        <KpiCard
          layout="metric"
          label="Merchant Aktif"
          value={dashboard.merchant_aktif || 0}
          accent="success"
        />
        <KpiCard
          layout="metric"
          label="Device Online"
          value={dashboard.device_online || 0}
          accent="success"
        />
        <KpiCard
          layout="metric"
          label="Device Offline"
          value={dashboard.device_offline || 0}
          accent="danger"
        />
        <KpiCard
          layout="metric"
          label="Pending Sync"
          value={dashboard.pending_sync || 0}
          accent="warning"
        />
        <KpiCard
          layout="metric"
          label="Failed Sync"
          value={dashboard.failed_sync || 0}
          accent="danger"
        />
        <KpiCard
          layout="metric"
          label="Kartu Aktif"
          value={dashboard.kartu_aktif || 0}
          accent="success"
        />
      </KpiGrid>
    </AppShell>
  );
}

const headerStyle = {
  marginBottom: "var(--space-6)",
};

const headerTitleStyle = {
  margin: 0,
  fontSize: "15px",
  fontWeight: 700,
  color: "var(--text-primary)",
  lineHeight: 1.3,
};

const headerSubtitleStyle = {
  margin: "var(--space-1) 0 0",
  fontSize: "13px",
  color: "var(--text-secondary)",
  lineHeight: 1.5,
};

export default RFIDDashboardPage;
