import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import Card from "../components/ui/Card";
import Button, { actionBarStyle } from "../components/ui/Button";
import DataTableCard from "../components/ui/DataTableCard";
import TableToolbar from "../components/ui/TableToolbar";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import { exportExcel } from "../utils/exportExcel";

const formFieldsStyle = {
  display: "flex",
  gap: "var(--space-3)",
  flexWrap: "wrap",
  alignItems: "center",
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

function KelasPage() {
  const [kelas, setKelas] = useState([]);
  const [namaKelas, setNamaKelas] = useState("");
  const [tableSearch, setTableSearch] = useState("");

  const getKelas = async () => {
    try {
      const response = await api.get("/kelas");
      setKelas(response.data.data || []);
    } catch (err) {
      console.log(err);
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
      console.log(err);
    }
  };

  const deleteKelas = async (id) => {
    try {
      await api.delete(`/kelas/${id}`);
      getKelas();
    } catch (err) {
      console.log(err);
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
        <div style={formFieldsStyle}>
          <input
            type="text"
            placeholder="Nama Kelas"
            value={namaKelas}
            onChange={(e) => setNamaKelas(e.target.value)}
          />
        </div>

        <div style={{ ...actionBarStyle, marginTop: "var(--space-4)" }}>
          <Button variant="primary" onClick={addKelas}>
            Tambah
          </Button>
        </div>
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
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Nama Kelas</th>
                    <th style={thStyle}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKelas.map((item) => (
                    <tr key={item.id}>
                      <td style={tdStyle}>{item.id}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{item.nama_kelas}</td>
                      <td style={tdStyle}>
                        <Button variant="danger" size="sm" onClick={() => deleteKelas(item.id)}>
                          Hapus
                        </Button>
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

export default KelasPage;
