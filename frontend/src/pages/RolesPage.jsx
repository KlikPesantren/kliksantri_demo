import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";

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
    <div style={{ display: "flex", background: "#f5f7fb", minHeight: "100vh" }}>
      <Sidebar />

      <div style={{ marginLeft: "240px", width: "calc(100% - 240px)", padding: "28px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>
          Role & Hak Akses
        </h1>
        <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 24px" }}>
          Kelola role dan matrix permission sistem RBAC
        </p>

        {error && <div style={bannerError}>{error}</div>}
        {success && <div style={bannerSuccess}>{success}</div>}

        <div style={cardStyle}>
          <div style={toolbarStyle}>
            <span style={{ color: "#64748b", fontSize: "14px" }}>
              {roles.length} role terdaftar
            </span>
            <button type="button" style={btnPrimary} onClick={() => setAddModal(true)}>
              + Tambah Role Custom
            </button>
          </div>

          {loading ? (
            <p style={emptyStyle}>Memuat data...</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Nama Sistem</th>
                    <th style={thStyle}>Tipe</th>
                    <th style={thStyle}>Jumlah Permission</th>
                    <th style={thStyle}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((r) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>
                        {r.label || r.name}
                      </td>
                      <td style={tdStyle}>
                        <code style={{ fontSize: "13px", color: "#475569" }}>{r.name}</code>
                      </td>
                      <td style={tdStyle}>
                        {r.is_system ? (
                          <span style={badgeSystem}>Sistem</span>
                        ) : (
                          <span style={badgeCustom}>Custom</span>
                        )}
                      </td>
                      <td style={tdStyle}>{r.total_permission || 0}</td>
                      <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                        <button type="button" style={btnEdit} onClick={() => openMatrix(r)}>
                          Edit Permission
                        </button>
                        {!r.is_system && (
                          <button type="button" style={btnDanger} onClick={() => openDelete(r)}>
                            Hapus
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL PERMISSION MATRIX */}
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
                  <button
                    type="button"
                    style={btnLink}
                    onClick={() => toggleGroup(grup, !allSelected)}
                  >
                    {allSelected ? "Hapus semua" : someSelected ? "Pilih semua" : "Pilih semua"}
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {perms.map((p) => (
                    <label key={p.key} style={checkLabel}>
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

        <div style={{ display: "flex", gap: "10px", marginTop: "20px", borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
          <button
            type="button"
            style={btnPrimary}
            onClick={saveMatrix}
            disabled={savingMatrix}
          >
            {savingMatrix ? "Menyimpan..." : "Simpan Permission"}
          </button>
          <button type="button" style={btnSecondary} onClick={() => setMatrixModal(false)}>
            Batal
          </button>
        </div>
      </Modal>

      {/* MODAL TAMBAH ROLE */}
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
          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <button type="button" style={btnPrimary} onClick={handleAddRole}>
              Simpan Role
            </button>
            <button type="button" style={btnSecondary} onClick={() => setAddModal(false)}>
              Batal
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL HAPUS ROLE */}
      <Modal open={deleteModal} title="Hapus Role Custom" onClose={() => setDeleteModal(false)} width={420}>
        <p style={{ margin: "0 0 16px", color: "#475569", lineHeight: 1.5 }}>
          Hapus role <strong>{deleteTarget?.label || deleteTarget?.name}</strong>?
          User dengan role ini tidak akan bisa di-assign ulang.
        </p>
        <div style={{ display: "flex", gap: "10px" }}>
          <button type="button" style={btnDangerSolid} onClick={handleDelete}>
            Ya, Hapus
          </button>
          <button type="button" style={btnSecondary} onClick={() => setDeleteModal(false)}>
            Batal
          </button>
        </div>
      </Modal>
    </div>
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

const cardStyle = {
  background: "white",
  borderRadius: "12px",
  padding: "20px",
  boxShadow: "0 1px 4px rgba(0,0,0,.06)",
};

const toolbarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "16px",
  flexWrap: "wrap",
  gap: "10px",
};

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
  padding: "9px 10px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  boxSizing: "border-box",
  fontSize: "14px",
  outline: "none",
};

const btnPrimary = {
  padding: "9px 20px",
  background: "#0F766E",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "14px",
};

const btnSecondary = {
  padding: "9px 20px",
  background: "#f1f5f9",
  color: "#475569",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "14px",
};

const btnEdit = {
  padding: "4px 12px",
  background: "#eff6ff",
  color: "#2563eb",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: 500,
  fontSize: "12px",
  marginRight: "5px",
};

const btnDanger = {
  padding: "4px 12px",
  background: "#fef2f2",
  color: "#dc2626",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: 500,
  fontSize: "12px",
};

const btnDangerSolid = {
  padding: "9px 20px",
  background: "#dc2626",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "14px",
};

const btnLink = {
  background: "none",
  border: "none",
  color: "#0F766E",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 600,
};

const badgeSystem = {
  padding: "3px 10px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: 600,
  background: "#eff6ff",
  color: "#2563eb",
};

const badgeCustom = {
  padding: "3px 10px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: 600,
  background: "#f0fdf4",
  color: "#15803d",
};

const groupCard = {
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "14px",
  marginBottom: "12px",
  background: "#fafafa",
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
