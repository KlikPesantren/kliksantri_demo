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

function perizinanBadgeVariant(status) {
  if (status === "kembali") return "success";
  if (status === "keluar") return "warning";
  return "neutral";
}

function PerizinanPage() {
  const [perizinan, setPerizinan] = useState([]);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [santri, setSantri] = useState([]);
  const [form, setForm] = useState({
    santri_id: "",
    tanggal: "",
    tujuan: "",
    alasan: "",
    tanggal_kembali: "",
    target_jam_kembali: "",
    jam_keluar: "",
    status: "keluar",
    catatan: "",
  });

  const getPerizinan = async () => {
    try {
      const response = await api.get("/perizinan");
      setPerizinan(response.data.data || []);
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

  const createPerizinan = async () => {
    try {
      if (editId) {
        await api.put(`/perizinan/${editId}`, form);
      } else {
        await api.post("/perizinan", form);
      }

      alert("Data berhasil disimpan");

      setEditId(null);
      setForm({
        santri_id: "",
        tanggal: "",
        tujuan: "",
        alasan: "",
        tanggal_kembali: "",
        target_jam_kembali: "",
        jam_keluar: "",
        status: "keluar",
        catatan: "",
      });

      getPerizinan();
    } catch (err) {
      console.log(err);
      alert("Gagal simpan");
    }
  };

  const kembali = async (id) => {
    try {
      await api.put(`/perizinan/kembali/${id}`);
      getPerizinan();
    } catch (err) {
      console.log(err);
    }
  };

  const editPerizinan = (p) => {
    setForm({
      santri_id: p.santri_id,
      tanggal: p.tanggal?.split("T")[0],
      tujuan: p.tujuan || "",
      alasan: p.alasan || "",
      tanggal_kembali: p.tanggal_kembali?.split("T")[0] || "",
      target_jam_kembali: p.target_jam_kembali || "",
      jam_keluar: p.jam_keluar || "",
      status: p.status || "keluar",
      catatan: p.catatan || "",
    });
    setEditId(p.id);
  };

  const deletePerizinan = async (id) => {
    if (!window.confirm("Hapus data ini?")) return;

    try {
      await api.delete(`/perizinan/${id}`);
      getPerizinan();
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getPerizinan();
    getSantri();
  }, []);

  const filtered = useMemo(
    () =>
      perizinan.filter((p) =>
        p.nama?.toLowerCase().includes(search.toLowerCase()),
      ),
    [perizinan, search],
  );

  return (
    <AppShell title="Perizinan Santri" breadcrumb="Keamanan / Perizinan">
      <LegacyPageStyles />
      <div className="legacy-page">
        <Card padding="md" shadow="card" border={false} radius="xl">
          <SectionHeading variant="eyebrow" spacing="first">
            Input Perizinan
          </SectionHeading>

          <div className="legacy-form-grid" style={{ ...formGridStyle, marginTop: "var(--space-4)" }}>
            <select
              style={fieldStyle}
              value={form.santri_id}
              onChange={(e) => setForm({ ...form, santri_id: e.target.value })}
            >
              <option value="">Pilih Santri</option>
              {santri.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
            </select>

            <input
              style={fieldStyle}
              type="date"
              value={form.tanggal}
              onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
            />

            <input
              style={fieldStyle}
              type="time"
              value={form.jam_keluar}
              onChange={(e) => setForm({ ...form, jam_keluar: e.target.value })}
            />

            <input
              style={fieldStyle}
              type="text"
              placeholder="Tujuan"
              value={form.tujuan}
              onChange={(e) => setForm({ ...form, tujuan: e.target.value })}
            />

            <input
              style={fieldStyle}
              type="date"
              value={form.tanggal_kembali}
              onChange={(e) => setForm({ ...form, tanggal_kembali: e.target.value })}
            />

            <input
              style={fieldStyle}
              type="time"
              value={form.target_jam_kembali}
              onChange={(e) => setForm({ ...form, target_jam_kembali: e.target.value })}
            />

            <textarea
              style={{ ...fieldStyle, ...spanFull, minHeight: "80px", resize: "vertical" }}
              placeholder="Alasan"
              value={form.alasan}
              onChange={(e) => setForm({ ...form, alasan: e.target.value })}
            />

            <textarea
              style={{ ...fieldStyle, ...spanFull, minHeight: "80px", resize: "vertical" }}
              placeholder="Catatan"
              value={form.catatan}
              onChange={(e) => setForm({ ...form, catatan: e.target.value })}
            />
          </div>

          <div style={{ ...actionBarStyle, marginTop: "var(--space-4)" }}>
            <Button variant="primary" onClick={createPerizinan}>
              Simpan
            </Button>
          </div>
        </Card>

        <div style={{ marginTop: "var(--space-6)" }}>
          <DataTableCard
            title="Daftar Perizinan"
            subtitle="Kelola izin keluar santri"
            actions={
              <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
                {filtered.length} perizinan
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
            />

            {filtered.length === 0 ? (
              <EmptyState
                title={perizinan.length === 0 ? "Belum ada perizinan" : "Tidak ada hasil pencarian"}
                description={
                  perizinan.length === 0
                    ? "Input perizinan pertama untuk memulai."
                    : "Coba kata kunci lain atau hapus filter pencarian."
                }
              />
            ) : (
              <div className="table-scroll-x">
                <table style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Nama</th>
                      <th style={thStyle}>Tanggal</th>
                      <th style={thStyle}>Tujuan</th>
                      <th style={thStyle}>Alasan</th>
                      <th style={thStyle}>Keluar</th>
                      <th style={thStyle}>Target Kembali</th>
                      <th style={thStyle}>Jam Kembali</th>
                      <th style={thStyle}>Catatan</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id}>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{p.nama}</td>
                        <td style={tdStyle}>{p.tanggal}</td>
                        <td style={tdStyle}>{p.tujuan || "—"}</td>
                        <td style={tdStyle}>{p.alasan || "—"}</td>
                        <td style={tdStyle}>{p.jam_keluar}</td>
                        <td style={tdStyle}>{p.tanggal_kembali || "—"}</td>
                        <td style={tdStyle}>{p.jam_kembali || "—"}</td>
                        <td style={tdStyle}>{p.catatan || "—"}</td>
                        <td style={tdStyle}>
                          <Badge variant={perizinanBadgeVariant(p.status)}>{p.status}</Badge>
                        </td>
                        <td style={tdStyle}>
                          <div style={actionBarStyle}>
                            <Button variant="outline" size="sm" onClick={() => editPerizinan(p)}>
                              Edit
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => deletePerizinan(p.id)}>
                              Hapus
                            </Button>
                            {p.status === "keluar" && (
                              <Button variant="primary" size="sm" onClick={() => kembali(p.id)}>
                                Kembali
                              </Button>
                            )}
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

export default PerizinanPage;
