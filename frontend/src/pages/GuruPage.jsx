import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import Card from "../components/ui/Card";
import KpiCard from "../components/ui/KpiCard";
import KpiGrid from "../components/ui/KpiGrid";
import SectionHeading from "../components/ui/SectionHeading";
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
  Textarea,
  FormGrid,
  FormActionBar,
} from "../components/ui/form";
import { getUser } from "../utils/storage";
import { formatNumber } from "../utils/formatCurrency";

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

function GuruPage() {
  const user = getUser() || {};
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

  const { page, setPage, paginatedItems, totalItems, pageSize } = useClientPagination(filteredGuru);

  useEffect(() => {
    setPage(1);
  }, [search, setPage]);

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
      <KpiGrid>
        <KpiCard label="Guru Aktif" value={formatNumber(aktifCount)} accent="success" />
        <KpiCard label="Guru Nonaktif" value={formatNumber(nonaktifCount)} accent="neutral" />
        <KpiCard label="Total Guru" value={formatNumber(guru.length)} accent="primary" />
      </KpiGrid>

      {showForm && (
        <div style={{ marginTop: "var(--space-5)" }}>
        <Card padding="md" shadow="card" border={false} radius="xl">
          <SectionHeading variant="eyebrow" spacing="first">
            {editId ? "Edit Data Guru" : "Tambah Guru Baru"}
          </SectionHeading>

          <FormGrid>
            <FormField label="Nama Lengkap" htmlFor="guru-nama" required>
              <Input
                id="guru-nama"
                name="nama"
                value={form.nama}
                onChange={handleChange}
                placeholder="Nama lengkap guru"
              />
            </FormField>
            <FormField label="Jabatan / Mata Pelajaran" htmlFor="guru-jabatan">
              <Input
                id="guru-jabatan"
                name="jabatan"
                value={form.jabatan}
                onChange={handleChange}
                placeholder="Contoh: Wali Kelas, Guru Tahfidz"
              />
            </FormField>
            <FormField label="Nomor HP" htmlFor="guru-hp">
              <Input
                id="guru-hp"
                name="nomor_hp"
                value={form.nomor_hp}
                onChange={handleChange}
                placeholder="08xxxxxxxxxx"
              />
            </FormField>
            <FormField label="Email" htmlFor="guru-email">
              <Input
                id="guru-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="guru@pesantren.id"
              />
            </FormField>
            <FormField label="Tanggal Masuk" htmlFor="guru-tgl">
              <Input
                id="guru-tgl"
                type="date"
                name="tanggal_masuk"
                value={form.tanggal_masuk}
                onChange={handleChange}
              />
            </FormField>
            <FormField label="Status" htmlFor="guru-status">
              <Select id="guru-status" name="status" value={form.status} onChange={handleChange}>
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </Select>
            </FormField>
            <FormField label="Alamat" htmlFor="guru-alamat" fullWidth>
              <Textarea
                id="guru-alamat"
                name="alamat"
                value={form.alamat}
                onChange={handleChange}
                placeholder="Alamat lengkap"
                rows={2}
              />
            </FormField>
            <FormField label="Catatan" htmlFor="guru-catatan" fullWidth>
              <Textarea
                id="guru-catatan"
                name="catatan"
                value={form.catatan}
                onChange={handleChange}
                placeholder="Catatan tambahan (opsional)"
                rows={2}
              />
            </FormField>
          </FormGrid>

          <FormActionBar className="form-action-bar-v3--compact">
            <Button variant="primary" onClick={handleSimpan}>
              {editId ? "Simpan Perubahan" : "Simpan"}
            </Button>
            <Button variant="outline" onClick={closeForm}>
              Batal
            </Button>
          </FormActionBar>
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
            <>
              <TableScroll>
                <Table>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Nama</th>
                      <th>Jabatan</th>
                      <th>Nomor HP</th>
                      <th>Email</th>
                      <th>Tgl Masuk</th>
                      <th>Status</th>
                      <th className="table-v3__cell--actions">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((g, idx) => (
                      <tr
                        key={g.id}
                        style={{
                          background: editId === g.id ? "var(--primary-subtle)" : "transparent",
                          opacity: g.status === "Nonaktif" ? 0.65 : 1,
                        }}
                      >
                        <td className="table-v3__cell--muted">{(page - 1) * pageSize + idx + 1}</td>
                        <td className="table-v3__cell--strong">{g.nama}</td>
                        <td>{g.jabatan || <Dash />}</td>
                        <td>{g.nomor_hp || <Dash />}</td>
                        <td>{g.email || <Dash />}</td>
                        <td>
                          {g.tanggal_masuk
                            ? new Date(g.tanggal_masuk).toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : <Dash />}
                        </td>
                        <td>
                          <StatusBadge status={g.status} />
                        </td>
                        <td className="table-v3__cell--actions">
                          <TableActions
                            items={[
                              { type: "edit", onClick: () => openEdit(g) },
                              {
                                type: "toggle",
                                active: g.status === "Aktif",
                                onClick: () => handleToggleStatus(g),
                              },
                              {
                                type: "delete",
                                hidden: role !== "superadmin",
                                onClick: () => handleHapus(g),
                              },
                            ]}
                          />
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
      </div>
    </AppShell>
  );
}

function Dash() {
  return <span style={{ color: "var(--border-hover)" }}>—</span>;
}

export default GuruPage;
