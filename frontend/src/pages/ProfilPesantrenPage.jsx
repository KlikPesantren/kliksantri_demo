import { useEffect, useState } from "react";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import Card from "../components/ui/Card";
import SectionHeading from "../components/ui/SectionHeading";
import Button, { actionBarStyle } from "../components/ui/Button";

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

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "var(--space-4)",
};

const spanFull = { gridColumn: "1 / -1" };

function LegacyPageStyles() {
  return (
    <style>{`
      .legacy-page {
        min-width: 0;
        max-width: 100%;
      }
      .legacy-form-grid input,
      .legacy-form-grid textarea {
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
      }
    `}</style>
  );
}

function ProfilPesantrenPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/profil-pesantren");
      const d = res.data.data;
      if (d) {
        setForm({
          nama_pesantren: d.nama_pesantren ?? "",
          alamat: d.alamat ?? "",
          telepon: d.telepon ?? "",
          email: d.email ?? "",
          website: d.website ?? "",
          logo_url: d.logo_url ?? "",
          visi: d.visi ?? "",
          misi: d.misi ?? "",
        });
      }
    } catch (err) {
      setError("Gagal memuat data. " + (err.response?.data?.error ?? err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
        visi: form.visi || null,
        misi: form.misi || null,
        alamat: form.alamat || null,
        telepon: form.telepon || null,
        email: form.email || null,
        website: form.website || null,
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

  return (
    <AppShell
      title="🏫 Profil Pesantren"
      description="Informasi ini tampil di APK Wali Santri. Simpan untuk memperbarui."
      breadcrumb="Sistem / Profil Pesantren"
    >
      <LegacyPageStyles />
      <div className="legacy-page">
        {loading ? (
          <p style={{ color: "var(--text-secondary)" }}>Memuat data...</p>
        ) : (
          <>
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

            <Card padding="md" shadow="card" border={false} radius="xl">
              <SectionHeading variant="eyebrow" spacing="first">
                Identitas
              </SectionHeading>

              <div className="legacy-form-grid" style={{ ...formGridStyle, marginTop: "var(--space-4)" }}>
                <div style={spanFull}>
                  <label style={labelStyle}>Nama Pesantren *</label>
                  <input
                    style={inputStyle}
                    value={form.nama_pesantren}
                    onChange={set("nama_pesantren")}
                    placeholder="Nama resmi pesantren"
                    maxLength={200}
                  />
                </div>

                <div style={spanFull}>
                  <label style={labelStyle}>Alamat</label>
                  <textarea
                    style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                    value={form.alamat}
                    onChange={set("alamat")}
                    placeholder="Alamat lengkap pesantren"
                  />
                </div>
              </div>
            </Card>

            <div style={{ marginTop: "var(--space-5)" }}>
              <Card padding="md" shadow="card" border={false} radius="xl">
                <SectionHeading variant="eyebrow" spacing="first">
                  Kontak
                </SectionHeading>

                <div className="legacy-form-grid" style={{ ...formGridStyle, marginTop: "var(--space-4)" }}>
                  <div>
                    <label style={labelStyle}>Telepon</label>
                    <input
                      style={inputStyle}
                      value={form.telepon}
                      onChange={set("telepon")}
                      placeholder="0812-xxxx-xxxx"
                      maxLength={30}
                    />
                  </div>
                  <div>
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
                  <div style={spanFull}>
                    <label style={labelStyle}>Website</label>
                    <input
                      style={inputStyle}
                      value={form.website}
                      onChange={set("website")}
                      placeholder="https://pesantren.ac.id"
                      maxLength={200}
                    />
                  </div>
                </div>
              </Card>
            </div>

            <div style={{ marginTop: "var(--space-5)" }}>
              <Card padding="md" shadow="card" border={false} radius="xl">
                <SectionHeading variant="eyebrow" spacing="first">
                  Branding
                </SectionHeading>

                <div className="legacy-form-grid" style={{ ...formGridStyle, marginTop: "var(--space-4)" }}>
                  <div style={spanFull}>
                    <label style={labelStyle}>URL Logo (opsional)</label>
                    <input
                      style={inputStyle}
                      value={form.logo_url}
                      onChange={set("logo_url")}
                      placeholder="https://cdn.pesantren.ac.id/logo.png"
                      maxLength={500}
                    />
                    {form.logo_url ? (
                      <div style={{ marginTop: "var(--space-2)" }}>
                        <img
                          src={form.logo_url}
                          alt="preview logo"
                          style={{
                            height: "56px",
                            objectFit: "contain",
                            borderRadius: "8px",
                            border: "1px solid var(--border)",
                          }}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div style={spanFull}>
                    <label style={labelStyle}>Visi</label>
                    <textarea
                      style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
                      value={form.visi}
                      onChange={set("visi")}
                      placeholder="Pernyataan visi pesantren..."
                    />
                  </div>

                  <div style={spanFull}>
                    <label style={labelStyle}>Misi</label>
                    <textarea
                      style={{ ...inputStyle, minHeight: "160px", resize: "vertical" }}
                      value={form.misi}
                      onChange={set("misi")}
                      placeholder="Pernyataan misi pesantren (tiap poin bisa dipisah dengan baris baru)..."
                    />
                  </div>
                </div>
              </Card>
            </div>

            <div style={{ ...actionBarStyle, marginTop: "var(--space-5)" }}>
              <Button
                type="button"
                variant="primary"
                onClick={save}
                loading={saving}
                disabled={saving}
              >
                💾 Simpan Perubahan
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={load}
                disabled={loading}
              >
                🔄 Muat Ulang
              </Button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--text-primary)",
  marginBottom: "6px",
};

const inputStyle = {
  width: "100%",
  maxWidth: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  fontSize: "14px",
  boxSizing: "border-box",
  outline: "none",
  fontFamily: "inherit",
  lineHeight: "1.5",
};

function alertStyle(bg, color) {
  return {
    background: bg,
    color: color,
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
    marginBottom: "var(--space-4)",
  };
}

export default ProfilPesantrenPage;
