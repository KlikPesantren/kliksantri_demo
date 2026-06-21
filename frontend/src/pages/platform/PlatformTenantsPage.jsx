import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import platformApi from "../../services/platformApi";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import DataTableCard from "../../components/ui/DataTableCard";
import Modal from "../../components/Modal";
import { formatDateShort } from "../../utils/formatDate";

function tenantDisplayName(row) {
  return row?.nama || row?.name || "-";
}

function statusBadgeVariant(status) {
  if (status === "active") return "success";
  if (status === "suspended") return "danger";
  if (status === "trial") return "info";
  return "neutral";
}

function PlatformTenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [credentials, setCredentials] = useState(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    admin_username: "",
    admin_password: "",
  });

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

  const resetCreateForm = () => {
    setForm({ name: "", slug: "", admin_username: "", admin_password: "" });
    setCreateError("");
    setCredentials(null);
  };

  const openCreate = () => {
    resetCreateForm();
    setCreateOpen(true);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    resetCreateForm();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");

    try {
      const res = await platformApi.post("/platform/tenants", {
        nama_pesantren: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        admin_username: form.admin_username.trim(),
        admin_password: form.admin_password,
        admin_nama: `Admin ${form.name.trim()}`,
        create_default_unit_users: false,
      });

      setCredentials({
        slug: res.data?.data?.tenant?.slug,
        admin_username: res.data?.data?.admin_user?.username || form.admin_username,
        admin_password: form.admin_password,
      });

      await loadTenants();
    } catch (err) {
      setCreateError(err.response?.data?.error || "Gagal membuat tenant");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div style={toolbarStyle}>
        <div>
          <h1 style={pageTitleStyle}>Tenants</h1>
          <p style={pageSubtitleStyle}>Kelola pesantren terdaftar di KlikSantri</p>
        </div>
        <Button onClick={openCreate}>+ Buat Tenant</Button>
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
        <Button variant="secondary" size="sm" onClick={loadTenants}>
          Refresh
        </Button>
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
                  <th style={thStyle}>Users</th>
                  <th style={thStyle}>Units</th>
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
                    <td style={tdStyle}>{t.user_count ?? 0}</td>
                    <td style={tdStyle}>{t.unit_count ?? 0}</td>
                    <td style={tdStyle}>
                      {formatDateShort(t.onboarded_at || t.created_at)}
                    </td>
                    <td style={tdStyle}>
                      <Link to={`/platform/tenants/${t.id}`} style={linkStyle}>
                        Detail
                      </Link>
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
        title={credentials ? "Tenant Berhasil Dibuat" : "Buat Tenant Baru"}
        onClose={closeCreate}
        width={520}
      >
        {credentials ? (
          <div>
            <p style={modalTextStyle}>
              Simpan kredensial admin tenant berikut. Password tidak ditampilkan lagi.
            </p>
            <div style={credentialBoxStyle}>
              <div><strong>Slug:</strong> {credentials.slug}</div>
              <div><strong>Admin username:</strong> {credentials.admin_username}</div>
              <div><strong>Admin password:</strong> {credentials.admin_password}</div>
            </div>
            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={closeCreate}>Tutup</Button>
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
                placeholder="al-hikmah"
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label htmlFor="admin-user">Admin Username</label>
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
              <label htmlFor="admin-pass">Admin Password</label>
              <input
                id="admin-pass"
                type="password"
                value={form.admin_password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, admin_password: e.target.value }))
                }
                required
                minLength={6}
                style={inputStyle}
              />
            </div>

            <div style={modalActionsStyle}>
              <Button variant="secondary" type="button" onClick={closeCreate}>
                Batal
              </Button>
              <Button type="submit" loading={creating}>
                Buat Tenant
              </Button>
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
  color: "var(--primary)",
  fontWeight: 600,
  textDecoration: "none",
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
