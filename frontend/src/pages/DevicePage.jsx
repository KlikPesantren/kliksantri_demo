import { useEffect, useState } from "react";
import AppShell from "../layouts/AppShell";
import api from "../services/api";
import Card from "../components/ui/Card";
import SectionHeading from "../components/ui/SectionHeading";
import Badge from "../components/ui/Badge";

function DevicePage() {
  const [devices, setDevices] = useState([]);

  const getDevices = async () => {
    try {
      const res = await api.get("/devices");

      setDevices(res.data.data || []);
    } catch (err) {
      console.log(err);
      setDevices([]);
    }
  };

  useEffect(() => {
    getDevices();

    const interval = setInterval(() => {
      getDevices();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const isOnline = (last_ping) => {
    if (!last_ping) return false;

    const now = new Date();
    const ping = new Date(last_ping);
    const diff = (now - ping) / 1000;

    return diff < 15;
  };

  return (
    <AppShell
      title="Device Monitoring"
      breadcrumb="Sistem / Perangkat"
    >
      <Card padding="md" shadow="card" border={false} radius="xl">
        <SectionHeading variant="eyebrow" spacing="first">
          Status Perangkat
        </SectionHeading>

        <div style={{ overflowX: "auto", marginTop: "var(--space-4)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Nama Device</th>
                <th style={thStyle}>Device ID</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>IP</th>
                <th style={thStyle}>Last Ping</th>
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={6} style={emptyStyle}>
                    Belum ada perangkat terdaftar.
                  </td>
                </tr>
              ) : (
                devices.map((d) => {
                  const online = isOnline(d.last_ping);
                  return (
                    <tr key={d.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={tdStyle}>{d.id}</td>
                      <td style={tdStyle}>{d.nama_device || "-"}</td>
                      <td style={tdStyle}>{d.device_id}</td>
                      <td style={tdStyle}>
                        <Badge variant={online ? "success" : "danger"}>
                          {online ? "Online" : "Offline"}
                        </Badge>
                      </td>
                      <td style={tdStyle}>{d.ip_address || "-"}</td>
                      <td style={tdStyle}>
                        {d.last_ping
                          ? new Date(d.last_ping).toLocaleString()
                          : "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}

const thStyle = {
  padding: "11px 14px",
  textAlign: "left",
  fontSize: "12px",
  fontWeight: 600,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  borderBottom: "1px solid #e2e8f0",
};

const tdStyle = {
  padding: "11px 14px",
  fontSize: "14px",
  color: "#1e293b",
  verticalAlign: "middle",
};

const emptyStyle = {
  textAlign: "center",
  padding: "48px",
  color: "#94a3b8",
  fontSize: "14px",
};

export default DevicePage;
