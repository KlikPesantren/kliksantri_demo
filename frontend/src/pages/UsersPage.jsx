import { useEffect, useMemo, useState } from "react";
import { FaKey } from "react-icons/fa";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import Modal from "../components/Modal";
import Button from "../components/ui/Button";
import DataTableCard from "../components/ui/DataTableCard";
import TableToolbar from "../components/ui/TableToolbar";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import StatusBadge from "../components/ui/StatusBadge";
import {
  Table,
  TableScroll,
  TableActions,
  TablePagination,
  useClientPagination,
} from "../components/ui/table";
import {
  FormField,
  Input,
  Select,
  FormGrid,
  FormActionBar,
} from "../components/ui/form";
import { hasPermission } from "../utils/hasPermission";
import { getUser } from "../utils/storage";
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

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const currentUser = getUser() || {};

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

  const { page, setPage, paginatedItems, totalItems, pageSize } = useClientPagination(filtered);

  useEffect(() => {
    setPage(1);
  }, [search, setPage]);

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

  const openDelete = (u) => {
    if (String(currentUser.id) === String(u.id)) {
      setError("Tidak dapat menghapus akun sendiri");
      return;
    }
    setDeleteTarget(u);
    setDeleteModal(true);
  };

  const handleDelete = async () => {
    const u = deleteTarget;
    setError("");
    try {
      await api.delete(`/users/${u.id}`);
      setDeleteModal(false);
      flash(`User ${u.username} berhasil dihapus`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Gagal menghapus user");
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
      {error && (
        <div style={bannerError}>{error}</div>
      )}
      {success && (
        <div style={bannerSuccess}>{success}</div>
      )}

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
            <>
              <TableScroll>
                <Table>
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>Username</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Tanggal Dibuat</th>
                      <th className="table-v3__cell--actions">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((u) => (
                      <tr key={u.id}>
                        <td className="table-v3__cell--strong">{u.nama}</td>
                        <td>{u.username}</td>
                        <td>{u.role_label || u.role}</td>
                        <td>
                          <StatusBadge status={u.status || "Aktif"} />
                        </td>
                        <td>{formatDate(u.created_at)}</td>
                        <td className="table-v3__cell--actions">
                          {(hasPermission("user.update") || hasPermission("user.delete")) && (
                            <TableActions
                              items={[
                                {
                                  type: "edit",
                                  hidden: !hasPermission("user.update"),
                                  onClick: () => openEdit(u),
                                },
                                {
                                  type: "custom",
                                  icon: FaKey,
                                  title: "Reset PIN",
                                  hidden: !hasPermission("user.update"),
                                  onClick: () => openResetPassword(u),
                                },
                                {
                                  type: "delete",
                                  title: "Hapus",
                                  hidden:
                                    !hasPermission("user.delete") ||
                                    String(currentUser.id) === String(u.id),
                                  onClick: () => openDelete(u),
                                },
                              ]}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableScroll>
              <TablePagination
                page={page}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={setPage}
              />
            </>
          )}
        </DataTableCard>
      <Modal
        open={formModal}
        title={editId ? "Edit User" : "Tambah User Baru"}
        onClose={() => setFormModal(false)}
      >
        <FormGrid columns="modal">
          <FormField label="Nama Lengkap" htmlFor="user-nama" required>
            <Input
              id="user-nama"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
            />
          </FormField>
          <FormField label="Username" htmlFor="user-username" required>
            <Input
              id="user-username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              disabled={!!editId}
            />
          </FormField>
          <FormField
            label={editId ? "Password Baru (kosongkan jika tidak diubah)" : "Password"}
            htmlFor="user-password"
            required={!editId}
          >
            <Input
              id="user-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </FormField>
          <FormField label="Role" htmlFor="user-role" required>
            <Select
              id="user-role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="">— Pilih Role —</option>
              {roles.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.label || r.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Status" htmlFor="user-status">
            <Select
              id="user-status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </Select>
          </FormField>
        </FormGrid>
        <FormActionBar className="form-action-bar-v3--compact">
          <Button type="button" variant="primary" onClick={handleSave}>
            Simpan
          </Button>
          <Button type="button" variant="outline" onClick={() => setFormModal(false)}>
            Batal
          </Button>
        </FormActionBar>
      </Modal>

      <Modal
        open={pwdModal}
        title={`Reset Password — ${pwdUser?.username || ""}`}
        onClose={() => setPwdModal(false)}
        width={420}
      >
        <FormField label="Password Baru" htmlFor="pwd-new" required>
          <Input
            id="pwd-new"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimal 4 karakter"
          />
        </FormField>
        <FormActionBar className="form-action-bar-v3--compact">
          <Button type="button" variant="primary" onClick={handleResetPassword}>
            Reset Password
          </Button>
          <Button type="button" variant="outline" onClick={() => setPwdModal(false)}>
            Batal
          </Button>
        </FormActionBar>
      </Modal>

      <Modal open={deleteModal} title="Hapus User" onClose={() => setDeleteModal(false)} width={420}>
        <p style={{ margin: "0 0 16px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Hapus user <strong>{deleteTarget?.username}</strong>? Aksi ini tidak bisa dibatalkan.
        </p>
        <FormActionBar className="form-action-bar-v3--compact">
          <Button type="button" variant="danger" onClick={handleDelete}>
            Ya, Hapus
          </Button>
          <Button type="button" variant="outline" onClick={() => setDeleteModal(false)}>
            Batal
          </Button>
        </FormActionBar>
      </Modal>
    </AppShell>
  );
}

const bannerError = {
  background: "var(--danger-subtle)",
  color: "var(--danger)",
  padding: "12px 16px",
  borderRadius: "8px",
  marginBottom: "16px",
  fontSize: "14px",
  borderLeft: "3px solid var(--danger)",
};

const bannerSuccess = {
  background: "var(--success-subtle)",
  color: "var(--primary-hover)",
  padding: "12px 16px",
  borderRadius: "8px",
  marginBottom: "16px",
  fontSize: "14px",
  borderLeft: "3px solid var(--primary-hover)",
};

export default UsersPage;
