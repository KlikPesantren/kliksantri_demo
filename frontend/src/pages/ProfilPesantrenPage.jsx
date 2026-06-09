import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";

const EMPTY_FORM = {
  nama_pesantren: "",
  alamat: "",
  telepon: "",
  email: "",
  website: "",
  logo_url: "",
  visi: "",
  misi: "",
};

function ProfilPesantrenPage() {

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  // ======================
  // LOAD
  // ======================

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/profil-pesantren");
      const d = res.data.data;
      if (d) {
        setForm({
          nama_pesantren: d.nama_pesantren ?? "",
          alamat:         d.alamat        ?? "",
          telepon:        d.telepon       ?? "",
          email:          d.email         ?? "",
          website:        d.website       ?? "",
          logo_url:       d.logo_url      ?? "",
          visi:           d.visi          ?? "",
          misi:           d.misi          ?? "",
        });
      }
    } catch (err) {
      setError("Gagal memuat data. " + (err.response?.data?.error ?? err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ======================
  // SAVE (UPSERT)
  // ======================

  const save = async () => {
    if (!form.nama_pesantren.trim()) {
      alert("Nama pesantren wajib diisi.");
      return;
    }
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await api.put("/profil-pesantren", {
        ...form,
        logo_url: form.logo_url || null,
        visi:     form.visi     || null,
        misi:     form.misi     || null,
        alamat:   form.alamat   || null,
        telepon:  form.telepon  || null,
        email:    form.email    || null,
        website:  form.website  || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError("Gagal menyimpan. " + (err.response?.data?.error ?? err.message));
    } finally {
      setSaving(false);
    }
  };

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  // ======================
  // RENDER
  // ======================

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f7fb" }}>
      <Sidebar />

      <div style={{
        marginLeft: "240px",
        width: "calc(100% - 240px)",
        padding: "24px",
        boxSizing: "border-box",
        maxWidth: "1000px",
      }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>🏫 Profil Pesantren</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "13px" }}>
            Informasi ini tampil di APK Wali Santri. Simpan untuk memperbarui.
          </p>
        </div>

        {loading ? (
          <p style={{ color: "#9ca3af" }}>Memuat data...</p>
        ) : (
          <div style={cardStyle}>

            {error && (
              <div style={alertStyle("#fee2e2", "#ef4444")}>
                ⚠️ {error}
              </div>
            )}
            {saved && (
              <div style={alertStyle("#dcfce7", "#16a34a")}>
                ✅ Data berhasil disimpan.
              </div>
            )}

            {/* ── Informasi Utama ── */}
            <h3 style={sectionTitle}>Informasi Utama</h3>

            <label style={labelStyle}>Nama Pesantren *</label>
            <input
              style={inputStyle}
              value={form.nama_pesantren}
              onChange={set("nama_pesantren")}
              placeholder="Nama resmi pesantren"
              maxLength={200}
            />

            <label style={labelStyle}>Alamat</label>
            <textarea
              style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
              value={form.alamat}
              onChange={set("alamat")}
              placeholder="Alamat lengkap pesantren"
            />

            {/* ── Kontak ── */}
            <h3 style={{ ...sectionTitle, marginTop: "24px" }}>Kontak</h3>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <label style={labelStyle}>Telepon</label>
                <input
                  style={inputStyle}
                  value={form.telepon}
                  onChange={set("telepon")}
                  placeholder="0812-xxxx-xxxx"
                  maxLength={30}
                />
              </div>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  style={inputStyle}
                  value={form.email}
                  onChange={set("email")}
                  placeholder="info@pesantren.ac.id"
                  maxLength={100}
                />
              </div>
            </div>

            <label style={labelStyle}>Website</label>
            <input
              style={inputStyle}
              value={form.website}
              onChange={set("website")}
              placeholder="https://pesantren.ac.id"
              maxLength={200}
            />

            <label style={labelStyle}>URL Logo (opsional)</label>
            <input
              style={inputStyle}
              value={form.logo_url}
              onChange={set("logo_url")}
              placeholder="https://cdn.pesantren.ac.id/logo.png"
              maxLength={500}
            />
            {form.logo_url ? (
              <div style={{ marginTop: "8px" }}>
                <img
                  src={form.logo_url}
                  alt="preview logo"
                  style={{ height: "56px", objectFit: "contain", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              </div>
            ) : null}

            {/* ── Visi & Misi ── */}
            <h3 style={{ ...sectionTitle, marginTop: "24px" }}>Visi & Misi</h3>

            <label style={labelStyle}>Visi</label>
            <textarea
              style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
              value={form.visi}
              onChange={set("visi")}
              placeholder="Pernyataan visi pesantren..."
            />

            <label style={labelStyle}>Misi</label>
            <textarea
              style={{ ...inputStyle, minHeight: "160px", resize: "vertical" }}
              value={form.misi}
              onChange={set("misi")}
              placeholder="Pernyataan misi pesantren (tiap poin bisa dipisah dengan baris baru)..."
            />

            {/* ── Action ── */}
            <div style={{ marginTop: "20px", display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                onClick={save}
                disabled={saving}
                style={{
                  ...btnStyle("#1a7f5a"),
                  opacity: saving ? 0.7 : 1,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Menyimpan..." : "💾 Simpan Perubahan"}
              </button>
              <button
                onClick={load}
                disabled={loading}
                style={{ ...btnStyle("#6b7280"), cursor: loading ? "not-allowed" : "pointer" }}
              >
                🔄 Muat Ulang
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────

const cardStyle = {
  background: "white",
  padding: "28px",
  borderRadius: "16px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
};

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  color: "#374151",
  marginBottom: "6px",
  marginTop: "14px",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  boxSizing: "border-box",
  outline: "none",
  fontFamily: "inherit",
  lineHeight: "1.5",
};

const sectionTitle = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#1f2937",
  margin: "0 0 4px",
  paddingBottom: "8px",
  borderBottom: "1px solid #e5e7eb",
};

function btnStyle(bg) {
  return {
    background: bg,
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
  };
}

function alertStyle(bg, color) {
  return {
    background: bg,
    color: color,
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
    marginBottom: "16px",
  };
}

export default ProfilPesantrenPage;
