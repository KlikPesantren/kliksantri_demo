import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import platformApi from "../../services/platformApi";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import PlatformButton from "../../components/platform/PlatformButton";

const STATUS_OPTIONS = {
  dns_status: ["pending", "creating", "active", "failed"],
  vercel_status: ["pending", "adding", "verified", "failed"],
  ssl_status: ["pending", "issuing", "active", "failed"],
  overall_status: ["draft", "provisioning", "active", "failed", "disabled"],
};

function statusVariant(status) {
  if (["active", "verified"].includes(status)) return "success";
  if (status === "failed") return "danger";
  if (["creating", "adding", "issuing", "provisioning"].includes(status)) return "warning";
  return "neutral";
}

export default function PlatformTenantDomainsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyTenant, setBusyTenant] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await platformApi.get("/platform/tenant-domains");
      setRows(response.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "Gagal memuat domain tenant");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const run = async (tenantId, action) => {
    setBusyTenant(tenantId); setError("");
    try { await action(); await load(); }
    catch (err) { setError(err.response?.data?.error || "Aksi domain gagal"); }
    finally { setBusyTenant(null); }
  };

  const updateStatus = (row, field, value) => run(row.tenant_id, () =>
    platformApi.patch(`/platform/tenants/${row.tenant_id}/domain/status`, { [field]: value })
  );

  return (
    <div>
      <div style={styles.header}>
        <div><p style={styles.eyebrow}>Platform Console</p><h1 style={styles.title}>Tenant Domains</h1>
          <p style={styles.subtitle}>Draft dan status domain tenant. Sprint ini tidak melakukan provisioning DNS atau Vercel.</p></div>
        <PlatformButton variant="secondary" onClick={load}>Refresh</PlatformButton>
      </div>
      {error && <div style={styles.error}>{error}</div>}
      <Card padding="none" shadow="card" radius="xl">
        <div style={styles.scroll}>
          <table style={styles.table}>
            <thead><tr>{["Tenant", "Hostname", "DNS", "Vercel", "SSL", "Overall", "Updated", "Action"].map((x) => <th key={x} style={styles.th}>{x}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="8" style={styles.empty}>Memuat domain tenant...</td></tr> : rows.map((row) => (
                <tr key={row.tenant_id}>
                  <td style={styles.td}><strong>{row.tenant_nama}</strong><div style={styles.slug}>{row.slug}</div></td>
                  <td style={styles.td}><code>{row.hostname || "Belum ada draft"}</code></td>
                  {["dns_status", "vercel_status", "ssl_status", "overall_status"].map((field) => <td key={field} style={styles.td}>
                    {row.id ? <select aria-label={field} value={row[field]} disabled={busyTenant === row.tenant_id} onChange={(e) => updateStatus(row, field, e.target.value)} style={styles.select}>
                      {STATUS_OPTIONS[field].map((status) => <option key={status}>{status}</option>)}
                    </select> : <Badge variant="neutral">-</Badge>}
                    {row.id && <div style={{ marginTop: 5 }}><Badge variant={statusVariant(row[field])}>{row[field]}</Badge></div>}
                  </td>)}
                  <td style={styles.td}>{row.updated_at ? new Date(row.updated_at).toLocaleString("id-ID") : "-"}</td>
                  <td style={styles.td}><div style={styles.actions}>
                    <Link to={`/platform/tenants/${row.tenant_id}`} style={styles.link}>Detail</Link>
                    {!row.id ? <button style={styles.action} disabled={busyTenant === row.tenant_id} onClick={() => run(row.tenant_id, () => platformApi.post(`/platform/tenants/${row.tenant_id}/domain/draft`))}>Generate draft</button>
                      : <button style={styles.action} disabled={busyTenant === row.tenant_id} onClick={() => run(row.tenant_id, () => platformApi.post(`/platform/tenants/${row.tenant_id}/domain/regenerate`))}>Regenerate</button>}
                    {row.hostname && <button style={styles.action} onClick={() => navigator.clipboard.writeText(row.hostname)}>Copy</button>}
                    {row.hostname && row.overall_status === "active" && <a style={styles.link} href={`https://${row.hostname}`} target="_blank" rel="noreferrer">Buka</a>}
                  </div></td>
                </tr>
              ))}
              {!loading && rows.length === 0 && <tr><td colSpan="8" style={styles.empty}>Belum ada tenant.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

const styles = {
  header: { display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap" },
  eyebrow: { margin: 0, color: "var(--primary)", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em" },
  title: { margin: "6px 0", fontSize: 30, color: "var(--text-primary)" }, subtitle: { margin: 0, color: "var(--text-secondary)" },
  error: { padding: 12, marginBottom: 16, borderRadius: 10, color: "var(--danger)", background: "var(--danger-subtle)", fontWeight: 600 },
  scroll: { overflowX: "auto" }, table: { width: "100%", minWidth: 1120, borderCollapse: "collapse", fontSize: 13 },
  th: { padding: "13px 14px", textAlign: "left", color: "var(--text-secondary)", background: "var(--surface-muted)", borderBottom: "1px solid var(--border)" },
  td: { padding: 14, verticalAlign: "top", color: "var(--text-primary)", borderBottom: "1px solid var(--border)" },
  slug: { marginTop: 4, color: "var(--text-muted)", fontSize: 12 }, select: { maxWidth: 110, padding: 6, border: "1px solid var(--border)", borderRadius: 7, background: "var(--surface)" },
  actions: { display: "flex", gap: 8, flexWrap: "wrap" }, action: { border: "1px solid var(--border)", borderRadius: 7, padding: "6px 9px", background: "var(--surface)", cursor: "pointer", color: "var(--text-primary)" },
  link: { color: "var(--primary)", fontWeight: 700, textDecoration: "none", padding: "6px 0" }, empty: { padding: 40, textAlign: "center", color: "var(--text-secondary)" },
};

