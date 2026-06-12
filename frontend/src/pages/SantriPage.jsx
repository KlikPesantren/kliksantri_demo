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
      console.log(err);
    }
  };

  const getKelas = async () => {
    try {
      const response = await api.get("/kelas");
      setKelas(response.data.data || []);
    } catch (err) {
      console.log(err);
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
      console.log(err);
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
      console.log(err);
    }
  };

  const deleteSantri = async (id) => {
    try {
      await api.delete(`/santri/${id}`);
      getSantri();
    } catch (err) {
      console.log(err);
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
        <div style={formFieldsStyle}>
          <input type="text" name="nis" placeholder="NIS" value={form.nis} onChange={handleChange} />
          <input type="text" name="nama" placeholder="Nama" value={form.nama} onChange={handleChange} />
          <input type="text" name="uid_rfid" placeholder="UID RFID" value={form.uid_rfid} onChange={handleChange} />
          <input type="text" name="alamat" placeholder="Alamat" value={form.alamat} onChange={handleChange} />
          <input type="text" name="orang_tua" placeholder="Orang Tua" value={form.orang_tua} onChange={handleChange} />
          <input type="text" name="nomor_hp_ortu" placeholder="No HP Ortu" value={form.nomor_hp_ortu} onChange={handleChange} />
          <input type="text" name="foto" placeholder="URL Foto" value={form.foto} onChange={handleChange} />
          <select name="kelas_id" value={form.kelas_id} onChange={handleChange}>
            <option value="">Pilih Kelas</option>
            {kelas.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama_kelas}
              </option>
            ))}
          </select>
        </div>

        <div style={{ ...actionBarStyle, marginTop: "var(--space-4)" }}>
          <Button variant="primary" onClick={editId ? updateSantri : addSantri}>
            {editId ? "Update" : "Tambah"}
          </Button>
        </div>
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
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Foto</th>
                    <th style={thStyle}>NIS</th>
                    <th style={thStyle}>Nama</th>
                    <th style={thStyle}>Kelas</th>
                    <th style={thStyle}>Wali</th>
                    <th style={thStyle}>No Telepon</th>
                    <th style={thStyle}>RFID</th>
                    <th style={thStyle}>Saldo</th>
                    <th style={thStyle}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSantri.map((item) => (
                    <tr key={item.id}>
                      <td style={tdStyle}>
                        {item.foto ? (
                          <img
                            src={item.foto}
                            alt="foto"
                            width="50"
                            height="50"
                            style={{ borderRadius: "10px", objectFit: "cover" }}
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={tdStyle}>{item.nis}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{item.nama}</td>
                      <td style={tdStyle}>{item.nama_kelas}</td>
                      <td style={tdStyle}>{item.nama_wali}</td>
                      <td style={tdStyle}>{item.nomor_hp}</td>
                      <td style={tdStyle}>{item.uid_rfid}</td>
                      <td style={tdStyle}>Rp {Number(item.saldo || 0).toLocaleString()}</td>
                      <td style={tdStyle}>
                        <Button variant="outline" size="sm" onClick={() => editSantri(item)}>
                          Edit
                        </Button>{" "}
                        <Button variant="danger" size="sm" onClick={() => deleteSantri(item.id)}>
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

export default SantriPage;
