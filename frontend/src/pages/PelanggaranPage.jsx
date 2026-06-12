import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import Card from "../components/ui/Card";
import SectionHeading from "../components/ui/SectionHeading";
import Button, { actionBarStyle } from "../components/ui/Button";
import DataTableCard from "../components/ui/DataTableCard";
import TableToolbar from "../components/ui/TableToolbar";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";

const FORM_INIT = {
  santri_id: "",
  tanggal: "",
  jam: "",
  jenis: "",
  tingkat: "",
  poin: 0,
  catatan: "",
  tindakan: "",
  petugas: "",
};

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

function PelanggaranPage() {
  const [pelanggaran, setPelanggaran] = useState([]);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [santri, setSantri] = useState([]);
  const [form, setForm] = useState(FORM_INIT);

  const getPelanggaran = async () => {
    try {
      const response = await api.get("/pelanggaran");
      setPelanggaran(response.data.data || []);
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

  const deletePelanggaran = async (id) => {
    if (!window.confirm("Hapus data ini?")) return;

    try {
      await api.delete(`/pelanggaran/${id}`);
      getPelanggaran();
    } catch (err) {
      console.log(err);
      alert("Gagal hapus");
    }
  };

  const editPelanggaran = (p) => {
    setForm({
      santri_id: p.santri_id,
      tanggal: p.tanggal?.split("T")[0],
      jam: p.jam || "",
      jenis: p.jenis,
      tingkat: p.tingkat || "",
      poin: p.poin,
      catatan: p.catatan || "",
      tindakan: p.tindakan || "",
      petugas: p.petugas || "",
    });
    setEditId(p.id);
  };

  const createPelanggaran = async () => {
    try {
      const payload = { ...form, poin: Number(form.poin) };

      if (editId) {
        await api.put(`/pelanggaran/${editId}`, payload);
      } else {
        await api.post("/pelanggaran", payload);
      }

      alert("Data berhasil disimpan");

      setEditId(null);
      setForm(FORM_INIT);
      getPelanggaran();
    } catch (err) {
      console.log(err);
      alert("Gagal simpan");
    }
  };

  useEffect(() => {
    getPelanggaran();
    getSantri();
  }, []);

  const filtered = useMemo(
    () =>
      pelanggaran.filter((p) =>
        p.nama?.toLowerCase().includes(search.toLowerCase()),
      ),
    [pelanggaran, search],
  );

  return (
    <AppShell title="Pelanggaran Santri" breadcrumb="Keamanan / Pelanggaran">
      <LegacyPageStyles />
      <div className="legacy-page">
        <Card padding="md" shadow="card" border={false} radius="xl">
          <SectionHeading variant="eyebrow" spacing="first">
            Input Pelanggaran
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
              value={form.jam}
              onChange={(e) => setForm({ ...form, jam: e.target.value })}
            />

            <input
              style={fieldStyle}
              type="text"
              placeholder="Jenis Pelanggaran"
              value={form.jenis}
              onChange={(e) => setForm({ ...form, jenis: e.target.value })}
            />

            <select
              style={fieldStyle}
              value={form.tingkat}
              onChange={(e) => setForm({ ...form, tingkat: e.target.value })}
            >
              <option value="">Pilih Tingkat</option>
              <option value="Ringan">Ringan</option>
              <option value="Sedang">Sedang</option>
              <option value="Berat">Berat</option>
            </select>

            <input
              style={fieldStyle}
              type="number"
              placeholder="Poin"
              value={form.poin}
              onChange={(e) => setForm({ ...form, poin: e.target.value })}
            />

            <input
              style={fieldStyle}
              type="text"
              placeholder="Nama Petugas"
              value={form.petugas}
              onChange={(e) => setForm({ ...form, petugas: e.target.value })}
            />

            <textarea
              style={{ ...fieldStyle, ...spanFull, minHeight: "80px", resize: "vertical" }}
              placeholder="Catatan"
              value={form.catatan}
              onChange={(e) => setForm({ ...form, catatan: e.target.value })}
            />

            <textarea
              style={{ ...fieldStyle, ...spanFull, minHeight: "80px", resize: "vertical" }}
              placeholder="Tindakan"
              value={form.tindakan}
              onChange={(e) => setForm({ ...form, tindakan: e.target.value })}
            />
          </div>

          <div style={{ ...actionBarStyle, marginTop: "var(--space-4)" }}>
            <Button variant="primary" onClick={createPelanggaran}>
              Simpan
            </Button>
          </div>
        </Card>

        <div style={{ marginTop: "var(--space-6)" }}>
          <DataTableCard
            title="Daftar Pelanggaran"
            subtitle="Rekap pelanggaran santri"
            actions={
              <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
                {filtered.length} pelanggaran
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
                title={pelanggaran.length === 0 ? "Belum ada pelanggaran" : "Tidak ada hasil pencarian"}
                description={
                  pelanggaran.length === 0
                    ? "Input pelanggaran pertama untuk memulai."
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
                      <th style={thStyle}>Jenis</th>
                      <th style={thStyle}>Poin</th>
                      <th style={thStyle}>Tindakan</th>
                      <th style={thStyle}>Petugas</th>
                      <th style={thStyle}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id}>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{p.nama}</td>
                        <td style={tdStyle}>{p.tanggal}</td>
                        <td style={tdStyle}>{p.jenis}</td>
                        <td style={tdStyle}>{p.poin}</td>
                        <td style={tdStyle}>{p.tindakan || "—"}</td>
                        <td style={tdStyle}>{p.petugas || "—"}</td>
                        <td style={tdStyle}>
                          <div style={actionBarStyle}>
                            <Button variant="outline" size="sm" onClick={() => editPelanggaran(p)}>
                              Edit
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => deletePelanggaran(p.id)}>
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

export default PelanggaranPage;
