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
      console.log(err);
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
      console.log(err);
      alert(err.response?.data?.error || "Gagal reset PIN");
    }
  };

  const getSantri = async () => {
    try {
      const response = await api.get("/santri");
      setSantri(response.data.data || []);
    } catch (err) {
      console.log(err);
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
      console.log(err);
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
      console.log(err);
    }
  };

  const deleteWali = async (id) => {
    try {
      await api.delete(`/wali/${id}`);
      getWali();
    } catch (err) {
      console.log(err);
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
        <div style={formFieldsStyle}>
          <input type="text" name="nama" placeholder="Nama Wali" value={form.nama} onChange={handleChange} />
          <input type="text" name="nomor_hp" placeholder="Nomor HP" value={form.nomor_hp} onChange={handleChange} />
          <input type="text" name="alamat" placeholder="Alamat" value={form.alamat} onChange={handleChange} />
          <select name="santri_id" value={form.santri_id} onChange={handleChange}>
            <option value="">Pilih Santri</option>
            {santri.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama}
              </option>
            ))}
          </select>
        </div>

        <div style={{ ...actionBarStyle, marginTop: "var(--space-4)" }}>
          <Button variant="primary" onClick={editId ? updateWali : createWali}>
            {editId ? "Update" : "Tambah"}
          </Button>
        </div>
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
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Nama</th>
                    <th style={thStyle}>Nomor HP</th>
                    <th style={thStyle}>PIN Awal</th>
                    <th style={thStyle}>Santri</th>
                    <th style={thStyle}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWali.map((item) => (
                    <tr key={item.id}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{item.nama}</td>
                      <td style={tdStyle}>{item.nomor_hp || "—"}</td>
                      <td
                        style={{
                          ...tdStyle,
                          fontFamily: "monospace",
                          letterSpacing: "2px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {DEFAULT_PIN_DISPLAY}
                      </td>
                      <td style={tdStyle}>{item.nama_santri || "—"}</td>
                      <td style={tdStyle}>
                        <Button variant="outline" size="sm" onClick={() => editWali(item)}>
                          Edit
                        </Button>{" "}
                        <Button variant="danger" size="sm" onClick={() => deleteWali(item.id)}>
                          Hapus
                        </Button>{" "}
                        <Button variant="outline" size="sm" onClick={() => resetPin(item.id, item.nama)}>
                          Reset PIN
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

export default WaliPage;
