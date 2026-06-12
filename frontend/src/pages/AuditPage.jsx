import { useEffect, useState } from "react";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import Card from "../components/ui/Card";
import SectionHeading from "../components/ui/SectionHeading";
import Badge from "../components/ui/Badge";

function auditEventVariant(eventType) {
  const e = String(eventType || "").toUpperCase();
  if (e === "CREATE") return "success";
  if (e === "UPDATE") return "warning";
  if (e === "DELETE") return "danger";
  return "neutral";
}

function AuditPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    getLogs();

    const interval = setInterval(() => {
      getLogs();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getLogs = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/audit", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLogs(response.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <AppShell
      title="Audit Log"
      breadcrumb="Sistem / Audit"
    >
      <Card padding="md" shadow="card" border={false} radius="xl">
        <SectionHeading variant="eyebrow" spacing="first">
          Log Aktivitas Device
        </SectionHeading>

        <div style={{ overflowX: "auto", marginTop: "var(--space-4)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Device</th>
                <th style={thStyle}>Event</th>
                <th style={thStyle}>Detail</th>
                <th style={thStyle}>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={emptyStyle}>
                    Belum ada log audit.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={tdStyle}>{log.id}</td>
                    <td style={tdStyle}>{log.device_id}</td>
                    <td style={tdStyle}>
                      <Badge variant={auditEventVariant(log.event_type)}>
                        {log.event_type}
                      </Badge>
                    </td>
                    <td style={tdStyle}>{log.detail}</td>
                    <td style={tdStyle}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
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

export default AuditPage;
