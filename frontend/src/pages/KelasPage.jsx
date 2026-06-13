import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import DataTableCard from "../components/ui/DataTableCard";
import TableToolbar from "../components/ui/TableToolbar";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import { Table, TableScroll, TableActions } from "../components/ui/table";
import { FormField, Input, FormGrid, FormActionBar } from "../components/ui/form";
import { exportExcel } from "../utils/exportExcel";

function KelasPage() {
  const [kelas, setKelas] = useState([]);
  const [namaKelas, setNamaKelas] = useState("");
  const [tableSearch, setTableSearch] = useState("");

  const getKelas = async () => {
    try {
      const response = await api.get("/kelas");
      setKelas(response.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getKelas();
  }, []);

  const filteredKelas = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return kelas;
    return kelas.filter((item) =>
      [item.id, item.nama_kelas].some((field) => String(field || "").toLowerCase().includes(q)),
    );
  }, [kelas, tableSearch]);

  const addKelas = async () => {
    try {
      await api.post("/kelas", {
        nama_kelas: namaKelas,
      });

      setNamaKelas("");
      getKelas();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteKelas = async (id) => {
    try {
      await api.delete(`/kelas/${id}`);
      getKelas();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = () => {
    const rows = kelas.map((item) => ({
      ID: item.id,
      NamaKelas: item.nama_kelas,
    }));

    exportExcel(rows, "Kelas");
  };

  return (
    <AppShell title="Data Kelas" breadcrumb="Master Data / Kelas">
      <Card padding="md" shadow="card" border={false} radius="xl">
        <FormGrid columns="single">
          <FormField label="Nama Kelas" htmlFor="kelas-nama" required>
            <Input
              id="kelas-nama"
              type="text"
              value={namaKelas}
              onChange={(e) => setNamaKelas(e.target.value)}
              placeholder="Contoh: Kelas 1A"
            />
          </FormField>
        </FormGrid>
        <FormActionBar className="form-action-bar-v3--compact">
          <Button variant="primary" onClick={addKelas}>
            Tambah
          </Button>
        </FormActionBar>
      </Card>

      <div style={{ marginTop: "var(--space-6)" }}>
        <DataTableCard
          title="Daftar Kelas"
          subtitle="Kelola data kelas pesantren"
          actions={
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
              {filteredKelas.length} data
            </span>
          }
        >
          <TableToolbar
            search={
              <SearchInput
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Cari ID atau nama kelas..."
              />
            }
            actions={
              <Button variant="success" onClick={handleExport}>
                Export Excel
              </Button>
            }
          />

          {filteredKelas.length === 0 ? (
            <EmptyState
              title={kelas.length === 0 ? "Belum ada data" : "Tidak ada hasil pencarian"}
              description={
                kelas.length === 0
                  ? "Tambahkan data pertama untuk memulai."
                  : "Coba kata kunci lain atau hapus filter pencarian."
              }
            />
          ) : (
            <TableScroll>
              <Table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nama Kelas</th>
                    <th className="table-v3__cell--actions">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKelas.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td className="table-v3__cell--strong">{item.nama_kelas}</td>
                      <td className="table-v3__cell--actions">
                        <TableActions
                          items={[{ type: "delete", onClick: () => deleteKelas(item.id) }]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableScroll>
          )}
        </DataTableCard>
      </div>
    </AppShell>
  );
}

export default KelasPage;
