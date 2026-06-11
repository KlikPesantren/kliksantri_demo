import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import { hasPermission } from "../utils/hasPermission";

const FORM_INIT = {
  nama: "",
  username: "",
  password: "",
  role: "",
  status: "Aktif",
};

function UsersPage() {
  const [users, setUsers]       = useState([]);
  const [roles, setRoles]       = useState([]);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  const [formModal, setFormModal]     = useState(false);
  const [editId, setEditId]           = useState(null);
  const [form, setForm]               = useState(FORM_INIT);

  const [pwdModal, setPwdModal]       = useState(false);
  const [pwdUser, setPwdUser]         = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const [statusModal, setStatusModal] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.nama || "").toLowerCase().includes(q) ||
        (u.username || "").toLowerCase().includes(q) ||
        (u.role || "").toLowerCase().includes(q) ||
        (u.role_label || "").toLowerCase().includes(q)
    );
  }, [users, search]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [uRes, rRes] = await Promise.all([
        api.get("/users"),
        api.get("/roles"),
      ]);
      setUsers(uRes.data.data || []);
      setRoles(rRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "Gagal memuat data user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const flash = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3500);
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ ...FORM_INIT, role: roles[0]?.name || "" });
    setFormModal(true);
  };

  const openEdit = (u) => {
    setEditId(u.id);
    setForm({
      nama: u.nama || "",
      username: u.username || "",
      password: "",
      role: u.role || "",
      status: u.status || "Aktif",
    });
    setFormModal(true);
  };

  const handleSave = async () => {
    if (!form.nama.trim() || !form.username.trim() || !form.role) {
      setError("Nama, username, dan role wajib diisi");
      return;
    }
    if (!editId && !form.password.trim()) {
      setError("Password wajib diisi untuk user baru");
      return;
    }
    setError("");
    try {
      const payload = {
        nama: form.nama.trim(),
        username: form.username.trim(),
        role: form.role,
        status: form.status,
      };
      if (editId) {
        if (form.password.trim()) payload.password = form.password;
        await api.put(`/users/${editId}`, payload);
        flash("User berhasil diperbarui");
      } else {
        payload.password = form.password;
        await api.post("/users", payload);
        flash("User berhasil ditambahkan");
      }
      setFormModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Gagal menyimpan user");
    }
  };

  const openResetPassword = (u) => {
    setPwdUser(u);
    setNewPassword("");
    setPwdModal(true);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 4) {
      setError("Password minimal 4 karakter");
      return;
    }
    setError("");
    try {
      await api.put(`/users/${pwdUser.id}/reset-password`, { password: newPassword });
      setPwdModal(false);
      flash(`Password ${pwdUser.username} berhasil direset`);
    } catch (err) {
      setError(err.response?.data?.error || "Gagal reset password");
    }
  };

  const openToggleStatus = (u) => {
    if (String(currentUser.id) === String(u.id)) {
      setError("Tidak dapat mengubah status akun sendiri");
      return;
    }
    setStatusTarget(u);
    setStatusModal(true);
  };

  const handleToggleStatus = async () => {
    const u = statusTarget;
    const newStatus = u.status === "Aktif" ? "Nonaktif" : "Aktif";
    setError("");
    try {
      await api.put(`/users/${u.id}`, {
        nama: u.nama,
        username: u.username,
        role: u.role,
        status: newStatus,
      });
      setStatusModal(false);
      flash(`User ${u.username} sekarang ${newStatus}`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Gagal mengubah status");
    }
  };

  const formatDate = (val) => {
    if (!val) return "—";
    return new Date(val).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div style={{ display: "flex", background: "#f5f7fb", minHeight: "100vh" }}>
      <Sidebar />

      <div style={{ marginLeft: "240px", width: "calc(100% - 240px)", padding: "28px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>
          Manajemen User
        </h1>
        <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 24px" }}>
          Kelola akun admin dan hak akses login
        </p>

        {error && (
          <div style={bannerError}>{error}</div>
        )}
        {success && (
          <div style={bannerSuccess}>{success}</div>
        )}

        <div style={cardStyle}>
          <div style={toolbarStyle}>
            <input
              type="text"
              placeholder="Cari nama, username, atau role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={searchStyle}
            />
            {hasPermission("user.create") && (
              <button type="button" onClick={openAdd} style={btnPrimary}>
                + Tambah User
              </button>
            )}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={thStyle}>Nama</th>
                  <th style={thStyle}>Username</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Tanggal Dibuat</th>
                  <th style={thStyle}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={emptyStyle}>Memuat data...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={emptyStyle}>
                      {search ? "Tidak ada user yang cocok." : "Belum ada data user."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{u.nama}</td>
                      <td style={tdStyle}>{u.username}</td>
                      <td style={tdStyle}>{u.role_label || u.role}</td>
                      <td style={tdStyle}>
                        <StatusBadge status={u.status || "Aktif"} />
                      </td>
                      <td style={tdStyle}>{formatDate(u.created_at)}</td>
                      <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                        {hasPermission("user.update") && (
                          <>
                            <button type="button" style={btnEdit} onClick={() => openEdit(u)}>
                              Edit
                            </button>
                            <button type="button" style={btnWarn} onClick={() => openResetPassword(u)}>
                              Reset PIN
                            </button>
                            {String(currentUser.id) !== String(u.id) && (
                              <button type="button" style={btnToggle} onClick={() => openToggleStatus(u)}>
                                {u.status === "Nonaktif" ? "Aktifkan" : "Nonaktifkan"}
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p style={{ margin: "12px 0 0", color: "#94a3b8", fontSize: "13px" }}>
            Menampilkan {filtered.length} dari {users.length} user
          </p>
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT */}
      <Modal
        open={formModal}
        title={editId ? "Edit User" : "Tambah User Baru"}
        onClose={() => setFormModal(false)}
      >
        <div style={{ display: "grid", gap: "14px" }}>
          <Field label="Nama Lengkap" required>
            <input
              style={inputStyle}
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
            />
          </Field>
          <Field label="Username" required>
            <input
              style={inputStyle}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              disabled={!!editId}
            />
          </Field>
          <Field label={editId ? "Password Baru (kosongkan jika tidak diubah)" : "Password"} required={!editId}>
            <input
              type="password"
              style={inputStyle}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          <Field label="Role" required>
            <select
              style={inputStyle}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="">— Pilih Role —</option>
              {roles.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.label || r.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              style={inputStyle}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </Field>
          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <button type="button" style={btnPrimary} onClick={handleSave}>
              Simpan
            </button>
            <button type="button" style={btnSecondary} onClick={() => setFormModal(false)}>
              Batal
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL RESET PASSWORD */}
      <Modal
        open={pwdModal}
        title={`Reset Password — ${pwdUser?.username || ""}`}
        onClose={() => setPwdModal(false)}
        width={420}
      >
        <Field label="Password Baru" required>
          <input
            type="password"
            style={inputStyle}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimal 4 karakter"
          />
        </Field>
        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
          <button type="button" style={btnPrimary} onClick={handleResetPassword}>
            Reset Password
          </button>
          <button type="button" style={btnSecondary} onClick={() => setPwdModal(false)}>
            Batal
          </button>
        </div>
      </Modal>

      {/* MODAL KONFIRMASI STATUS */}
      <Modal
        open={statusModal}
        title="Ubah Status User"
        onClose={() => setStatusModal(false)}
        width={420}
      >
        <p style={{ margin: "0 0 16px", color: "#475569", lineHeight: 1.5 }}>
          {statusTarget?.status === "Nonaktif"
            ? `Aktifkan kembali user "${statusTarget?.username}"?`
            : `Nonaktifkan user "${statusTarget?.username}"? User tidak akan bisa login.`}
        </p>
        <div style={{ display: "flex", gap: "10px" }}>
          <button type="button" style={btnPrimary} onClick={handleToggleStatus}>
            Ya, Lanjutkan
          </button>
          <button type="button" style={btnSecondary} onClick={() => setStatusModal(false)}>
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

function StatusBadge({ status }) {
  const aktif = status === "Aktif";
  return (
    <span
      style={{
        padding: "3px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: 600,
        background: aktif ? "#dcfce7" : "#f1f5f9",
        color: aktif ? "#15803d" : "#64748b",
      }}
    >
      {status || "Aktif"}
    </span>
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
  gap: "10px",
  marginBottom: "16px",
  alignItems: "center",
  flexWrap: "wrap",
};

const searchStyle = {
  padding: "9px 14px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  width: "320px",
  outline: "none",
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
  fontSize: "14px",
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

const btnWarn = {
  padding: "4px 12px",
  background: "#fffbeb",
  color: "#d97706",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: 500,
  fontSize: "12px",
  marginRight: "5px",
};

const btnToggle = {
  padding: "4px 12px",
  background: "#fef2f2",
  color: "#dc2626",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: 500,
  fontSize: "12px",
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

export default UsersPage;
