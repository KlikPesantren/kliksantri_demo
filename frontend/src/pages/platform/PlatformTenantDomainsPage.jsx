import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import platformApi from "../../services/platformApi";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import PlatformButton from "../../components/platform/PlatformButton";
import Modal from "../../components/Modal";
import { RESERVED_SUBDOMAINS, ROOT_DOMAIN } from "../../utils/hostnameRouting";
import { copyActiveTenantUrl, getActiveTenantUrl } from "../../utils/tenantDomainUrl";

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

function isProvisionableHostname(hostname) {
  const normalized = String(hostname || "").toLowerCase();
  const suffix = `.${ROOT_DOMAIN}`;
  if (!normalized.endsWith(suffix)) return false;
  const slug = normalized.slice(0, -suffix.length);
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && !RESERVED_SUBDOMAINS.has(slug);
}

export default function PlatformTenantDomainsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyTenant, setBusyTenant] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [customForm, setCustomForm] = useState({ tenantId: "", hostname: "" });

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

  const runDnsAction = (row, action) => run(row.tenant_id, () =>
    platformApi.post(`/platform/tenant-domains/${row.id}/${action}-dns`)
  );
  const runDomainAction = (row, endpoint) => run(row.tenant_id, () =>
    platformApi.post(`/platform/tenant-domains/${row.id}/${endpoint}`)
  );

  const confirmDnsAction = async () => {
    if (!confirmation) return;
    const { row, action } = confirmation;
    setConfirmation(null);
    await runDnsAction(row, action);
  };

  const fallbackCopy = async (value) => {
    const textarea = document.createElement("textarea");
    textarea.value = value; textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed"; textarea.style.opacity = "0";
    document.body.appendChild(textarea); textarea.select();
    let copied = false;
    try { copied = document.execCommand("copy"); } finally { document.body.removeChild(textarea); }
    return copied;
  };

  const handleCopyUrl = async (row) => {
    try {
      await copyActiveTenantUrl(row, { clipboard: navigator.clipboard, fallbackCopy });
      setCopyFeedback("URL berhasil disalin");
    } catch {
      setCopyFeedback("URL tidak dapat disalin");
    }
    window.setTimeout(() => setCopyFeedback(""), 2200);
  };
  const copyText = async (value) => {
    try { await navigator.clipboard.writeText(value); setCopyFeedback("Nilai berhasil disalin"); }
    catch { setCopyFeedback("Nilai tidak dapat disalin"); }
    window.setTimeout(() => setCopyFeedback(""), 2200);
  };
  const submitCustomDomain = async (event) => {
    event.preventDefault(); setError("");
    try {
      await platformApi.post("/platform/tenant-domains/custom", { tenantId: Number(customForm.tenantId), hostname: customForm.hostname });
      setCustomOpen(false); setCustomForm({ tenantId: "", hostname: "" }); await load();
    } catch (err) { setError(err.response?.data?.error || "Gagal menambahkan custom domain"); }
  };
  const tenantOptions = [...new Map(rows.filter((row) => row.tenant_id).map((row) => [row.tenant_id, row.tenant_nama])).entries()];

  return (
    <div>
      <div style={styles.header}>
        <div><p style={styles.eyebrow}>Platform Console</p><h1 style={styles.title}>Tenant Domains</h1>
          <p style={styles.subtitle}>Kelola provisioning DNS Cloudflare, domain Vercel, dan SSL tenant.</p></div>
        <div style={styles.actions}><PlatformButton onClick={() => setCustomOpen(true)}>+ Tambah Custom Domain</PlatformButton><PlatformButton variant="secondary" onClick={load}>Refresh</PlatformButton></div>
      </div>
      {error && <div style={styles.error}>{error}</div>}
      {copyFeedback && <div role="status" style={styles.success}>{copyFeedback}</div>}
      <Card padding="none" shadow="card" radius="xl">
        <div style={styles.scroll}>
          <table style={styles.table}>
            <thead><tr>{["Tenant", "Hostname", "DNS", "Vercel", "SSL", "Overall", "Updated", "Action"].map((x) => <th key={x} style={styles.th}>{x}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="8" style={styles.empty}>Memuat domain tenant...</td></tr> : rows.map((row) => {
                const activeUrl = getActiveTenantUrl(row);
                const isCustom = row.domain_type === "custom_domain" || row.domain_type === "custom";
                const instructions = row.metadata?.dns_instructions?.records || [];
                return (
                <tr key={row.id ? `domain-${row.id}` : `tenant-${row.tenant_id}`}>
                  <td style={styles.td}><strong>{row.tenant_nama}</strong><div style={styles.slug}>{row.slug}</div></td>
                  <td style={styles.td}><code>{row.hostname || "Belum ada draft"}</code><div style={{ marginTop: 6 }}><Badge variant={isCustom ? "info" : "neutral"}>{isCustom ? "Custom Domain" : "Platform Subdomain"}</Badge></div>
                    {isCustom && instructions.length > 0 && <div style={styles.instructions}><strong>DNS Configuration Required</strong><span>Tambahkan record berikut di pengelola DNS domain Anda.</span>{instructions.map((item, index) => <div key={`${item.type}-${index}`} style={styles.instructionRow}>
                      <span>Type: <code>{item.type}</code></span><button style={styles.action} onClick={() => copyText(item.type)}>Copy Type</button>
                      <span>Name: <code>{item.name}</code></span><button style={styles.action} onClick={() => copyText(item.name)}>Copy Name</button>
                      <span>Target: <code>{item.value}</code></span><button style={styles.action} onClick={() => copyText(item.value)}>Copy Target</button>
                      <span>Proxy: <strong>{item.proxy || "DNS only"}</strong></span>
                    </div>)}</div>}
                    {isCustom && row.dns_status !== "active" && instructions.length === 0 && <div style={styles.waiting}>Menunggu konfigurasi DNS customer.</div>}
                  </td>
                  {["dns_status", "vercel_status", "ssl_status", "overall_status"].map((field) => <td key={field} style={styles.td}>
                    {row.id ? <select aria-label={field} value={row[field]} disabled={busyTenant === row.tenant_id} onChange={(e) => updateStatus(row, field, e.target.value)} style={styles.select}>
                      {STATUS_OPTIONS[field].map((status) => <option key={status}>{status}</option>)}
                    </select> : <Badge variant="neutral">-</Badge>}
                    {row.id && <div style={{ marginTop: 5 }}><Badge variant={statusVariant(row[field])}>{row[field]}</Badge></div>}
                  </td>)}
                  <td style={styles.td}>{row.updated_at ? new Date(row.updated_at).toLocaleString("id-ID") : "-"}</td>
                  <td style={styles.td}><div style={styles.actions}>
                    <Link to={`/platform/tenants/${row.tenant_id}`} style={styles.link}>Detail</Link>
                    {activeUrl && <a style={styles.link} href={activeUrl} target="_blank" rel="noopener noreferrer">Open Site</a>}
                    {activeUrl && <button style={styles.action} onClick={() => handleCopyUrl(row)}>Copy URL</button>}
                    {!row.id ? <button style={styles.action} disabled={busyTenant === row.tenant_id} onClick={() => run(row.tenant_id, () => platformApi.post(`/platform/tenants/${row.tenant_id}/domain/draft`))}>Generate draft</button>
                      : row.overall_status !== "active" && <button style={styles.action} disabled={busyTenant === row.tenant_id} onClick={() => run(row.tenant_id, () => platformApi.post(`/platform/tenants/${row.tenant_id}/domain/regenerate`))}>Regenerate</button>}
                    {!isCustom && row.id && row.overall_status !== "disabled" && row.dns_status !== "creating" && row.dns_status !== "active" && row.dns_status !== "failed" && isProvisionableHostname(row.hostname) && (
                      <button style={styles.primaryAction} onClick={() => setConfirmation({ row, action: "provision" })}>Provision DNS</button>
                    )}
                    {!isCustom && row.id && row.dns_status === "failed" && row.overall_status !== "disabled" && isProvisionableHostname(row.hostname) && (
                      <button style={styles.primaryAction} onClick={() => runDnsAction(row, "retry")}>Retry DNS</button>
                    )}
                    {!isCustom && row.id && row.dns_status !== "creating" && isProvisionableHostname(row.hostname) && (
                      <button style={styles.action} onClick={() => runDnsAction(row, "reconcile")}>Reconcile</button>
                    )}
                    {!isCustom && row.id && row.dns_status === "active" && isProvisionableHostname(row.hostname) && (
                      <button style={styles.dangerAction} onClick={() => setConfirmation({ row, action: "rollback" })}>Rollback DNS</button>
                    )}
                    {row.id && (isCustom || row.dns_status === "active") && row.vercel_status === "pending" && row.overall_status !== "disabled" && (
                      <button style={styles.primaryAction} onClick={() => runDomainAction(row, "provision-vercel")}>Provision Vercel</button>
                    )}
                    {row.id && row.vercel_status === "failed" && row.overall_status !== "disabled" && (
                      <button style={styles.primaryAction} onClick={() => runDomainAction(row, "retry-vercel")}>Retry Vercel</button>
                    )}
                    {row.id && row.dns_status === "active" && row.vercel_status !== "pending" && (
                      <button style={styles.action} onClick={() => runDomainAction(row, "reconcile-vercel")}>Reconcile Vercel</button>
                    )}
                    {row.id && row.vercel_status === "verified" && (
                      <button style={styles.action} onClick={() => runDomainAction(row, "reconcile-ssl")}>Reconcile SSL</button>
                    )}
                    {row.id && ["adding", "verified"].includes(row.vercel_status) && (
                      <button style={styles.dangerAction} onClick={() => runDomainAction(row, "rollback-vercel")}>Rollback Vercel</button>
                    )}
                    {isCustom && row.id && <button style={styles.action} onClick={() => runDomainAction(row, "reconcile")}>Check DNS</button>}
                  </div></td>
                </tr>
                );
              })}
              {!loading && rows.length === 0 && <tr><td colSpan="8" style={styles.empty}>Belum ada tenant.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal
        open={Boolean(confirmation)}
        title={confirmation?.action === "rollback" ? "Konfirmasi Rollback DNS" : "Konfirmasi Provision DNS"}
        onClose={() => setConfirmation(null)}
      >
        <p style={styles.modalText}>
          {confirmation?.action === "rollback"
            ? "Record CNAME tenant akan dihapus dari Cloudflare. Portal tenant dapat berhenti dapat diakses."
            : "Record CNAME tenant akan dibuat di Cloudflare menggunakan target backend yang telah dikonfigurasi."}
        </p>
        <code style={styles.modalHostname}>{confirmation?.row?.hostname}</code>
        <div style={styles.modalActions}>
          <PlatformButton variant="secondary" onClick={() => setConfirmation(null)}>Batal</PlatformButton>
          <PlatformButton variant={confirmation?.action === "rollback" ? "danger" : "primary"} onClick={confirmDnsAction}>
            {confirmation?.action === "rollback" ? "Rollback DNS" : "Provision DNS"}
          </PlatformButton>
        </div>
      </Modal>
      <Modal open={customOpen} title="Tambah Custom Domain" onClose={() => setCustomOpen(false)}>
        <form onSubmit={submitCustomDomain} style={styles.customForm}>
          <p style={styles.modalText}>Gunakan subdomain seperti app.domaincustomer.com agar website dan email utama customer tidak terganggu.</p>
          <label>Tenant<select required value={customForm.tenantId} onChange={(e) => setCustomForm((form) => ({ ...form, tenantId: e.target.value }))} style={styles.formInput}><option value="">Pilih tenant</option>{tenantOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
          <label>Hostname<input required placeholder="app.alfalah.id" value={customForm.hostname} onChange={(e) => setCustomForm((form) => ({ ...form, hostname: e.target.value }))} style={styles.formInput} /></label>
          <div style={styles.modalActions}><PlatformButton variant="secondary" type="button" onClick={() => setCustomOpen(false)}>Batal</PlatformButton><PlatformButton type="submit">Tambah Domain</PlatformButton></div>
        </form>
      </Modal>
    </div>
  );
}

const styles = {
  header: { display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap" },
  eyebrow: { margin: 0, color: "var(--primary)", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em" },
  title: { margin: "6px 0", fontSize: 30, color: "var(--text-primary)" }, subtitle: { margin: 0, color: "var(--text-secondary)" },
  error: { padding: 12, marginBottom: 16, borderRadius: 10, color: "var(--danger)", background: "var(--danger-subtle)", fontWeight: 600 },
  success: { padding: 10, marginBottom: 16, borderRadius: 10, color: "#166534", background: "var(--success-subtle)", fontWeight: 700 },
  scroll: { overflowX: "auto" }, table: { width: "100%", minWidth: 1120, borderCollapse: "collapse", fontSize: 13 },
  th: { padding: "13px 14px", textAlign: "left", color: "var(--text-secondary)", background: "var(--surface-muted)", borderBottom: "1px solid var(--border)" },
  td: { padding: 14, verticalAlign: "top", color: "var(--text-primary)", borderBottom: "1px solid var(--border)" },
  slug: { marginTop: 4, color: "var(--text-muted)", fontSize: 12 }, select: { maxWidth: 110, padding: 6, border: "1px solid var(--border)", borderRadius: 7, background: "var(--surface)" },
  actions: { display: "flex", gap: 8, flexWrap: "wrap" }, action: { border: "1px solid var(--border)", borderRadius: 7, padding: "6px 9px", background: "var(--surface)", cursor: "pointer", color: "var(--text-primary)" },
  primaryAction: { border: 0, borderRadius: 7, padding: "7px 10px", background: "#166534", cursor: "pointer", color: "#fff", fontWeight: 700 },
  dangerAction: { border: 0, borderRadius: 7, padding: "7px 10px", background: "#dc2626", cursor: "pointer", color: "#fff", fontWeight: 700 },
  modalText: { color: "var(--text-secondary)", lineHeight: 1.6 }, modalHostname: { display: "block", padding: 12, borderRadius: 8, background: "var(--surface-muted)" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, flexWrap: "wrap" },
  instructions: { display: "grid", gap: 6, marginTop: 10, padding: 10, borderRadius: 8, background: "var(--surface-muted)", fontSize: 11 }, instructionRow: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }, waiting: { marginTop: 8, color: "var(--warning)", fontSize: 12, fontWeight: 700 },
  customForm: { display: "grid", gap: 14 }, formInput: { display: "block", width: "100%", marginTop: 6, padding: 10, boxSizing: "border-box", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", color: "var(--text-primary)" },
  link: { color: "var(--primary)", fontWeight: 700, textDecoration: "none", padding: "6px 0" }, empty: { padding: 40, textAlign: "center", color: "var(--text-secondary)" },
};
