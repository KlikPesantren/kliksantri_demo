import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import Modal from "../components/Modal";
import Badge from "../components/ui/Badge";
import Button, { actionBarStyle } from "../components/ui/Button";
import DataTableCard from "../components/ui/DataTableCard";
import TableToolbar from "../components/ui/TableToolbar";
import EmptyState from "../components/ui/EmptyState";
function RolesPage() {
  const [roles, setRoles]             = useState([]);
  const [allPerms, setAllPerms]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");

  const [matrixModal, setMatrixModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [checked, setChecked]         = useState(new Set());
  const [savingMatrix, setSavingMatrix] = useState(false);

  const [addModal, setAddModal]       = useState(false);
  const [newRole, setNewRole]         = useState({ name: "", label: "" });

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const groupedPerms = useMemo(() => {
    const map = {};
    for (const p of allPerms) {
      const g = p.grup || "lainnya";
      if (!map[g]) map[g] = [];
      map[g].push(p);
    }
    return map;
  }, [allPerms]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [rRes, pRes] = await Promise.all([
        api.get("/roles"),
        api.get("/roles/permissions"),
      ]);
      setRoles(rRes.data.data || []);
      setAllPerms(pRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "Gagal memuat data role");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const flash = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3500);
  };

  const openMatrix = async (role) => {
    setError("");
    try {
      const res = await api.get(`/roles/${role.id}`);
      const keys = res.data.data?.permissions || [];
      setSelectedRole(role);
      setChecked(new Set(keys));
      setMatrixModal(true);
    } catch (err) {
      setError(err.response?.data?.error || "Gagal memuat permission role");
    }
  };

  const togglePerm = (key) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleGroup = (grup, selectAll) => {
    const keys = (groupedPerms[grup] || []).map((p) => p.key);
    setChecked((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => (selectAll ? next.add(k) : next.delete(k)));
      return next;
    });
  };

  const saveMatrix = async () => {
    if (!selectedRole) return;
    setSavingMatrix(true);
    setError("");
    try {
      await api.put(`/roles/${selectedRole.id}/permissions`, {
        permissions: [...checked],
      });
      setMatrixModal(false);
      flash(`Permission role "${selectedRole.label || selectedRole.name}" diperbarui`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Gagal menyimpan permission");
    } finally {
      setSavingMatrix(false);
    }
  };

  const handleAddRole = async () => {
    if (!newRole.name.trim()) {
      setError("Nama role wajib diisi");
      return;
    }
    setError("");
    try {
      await api.post("/roles", {
        name: newRole.name.trim().toLowerCase().replace(/\s+/g, "_"),
        label: newRole.label.trim() || newRole.name.trim(),
      });
      setAddModal(false);
      setNewRole({ name: "", label: "" });
      flash("Role custom berhasil ditambahkan");
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Gagal menambah role");
    }
  };

  const openDelete = (role) => {
    setDeleteTarget(role);
    setDeleteModal(true);
  };

  const handleDelete = async () => {
    setError("");
    try {
      await api.delete(`/roles/${deleteTarget.id}`);
      setDeleteModal(false);
      flash(`Role "${deleteTarget.label || deleteTarget.name}" dihapus`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Gagal menghapus role");
    }
  };

  return (
    <AppShell
      title="Role & Hak Akses"
      description="Kelola role dan matrix permission sistem RBAC"
      breadcrumb="Sistem / Role & Hak Akses"
    >
      <LegacyPageStyles />
      {error && <div style={bannerError}>{error}</div>}
      {success && <div style={bannerSuccess}>{success}</div>}

      <div className="legacy-page">
        <DataTableCard
          title="Daftar Role"
          subtitle="Kelola role dan permission sistem"
          actions={
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
              {roles.length} role
            </span>
          }
        >
          <TableToolbar
            actions={
              <Button type="button" variant="primary" onClick={() => setAddModal(true)}>
                + Tambah Role Custom
              </Button>
            }
          />

          {loading ? (
            <EmptyState title="Memuat data..." description="Mohon tunggu sebentar." />
          ) : roles.length === 0 ? (
            <EmptyState
              title="Belum ada role"
              description="Tambahkan role custom untuk memulai."
            />
          ) : (
            <div className="table-scroll-x">
              <table style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Nama Sistem</th>
                    <th style={thStyle}>Tipe</th>
                    <th style={thStyle}>Jumlah Permission</th>
                    <th style={thStyle}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((r) => (
                    <tr key={r.id}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>
                        {r.label || r.name}
                      </td>
                      <td style={tdStyle}>
                        <code style={{ fontSize: "13px", color: "#475569" }}>{r.name}</code>
                      </td>
                      <td style={tdStyle}>
                        {r.is_system ? (
                          <Badge variant="info">Sistem</Badge>
                        ) : (
                          <Badge variant="success">Custom</Badge>
                        )}
                      </td>
                      <td style={tdStyle}>{r.total_permission || 0}</td>
                      <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                        <div style={actionBarStyle}>
                          <Button type="button" variant="outline" size="sm" onClick={() => openMatrix(r)}>
                            Edit Permission
                          </Button>
                          {!r.is_system && (
                            <Button type="button" variant="danger" size="sm" onClick={() => openDelete(r)}>
                              Hapus
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DataTableCard>
      </div>
      <Modal
        open={matrixModal}
        title={`Permission Matrix — ${selectedRole?.label || selectedRole?.name || ""}`}
        onClose={() => setMatrixModal(false)}
        width={720}
      >
        <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "13px" }}>
          {checked.size} permission dipilih
        </p>

        <div style={{ maxHeight: "55vh", overflowY: "auto", paddingRight: "4px" }}>
          {Object.entries(groupedPerms).map(([grup, perms]) => {
            const allSelected = perms.every((p) => checked.has(p.key));
            const someSelected = perms.some((p) => checked.has(p.key));
            return (
              <div key={grup} style={groupCard}>
                <div style={groupHeader}>
                  <span style={{ fontWeight: 600, textTransform: "capitalize", color: "#0f172a" }}>
                    {grup.replace(/_/g, " ")}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleGroup(grup, !allSelected)}
                    style={{ border: "none", background: "transparent", padding: "2px 0" }}
                  >
                    {allSelected ? "Hapus semua" : someSelected ? "Pilih semua" : "Pilih semua"}
                  </Button>
                </div>
                <div className="roles-perm-grid">
                  {perms.map((p) => (                    <label key={p.key} style={checkLabel}>
                      <input
                        type="checkbox"
                        checked={checked.has(p.key)}
                        onChange={() => togglePerm(p.key)}
                      />
                      <span>
                        <span style={{ display: "block", fontSize: "13px", color: "#1e293b" }}>
                          {p.label || p.key}
                        </span>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>{p.key}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ ...actionBarStyle, marginTop: "var(--space-4)", borderTop: "1px solid #e2e8f0", paddingTop: "var(--space-4)" }}>
          <Button
            type="button"
            variant="primary"
            onClick={saveMatrix}
            loading={savingMatrix}
            disabled={savingMatrix}
          >
            Simpan Permission
          </Button>
          <Button type="button" variant="outline" onClick={() => setMatrixModal(false)}>
            Batal
          </Button>
        </div>
      </Modal>

      <Modal open={addModal} title="Tambah Role Custom" onClose={() => setAddModal(false)} width={440}>
        <div style={{ display: "grid", gap: "14px" }}>
          <Field label="Nama Role (slug)" required>
            <input
              style={inputStyle}
              placeholder="contoh: operator_keuangan"
              value={newRole.name}
              onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
            />
          </Field>
          <Field label="Label Tampilan">
            <input
              style={inputStyle}
              placeholder="contoh: Operator Keuangan"
              value={newRole.label}
              onChange={(e) => setNewRole({ ...newRole, label: e.target.value })}
            />
          </Field>
          <div style={{ ...actionBarStyle, marginTop: "var(--space-4)" }}>
            <Button type="button" variant="primary" onClick={handleAddRole}>
              Simpan Role
            </Button>
            <Button type="button" variant="outline" onClick={() => setAddModal(false)}>
              Batal
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={deleteModal} title="Hapus Role Custom" onClose={() => setDeleteModal(false)} width={420}>
        <p style={{ margin: "0 0 16px", color: "#475569", lineHeight: 1.5 }}>
          Hapus role <strong>{deleteTarget?.label || deleteTarget?.name}</strong>?
          User dengan role ini tidak akan bisa di-assign ulang.
        </p>
        <div style={{ ...actionBarStyle, marginTop: "var(--space-4)" }}>
          <Button type="button" variant="danger" onClick={handleDelete}>
            Ya, Hapus
          </Button>
          <Button type="button" variant="outline" onClick={() => setDeleteModal(false)}>
            Batal
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function LegacyPageStyles() {
  return (
    <style>{`
      .legacy-page {
        min-width: 0;
        max-width: 100%;
      }
      .table-scroll-x {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        max-width: 100%;
        min-width: 0;
      }
      .table-scroll-x > table {
        width: max-content;
        min-width: 100%;
      }
      .roles-perm-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 8px;
      }
    `}</style>
  );
}

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
const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: 500,
  marginBottom: "5px",
  color: "#374151",
};

const inputStyle = {
  width: "100%",
  maxWidth: "100%",
  padding: "9px 10px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  boxSizing: "border-box",
  fontSize: "14px",
  outline: "none",
};

const groupCard = {
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  padding: "14px",
  marginBottom: "12px",
  background: "var(--neutral-subtle)",
};
const groupHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px",
};

const checkLabel = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  cursor: "pointer",
  padding: "6px 4px",
};

const bannerError = {
  background: "#fef2f2",
  color: "#dc2626",
  padding: "12px 16px",
  borderRadius: "8px",
  marginBottom: "16px",
  fontSize: "14px",
  borderLeft: "3px solid #dc2626",
};

const bannerSuccess = {
  background: "#f0fdf4",
  color: "#15803d",
  padding: "12px 16px",
  borderRadius: "8px",
  marginBottom: "16px",
  fontSize: "14px",
  borderLeft: "3px solid #15803d",
};

export default RolesPage;
