import { useEffect, useMemo, useState } from "react";
import AppShell from "../layouts/AppShell";
import api from "../services/api";
import KpiCard from "../components/ui/KpiCard";
import KpiGrid from "../components/ui/KpiGrid";
import Badge from "../components/ui/Badge";
import DataTableCard from "../components/ui/DataTableCard";
import TableToolbar from "../components/ui/TableToolbar";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";

const thStyle = {
  padding: "11px 14px",
  textAlign: "left",
  fontSize: "11px",
  fontWeight: 700,
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  borderBottom: "1px solid var(--border)",
  background: "var(--background)",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "12px 14px",
  fontSize: "14px",
  color: "var(--text-primary)",
  verticalAlign: "middle",
  borderBottom: "1px solid #F1F5F9",
};

function syncBadgeVariant(status) {
  const value = String(status || "").toLowerCase();
  if (value === "online" || value === "synced") return "success";
  if (value === "pending") return "warning";
  if (value === "offline" || value === "failed") return "danger";
  return "neutral";
}

function RFIDMonitorPage() {
  const [devices, setDevices] = useState([]);
  const [tableSearch, setTableSearch] = useState("");

  const getData = async () => {
    try {
      const res = await api.get("/rfid/monitor");
      setDevices(res.data.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getData();

    const interval = setInterval(getData, 10000);

    return () => clearInterval(interval);
  }, []);

  const filteredDevices = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return devices;
    return devices.filter((item) =>
      [item.device_id, item.nama_merchant, item.status, item.total_transaksi_hari_ini]
        .some((field) => String(field || "").toLowerCase().includes(q)),
    );
  }, [devices, tableSearch]);

  const online = devices.filter((d) => d.status === "online").length;
  const offline = devices.filter((d) => d.status !== "online").length;
  const totalTransaksi = devices.reduce(
    (a, b) => a + Number(b.total_transaksi_hari_ini || 0),
    0,
  );

  return (
    <AppShell
      title="RFID Monitor"
      description="Monitoring perangkat RFID pesantren"
      breadcrumb="Keamanan / RFID Monitor"
    >
      <KpiGrid minColumnWidth={200} gap={16}>
        <KpiCard layout="metric" label="Device Online" value={online} accent="success" />
        <KpiCard layout="metric" label="Device Offline" value={offline} accent="danger" />
        <KpiCard layout="metric" label="Total Device" value={devices.length} accent="teal" />
        <KpiCard layout="metric" label="Transaksi Hari Ini" value={totalTransaksi} accent="teal" />
      </KpiGrid>

      <div style={{ marginTop: "var(--space-6)" }}>
        <DataTableCard
          title="Status Perangkat"
          subtitle="Monitoring perangkat RFID secara realtime"
          actions={
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
              {filteredDevices.length} device
            </span>
          }
        >
          <TableToolbar
            search={
              <SearchInput
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Cari device, merchant, status..."
              />
            }
          />

          {filteredDevices.length === 0 ? (
            <EmptyState
              title={devices.length === 0 ? "Belum ada perangkat" : "Tidak ada hasil pencarian"}
              description={
                devices.length === 0
                  ? "Perangkat RFID akan muncul setelah terhubung ke sistem."
                  : "Coba kata kunci lain atau hapus filter pencarian."
              }
            />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Device</th>
                    <th style={thStyle}>Merchant</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Last Ping</th>
                    <th style={thStyle}>Last Sync</th>
                    <th style={thStyle}>Transaksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDevices.map((item) => (
                    <tr key={item.id}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{item.device_id}</td>
                      <td style={tdStyle}>{item.nama_merchant}</td>
                      <td style={tdStyle}>
                        <Badge variant={syncBadgeVariant(item.status)}>{item.status}</Badge>
                      </td>
                      <td style={tdStyle}>
                        {item.last_ping ? new Date(item.last_ping).toLocaleString() : "—"}
                      </td>
                      <td style={tdStyle}>
                        {item.last_sync ? new Date(item.last_sync).toLocaleString() : "—"}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{item.total_transaksi_hari_ini}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DataTableCard>
      </div>
    </AppShell>
  );
}

export default RFIDMonitorPage;
