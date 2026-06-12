import { useEffect, useState } from "react";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import Card from "../components/ui/Card";
import KpiCard from "../components/ui/KpiCard";
import KpiGrid from "../components/ui/KpiGrid";
import SectionHeading from "../components/ui/SectionHeading";
import Badge from "../components/ui/Badge";
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

function sahriyahBadgeVariant(status) {
  if (status === "Lunas") return "success";
  if (status === "Belum Lunas") return "danger";
  if (status === "Cicilan") return "warning";
  return "neutral";
}

function KeuanganResponsiveStyles() {
  return (
    <style>{`
      .keuangan-page {
        min-width: 0;
        max-width: 100%;
      }

      .keuangan-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        z-index: 50;
        box-sizing: border-box;
      }

      .keuangan-modal-panel {
        width: 100%;
        max-height: calc(100vh - 32px);
        overflow-y: auto;
        box-sizing: border-box;
      }

      .keuangan-modal-panel--sm {
        max-width: 400px;
      }

      .keuangan-modal-panel--md {
        max-width: 500px;
      }

      .keuangan-modal-panel--lg {
        max-width: 600px;
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

function SahriyahPage() {
  const [data, setData] = useState([]);
  const [showBayar, setShowBayar] = useState(false);
  const [selectedTagihan, setSelectedTagihan] = useState(null);
  const [formBayar, setFormBayar] = useState({
    nominal: "",
    beras: "",
    petugas: "",
  });
  const [search, setSearch] = useState("");
  const [showRiwayat, setShowRiwayat] = useState(false);
  const [riwayat, setRiwayat] = useState([]);
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());

  const getData = async () => {
    try {
      const response = await api.get(`/sahriyah?t=${Date.now()}`);
      setData([...response.data.data]);
    } catch (err) {
      console.log(err);
    }
  };

  const generateTagihan = async () => {
    try {
      await api.post("/sahriyah/generate", { bulan, tahun });
      alert("Tagihan berhasil dibuat");
      getData();
    } catch (err) {
      console.log(err);
      alert("Generate gagal");
    }
  };

  const bayarTagihan = (tagihan) => {
    setSelectedTagihan(tagihan);
    setFormBayar({ nominal: "", beras: "", petugas: "" });
    setShowBayar(true);
  };

  const lihatRiwayat = async (id) => {
    try {
      const response = await api.get(`/sahriyah/riwayat/${id}`);
      setRiwayat(response.data.data);
      setShowRiwayat(true);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const filtered = data.filter(
    (d) =>
      d.nama?.toLowerCase().includes(search.toLowerCase()) &&
      d.bulan === bulan &&
      d.tahun === tahun,
  );

  useEffect(() => {}, [data]);

  const simpanPembayaran = async () => {
    try {
      await api.put(`/sahriyah/bayar/${selectedTagihan.id}`, {
        nominal: Number(formBayar.nominal || 0),
        beras: Number(formBayar.beras || 0),
        petugas: formBayar.petugas,
      });

      const response = await api.get(`/sahriyah?t=${Date.now()}`);

      console.log(
        "SETELAH BAYAR",
        response.data.data.find((x) => x.id === selectedTagihan.id),
      );

      setData([]);

      setTimeout(() => {
        setData([...response.data.data]);
      }, 10);

      setShowBayar(false);
      setSelectedTagihan(null);
      setFormBayar({ nominal: "", beras: "", petugas: "" });

      setSelectedTagihan(null);
      setFormBayar({ nominal: "", beras: "", petugas: "" });
    } catch (err) {
      console.log(err);
      alert("Pembayaran gagal");
    }
  };

  const hapusTagihan = async (id) => {
    const yakin = window.confirm("Yakin hapus tagihan sahriyah ini?");
    if (!yakin) return;

    try {
      await api.delete(`/sahriyah/${id}`);
      await getData();
      alert("Tagihan berhasil dihapus");
    } catch (err) {
      console.log(err);
      alert("Gagal menghapus tagihan");
    }
  };

  const handleExport = () => {
    const rows = filtered.map((d) => ({
      Nama: d.nama,
      Tagihan: Number(d.nominal),
      SudahBayar: Number(d.total_bayar),
      Sisa: Number(d.sisa_tagihan),
      Beras: Number(d.nominal_beras),
      BerasMasuk: Number(d.beras_terbayar),
      SisaBeras: Number(d.sisa_beras),
      Status: d.status,
    }));

    exportExcel(rows, "Sahriyah");
  };

  const totalNominal = filtered.reduce((a, b) => a + Number(b.nominal || 0), 0);
  const periodData = data.filter((d) => d.bulan === bulan && d.tahun === tahun);

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
    <AppShell title="Sahriyah" breadcrumb="Keuangan / Sahriyah">
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

          <Button onClick={generateTagihan}>Generate Tagihan</Button>
        </div>
      </Card>

      <div style={{ marginTop: "var(--space-6)" }}>
        <KpiGrid minColumnWidth={200} gap={16}>
          <KpiCard layout="metric" label="Total Tagihan" value={filtered.length} accent="teal" />
          <KpiCard
            layout="metric"
            label="Lunas"
            value={filtered.filter((d) => d.status === "Lunas").length}
            accent="success"
          />
          <KpiCard
            layout="metric"
            label="Belum Lunas"
            value={filtered.filter((d) => d.status !== "Lunas").length}
            accent="danger"
          />
          <KpiCard
            layout="metric"
            label="Total Nominal"
            value={`Rp ${totalNominal.toLocaleString()}`}
            accent="teal"
          />
        </KpiGrid>
      </div>

      <div style={{ marginTop: "var(--space-6)" }}>
        <DataTableCard
          title="Data Tagihan Sahriyah"
          subtitle={`Tagihan ${bulanLabel} ${tahun}`}
          actions={
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
              {filtered.length} tagihan
            </span>
          }
        >
          <TableToolbar
            search={
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama santri..."
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
              title={periodData.length === 0 ? "Belum ada tagihan" : "Tidak ada hasil pencarian"}
              description={
                periodData.length === 0
                  ? "Generate tagihan untuk periode ini terlebih dahulu."
                  : "Coba kata kunci lain atau hapus filter pencarian."
              }
            />
          ) : (
            <div className="table-scroll-x">
              <table style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Nama</th>
                    <th style={thStyle}>Tagihan Uang</th>
                    <th style={thStyle}>Sudah Bayar</th>
                    <th style={thStyle}>Sisa Uang</th>
                    <th style={thStyle}>Tagihan Beras</th>
                    <th style={thStyle}>Beras Masuk</th>
                    <th style={thStyle}>Sisa Beras</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Tgl Bayar</th>
                    <th style={thStyle}>Petugas</th>
                    <th style={thStyle}>Aksi</th>
                    <th style={thStyle}>Riwayat</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => (
                    <tr key={d.id}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>
                        {d.nama}
                        <br />
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 400 }}>
                          ID:{d.id} · Bayar:{d.total_bayar}
                        </span>
                      </td>
                      <td style={tdStyle}>Rp {Number(d.nominal || 0).toLocaleString()}</td>
                      <td style={tdStyle}>Rp {Number(d.total_bayar || 0).toLocaleString()}</td>
                      <td style={tdStyle}>Rp {Number(d.sisa_tagihan || 0).toLocaleString()}</td>
                      <td style={tdStyle}>{Number(d.nominal_beras || 0)} Kg</td>
                      <td style={tdStyle}>{Number(d.beras_terbayar || 0)} Kg</td>
                      <td style={tdStyle}>{Number(d.sisa_beras || 0)} Kg</td>
                      <td style={tdStyle}>
                        <Badge variant={sahriyahBadgeVariant(d.status)}>{d.status}</Badge>
                      </td>
                      <td style={tdStyle}>{d.tanggal_bayar || "—"}</td>
                      <td style={tdStyle}>{d.petugas || "—"}</td>
                      <td style={tdStyle}>
                        {d.status === "Lunas" ? (
                          "✓"
                        ) : (
                          <Button size="sm" onClick={() => bayarTagihan(d)}>
                            Bayar
                          </Button>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <Button size="sm" variant="outline" onClick={() => lihatRiwayat(d.id)}>
                          Riwayat
                        </Button>{" "}
                        <Button size="sm" variant="danger" onClick={() => hapusTagihan(d.id)}>
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

      {showBayar && (
        <div className="keuangan-modal-backdrop">
          <div className="keuangan-modal-panel keuangan-modal-panel--sm">
            <Card padding="lg" shadow="kpi" border={false} radius="xl">
              <SectionHeading variant="eyebrow" spacing="first">
                Bayar Sahriyah
              </SectionHeading>

              <p style={{ marginTop: "var(--space-4)" }}>{selectedTagihan?.nama}</p>

              <div className="keuangan-form-controls">
              <input
                placeholder="Nominal Uang"
                value={formBayar.nominal}
                onChange={(e) =>
                  setFormBayar({ ...formBayar, nominal: e.target.value })
                }
                style={{ width: "100%", boxSizing: "border-box" }}
              />
              <br />
              <br />

              <input
                placeholder="Beras (Kg)"
                value={formBayar.beras}
                onChange={(e) =>
                  setFormBayar({ ...formBayar, beras: e.target.value })
                }
                style={{ width: "100%", boxSizing: "border-box" }}
              />
              <br />
              <br />

              <input
                placeholder="Petugas"
                value={formBayar.petugas}
                onChange={(e) =>
                  setFormBayar({ ...formBayar, petugas: e.target.value })
                }
                style={{ width: "100%", boxSizing: "border-box" }}
              />
              </div>

              <div style={{ ...actionBarStyle, marginTop: "var(--space-4)" }}>
                <Button onClick={simpanPembayaran}>Simpan</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBayar(false);
                  }}
                >
                  Tutup
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {showRiwayat && (
        <div className="keuangan-modal-backdrop">
          <div className="keuangan-modal-panel keuangan-modal-panel--lg">
            <Card padding="lg" shadow="kpi" border={false} radius="xl">
              <SectionHeading variant="eyebrow" spacing="first">
                Histori Pembayaran Sahriyah
              </SectionHeading>

              <div className="table-scroll-x" style={{ marginTop: "var(--space-4)" }}>
              <table border="1" width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Nominal</th>
                    <th>Beras</th>
                    <th>Petugas</th>
                  </tr>
                </thead>
                <tbody>
                  {riwayat.map((r) => (
                    <tr key={r.id}>
                      <td>{r.tanggal}</td>
                      <td>Rp {Number(r.nominal || 0).toLocaleString()}</td>
                      <td>{Number(r.nominal_beras || 0)} Kg</td>
                      <td>{r.petugas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              <div style={{ ...actionBarStyle, marginTop: "var(--space-4)" }}>
                <Button variant="outline" onClick={() => setShowRiwayat(false)}>
                  Tutup
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
      </div>
    </AppShell>
  );
}

export default SahriyahPage;
