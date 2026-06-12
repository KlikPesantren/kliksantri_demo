import { useEffect, useState } from "react";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import Card from "../components/ui/Card";
import SectionHeading from "../components/ui/SectionHeading";
import KpiCard from "../components/ui/KpiCard";
import KpiGrid from "../components/ui/KpiGrid";
import Badge from "../components/ui/Badge";
import Button, { actionBarStyle } from "../components/ui/Button";
import DataTableCard from "../components/ui/DataTableCard";
import TableToolbar from "../components/ui/TableToolbar";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import { exportExcel } from "../utils/exportExcel";

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "var(--space-4)",
};

const spanFull = { gridColumn: "1 / -1" };

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

const fieldStyle = {
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
};

function LegacyPageStyles() {
  return (
    <style>{`
      .legacy-page {
        min-width: 0;
        max-width: 100%;
      }
      .table-scroll-x {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        max-width: 100%;
        min-width: 0;
      }
      .table-scroll-x > table {
        width: max-content;
        min-width: 100%;
      }
      .legacy-form-grid input,
      .legacy-form-grid select,
      .legacy-form-grid textarea {
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
      }
    `}</style>
  );
}

function TamuPage() {
  const [tamu, setTamu] = useState([]);
  const [editId, setEditId] = useState(null);
  const [searchNama, setSearchNama] = useState("");
  const [searchTujuan, setSearchTujuan] = useState("");
  const [searchInstansi, setSearchInstansi] = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [form, setForm] = useState({
    nama_tamu: "",
    no_hp: "",
    alamat: "",
    instansi: "",
    tujuan: "",
    bertemu_dengan: "",
    keperluan: "",
    jumlah_orang: 1,
    petugas: "",
  });

  const getTamu = async () => {
    try {
      const response = await api.get("/tamu");
      setTamu(response.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getTamu();
  }, []);

  const simpanTamu = async () => {
    try {
      if (editId) {
        await api.put(`/tamu/${editId}`, form);
      } else {
        await api.post("/tamu", form);
      }

      alert("Data berhasil disimpan");

      setEditId(null);
      setForm({
        nama_tamu: "",
        no_hp: "",
        alamat: "",
        instansi: "",
        tujuan: "",
        bertemu_dengan: "",
        keperluan: "",
        jumlah_orang: 1,
        petugas: "",
      });

      getTamu();
    } catch (err) {
      console.log(err);
      alert("Gagal");
    }
  };

  const editTamu = (item) => {
    setEditId(item.id);
    setForm({
      nama_tamu: item.nama_tamu || "",
      no_hp: item.no_hp || "",
      alamat: item.alamat || "",
      instansi: item.instansi || "",
      tujuan: item.tujuan || "",
      bertemu_dengan: item.bertemu_dengan || "",
      keperluan: item.keperluan || "",
      jumlah_orang: item.jumlah_orang || 1,
      petugas: item.petugas || "",
    });
  };

  const hapusTamu = async (id) => {
    if (!window.confirm("Hapus data?")) return;

    try {
      await api.delete(`/tamu/${id}`);
      getTamu();
    } catch (err) {
      console.log(err);
    }
  };

  const keluarTamu = async (id) => {
    if (!window.confirm("Tamu sudah pulang?")) return;

    try {
      await api.patch(`/tamu/${id}/keluar`);
      await getTamu();
    } catch (err) {
      console.log(err);
    }
  };

  const filtered = tamu.filter((item) => {
    console.log("TAMU", tamu);
    const nama = (item.nama_tamu || "")
      .toLowerCase()
      .includes(searchNama.toLowerCase());

    const tujuan = (item.tujuan || "")
      .toLowerCase()
      .includes(searchTujuan.toLowerCase());

    const instansi = (item.instansi || "")
      .toLowerCase()
      .includes(searchInstansi.toLowerCase());

    const tanggal =
      !filterTanggal
        ? true
        : item.tanggal?.split("T")[0] === filterTanggal;

    return nama && tujuan && instansi && tanggal;
  });

  const today = new Date().toLocaleDateString("sv-SE");

  const totalHariIni = tamu.filter(
    (t) =>
      new Date(t.tanggal).toLocaleDateString("sv-SE") === today,
  ).length;

  const masihDidalam = tamu.filter((t) => t.status === "Masuk").length;
  const sudahKeluar = tamu.filter((t) => t.status === "Keluar").length;

  const bulanIni = new Date().getMonth() + 1;
  const tahunIni = new Date().getFullYear();

  const totalBulanIni = tamu.filter((t) => {
    const d = new Date(t.tanggal);
    return d.getMonth() + 1 === bulanIni && d.getFullYear() === tahunIni;
  }).length;

  const exportData = () => {
    exportExcel(
      filtered.map((item) => ({
        Tanggal: new Date(item.tanggal).toLocaleDateString("id-ID"),
        "Jam Masuk": item.jam_masuk,
        "Jam Keluar": item.jam_keluar || "-",
        "Nama Tamu": item.nama_tamu,
        Instansi: item.instansi,
        Tujuan: item.tujuan,
        "Bertemu Dengan": item.bertemu_dengan,
        "Jumlah Orang": item.jumlah_orang,
        Status: item.status,
        Petugas: item.petugas,
      })),
      "DaftarTamu",
    );
  };

  return (
    <AppShell title="Daftar Hadir Tamu" breadcrumb="Keamanan / Daftar Hadir Tamu">
      <LegacyPageStyles />
      <div className="legacy-page">
        <KpiGrid minColumnWidth={200} gap={16}>
          <KpiCard layout="metric" label="Tamu Hari Ini" value={totalHariIni} accent="teal" />
          <KpiCard layout="metric" label="Masih Di Dalam" value={masihDidalam} accent="success" />
          <KpiCard layout="metric" label="Sudah Keluar" value={sudahKeluar} accent="danger" />
          <KpiCard layout="metric" label="Bulan Ini" value={totalBulanIni} accent="teal" />
        </KpiGrid>

        <div style={{ marginTop: "var(--space-6)" }}>
          <Card padding="md" shadow="card" border={false} radius="xl">
            <SectionHeading variant="eyebrow" spacing="first">
              Input Tamu
            </SectionHeading>

            <div className="legacy-form-grid" style={{ ...formGridStyle, marginTop: "var(--space-4)" }}>
              <input
                style={fieldStyle}
                placeholder="Nama Tamu"
                value={form.nama_tamu}
                onChange={(e) => setForm({ ...form, nama_tamu: e.target.value })}
              />

              <input
                style={fieldStyle}
                placeholder="Nomor HP"
                value={form.no_hp}
                onChange={(e) => setForm({ ...form, no_hp: e.target.value })}
              />

              <input
                style={fieldStyle}
                placeholder="Instansi"
                value={form.instansi}
                onChange={(e) => setForm({ ...form, instansi: e.target.value })}
              />

              <input
                style={fieldStyle}
                placeholder="Tujuan"
                value={form.tujuan}
                onChange={(e) => setForm({ ...form, tujuan: e.target.value })}
              />

              <input
                style={fieldStyle}
                placeholder="Bertemu Dengan"
                value={form.bertemu_dengan}
                onChange={(e) => setForm({ ...form, bertemu_dengan: e.target.value })}
              />

              <input
                style={fieldStyle}
                type="number"
                placeholder="Jumlah Orang"
                value={form.jumlah_orang}
                onChange={(e) => setForm({ ...form, jumlah_orang: e.target.value })}
              />

              <input
                style={fieldStyle}
                placeholder="Petugas"
                value={form.petugas}
                onChange={(e) => setForm({ ...form, petugas: e.target.value })}
              />

              <textarea
                style={{ ...fieldStyle, ...spanFull, minHeight: "80px", resize: "vertical" }}
                placeholder="Alamat"
                value={form.alamat}
                onChange={(e) => setForm({ ...form, alamat: e.target.value })}
              />

              <textarea
                style={{ ...fieldStyle, ...spanFull, minHeight: "80px", resize: "vertical" }}
                placeholder="Keperluan"
                value={form.keperluan}
                onChange={(e) => setForm({ ...form, keperluan: e.target.value })}
              />
            </div>

            <div style={{ ...actionBarStyle, marginTop: "var(--space-4)" }}>
              <Button variant="primary" onClick={simpanTamu}>
                Simpan
              </Button>
            </div>
          </Card>
        </div>

        <div style={{ marginTop: "var(--space-6)" }}>
          <DataTableCard
            title="Daftar Tamu"
            subtitle="Rekap kunjungan tamu pesantren"
            actions={
              <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
                {tamu.length} tamu
              </span>
            }
          >
            <div
              className="legacy-form-grid"
              style={{ ...formGridStyle, marginBottom: "var(--space-4)" }}
            >
              <SearchInput
                value={searchNama}
                onChange={(e) => setSearchNama(e.target.value)}
                placeholder="Cari nama..."
              />
              <SearchInput
                value={searchTujuan}
                onChange={(e) => setSearchTujuan(e.target.value)}
                placeholder="Cari tujuan..."
              />
              <SearchInput
                value={searchInstansi}
                onChange={(e) => setSearchInstansi(e.target.value)}
                placeholder="Cari instansi..."
              />
              <input
                style={fieldStyle}
                type="date"
                value={filterTanggal}
                onChange={(e) => setFilterTanggal(e.target.value)}
              />
            </div>

            <TableToolbar
              actions={
                <Button variant="success" onClick={exportData}>
                  Export Excel
                </Button>
              }
            />

            {tamu.length === 0 ? (
              <EmptyState
                title="Belum ada tamu"
                description="Input tamu pertama untuk memulai."
              />
            ) : (
              <div className="table-scroll-x">
                <table style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Tanggal</th>
                      <th style={thStyle}>Jam Masuk</th>
                      <th style={thStyle}>Jam Keluar</th>
                      <th style={thStyle}>Nama</th>
                      <th style={thStyle}>Instansi</th>
                      <th style={thStyle}>Tujuan</th>
                      <th style={thStyle}>Bertemu</th>
                      <th style={thStyle}>Jumlah</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Petugas</th>
                      <th style={thStyle}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tamu.map((item) => (
                      <tr key={item.id}>
                        <td style={tdStyle}>
                          {new Date(item.tanggal).toLocaleDateString("id-ID")}
                        </td>
                        <td style={tdStyle}>{item.jam_masuk}</td>
                        <td style={tdStyle}>{item.jam_keluar || "—"}</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{item.nama_tamu}</td>
                        <td style={tdStyle}>{item.instansi}</td>
                        <td style={tdStyle}>{item.tujuan}</td>
                        <td style={tdStyle}>{item.bertemu_dengan}</td>
                        <td style={tdStyle}>{item.jumlah_orang}</td>
                        <td style={tdStyle}>
                          <Badge variant={item.status === "Masuk" ? "success" : "danger"}>
                            {item.status}
                          </Badge>
                        </td>
                        <td style={tdStyle}>{item.petugas}</td>
                        <td style={tdStyle}>
                          <div style={actionBarStyle}>
                            <Button variant="outline" size="sm" onClick={() => editTamu(item)}>
                              Edit
                            </Button>
                            {item.status === "Masuk" && (
                              <Button variant="primary" size="sm" onClick={() => keluarTamu(item.id)}>
                                Keluar
                              </Button>
                            )}
                            <Button variant="danger" size="sm" onClick={() => hapusTamu(item.id)}>
                              Hapus
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DataTableCard>
        </div>
      </div>
    </AppShell>
  );
}

export default TamuPage;
