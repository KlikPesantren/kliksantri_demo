import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import platformApi from "../../services/platformApi";
import Badge from "../../components/ui/Badge";
import { PlatformConsoleShell } from "../../components/platform/PlatformConsoleShell";

function tenantDisplayName(row) {
  return row?.nama || row?.name || "-";
}

function statusBadgeVariant(status) {
  if (status === "active") return "success";
  if (status === "suspended") return "danger";
  return "neutral";
}

function PlatformTenantHealthOverviewPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await platformApi.get("/platform/tenants");
      setTenants(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "Gagal memuat health tenant");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PlatformConsoleShell
      badge="TENANT HEALTH"
      title="Tenant Health Center"
      subtitle="Ringkasan operasional semua tenant. Detail lengkap ada di masing-masing Tenant Detail."
      primaryLink="/platform/dashboard"
      primaryLabel="Platform Dashboard"
    >
      {error && <div style={errorStyle}>{error}</div>}
      <div className="platform-console-table-wrap">
        {loading ? (
          <div className="platform-console-empty">Memuat...</div>
        ) : tenants.length === 0 ? (
          <div className="platform-console-empty">Belum ada tenant.</div>
        ) : (
          <table className="platform-console-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Status</th>
                <th>Package</th>
                <th>Santri</th>
                <th>Users</th>
                <th>Features ON</th>
                <th>Features OFF</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link to={`/platform/tenants/${t.id}`}>{tenantDisplayName(t)}</Link>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{t.slug}</div>
                  </td>
                  <td>
                    <Badge variant={statusBadgeVariant(t.status)} size="sm">
                      {t.status}
                    </Badge>
                  </td>
                  <td>{t.current_package?.label || "-"}</td>
                  <td>{t.santri_count ?? 0}</td>
                  <td>{t.user_count ?? 0}</td>
                  <td>{t.feature_enabled_count ?? "-"}</td>
                  <td>{t.feature_disabled_count ?? "-"}</td>
                  <td>
                    <Link to={`/platform/tenants/${t.id}`}>Detail →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PlatformConsoleShell>
  );
}

const errorStyle = {
  padding: "12px 14px",
  borderRadius: 8,
  background: "var(--danger-subtle)",
  color: "var(--danger)",
  fontWeight: 600,
};

export default PlatformTenantHealthOverviewPage;
