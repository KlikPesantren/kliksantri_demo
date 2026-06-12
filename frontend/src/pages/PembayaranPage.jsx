import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import Card from "../components/ui/Card";
import SectionHeading from "../components/ui/SectionHeading";
import Badge from "../components/ui/Badge";
import Button, { actionBarStyle } from "../components/ui/Button";
import DataTableCard from "../components/ui/DataTableCard";
import TableToolbar from "../components/ui/TableToolbar";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import { exportExcel } from "../utils/exportExcel";

function pembayaranBadgeVariant(status) {
  const value = String(status || "").toLowerCase();
  if (value.includes("lunas")) return "success";
  if (value.includes("belum") || value.includes("tunggak")) return "danger";
  if (value.includes("cicil")) return "warning";
  return "neutral";
}

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

      .keuangan-form-controls input:not([type="radio"]):not([type="checkbox"]),
      .keuangan-form-controls select,
      .keuangan-form-controls textarea {
        max-width: 100%;
        box-sizing: border-box;
      }

      @media (max-width: 767px) {
        .keuangan-form-controls input:not([type="radio"]):not([type="checkbox"]),
        .keuangan-form-controls select,
        .keuangan-form-controls textarea {
          width: 100%;
        }
      }
    `}</style>
  );
}

function PembayaranPage() {
  const [pembayaran, setPembayaran] = useState([]);
  const [santri, setSantri] = useState([]);
  const [kelas, setKelas] = useState([]);
  const [tableSearch, setTableSearch] = useState("");
  const [form, setForm] = useState({
    santri_id: "",
    nama_tagihan: "",
    bulan: "",
    tahun: 2026,
    nominal_tagihan: "",
    nominal_bayar: "",
  });
  const [modeGenerate, setModeGenerate] = useState("semua");
  const [selectedSantri, setSelectedSantri] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState("");
  const [showRiwayat, setShowRiwayat] = useState(false);
  const [riwayat, setRiwayat] = useState([]);
  const [showBayar, setShowBayar] = useState(false);
  const [selectedTagihan, setSelectedTagihan] = useState(null);
  const [nominalBayar, setNominalBayar] = useState("");

  const getPembayaran = async () => {
    try {
      const response = await api.get("/pembayaran");
      console.log("DATA BARU", response.data.data);
      setPembayaran([...response.data.data]);
      console.log("RENDER", response.data.data[0]);
    } catch (err) {
      console.log(err);
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

  const getKelas = async () => {
    try {
      const response = await api.get("/kelas");
      setKelas(response.data.data);
    } catch (err) {
      console.log(err);
    }
  };

  const createPembayaran = async () => {
    try {
      let targetSantri = [];

      if (modeGenerate === "semua") {
        targetSantri = santri.map((s) => s.id);
      } else if (modeGenerate === "kelas") {
        targetSantri = santri
          .filter((s) => Number(s.kelas_id) === Number(selectedKelas))
          .map((s) => s.id);
      } else {
        targetSantri = selectedSantri;
      }

      for (const santriId of targetSantri) {
        await api.post("/pembayaran", {
          santri_id: santriId,
          nama_tagihan: form.nama_tagihan,
          bulan: form.bulan,
          tahun: form.tahun,
          nominal_tagihan: Number(form.nominal_tagihan),
          nominal_bayar: 0,
        });
      }

      alert("Tagihan berhasil dibuat");

      setForm({
        santri_id: "",
        nama_tagihan: "",
        bulan: "",
        tahun: 2026,
        nominal_tagihan: "",
        nominal_bayar: "",
      });

      setSelectedSantri([]);
      getPembayaran();
    } catch (err) {
      console.log(err);
      alert("Gagal membuat tagihan");
    }
  };

  const bukaBayar = (tagihan) => {
    setSelectedTagihan(tagihan);
    setShowBayar(true);
  };

  const tutupBayar = () => {
    setShowBayar(false);
    setSelectedTagihan(null);
    setNominalBayar("");
  };

  const simpanPembayaran = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    try {
      await api.put(`/pembayaran/bayar/${selectedTagihan.id}`, {
        nominal: Number(nominalBayar),
        petugas: user?.nama || user?.username || "Admin",
      });

      alert("Pembayaran berhasil");
      await getPembayaran();
      setShowBayar(false);
      setSelectedTagihan(null);
      setNominalBayar("");
    } catch (err) {
      console.log(err);
      alert("Gagal bayar");
    }
  };

  const hapusTagihan = async (id) => {
    const yakin = window.confirm("Hapus tagihan?");
    if (!yakin) return;

    try {
      await api.delete(`/pembayaran/${id}`);
      await getPembayaran();
    } catch (err) {
      console.log(err);
      alert("Gagal hapus");
    }
  };

  const lihatRiwayat = async (tagihan) => {
    try {
      const response = await api.get(`/pembayaran/riwayat/${tagihan.id}`);
      setRiwayat(response.data.data);
      setShowRiwayat(true);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getPembayaran();
    getSantri();
    getKelas();
  }, []);

  const filteredPembayaran = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return pembayaran;
    return pembayaran.filter((p) =>
      [p.nama, p.nama_tagihan, p.status, p.bulan, p.tahun]
        .some((field) => String(field || "").toLowerCase().includes(q)),
    );
  }, [pembayaran, tableSearch]);

  const handleExport = () => {
    const rows = pembayaran.map((p) => ({
      Santri: p.nama,
      Tagihan: p.nama_tagihan,
      Nominal: Number(p.nominal_tagihan),
      Dibayar: Number(p.nominal_bayar),
      Sisa: Number(p.sisa_tunggakan),
      Status: p.status,
    }));

    exportExcel(rows, "Pembayaran");
  };

  return (
    <AppShell title="Pembayaran" breadcrumb="Keuangan / Pembayaran">
      <KeuanganResponsiveStyles />
      <div className="keuangan-page">
      <Card padding="md" shadow="card" border={false} radius="xl">
        <SectionHeading variant="eyebrow" spacing="first">
          Tambah Pembayaran
        </SectionHeading>

        <div className="keuangan-form-controls" style={{ marginTop: "var(--space-4)" }}>
          <label>
            <input
              type="radio"
              checked={modeGenerate === "semua"}
              onChange={() => setModeGenerate("semua")}
            />
            Semua Santri
          </label>
          <br />

          <label>
            <input
              type="radio"
              checked={modeGenerate === "pilih"}
              onChange={() => setModeGenerate("pilih")}
            />
            Pilih Santri
          </label>
          <br />
          <br />

          <label>
            <input
              type="radio"
              checked={modeGenerate === "kelas"}
              onChange={() => setModeGenerate("kelas")}
            />
            Berdasarkan Kelas
          </label>
          <br />
          <br />

          {modeGenerate === "pilih" &&
            santri.map((s) => (
              <div key={s.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedSantri.includes(s.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSantri([...selectedSantri, s.id]);
                      } else {
                        setSelectedSantri(selectedSantri.filter((id) => id !== s.id));
                      }
                    }}
                  />
                  {s.nama}
                </label>
              </div>
            ))}

          {modeGenerate === "kelas" && (
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
            >
              <option value="">Pilih Kelas</option>
              {kelas.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama_kelas}
                </option>
              ))}
            </select>
          )}

          {modeGenerate === "pilih" && (
            <select
              value={form.santri_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  santri_id: e.target.value,
                })
              }
            >
              <option value="">Pilih Santri</option>
              {santri.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
            </select>
          )}

          <br />
          <br />

          <input
            type="text"
            placeholder="Nama Tagihan"
            value={form.nama_tagihan}
            onChange={(e) =>
              setForm({
                ...form,
                nama_tagihan: e.target.value,
              })
            }
          />
          <br />
          <br />

          <input
            type="text"
            placeholder="Bulan"
            value={form.bulan}
            onChange={(e) =>
              setForm({
                ...form,
                bulan: e.target.value,
              })
            }
          />
          <br />
          <br />

          <input
            type="number"
            placeholder="Tahun"
            value={form.tahun}
            onChange={(e) =>
              setForm({
                ...form,
                tahun: e.target.value,
              })
            }
          />
          <br />
          <br />

          <input
            type="number"
            placeholder="Nominal Tagihan"
            value={form.nominal_tagihan}
            onChange={(e) =>
              setForm({
                ...form,
                nominal_tagihan: e.target.value,
              })
            }
          />
          <br />
          <br />

          <div style={{ ...actionBarStyle, marginTop: "var(--space-4)" }}>
            <Button onClick={createPembayaran}>Simpan</Button>
          </div>
        </div>
      </Card>

      <div style={{ marginTop: "var(--space-6)" }}>
        <DataTableCard
          title="Daftar Tagihan"
          subtitle="Kelola tagihan dan pembayaran santri"
          actions={
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
              {filteredPembayaran.length} tagihan
            </span>
          }
        >
          <TableToolbar
            search={
              <SearchInput
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Cari santri, tagihan, status..."
              />
            }
            actions={
              <Button variant="success" onClick={handleExport}>
                Export Excel
              </Button>
            }
          />

          {filteredPembayaran.length === 0 ? (
            <EmptyState
              title={pembayaran.length === 0 ? "Belum ada tagihan" : "Tidak ada hasil pencarian"}
              description={
                pembayaran.length === 0
                  ? "Generate tagihan pertama untuk memulai."
                  : "Coba kata kunci lain atau hapus filter pencarian."
              }
            />
          ) : (
            <div className="table-scroll-x">
              <table style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Santri</th>
                    <th style={thStyle}>Nama Tagihan</th>
                    <th style={thStyle}>Nominal</th>
                    <th style={thStyle}>Bayar</th>
                    <th style={thStyle}>Sisa</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPembayaran.map((p) => (
                    <tr key={p.id}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{p.nama}</td>
                      <td style={tdStyle}>{p.nama_tagihan}</td>
                      <td style={tdStyle}>Rp {Number(p.nominal_tagihan || 0).toLocaleString()}</td>
                      <td style={tdStyle}>Rp {Number(p.nominal_bayar || 0).toLocaleString()}</td>
                      <td style={tdStyle}>Rp {Number(p.sisa_tunggakan || 0).toLocaleString()}</td>
                      <td style={tdStyle}>
                        <Badge variant={pembayaranBadgeVariant(p.status)}>{p.status}</Badge>
                      </td>
                      <td style={tdStyle}>
                        <Button size="sm" onClick={() => bukaBayar(p)}>
                          Bayar
                        </Button>{" "}
                        <Button size="sm" variant="outline" onClick={() => lihatRiwayat(p)}>
                          Histori
                        </Button>{" "}
                        <Button size="sm" variant="danger" onClick={() => hapusTagihan(p.id)}>
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

      {showBayar && selectedTagihan && (
        <div className="keuangan-modal-backdrop">
          <div className="keuangan-modal-panel keuangan-modal-panel--sm">
            <Card padding="lg" shadow="kpi" border={false} radius="xl">
              <SectionHeading variant="eyebrow" spacing="first">
                Pembayaran Tagihan
              </SectionHeading>

              <hr style={{ margin: "var(--space-4) 0" }} />

              <p>
                <b>Santri:</b> {selectedTagihan.nama}
              </p>
              <p>
                <b>Tagihan:</b> {selectedTagihan.nama_tagihan}
              </p>
              <p>
                <b>Sisa:</b> Rp{" "}
                {Number(selectedTagihan.sisa_tunggakan || 0).toLocaleString()}
              </p>

              <input
                type="number"
                placeholder="Nominal Bayar"
                value={nominalBayar}
                onChange={(e) => setNominalBayar(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box" }}
              />

              <div style={{ ...actionBarStyle, marginTop: "var(--space-4)" }}>
                <Button onClick={simpanPembayaran}>Simpan</Button>
                <Button variant="outline" onClick={tutupBayar}>
                  Tutup
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {showRiwayat && (
        <div className="keuangan-modal-backdrop">
          <div className="keuangan-modal-panel keuangan-modal-panel--md">
            <Card padding="lg" shadow="kpi" border={false} radius="xl">
              <SectionHeading variant="eyebrow" spacing="first">
                Histori Pembayaran
              </SectionHeading>

              <hr style={{ margin: "var(--space-4) 0" }} />

              <div className="table-scroll-x">
              <table width="100%" border="1" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Nominal</th>
                    <th>Petugas</th>
                  </tr>
                </thead>
                <tbody>
                  {riwayat.map((r) => (
                    <tr key={r.id}>
                      <td>{r.tanggal}</td>
                      <td>Rp {Number(r.nominal).toLocaleString()}</td>
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

export default PembayaranPage;
