import { useEffect, useState } from "react";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import Card from "../components/ui/Card";
import KpiCard from "../components/ui/KpiCard";
import KpiGrid from "../components/ui/KpiGrid";
import SectionHeading from "../components/ui/SectionHeading";
import Button, { actionBarStyle } from "../components/ui/Button";
import DataTableCard from "../components/ui/DataTableCard";
import TableToolbar from "../components/ui/TableToolbar";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import { exportExcel } from "../utils/exportExcel";

const filterPanelStyle = {
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

function KeuanganResponsiveStyles() {
  return (
    <style>{`
      .keuangan-page {
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

      .keuangan-filter-panel select,
      .keuangan-filter-panel input:not([type="radio"]):not([type="checkbox"]) {
        min-width: 0;
        flex: 1 1 140px;
        max-width: 100%;
      }

      .keuangan-form-controls input:not([type="radio"]):not([type="checkbox"]),
      .keuangan-form-controls select,
      .keuangan-form-controls textarea {
        max-width: 100%;
        box-sizing: border-box;
      }

      @media (max-width: 767px) {
        .keuangan-filter-panel select,
        .keuangan-filter-panel input:not([type="radio"]):not([type="checkbox"]) {
          flex: 1 1 100%;
        }

        .keuangan-form-controls input:not([type="radio"]):not([type="checkbox"]),
        .keuangan-form-controls select,
        .keuangan-form-controls textarea {
          width: 100%;
        }
      }
    `}</style>
  );
}

function BukuKasPage() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [form, setForm] = useState({
    tanggal: "",
    jenis: "Masuk",
    kategori: "",
    keterangan: "",
    nominal: "",
    petugas: "",
  });

  const getData = async () => {
    const response = await api.get("/buku-kas");

    console.log("TANGGAL DB", response.data.data[0]?.tanggal);
    console.log(response.data.data.slice(0, 5));

    setData(response.data.data);
  };

  const simpan = async () => {
    try {
      if (editId) {
        await api.put(`/buku-kas/${editId}`, {
          ...form,
          nominal: Number(form.nominal),
        });
      } else {
        await api.post("/buku-kas", {
          ...form,
          nominal: Number(form.nominal),
        });
      }

      setEditId(null);
      setForm({
        tanggal: "",
        jenis: "Masuk",
        kategori: "",
        keterangan: "",
        nominal: "",
        petugas: "",
      });
      console.log("UPDATE SELESAI");

      await getData();

      alert(editId ? "Data berhasil diupdate" : "Data berhasil disimpan");
    } catch (err) {
      console.log(err);
    }
  };

  const hapus = async (id) => {
    if (!window.confirm("Hapus transaksi?")) return;

    try {
      await api.delete(`/buku-kas/${id}`);
      await getData();
    } catch (err) {
      console.log(err);
    }
  };

  const editData = (d) => {
    setForm({
      tanggal: d.tanggal?.split("T")[0] || d.tanggal,
      jenis: d.jenis,
      kategori: d.kategori,
      keterangan: d.keterangan || "",
      nominal: d.nominal,
      petugas: d.petugas || "",
    });
    setEditId(d.id);
  };

  useEffect(() => {
    getData();
  }, []);

  const dataTahunan = data.filter(
    (d) => Number(String(d.tanggal).split("-")[0]) === tahun,
  );

  const dataBulanan = dataTahunan.filter(
    (d) => Number(String(d.tanggal).split("-")[1]) === bulan,
  );

  const totalMasuk = dataBulanan
    .filter((d) => d.jenis === "Masuk")
    .reduce((sum, d) => sum + Number(d.nominal), 0);

  const totalKeluar = dataBulanan
    .filter((d) => d.jenis === "Keluar")
    .reduce((sum, d) => sum + Number(d.nominal), 0);

  const filtered = dataBulanan.filter(
    (d) =>
      d.kategori?.toLowerCase().includes(search.toLowerCase()) ||
      d.keterangan?.toLowerCase().includes(search.toLowerCase()) ||
      d.petugas?.toLowerCase().includes(search.toLowerCase()),
  );

  const saldoKas = totalMasuk - totalKeluar;
  const jumlahTransaksi = filtered.length;

  const handleExport = () => {
    const rows = filtered.map((d) => ({
      Tanggal: new Date(d.tanggal).toLocaleDateString("id-ID"),
      Jenis: d.jenis,
      Kategori: d.kategori,
      Keterangan: d.keterangan,
      Nominal: Number(d.nominal),
      Petugas: d.petugas,
    }));

    exportExcel(rows, "BukuKas");
  };

  const bulanLabel = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ][bulan - 1];

  return (
    <AppShell title="Buku Kas" breadcrumb="Keuangan / Buku Kas">
      <KeuanganResponsiveStyles />
      <div className="keuangan-page">
      <Card padding="md" shadow="card" border={false} radius="xl">
        <div className="keuangan-filter-panel" style={filterPanelStyle}>
          <select value={bulan} onChange={(e) => setBulan(Number(e.target.value))}>
            <option value={1}>Januari</option>
            <option value={2}>Februari</option>
            <option value={3}>Maret</option>
            <option value={4}>April</option>
            <option value={5}>Mei</option>
            <option value={6}>Juni</option>
            <option value={7}>Juli</option>
            <option value={8}>Agustus</option>
            <option value={9}>September</option>
            <option value={10}>Oktober</option>
            <option value={11}>November</option>
            <option value={12}>Desember</option>
          </select>

          <select value={tahun} onChange={(e) => setTahun(Number(e.target.value))}>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
            <option value={2028}>2028</option>
          </select>
        </div>
      </Card>

      <div style={{ marginTop: "var(--space-6)" }}>
        <KpiGrid minColumnWidth={200} gap={16}>
          <KpiCard
            layout="metric"
            label="Total Pemasukan"
            value={`Rp ${totalMasuk.toLocaleString()}`}
            accent="success"
          />
          <KpiCard
            layout="metric"
            label="Total Pengeluaran"
            value={`Rp ${totalKeluar.toLocaleString()}`}
            accent="danger"
          />
          <KpiCard
            layout="metric"
            label="Saldo"
            value={`Rp ${saldoKas.toLocaleString()}`}
            accent="teal"
          />
          <KpiCard layout="metric" label="Jumlah Transaksi" value={jumlahTransaksi} accent="teal" />
        </KpiGrid>
      </div>

      <div style={{ marginTop: "var(--space-6)" }}>
        <Card padding="md" shadow="card" border={false} radius="xl">
          <SectionHeading variant="eyebrow" spacing="first">
            Tambah Transaksi
          </SectionHeading>

          <div className="keuangan-form-controls">
          <input
            type="date"
            value={form.tanggal}
            onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
            style={{ marginTop: "var(--space-4)" }}
          />
          <br />
          <br />

          <select
            value={form.jenis}
            onChange={(e) => setForm({ ...form, jenis: e.target.value })}
          >
            <option>Masuk</option>
            <option>Keluar</option>
          </select>
          <br />
          <br />

          <select
            value={form.kategori}
            onChange={(e) => setForm({ ...form, kategori: e.target.value })}
          >
            <option value="">Pilih Kategori</option>
            <option value="Sahriyah">Sahriyah</option>
            <option value="Daftar Ulang">Daftar Ulang</option>
            <option value="Donasi">Donasi</option>
            <option value="Topup RFID">Topup RFID</option>
            <option value="Operasional">Operasional</option>
            <option value="Listrik">Listrik</option>
            <option value="Air">Air</option>
            <option value="Insentif Guru">Insentif Guru</option>
            <option value="Lainnya">Lainnya</option>
          </select>
          <br />
          <br />

          <input
            value={form.nominal}
            placeholder="Nominal"
            onChange={(e) => setForm({ ...form, nominal: e.target.value })}
          />
          <br />
          <br />

          <input
            value={form.petugas}
            placeholder="Petugas"
            onChange={(e) => setForm({ ...form, petugas: e.target.value })}
          />
          <br />
          <br />

          <textarea
            value={form.keterangan}
            placeholder="Keterangan"
            onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
          />

          <div style={{ ...actionBarStyle, marginTop: "var(--space-4)" }}>
            <Button onClick={simpan}>{editId ? "Update" : "Simpan"}</Button>
          </div>
          </div>
        </Card>
      </div>

      <div style={{ marginTop: "var(--space-6)" }}>
        <DataTableCard
          title="Daftar Transaksi"
          subtitle={`Arus kas ${bulanLabel} ${tahun}`}
          actions={
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
              {filtered.length} transaksi
            </span>
          }
        >
          <TableToolbar
            search={
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kategori, keterangan, petugas..."
              />
            }
            actions={
              <Button variant="success" onClick={handleExport}>
                Export Excel
              </Button>
            }
          />

          {filtered.length === 0 ? (
            <EmptyState
              title={dataBulanan.length === 0 ? "Belum ada transaksi" : "Tidak ada hasil pencarian"}
              description={
                dataBulanan.length === 0
                  ? "Catat transaksi pertama untuk periode ini."
                  : "Coba kata kunci lain atau hapus filter pencarian."
              }
            />
          ) : (
            <div className="table-scroll-x">
              <table style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Tanggal</th>
                    <th style={thStyle}>Jenis</th>
                    <th style={thStyle}>Kategori</th>
                    <th style={thStyle}>Keterangan</th>
                    <th style={thStyle}>Nominal</th>
                    <th style={thStyle}>Petugas</th>
                    <th style={thStyle}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => (
                    <tr key={d.id}>
                      <td style={tdStyle}>
                        {new Date(d.tanggal).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            fontWeight: 600,
                            color: d.jenis === "Masuk" ? "var(--success)" : "var(--danger)",
                          }}
                        >
                          {d.jenis}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{d.kategori}</td>
                      <td style={tdStyle}>{d.keterangan || "—"}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>
                        Rp {Number(d.nominal).toLocaleString()}
                      </td>
                      <td style={tdStyle}>{d.petugas || "—"}</td>
                      <td style={tdStyle}>
                        <Button size="sm" variant="outline" onClick={() => editData(d)}>
                          Edit
                        </Button>{" "}
                        <Button size="sm" variant="danger" onClick={() => hapus(d.id)}>
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
      </div>
    </AppShell>
  );
}

export default BukuKasPage;
