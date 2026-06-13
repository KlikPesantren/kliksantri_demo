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
import { FaKey } from "react-icons/fa";
import {
  FormField,
  Input,
  Select,
  FormGrid,
  FormActionBar,
} from "../components/ui/form";
import { exportExcel } from "../utils/exportExcel";

function WaliPage() {
  const [wali, setWali] = useState([]);
  const [santri, setSantri] = useState([]);
  const [editId, setEditId] = useState(null);
  const [tableSearch, setTableSearch] = useState("");
  const [form, setForm] = useState({
    nama: "",
    nomor_hp: "",
    alamat: "",
    santri_id: "",
  });

  const DEFAULT_PIN_DISPLAY = "456789";

  const getWali = async () => {
    try {
      const response = await api.get("/wali");
      setWali(response.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const resetPin = async (id, nama) => {
    if (!window.confirm(`Reset PIN ${nama} ke ${DEFAULT_PIN_DISPLAY}?`)) return;

    try {
      await api.put(`/wali/${id}/reset-pin`);

      alert(
        `PIN ${nama} berhasil direset ke ${DEFAULT_PIN_DISPLAY}.\nWali wajib ganti PIN saat login berikutnya.`,
      );
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Gagal reset PIN");
    }
  };

  const getSantri = async () => {
    try {
      const response = await api.get("/santri");
      setSantri(response.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getWali();
    getSantri();
  }, []);

  const filteredWali = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return wali;
    return wali.filter((item) =>
      [item.nama, item.nomor_hp, item.alamat, item.nama_santri]
        .some((field) => String(field || "").toLowerCase().includes(q)),
    );
  }, [wali, tableSearch]);

  const { page, setPage, paginatedItems, totalItems, pageSize } = useClientPagination(filteredWali);

  useEffect(() => {
    setPage(1);
  }, [tableSearch, setPage]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setForm({
      nama: "",
      nomor_hp: "",
      alamat: "",
      santri_id: "",
    });
  };

  const createWali = async () => {
    try {
      await api.post("/wali", form);
      alert("Wali berhasil");
      resetForm();
      getWali();
    } catch (err) {
      console.error(err);
      alert("Gagal input");
    }
  };

  const editWali = (item) => {
    setEditId(item.id);
    setForm({
      nama: item.nama || "",
      nomor_hp: item.nomor_hp || "",
      alamat: item.alamat || "",
      santri_id: item.santri_id || "",
    });
  };

  const updateWali = async () => {
    try {
      await api.put(`/wali/${editId}`, form);
      alert("Wali updated");
      resetForm();
      getWali();
      setEditId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteWali = async (id) => {
    try {
      await api.delete(`/wali/${id}`);
      getWali();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = () => {
    const rows = wali.map((item) => ({
      Nama: item.nama,
      NomorHP: item.nomor_hp,
      Alamat: item.alamat,
      Santri: item.nama_santri,
    }));

    exportExcel(rows, "WaliSantri");
  };

  return (
    <AppShell title="Wali Santri" breadcrumb="Master Data / Wali Santri">
      <Card padding="md" shadow="card" border={false} radius="xl">
        <FormGrid>
          <FormField label="Nama Wali" htmlFor="wali-nama" required>
            <Input id="wali-nama" type="text" name="nama" value={form.nama} onChange={handleChange} />
          </FormField>
          <FormField label="Nomor HP" htmlFor="wali-hp">
            <Input id="wali-hp" type="text" name="nomor_hp" value={form.nomor_hp} onChange={handleChange} />
          </FormField>
          <FormField label="Alamat" htmlFor="wali-alamat" fullWidth>
            <Input id="wali-alamat" type="text" name="alamat" value={form.alamat} onChange={handleChange} />
          </FormField>
          <FormField label="Santri" htmlFor="wali-santri" required>
            <Select id="wali-santri" name="santri_id" value={form.santri_id} onChange={handleChange}>
              <option value="">Pilih Santri</option>
              {santri.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
            </Select>
          </FormField>
        </FormGrid>
        <FormActionBar className="form-action-bar-v3--compact">
          <Button variant="primary" onClick={editId ? updateWali : createWali}>
            {editId ? "Update" : "Tambah"}
          </Button>
        </FormActionBar>
      </Card>

      <div style={{ marginTop: "var(--space-6)" }}>
        <DataTableCard
          title="Daftar Wali Santri"
          subtitle="Kelola data wali santri pesantren"
          actions={
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
              {filteredWali.length} data
            </span>
          }
        >
          <TableToolbar
            search={
              <SearchInput
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Cari nama, nomor HP, alamat, santri..."
              />
            }
            actions={
              <Button variant="success" onClick={handleExport}>
                Export Excel
              </Button>
            }
          />

          {filteredWali.length === 0 ? (
            <EmptyState
              title={wali.length === 0 ? "Belum ada data" : "Tidak ada hasil pencarian"}
              description={
                wali.length === 0
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
                    <th>Nama</th>
                    <th>Nomor HP</th>
                    <th>PIN Awal</th>
                    <th>Santri</th>
                    <th className="table-v3__cell--actions">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((item) => (
                    <tr key={item.id}>
                      <td className="table-v3__cell--strong">{item.nama}</td>
                      <td>{item.nomor_hp || "—"}</td>
                      <td className="table-v3__cell--mono">{DEFAULT_PIN_DISPLAY}</td>
                      <td>{item.nama_santri || "—"}</td>
                      <td className="table-v3__cell--actions">
                        <TableActions
                          items={[
                            { type: "edit", onClick: () => editWali(item) },
                            { type: "delete", onClick: () => deleteWali(item.id) },
                            {
                              type: "custom",
                              icon: FaKey,
                              title: "Reset PIN",
                              onClick: () => resetPin(item.id, item.nama),
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

export default WaliPage;
