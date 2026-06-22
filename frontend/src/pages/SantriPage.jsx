import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import DataTableCard from "../components/ui/DataTableCard";
import TableToolbar from "../components/ui/TableToolbar";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
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
  FormSection,
  FormActionBar,
} from "../components/ui/form";
import { exportExcel } from "../utils/exportExcel";
import SantriImportModal from "../components/santri/SantriImportModal";
import SantriOperationalChecklist from "../components/santri/SantriOperationalChecklist";
import ImageUploadField from "../components/ImageUploadField";
import { resolveDisplayMediaUrl } from "../utils/mediaUrl";
import { formatCurrency } from "../utils/formatCurrency";

function isStatusNonAktif(status) {
  const normalized = String(status ?? "aktif").trim().toLowerCase();
  return normalized !== "aktif" && normalized !== "active" && normalized !== "";
}

function formatExitSummary(summary) {
  const lines = [
    `Tagihan pembayaran belum lunas: ${summary.tagihan_pembayaran_belum_lunas || 0}`,
    `Tagihan sahriyah belum lunas: ${summary.tagihan_sahriyah_belum_lunas || 0}`,
    `Saldo RFID: ${formatCurrency(Number(summary.saldo_rfid || 0))}`,
    `Kartu RFID terdaftar: ${summary.kartu_rfid_aktif ? "Ya" : "Tidak"}`,
    `Wali terhubung: ${summary.wali_terhubung ? "Ya" : "Belum"}`,
  ];
  return lines.join("\n");
}

