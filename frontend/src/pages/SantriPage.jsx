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

function SantriPage() {
  const [santri, setSantri] = useState([]);
  const [kelas, setKelas] = useState([]);
  const [editId, setEditId] = useState(null);
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
    setForm({
      nis: item.nis || "",
      nama: item.nama || "",
      uid_rfid: item.uid_rfid || "",
      alamat: item.alamat || "",
      orang_tua: item.nama_wali || "",
      nomor_hp_ortu: item.nomor_hp || "",
      kelas_id: item.kelas_id || "",
      foto: item.foto || "",
    });
  };

  const updateSantri = async () => {
    try {
      await api.put(`/santri/${editId}`, form);
      alert("Santri updated");
      resetForm();
      getSantri();
      setEditId(null);
    } catch (err) {
      console.error(err);
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
    });
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
            </FormGrid>
          </FormSection>

          <FormSection title="Data Orang Tua">
            <FormGrid>
              <FormField label="Nama Orang Tua" htmlFor="santri-ortu">
                <Input id="santri-ortu" type="text" name="orang_tua" value={form.orang_tua} onChange={handleChange} />
              </FormField>
              <FormField label="No HP Orang Tua" htmlFor="santri-hp-ortu">
                <Input id="santri-hp-ortu" type="text" name="nomor_hp_ortu" value={form.nomor_hp_ortu} onChange={handleChange} />
              </FormField>
            </FormGrid>
          </FormSection>

          <FormSection title="Data Administrasi">
            <FormGrid>
              <FormField label="Alamat" htmlFor="santri-alamat" fullWidth>
                <Input id="santri-alamat" type="text" name="alamat" value={form.alamat} onChange={handleChange} />
              </FormField>
              <FormField label="URL Foto" htmlFor="santri-foto" fullWidth>
                <Input id="santri-foto" type="text" name="foto" value={form.foto} onChange={handleChange} />
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
              <Button variant="success" onClick={handleExport}>
                Export Excel
              </Button>
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
                      <th className="table-v3__cell--actions">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((item) => (
                      <tr key={item.id}>
                        <td>
                          {item.foto ? (
                            <img
                              src={item.foto}
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
                        <td className="table-v3__cell--actions">
                          <TableActions
                            items={[
                              { type: "edit", onClick: () => editSantri(item) },
                              { type: "delete", onClick: () => deleteSantri(item.id) },
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

export default SantriPage;
