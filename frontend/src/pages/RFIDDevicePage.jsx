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

function DeviceStatusBadge({ status }) {
  const isOnline = status === "online";
  return (
    <Badge variant={isOnline ? "success" : "danger"} size="md">
      {isOnline ? "Online" : "Offline"}
    </Badge>
  );
}

function RFIDDevicePage() {
  const [devices, setDevices] = useState([]);
  const [tableSearch, setTableSearch] = useState("");

  const loadData = async () => {
    try {
      const res = await api.get("/devices");
      setDevices(res.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadData();

    const interval = setInterval(loadData, 10000);

    return () => clearInterval(interval);
  }, []);

  const filteredDevices = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return devices;
    return devices.filter((d) =>
      [d.id, d.device_id, d.status, d.ip_address, d.firmware_version]
        .some((field) => String(field || "").toLowerCase().includes(q)),
    );
  }, [devices, tableSearch]);

  const online = devices.filter((d) => d.status === "online").length;
  const offline = devices.filter((d) => d.status !== "online").length;
  const synced = devices.filter((d) => d.last_sync).length;

  return (
    <AppShell
      title="RFID Devices"
      description="Monitoring seluruh RFID EDC"
      breadcrumb="Keamanan / RFID Devices"
    >
      <KpiGrid minColumnWidth={200} gap={16}>
        <KpiCard layout="metric" label="Total Device" value={devices.length} accent="teal" />
        <KpiCard layout="metric" label="Device Online" value={online} accent="success" />
        <KpiCard layout="metric" label="Device Offline" value={offline} accent="danger" />
        <KpiCard layout="metric" label="Sync" value={synced} accent="teal" />
      </KpiGrid>

      <div style={{ marginTop: "var(--space-6)" }}>
        <DataTableCard
          title="Daftar Perangkat RFID"
          subtitle="Status koneksi dan sinkronisasi EDC"
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
                placeholder="Cari device ID, IP, firmware..."
              />
            }
          />

          {filteredDevices.length === 0 ? (
            <EmptyState
              title={devices.length === 0 ? "Belum ada perangkat" : "Tidak ada hasil pencarian"}
              description={
                devices.length === 0
                  ? "Perangkat EDC akan muncul setelah terdaftar."
                  : "Coba kata kunci lain atau hapus filter pencarian."
              }
            />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Device</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>IP Address</th>
                    <th style={thStyle}>Last Ping</th>
                    <th style={thStyle}>Last Sync</th>
                    <th style={thStyle}>Firmware</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDevices.map((d) => (
                    <tr key={d.id}>
                      <td style={tdStyle}>{d.id}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{d.device_id}</td>
                      <td style={tdStyle}>
                        <DeviceStatusBadge status={d.status} />
                      </td>
                      <td style={tdStyle}>
                        {d.ip_address ? d.ip_address.replace("::ffff:", "") : "—"}
                      </td>
                      <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "13px" }}>
                        {d.last_ping ? new Date(d.last_ping).toLocaleString() : "—"}
                      </td>
                      <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "13px" }}>
                        {d.last_sync ? new Date(d.last_sync).toLocaleString() : "—"}
                      </td>
                      <td style={tdStyle}>{d.firmware_version || "—"}</td>
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

export default RFIDDevicePage;