function SantriPage() {
  const [santri, setSantri] = useState([]);
  const [kelas, setKelas] = useState([]);
  const [editId, setEditId] = useState(null);
  const [originalStatus, setOriginalStatus] = useState("aktif");
  const [importOpen, setImportOpen] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [form, setForm] = useState({
    nis: "",
    nama: "",
    uid_rfid: "",
    alamat: "",
    orang_tua: "",
    nomor_hp_ortu: "",
    kelas_id: "",
    foto: "",
    status: "aktif",
  });

  const getSantri = async () => {
    try {
      const response = await api.get("/santri");
      setSantri(response.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getKelas = async () => {
    try {
      const response = await api.get("/kelas");
      setKelas(response.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getSantri();
    getKelas();
  }, []);

  const filteredSantri = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return santri;
    return santri.filter((item) =>
      [item.nis, item.nama, item.nama_kelas, item.nama_wali, item.nomor_hp, item.uid_rfid]
        .some((field) => String(field || "").toLowerCase().includes(q)),
    );
  }, [santri, tableSearch]);

  const { page, setPage, paginatedItems, totalItems, pageSize } = useClientPagination(filteredSantri);

  useEffect(() => {
    setPage(1);
  }, [tableSearch, setPage]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const addSantri = async () => {
    try {
      await api.post("/santri", form);
      resetForm();
      getSantri();
    } catch (err) {
      console.error(err);
    }
  };

  const editSantri = (item) => {
    setEditId(item.id);
    setOriginalStatus(item.status || "aktif");
    setForm({
      nis: item.nis || "",
      nama: item.nama || "",
      uid_rfid: item.uid_rfid || "",
      alamat: item.alamat || "",
      orang_tua: item.nama_wali || "",
      nomor_hp_ortu: item.nomor_hp || "",
      kelas_id: item.kelas_id || "",
      foto: item.foto || "",
      status: item.status || "aktif",
    });
  };

  const updateSantri = async () => {
    try {
      const wasAktif = !isStatusNonAktif(originalStatus);
      const willNonAktif = isStatusNonAktif(form.status);

      if (wasAktif && willNonAktif) {
        const summaryRes = await api.get(`/santri/${editId}/exit-summary`);
        const summary = summaryRes.data.data;
        const ok = window.confirm(
          `Santri akan diubah menjadi nonaktif.\n\nRingkasan:\n${formatExitSummary(summary)}\n\nLanjutkan?`,
        );
        if (!ok) return;
      }

      const response = await api.put(`/santri/${editId}`, form);
      if (response.data.exit_summary) {
        alert(
          `Santri diperbarui.\n\nRingkasan keluar:\n${formatExitSummary(response.data.exit_summary)}`,
        );
      } else {
        alert("Santri updated");
      }
      resetForm();
      getSantri();
      setEditId(null);
      setOriginalStatus("aktif");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Gagal memperbarui santri");
    }
  };

  const deleteSantri = async (id) => {
    try {
      await api.delete(`/santri/${id}`);
      getSantri();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setForm({
      nis: "",
      nama: "",
      uid_rfid: "",
      alamat: "",
      orang_tua: "",
      nomor_hp_ortu: "",
      kelas_id: "",
      foto: "",
      status: "aktif",
    });
    setEditId(null);
    setOriginalStatus("aktif");
  };

  const handleExport = () => {
    const rows = santri.map((item) => ({
      NIS: item.nis,
      Nama: item.nama,
      Kelas: item.nama_kelas,
      Wali: item.nama_wali,
      NomorHP: item.nomor_hp,
      RFID: item.uid_rfid,
      Saldo: item.saldo,
    }));

    exportExcel(rows, "Santri");
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get("/santri/import/template", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "template_import_santri.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Gagal unduh template");
    }
  };

  return (
    <AppShell title="Data Santri" breadcrumb="Master Data / Santri">
      <Card padding="md" shadow="card" border={false} radius="xl">
        <FormSection title={editId ? "Edit Santri" : "Tambah Santri"}>
          <FormSection title="Data Santri">
            <FormGrid>
              <FormField label="NIS" htmlFor="santri-nis" required>
                <Input id="santri-nis" type="text" name="nis" value={form.nis} onChange={handleChange} />
              </FormField>
              <FormField label="Nama Lengkap" htmlFor="santri-nama" required>
                <Input id="santri-nama" type="text" name="nama" value={form.nama} onChange={handleChange} />
              </FormField>
              <FormField label="Kelas" htmlFor="santri-kelas">
                <Select id="santri-kelas" name="kelas_id" value={form.kelas_id} onChange={handleChange}>
                  <option value="">Pilih Kelas</option>
                  {kelas.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama_kelas}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="UID RFID" htmlFor="santri-rfid">
                <Input id="santri-rfid" type="text" name="uid_rfid" value={form.uid_rfid} onChange={handleChange} />
              </FormField>
              <FormField label="Status" htmlFor="santri-status">
                <Select id="santri-status" name="status" value={form.status} onChange={handleChange}>
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                  <option value="lulus">Lulus</option>
                  <option value="keluar">Keluar</option>
                </Select>
              </FormField>
            </FormGrid>
          </FormSection>

          {editId ? <SantriOperationalChecklist santriId={editId} /> : null}

          <FormSection title="Data Wali">
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-secondary)" }}>
              Nomor HP ini otomatis menjadi akun login aplikasi wali.
            </p>
            <FormGrid>
              <FormField label="Nama Wali" htmlFor="santri-ortu">
                <Input id="santri-ortu" type="text" name="orang_tua" value={form.orang_tua} onChange={handleChange} />
              </FormField>
              <FormField label="Nomor HP Wali" htmlFor="santri-hp-ortu">
                <Input id="santri-hp-ortu" type="text" name="nomor_hp_ortu" value={form.nomor_hp_ortu} onChange={handleChange} />
              </FormField>
            </FormGrid>
          </FormSection>

          <FormSection title="Data Administrasi">
            <FormGrid>
              <FormField label="Alamat" htmlFor="santri-alamat" fullWidth>
                <Input id="santri-alamat" type="text" name="alamat" value={form.alamat} onChange={handleChange} />
              </FormField>
              <FormField label="Upload Foto" htmlFor="santri-foto" fullWidth>
                <ImageUploadField
                  id="santri-foto"
                  label="Foto Santri"
                  value={form.foto}
                  onChange={(url) => setForm((prev) => ({ ...prev, foto: url }))}
                  accept="image/*"
                  pickLabel="Pilih Foto"
                  previewHeight={120}
                />
              </FormField>
            </FormGrid>
          </FormSection>

          <FormActionBar className="form-action-bar-v3--compact">
            <Button variant="primary" onClick={editId ? updateSantri : addSantri}>
              {editId ? "Update" : "Tambah"}
            </Button>
          </FormActionBar>
        </FormSection>
      </Card>

      <div style={{ marginTop: "var(--space-6)" }}>
        <DataTableCard
          title="Daftar Santri"
          subtitle="Kelola data santri pesantren"
          actions={
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
              {filteredSantri.length} data
            </span>
          }
        >
          <TableToolbar
            search={
              <SearchInput
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Cari NIS, nama, kelas, wali, RFID..."
              />
            }
            actions={
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Button variant="secondary" onClick={handleDownloadTemplate}>
                  Download Template
                </Button>
                <Button variant="primary" onClick={() => setImportOpen(true)}>
                  Import Excel
                </Button>
                <Button variant="success" onClick={handleExport}>
                  Export Excel
                </Button>
              </div>
            }
          />

          {filteredSantri.length === 0 ? (
            <EmptyState
              title={santri.length === 0 ? "Belum ada data" : "Tidak ada hasil pencarian"}
              description={
                santri.length === 0
                  ? "Tambahkan data pertama untuk memulai."
                  : "Coba kata kunci lain atau hapus filter pencarian."
              }
            />
          ) : (
            <>
              <TableScroll>
                <Table>
                  <thead>
                    <tr>
                      <th>Foto</th>
                      <th>NIS</th>
                      <th>Nama</th>
                      <th>Kelas</th>
                      <th>Wali</th>
                      <th>No Telepon</th>
                      <th>RFID</th>
                      <th>Saldo</th>
                      <th>Status</th>
                      <th className="table-v3__cell--actions">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((item) => {
                      const fotoSrc = resolveDisplayMediaUrl(item.foto);
                      return (
                      <tr key={item.id}>
                        <td>
                          {fotoSrc ? (
                            <img
                              src={fotoSrc}
                              alt="foto"
                              width="40"
                              height="40"
                              style={{ borderRadius: "8px", objectFit: "cover" }}
                            />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>{item.nis}</td>
                        <td className="table-v3__cell--strong">{item.nama}</td>
                        <td>{item.nama_kelas || "—"}</td>
                        <td>{item.nama_wali || "—"}</td>
                        <td>{item.nomor_hp || "—"}</td>
                        <td className="table-v3__cell--mono">{item.uid_rfid || "—"}</td>
                        <td>Rp {Number(item.saldo || 0).toLocaleString()}</td>
                        <td>{item.status || "aktif"}</td>
                        <td className="table-v3__cell--actions">
                          <TableActions
                            items={[
                              { type: "edit", onClick: () => editSantri(item) },
                              { type: "delete", onClick: () => deleteSantri(item.id) },
                            ]}
                          />
                        </td>
                      </tr>
                      );
                    })}
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

      <SantriImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={getSantri}
      />
    </AppShell>
  );
}

export default SantriPage;
