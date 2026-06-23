import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import platformApi from "../../services/platformApi";
import Badge from "../../components/ui/Badge";
import PlatformButton from "../../components/platform/PlatformButton";
import DataTableCard from "../../components/ui/DataTableCard";
import Modal from "../../components/Modal";
import {
  CUSTOM_FEATURE_OPTIONS,
  TENANT_PACKAGES,
  generateClientPassword,
} from "../../constants/tenantPackages";
import { formatDateShort } from "../../utils/formatDate";
import { openTenantAdminPortal } from "../../utils/tenantPortal";

function tenantDisplayName(row) {
  return row?.nama || row?.name || "-";
}

function statusBadgeVariant(status) {
  if (status === "active") return "success";
  if (status === "suspended") return "danger";
  if (status === "trial") return "info";
  return "neutral";
}

function billingBadgeVariant(status) {
  if (status === "active") return "success";
  if (status === "trial") return "info";
  if (status === "overdue") return "warning";
  if (status === "suspended" || status === "cancelled") return "danger";
  return "neutral";
}

const EMPTY_FORM = {
  name: "",
  slug: "",
  admin_nama: "",
  admin_username: "",
  admin_password: "",
  package: "basic",
  custom_features: [],
};

function PlatformTenantsPage({ initialCreate = false }) {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [credentials, setCredentials] = useState(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [initialCreateConsumed, setInitialCreateConsumed] = useState(false);

  const loadTenants = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (q.trim()) params.q = q.trim();
      if (status) params.status = status;

      const res = await platformApi.get("/platform/tenants", { params });
      setTenants(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "Gagal memuat daftar tenant");
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  useEffect(() => {
    if (initialCreate && !initialCreateConsumed) {
      resetCreateForm();
      setCreateOpen(true);
      setInitialCreateConsumed(true);
    }
  }, [initialCreate, initialCreateConsumed]);

  const resetCreateForm = () => {
    setForm(EMPTY_FORM);
    setCreateError("");
    setCredentials(null);
    setCopied(false);
  };

  const openCreate = () => {
    resetCreateForm();
    setCreateOpen(true);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    resetCreateForm();
    if (initialCreate) {
      navigate("/platform/tenants", { replace: true });
    }
  };

  const handleGeneratePassword = () => {
    setForm((f) => ({ ...f, admin_password: generateClientPassword() }));
  };

  const toggleCustomFeature = (key) => {
    setForm((f) => {
      const set = new Set(f.custom_features);
      if (set.has(key)) set.delete(key);
      else set.add(key);
      return { ...f, custom_features: [...set] };
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");

    if (!form.package) {
      setCreateError("Package wajib dipilih");
      setCreating(false);
      return;
    }

    const password = form.admin_password.trim() || generateClientPassword();

    try {
      const payload = {
        nama: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        admin_nama: form.admin_nama.trim() || `Admin ${form.name.trim()}`,
        admin_username: form.admin_username.trim(),
        admin_password: password,
        package: form.package,
        create_default_unit_users: false,
      };

      if (form.package === "custom") {
        payload.custom_features = form.custom_features;
      }

      const res = await platformApi.post("/platform/tenants", payload);

      const tenant = res.data?.tenant || res.data?.data?.tenant;
      const admin = res.data?.admin || res.data?.data?.admin_user;

      setCredentials({
        nama: tenant?.nama || form.name.trim(),
        slug: tenant?.slug || form.slug.trim().toLowerCase(),
        admin_username: admin?.username || form.admin_username.trim(),
        admin_password: res.data?.admin?.password || password,
        package: res.data?.package || form.package,
      });

      await loadTenants();
    } catch (err) {
      setCreateError(err.response?.data?.error || "Gagal membuat tenant");
    } finally {
      setCreating(false);
    }
  };

  const handleCopyCredentials = async () => {
    if (!credentials) return;
    const text = [
      `Nama: ${credentials.nama}`,
      `Slug: ${credentials.slug}`,
      `Username: ${credentials.admin_username}`,
      `Password: ${credentials.admin_password}`,
      `Package: ${credentials.package}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      window.prompt("Salin kredensial:", text);
    }
  };

  return (
    <>
      <div style={toolbarStyle}>
        <div>
          <h1 style={pageTitleStyle}>Tenants</h1>
          <p style={pageSubtitleStyle}>Kelola pesantren terdaftar di KlikSantri</p>
        </div>
        <PlatformButton onClick={openCreate}>+ Create Tenant</PlatformButton>
      </div>

      <div style={filterRowStyle}>
        <input
          type="search"
          placeholder="Cari nama atau slug..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={filterInputStyle}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={filterSelectStyle}
        >
          <option value="">Semua status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="trial">Trial</option>
          <option value="inactive">Inactive</option>
        </select>
        <PlatformButton variant="secondary" size="sm" onClick={loadTenants}>
          Refresh
        </PlatformButton>
      </div>

      {error && <div style={errorBoxStyle}>{error}</div>}

      <DataTableCard title="Daftar Tenant" padding="none">
        {loading ? (
          <div style={emptyStyle}>Memuat...</div>
        ) : tenants.length === 0 ? (
          <div style={emptyStyle}>Belum ada tenant.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Nama</th>
                  <th style={thStyle}>Slug</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Package</th>
                  <th style={thStyle}>Plan</th>
                  <th style={thStyle}>Billing</th>
                  <th style={thStyle}>Expires</th>
                  <th style={thStyle}>Santri</th>
                  <th style={thStyle}>Users</th>
                  <th style={thStyle}>Features</th>
                  <th style={thStyle}>Onboarded</th>
                  <th style={thStyle} />
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id}>
                    <td style={tdStyle}>{tenantDisplayName(t)}</td>
                    <td style={tdStyle}>
                      <code style={codeStyle}>{t.slug}</code>
                    </td>
                    <td style={tdStyle}>
                      <Badge variant={statusBadgeVariant(t.status)} size="sm">
                        {t.status}
                      </Badge>
                    </td>
                    <td style={tdStyle}>
                      <Badge
                        variant={t.current_package?.id === "custom" ? "warning" : "success"}
                        size="sm"
                      >
                        {t.current_package?.label || "Custom"}
                      </Badge>
                    </td>
                    <td style={tdStyle}>{t.plan_code || "-"}</td>
                    <td style={tdStyle}>
                      <Badge
                        variant={billingBadgeVariant(t.billing_status)}
                        size="sm"
                      >
                        {t.billing_status || "-"}
                      </Badge>
                    </td>
                    <td style={tdStyle}>
                      {formatDateShort(t.subscription_expires_at)}
                    </td>
                    <td style={tdStyle}>{t.santri_count ?? 0}</td>
                    <td style={tdStyle}>{t.user_count ?? 0}</td>
                    <td style={tdStyle}>{t.feature_enabled_count ?? 0} ON</td>
                    <td style={tdStyle}>
                      {formatDateShort(t.onboarded_at || t.created_at)}
                    </td>
                    <td style={tdStyle}>
                      <div style={rowActionsStyle}>
                        <Link to={`/platform/tenants/${t.id}`} style={linkStyle}>
                          Detail
                        </Link>
                        <button
                          type="button"
                          style={portalPlatformButtonStyle}
                          onClick={() => openTenantAdminPortal(t.slug)}
                        >
                          Buka Portal
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataTableCard>

      <Modal
        open={createOpen}
        title={credentials ? "Tenant Berhasil Dibuat" : "Create Tenant"}
        onClose={closeCreate}
        width={credentials ? 520 : 600}
      >
        {credentials ? (
          <div>
            <p style={successBannerStyle}>Tenant berhasil dibuat</p>
            <p style={modalTextStyle}>
              Simpan kredensial admin berikut. Password hanya ditampilkan sekali.
            </p>
            <div style={credentialBoxStyle}>
              <div><strong>Nama:</strong> {credentials.nama}</div>
              <div><strong>Slug:</strong> {credentials.slug}</div>
              <div><strong>Username Admin:</strong> {credentials.admin_username}</div>
              <div><strong>Password:</strong> {credentials.admin_password}</div>
              <div><strong>Package:</strong> {credentials.package}</div>
            </div>
            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <PlatformButton variant="secondary" onClick={handleCopyCredentials}>
                {copied ? "Tersalin" : "Salin Kredensial"}
              </PlatformButton>
              <PlatformButton onClick={closeCreate}>Tutup</PlatformButton>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreate}>
            {createError && <div style={errorBoxStyle}>{createError}</div>}

            <div style={fieldStyle}>
              <label htmlFor="tenant-name">Nama Pesantren</label>
              <input
                id="tenant-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label htmlFor="tenant-slug">Slug</label>
              <input
                id="tenant-slug"
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                  }))
                }
                required
                placeholder="al-falah"
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label htmlFor="admin-nama">Nama Admin</label>
              <input
                id="admin-nama"
                value={form.admin_nama}
                onChange={(e) =>
                  setForm((f) => ({ ...f, admin_nama: e.target.value }))
                }
                placeholder="Admin Pesantren"
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label htmlFor="admin-user">Username Admin</label>
              <input
                id="admin-user"
                value={form.admin_username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, admin_username: e.target.value }))
                }
                required
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label htmlFor="admin-pass">Password Admin</label>
              <div style={passwordRowStyle}>
                <input
                  id="admin-pass"
                  type="text"
                  value={form.admin_password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, admin_password: e.target.value }))
                  }
                  placeholder="Kosongkan untuk generate otomatis"
                  minLength={6}
                  style={{ ...inputStyle, marginTop: 0, flex: 1 }}
                />
                <PlatformButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleGeneratePassword}
                >
                  Generate
                </PlatformButton>
              </div>
            </div>

            <div style={fieldStyle}>
              <label>Package</label>
              <div style={packageGridStyle}>
                {TENANT_PACKAGES.map((pkg) => (
                  <label key={pkg.id} style={packageOptionStyle}>
                    <input
                      type="radio"
                      name="package"
                      value={pkg.id}
                      checked={form.package === pkg.id}
                      onChange={() =>
                        setForm((f) => ({ ...f, package: pkg.id }))
                      }
                    />
                    <span>
                      <strong>{pkg.label}</strong>
                      <span style={packageDescStyle}>{pkg.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {form.package === "custom" && (
              <div style={fieldStyle}>
                <label>Fitur Custom</label>
                <div style={customFeatureGridStyle}>
                  {CUSTOM_FEATURE_OPTIONS.map((feat) => (
                    <label key={feat.key} style={customFeatureItemStyle}>
                      <input
                        type="checkbox"
                        checked={form.custom_features.includes(feat.key)}
                        onChange={() => toggleCustomFeature(feat.key)}
                      />
                      {feat.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div style={modalActionsStyle}>
              <PlatformButton variant="secondary" type="button" onClick={closeCreate}>
                Batal
              </PlatformButton>
              <PlatformButton type="submit" loading={creating}>
                Buat Tenant
              </PlatformButton>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

const toolbarStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 20,
};

const pageTitleStyle = {
  margin: 0,
  fontSize: "24px",
  fontWeight: 800,
  color: "var(--text-primary)",
};

const pageSubtitleStyle = {
  margin: "6px 0 0",
  fontSize: "14px",
  color: "var(--text-secondary)",
};

const filterRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginBottom: 16,
};

const filterInputStyle = {
  flex: "1 1 220px",
  minWidth: 180,
  padding: "10px 12px",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  fontSize: "14px",
};

const filterSelectStyle = {
  padding: "10px 12px",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  fontSize: "14px",
  background: "var(--surface)",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "14px",
};

const thStyle = {
  textAlign: "left",
  padding: "12px 16px",
  borderBottom: "1px solid var(--border)",
  color: "var(--text-secondary)",
  fontSize: "12px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const tdStyle = {
  padding: "14px 16px",
  borderBottom: "1px solid var(--border)",
  color: "var(--text-primary)",
  verticalAlign: "middle",
};

const codeStyle = {
  fontSize: "13px",
  background: "var(--neutral-subtle)",
  padding: "2px 6px",
  borderRadius: "4px",
};

const linkStyle = {
  color: "#166534",
  fontWeight: 600,
  textDecoration: "none",
};

const rowActionsStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 6,
};

const portalPlatformButtonStyle = {
  padding: 0,
  border: "none",
  background: "none",
  color: "#166534",
  fontWeight: 600,
  fontSize: "13px",
  cursor: "pointer",
  fontFamily: "inherit",
  textDecoration: "underline",
};

const emptyStyle = {
  padding: "32px 24px",
  color: "var(--text-secondary)",
  textAlign: "center",
};

const errorBoxStyle = {
  marginBottom: 12,
  padding: "10px 12px",
  borderRadius: "var(--radius-sm)",
  background: "var(--danger-subtle)",
  color: "var(--danger)",
  fontSize: "13px",
  fontWeight: 600,
};

const successBannerStyle = {
  margin: "0 0 12px",
  padding: "10px 12px",
  borderRadius: "var(--radius-sm)",
  background: "var(--success-subtle)",
  color: "var(--success)",
  fontWeight: 700,
  fontSize: "14px",
};

const fieldStyle = {
  marginBottom: 14,
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  fontSize: "14px",
  boxSizing: "border-box",
  marginTop: 6,
};

const passwordRowStyle = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  marginTop: 6,
};

const packageGridStyle = {
  display: "grid",
  gap: 8,
  marginTop: 8,
};

const packageOptionStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  padding: "10px 12px",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  cursor: "pointer",
  fontSize: "14px",
};

const packageDescStyle = {
  display: "block",
  fontSize: "12px",
  color: "var(--text-secondary)",
  marginTop: 2,
  fontWeight: 400,
};

const customFeatureGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: 8,
  marginTop: 8,
};

const customFeatureItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: "13px",
  cursor: "pointer",
};

const modalActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  marginTop: 8,
};

const modalTextStyle = {
  margin: "0 0 12px",
  fontSize: "14px",
  color: "var(--text-secondary)",
  lineHeight: 1.5,
};

const credentialBoxStyle = {
  background: "var(--neutral-subtle)",
  borderRadius: "var(--radius-md)",
  padding: "14px 16px",
  fontSize: "14px",
  lineHeight: 1.8,
};

export default PlatformTenantsPage;
