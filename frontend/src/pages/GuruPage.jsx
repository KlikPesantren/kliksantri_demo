import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import Card from "../components/ui/Card";
import KpiCard from "../components/ui/KpiCard";
import KpiGrid from "../components/ui/KpiGrid";
import SectionHeading from "../components/ui/SectionHeading";
import Badge from "../components/ui/Badge";
import Button, { actionBarStyle } from "../components/ui/Button";
import DataTableCard from "../components/ui/DataTableCard";
import TableToolbar from "../components/ui/TableToolbar";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";

const FORM_INIT = {
  nama: "",
  jabatan: "",
  nomor_hp: "",
  email: "",
  alamat: "",
  tanggal_masuk: "",
  status: "Aktif",
  catatan: "",
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

function GuruPage() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role || "";

  const [guru, setGuru] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(FORM_INIT);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const getGuru = async () => {
    try {
      const res = await api.get("/guru");
      setGuru(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getGuru();
  }, []);

  const filteredGuru = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return guru;
    return guru.filter((g) =>
      [g.nama, g.jabatan, g.nomor_hp, g.email, g.alamat, g.status, g.catatan].some((field) =>
        String(field || "").toLowerCase().includes(q),
      ),
    );
  }, [guru, search]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openAdd = () => {
    setForm(FORM_INIT);
    setEditId(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEdit = (g) => {
    setForm({
      nama: g.nama || "",
      jabatan: g.jabatan || "",
      nomor_hp: g.nomor_hp || "",
      email: g.email || "",
      alamat: g.alamat || "",
      tanggal_masuk: g.tanggal_masuk ? String(g.tanggal_masuk).slice(0, 10) : "",
      status: g.status || "Aktif",
      catatan: g.catatan || "",
    });
    setEditId(g.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(FORM_INIT);
  };

  const handleSimpan = async () => {
    if (!form.nama.trim()) {
      alert("Nama guru wajib diisi.");
      return;
    }
    try {
      if (editId) {
        await api.put(`/guru/${editId}`, form);
      } else {
        await api.post("/guru", form);
      }
      closeForm();
      getGuru();
    } catch (err) {
      alert("Gagal menyimpan: " + (err.response?.data?.error || err.message));
    }
  };

  const handleToggleStatus = async (g) => {
    const newStatus = g.status === "Aktif" ? "Nonaktif" : "Aktif";
    const label = newStatus === "Nonaktif" ? "Nonaktifkan" : "Aktifkan kembali";
    if (!window.confirm(`${label} guru "${g.nama}"?`)) return;

    try {
      await api.put(`/guru/${g.id}`, {
        nama: g.nama,
        jabatan: g.jabatan || "",
        nomor_hp: g.nomor_hp || "",
        email: g.email || "",
        alamat: g.alamat || "",
        tanggal_masuk: g.tanggal_masuk ? String(g.tanggal_masuk).slice(0, 10) : "",
        status: newStatus,
        catatan: g.catatan || "",
      });
      getGuru();
    } catch (err) {
      alert("Gagal mengubah status: " + (err.response?.data?.error || err.message));
    }
  };

  const handleHapus = async (g) => {
    if (
      !window.confirm(
        `HAPUS PERMANEN guru "${g.nama}"?\n\nPeringatan: Aksi ini tidak dapat dibatalkan.\nGunakan "Nonaktifkan" jika ingin mempertahankan riwayat.`,
      )
    )
      return;

    try {
      await api.delete(`/guru/${g.id}`);
      getGuru();
    } catch (err) {
      alert("Gagal menghapus: " + (err.response?.data?.error || err.message));
    }
  };

  const aktifCount = guru.filter((g) => g.status === "Aktif").length;
  const nonaktifCount = guru.filter((g) => g.status === "Nonaktif").length;

  return (
    <AppShell
      title="Master Guru"
      description="Kelola data guru dan tenaga pendidik pesantren"
      breadcrumb="Master Data / Master Guru"
    >
      <KpiGrid minColumnWidth={180} gap={16}>
        <KpiCard layout="metric" label="Guru Aktif" value={aktifCount} accent="success" />
        <KpiCard layout="metric" label="Guru Nonaktif" value={nonaktifCount} accent="#64748B" />
        <KpiCard layout="metric" label="Total Guru" value={guru.length} accent="teal" />
      </KpiGrid>

      {showForm && (
        <div style={{ marginTop: "var(--space-5)" }}>
        <Card padding="md" shadow="card" border={false} radius="xl">
          <SectionHeading variant="eyebrow" spacing="first">
            {editId ? "Edit Data Guru" : "Tambah Guru Baru"}
          </SectionHeading>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "var(--space-4)" }}>
            <div>
              <label style={labelStyle}>
                Nama Lengkap <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                name="nama"
                value={form.nama}
                onChange={handleChange}
                placeholder="Nama lengkap guru"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Jabatan / Mata Pelajaran</label>
              <input
                name="jabatan"
                value={form.jabatan}
                onChange={handleChange}
                placeholder="Contoh: Wali Kelas, Guru Tahfidz"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Nomor HP</label>
              <input
                name="nomor_hp"
                value={form.nomor_hp}
                onChange={handleChange}
                placeholder="08xxxxxxxxxx"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="guru@pesantren.id"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Tanggal Masuk</label>
              <input
                type="date"
                name="tanggal_masuk"
                value={form.tanggal_masuk}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Status</label>
              <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Alamat</label>
              <textarea
                name="alamat"
                value={form.alamat}
                onChange={handleChange}
                placeholder="Alamat lengkap"
                rows={2}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Catatan</label>
              <textarea
                name="catatan"
                value={form.catatan}
                onChange={handleChange}
                placeholder="Catatan tambahan (opsional)"
                rows={2}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
          </div>

          <div style={{ ...actionBarStyle, marginTop: "var(--space-4)" }}>
            <Button variant="primary" onClick={handleSimpan}>
              {editId ? "Simpan Perubahan" : "Simpan"}
            </Button>
            <Button variant="outline" onClick={closeForm}>
              Batal
            </Button>
          </div>
        </Card>
        </div>
      )}

      <div style={{ marginTop: "var(--space-6)" }}>
        <DataTableCard
          title="Daftar Guru"
          subtitle="Kelola data guru pesantren"
          actions={
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
              {filteredGuru.length} data
            </span>
          }
        >
          <TableToolbar
            search={
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, jabatan, atau email..."
              />
            }
            actions={
              <Button variant="primary" onClick={openAdd}>
                + Tambah Guru
              </Button>
            }
          />

          {filteredGuru.length === 0 ? (
            <EmptyState
              title={guru.length === 0 ? "Belum ada data" : "Tidak ada hasil pencarian"}
              description={
                guru.length === 0
                  ? 'Tambahkan data pertama dengan tombol "+ Tambah Guru".'
                  : "Coba kata kunci lain atau hapus filter pencarian."
              }
              action={
                guru.length === 0 ? (
                  <Button variant="primary" onClick={openAdd}>
                    + Tambah Guru
                  </Button>
                ) : null
              }
            />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>No</th>
                    <th style={thStyle}>Nama</th>
                    <th style={thStyle}>Jabatan</th>
                    <th style={thStyle}>Nomor HP</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Tgl Masuk</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuru.map((g, idx) => (
                    <tr
                      key={g.id}
                      style={{
                        background: editId === g.id ? "#f0fdf4" : "transparent",
                        opacity: g.status === "Nonaktif" ? 0.65 : 1,
                      }}
                    >
                      <td style={{ ...tdStyle, color: "var(--text-secondary)", width: "44px" }}>{idx + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{g.nama}</td>
                      <td style={tdStyle}>{g.jabatan || <Dash />}</td>
                      <td style={tdStyle}>{g.nomor_hp || <Dash />}</td>
                      <td style={tdStyle}>{g.email || <Dash />}</td>
                      <td style={tdStyle}>
                        {g.tanggal_masuk
                          ? new Date(g.tanggal_masuk).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : <Dash />}
                      </td>
                      <td style={tdStyle}>
                        <Badge variant={g.status === "Aktif" ? "success" : "neutral"}>{g.status}</Badge>
                      </td>
                      <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(g)}
                          title="Edit data guru"
                          style={{ marginRight: "5px" }}
                        >
                          Edit
                        </Button>

                        {g.status === "Aktif" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(g)}
                            title="Nonaktifkan guru (data historis tetap tersimpan)"
                            style={{ marginRight: "5px" }}
                          >
                            Nonaktifkan
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(g)}
                            title="Aktifkan kembali guru"
                            style={{ marginRight: "5px" }}
                          >
                            Aktifkan
                          </Button>
                        )}

                        {role === "superadmin" && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleHapus(g)}
                            title="Hapus permanen (tidak dapat dibatalkan)"
                          >
                            Hapus
                          </Button>
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
    </AppShell>
  );
}

function Dash() {
  return <span style={{ color: "#cbd5e1" }}>—</span>;
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
  padding: "9px 10px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  boxSizing: "border-box",
  fontSize: "14px",
  outline: "none",
};

export default GuruPage;
