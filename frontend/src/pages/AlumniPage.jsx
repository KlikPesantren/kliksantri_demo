import { useEffect, useState } from "react";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import { FormField, Input, Select, Textarea, FormGrid, FormSection, FormActionBar } from "../components/ui/form";

const EMPTY = {
  nama: "", nis: "", jenis_kelamin: "", tahun_masuk: "", tahun_lulus: "",
  angkatan: "", status_kelulusan: "lulus", kontak: "", alamat: "", pekerjaan: "", catatan: "",
};

export default function AlumniPage() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const res = await api.get("/alumni"); setList(res.data.data || []); }
    catch (err) { alert(err.response?.data?.error || "Gagal memuat data alumni"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const filtered = list.filter((item) => {
    const q = search.trim().toLowerCase();
    return !q || [item.nama, item.nis, item.angkatan, item.tahun_lulus, item.nama_kelas]
      .some((value) => String(value || "").toLowerCase().includes(q));
  });
  const save = async () => {
    if (!form.nama.trim()) return alert("Nama alumni wajib diisi");
    setSaving(true);
    try { await api.post("/alumni", form); setForm(EMPTY); await load(); }
    catch (err) { alert(err.response?.data?.error || "Gagal menyimpan alumni"); }
    finally { setSaving(false); }
  };

  return (
    <AppShell title="Data Alumni" breadcrumb="Data Utama / Alumni">
      <Card padding="md" shadow="card" border={false} radius="xl">
        <FormSection title="Tambah Alumni Lama">
          <p style={{ marginTop: 0, color: "var(--text-secondary)", fontSize: 13 }}>
            Gunakan form ini untuk alumni sebelum sistem digunakan. Alumni dari santri lulus/keluar akan tersinkron otomatis.
          </p>
          <FormGrid>
            <FormField label="Nama Lengkap" required><Input value={form.nama} onChange={set("nama")} /></FormField>
            <FormField label="NIS"><Input value={form.nis} onChange={set("nis")} /></FormField>
            <FormField label="Jenis Kelamin"><Select value={form.jenis_kelamin} onChange={set("jenis_kelamin")}><option value="">Pilih</option><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option></Select></FormField>
            <FormField label="Status"><Select value={form.status_kelulusan} onChange={set("status_kelulusan")}><option value="lulus">Lulus</option><option value="keluar">Keluar</option></Select></FormField>
            <FormField label="Angkatan"><Input value={form.angkatan} onChange={set("angkatan")} placeholder="Contoh: 2015" /></FormField>
            <FormField label="Tahun Masuk"><Input type="number" value={form.tahun_masuk} onChange={set("tahun_masuk")} /></FormField>
            <FormField label="Tahun Lulus"><Input type="number" value={form.tahun_lulus} onChange={set("tahun_lulus")} /></FormField>
            <FormField label="Kontak"><Input value={form.kontak} onChange={set("kontak")} /></FormField>
            <FormField label="Pekerjaan"><Input value={form.pekerjaan} onChange={set("pekerjaan")} /></FormField>
            <FormField label="Alamat" fullWidth><Textarea rows={2} value={form.alamat} onChange={set("alamat")} /></FormField>
            <FormField label="Catatan" fullWidth><Textarea rows={2} value={form.catatan} onChange={set("catatan")} /></FormField>
          </FormGrid>
          <FormActionBar><Button variant="primary" onClick={save} disabled={saving}>{saving ? "Menyimpan..." : "Simpan Alumni"}</Button></FormActionBar>
        </FormSection>
      </Card>
      <Card padding="md" shadow="card" border={false} radius="xl">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Daftar Alumni ({filtered.length})</h2>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, NIS, angkatan..." />
        </div>
        {loading ? <p>Memuat data alumni...</p> : filtered.length === 0 ? <EmptyState title="Belum ada alumni" description="Tambahkan alumni lama melalui form di atas." /> : (
          <div style={{ overflowX: "auto", marginTop: 16 }}><table className="table-v3"><thead><tr><th>Nama</th><th>NIS</th><th>Angkatan</th><th>Tahun Lulus</th><th>Status</th><th>Kelas Terakhir</th><th>Kontak</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td>{item.nama}</td><td>{item.nis || "—"}</td><td>{item.angkatan || "—"}</td><td>{item.tahun_lulus || "—"}</td><td>{item.status_kelulusan}</td><td>{item.nama_kelas || "—"}</td><td>{item.kontak || "—"}</td></tr>)}</tbody></table></div>
        )}
      </Card>
    </AppShell>
  );
}
