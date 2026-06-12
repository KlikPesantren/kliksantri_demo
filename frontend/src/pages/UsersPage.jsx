import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import Modal from "../components/Modal";
import Badge from "../components/ui/Badge";
import Button, { actionBarStyle } from "../components/ui/Button";
import DataTableCard from "../components/ui/DataTableCard";
import TableToolbar from "../components/ui/TableToolbar";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import { hasPermission } from "../utils/hasPermission";
const FORM_INIT = {
  nama: "",
  username: "",
  password: "",
  role: "",
  status: "Aktif",
};

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
    `}</style>
  );
}
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
    <AppShell
      title="Manajemen User"
      description="Kelola akun admin dan hak akses login"
      breadcrumb="Sistem / Manajemen User"
    >
      <LegacyPageStyles />
      {error && (
        <div style={bannerError}>{error}</div>
      )}
      {success && (
        <div style={bannerSuccess}>{success}</div>
      )}

      <div className="legacy-page">
        <DataTableCard
          title="Daftar User"
          subtitle="Kelola akun admin dan hak akses login"
          actions={
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
              {filtered.length} user
            </span>
          }
        >
          <TableToolbar
            search={
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, username, atau role..."
              />
            }
            actions={
              hasPermission("user.create") ? (
                <Button type="button" variant="primary" onClick={openAdd}>
                  + Tambah User
                </Button>
              ) : null
            }
          />

          {loading ? (
            <EmptyState title="Memuat data..." description="Mohon tunggu sebentar." />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={search ? "Tidak ada hasil pencarian" : "Belum ada data user"}
              description={
                search
                  ? "Coba kata kunci lain atau hapus filter pencarian."
                  : "Tambahkan user pertama untuk memulai."
              }
            />
          ) : (
            <div className="table-scroll-x">
              <table style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Nama</th>
                    <th style={thStyle}>Username</th>
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Tanggal Dibuat</th>
                    <th style={thStyle}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{u.nama}</td>
                      <td style={tdStyle}>{u.username}</td>
                      <td style={tdStyle}>{u.role_label || u.role}</td>
                      <td style={tdStyle}>
                        <Badge variant={u.status === "Nonaktif" ? "neutral" : "success"}>
                          {u.status || "Aktif"}
                        </Badge>
                      </td>
                      <td style={tdStyle}>{formatDate(u.created_at)}</td>
                      <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                        {hasPermission("user.update") && (
                          <div style={actionBarStyle}>
                            <Button type="button" variant="outline" size="sm" onClick={() => openEdit(u)}>
                              Edit
                            </Button>
                            <Button type="button" variant="primary" size="sm" onClick={() => openResetPassword(u)}>
                              Reset PIN
                            </Button>
                            {String(currentUser.id) !== String(u.id) && (
                              <Button type="button" variant="outline" size="sm" onClick={() => openToggleStatus(u)}>
                                {u.status === "Nonaktif" ? "Aktifkan" : "Nonaktifkan"}
                              </Button>
                            )}
                          </div>
                        )}
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
          <div style={{ ...actionBarStyle, marginTop: "var(--space-4)" }}>
            <Button type="button" variant="primary" onClick={handleSave}>
              Simpan
            </Button>
            <Button type="button" variant="outline" onClick={() => setFormModal(false)}>
              Batal
            </Button>
          </div>
        </div>
      </Modal>

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
        <div style={{ ...actionBarStyle, marginTop: "var(--space-4)" }}>
          <Button type="button" variant="primary" onClick={handleResetPassword}>
            Reset Password
          </Button>
          <Button type="button" variant="outline" onClick={() => setPwdModal(false)}>
            Batal
          </Button>
        </div>
      </Modal>

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
        <div style={{ ...actionBarStyle, marginTop: "var(--space-4)" }}>
          <Button type="button" variant="primary" onClick={handleToggleStatus}>
            Ya, Lanjutkan
          </Button>
          <Button type="button" variant="outline" onClick={() => setStatusModal(false)}>
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
