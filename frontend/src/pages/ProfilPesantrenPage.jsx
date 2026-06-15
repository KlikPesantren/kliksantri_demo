import { useEffect, useMemo, useState, useCallback } from "react";

import api from "../services/api";

import AppShell from "../layouts/AppShell";

import Card from "../components/ui/Card";

import SectionHeading from "../components/ui/SectionHeading";

import Button from "../components/ui/Button";

import TenantBrand from "../components/TenantBrand";

import {

  FormField,

  Input,

  Textarea,

  FormGrid,

  FormActionBar,

} from "../components/ui/form";

import { useTenantProfile } from "../context/TenantProfileContext";

import AppBrandingPreview from "../components/AppBrandingPreview";

import ImageUploadField from "../components/ImageUploadField";

import { isBannerVisible, resolveTenantDisplay } from "../utils/tenantProfile";

import { resolveDisplayMediaUrl } from "../utils/mediaUrl";



const EMPTY_FORM = {

  nama_pesantren: "",

  alamat: "",

  telepon: "",

  email: "",

  website: "",

  logo_url: "",

  banner_url: "",

  banner_active: true,

  splash_logo_url: "",

  app_icon_url: "",

  tagline: "",

  tentang: "",

  visi: "",

  misi: "",

};



function BannerPreview({ bannerUrl, bannerActive, name, address }) {

  const resolvedBanner = resolveDisplayMediaUrl(bannerUrl);
  const hasImage = Boolean(resolvedBanner?.trim());



  return (

    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>

      <div>

        <div style={previewLabelStyle}>Desktop (16:9 · max 220px)</div>

        <div style={desktopFrameStyle}>

          {hasImage && bannerActive ? (

            <img src={resolvedBanner} alt="Preview banner desktop" style={desktopImageStyle} />

          ) : (

            <BannerPlaceholder />

          )}

          {hasImage && bannerActive ? (

            <div style={overlayStyle}>

              <div style={overlayTitleStyle}>{name || "Nama Pesantren"}</div>

              {address ? <div style={overlaySubStyle}>{address}</div> : null}

            </div>

          ) : null}

        </div>

      </div>



      <div>

        <div style={previewLabelStyle}>Mobile</div>

        <div style={mobileFrameStyle}>

          {hasImage && bannerActive ? (

            <img src={resolvedBanner} alt="Preview banner mobile" style={mobileImageStyle} />

          ) : (

            <BannerPlaceholder compact />

          )}

        </div>

      </div>

    </div>

  );

}



function BannerPlaceholder({ compact = false }) {

  return (

    <div style={placeholderStyle(compact)}>

      <span style={{ fontSize: compact ? 24 : 32, opacity: 0.35 }}>🏫</span>

      <span style={placeholderTextStyle}>Belum ada banner pesantren</span>

    </div>

  );

}



function ProfilPesantrenPage() {

  const { updateLocal } = useTenantProfile();

  const [form, setForm] = useState(EMPTY_FORM);

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [saved, setSaved] = useState(false);

  const [error, setError] = useState(null);



  const setField = useCallback(

    (field) => (url) => setForm((prev) => ({ ...prev, [field]: url })),

    [],

  );



  const load = async () => {

    setLoading(true);

    setError(null);

    try {

      const res = await api.get("/profil-pesantren");

      const d = res.data.data;

      if (d) {

        const nextForm = {

          nama_pesantren: d.nama_pesantren ?? "",

          alamat: d.alamat ?? "",

          telepon: d.telepon ?? "",

          email: d.email ?? "",

          website: d.website ?? "",

          logo_url: d.logo_url ?? "",

          banner_url: d.banner_url ?? "",

          banner_active: d.banner_active !== false,

          splash_logo_url: d.splash_logo_url ?? "",

          app_icon_url: d.app_icon_url ?? "",

          tagline: d.tagline ?? "",

          tentang: d.tentang ?? "",

          visi: d.visi ?? "",

          misi: d.misi ?? "",

        };

        setForm(nextForm);

        updateLocal(d);

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

      const payload = {

        ...form,

        logo_url: form.logo_url || null,

        banner_url: form.banner_url || null,

        banner_active: form.banner_active !== false,

        splash_logo_url: form.splash_logo_url || null,

        app_icon_url: form.app_icon_url || null,

        tagline: form.tagline || null,

        tentang: form.tentang || null,

        visi: form.visi || null,

        misi: form.misi || null,

        alamat: form.alamat || null,

        telepon: form.telepon || null,

        email: form.email || null,

        website: form.website || null,

      };

      await api.put("/profil-pesantren", payload);

      updateLocal(payload);

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



  const previewDisplay = useMemo(

    () =>

      resolveTenantDisplay({

        nama_pesantren: form.nama_pesantren,

        alamat: form.alamat,

        logo_url: form.logo_url,

        banner_url: form.banner_url,

        banner_active: form.banner_active,

        splash_logo_url: form.splash_logo_url,

        app_icon_url: form.app_icon_url,

        tagline: form.tagline,

      }),

    [form],

  );



  const bannerPreviewVisible = isBannerVisible({

    banner_url: form.banner_url,

    banner_active: form.banner_active,

  });



  return (

    <AppShell

      title="Profil Pesantren"

      description="Informasi ini tampil di APK Wali Santri. Simpan untuk memperbarui."

      breadcrumb="Sistem / Profil Pesantren"

    >

      <div className="legacy-page">

        {loading ? (

          <p style={{ color: "var(--text-secondary)" }}>Memuat data...</p>

        ) : (

          <>

            {error && (

              <div style={alertStyle("var(--danger-subtle)", "var(--danger)")}>

                ⚠️ {error}

              </div>

            )}

            {saved && (

              <div style={alertStyle("var(--success-subtle)", "var(--primary)")}>

                ✅ Data berhasil disimpan.

              </div>

            )}



            <Card padding="md" shadow="card" border={false} radius="xl">

              <SectionHeading variant="eyebrow" spacing="first">

                Identitas

              </SectionHeading>

              <FormGrid style={{ marginTop: "var(--space-4)" }}>

                <FormField label="Nama Pesantren" htmlFor="profil-nama" required fullWidth>

                  <Input

                    id="profil-nama"

                    value={form.nama_pesantren}

                    onChange={set("nama_pesantren")}

                    placeholder="Nama resmi pesantren"

                    maxLength={200}

                  />

                </FormField>

                <FormField label="Alamat" htmlFor="profil-alamat" fullWidth>

                  <Textarea

                    id="profil-alamat"

                    value={form.alamat}

                    onChange={set("alamat")}

                    placeholder="Alamat lengkap pesantren"

                    rows={3}

                  />

                </FormField>

              </FormGrid>

            </Card>



            <div style={{ marginTop: "var(--space-4)" }}>

              <Card padding="md" shadow="card" border={false} radius="xl">

                <SectionHeading variant="eyebrow" spacing="first">

                  Kontak

                </SectionHeading>

                <FormGrid style={{ marginTop: "var(--space-4)" }}>

                  <FormField label="Telepon" htmlFor="profil-telp">

                    <Input

                      id="profil-telp"

                      value={form.telepon}

                      onChange={set("telepon")}

                      placeholder="0812-xxxx-xxxx"

                      maxLength={30}

                    />

                  </FormField>

                  <FormField label="Email" htmlFor="profil-email">

                    <Input

                      id="profil-email"

                      type="email"

                      value={form.email}

                      onChange={set("email")}

                      placeholder="info@pesantren.ac.id"

                      maxLength={100}

                    />

                  </FormField>

                  <FormField label="Website" htmlFor="profil-web" fullWidth>

                    <Input

                      id="profil-web"

                      value={form.website}

                      onChange={set("website")}

                      placeholder="https://pesantren.ac.id"

                      maxLength={200}

                    />

                  </FormField>

                </FormGrid>

              </Card>

            </div>



            <div style={{ marginTop: "var(--space-4)" }}>

              <Card padding="md" shadow="card" border={false} radius="xl">

                <SectionHeading variant="eyebrow" spacing="first">

                  Branding Aplikasi

                </SectionHeading>

                <p style={helperTextStyle}>

                  Logo, splash, tagline, dan banner tampil di Admin Panel dan APK Wali Santri.

                  Upload file PNG/JPG/WEBP (maks. 5MB). URL hasil upload otomatis tersimpan.

                  Jika logo splash kosong, preview menggunakan logo pesantren.

                </p>

                <div style={{ marginTop: "var(--space-4)" }}>

                  <AppBrandingPreview profile={form} />

                </div>

                <div

                  style={{

                    marginTop: "var(--space-4)",

                    padding: "var(--space-4)",

                    borderRadius: "var(--radius-lg)",

                    background: "var(--dark)",

                    border: "1px solid rgba(148, 163, 184, 0.12)",

                  }}

                >

                  <div style={previewLabelStyle}>Preview Sidebar Admin</div>

                  <TenantBrand

                    variant="sidebar"

                    logo={previewDisplay.logo}

                    name={previewDisplay.name}

                    location={previewDisplay.address}

                  />

                </div>

                <FormGrid style={{ marginTop: "var(--space-4)" }}>

                  <FormField label="Logo Pesantren" htmlFor="profil-logo" fullWidth>

                    <ImageUploadField

                      id="profil-logo"

                      label="Logo Pesantren"

                      value={form.logo_url}

                      onChange={setField("logo_url")}

                    />

                  </FormField>

                  <FormField label="Logo Splash Screen" htmlFor="profil-splash-logo" fullWidth>

                    <ImageUploadField

                      id="profil-splash-logo"

                      label="Splash Logo"

                      value={form.splash_logo_url}

                      onChange={setField("splash_logo_url")}

                    />

                  </FormField>

                  <FormField label="App Icon (persiapan build)" htmlFor="profil-app-icon" fullWidth>

                    <ImageUploadField

                      id="profil-app-icon"

                      label="App Icon"

                      value={form.app_icon_url}

                      onChange={setField("app_icon_url")}

                    />

                  </FormField>

                  <FormField label="Tagline Pesantren" htmlFor="profil-tagline" fullWidth>

                    <Input

                      id="profil-tagline"

                      value={form.tagline}

                      onChange={set("tagline")}

                      placeholder="Portal Wali Santri"

                      maxLength={200}

                    />

                  </FormField>

                  <FormField label="Banner Pesantren" htmlFor="profil-banner" fullWidth>

                    <ImageUploadField

                      id="profil-banner"

                      label="Banner Pesantren"

                      value={form.banner_url}

                      onChange={setField("banner_url")}

                      previewHeight={140}

                    />

                  </FormField>

                  <FormField label="Status Banner" htmlFor="profil-banner-active" fullWidth>

                    <label style={toggleLabelStyle}>

                      <input

                        id="profil-banner-active"

                        type="checkbox"

                        checked={form.banner_active !== false}

                        onChange={(e) =>

                          setForm((prev) => ({

                            ...prev,

                            banner_active: e.target.checked,

                          }))

                        }

                        style={{ width: 16, height: 16, accentColor: "var(--primary)" }}

                      />

                      <span>

                        Banner aktif

                        {bannerPreviewVisible ? " — akan tampil di APK Wali" : ""}

                      </span>

                    </label>

                  </FormField>

                </FormGrid>

                <div style={{ marginTop: "var(--space-4)" }}>

                  <BannerPreview

                    bannerUrl={form.banner_url}

                    bannerActive={form.banner_active}

                    name={previewDisplay.name}

                    address={previewDisplay.address}

                  />

                </div>

              </Card>

            </div>



            <div style={{ marginTop: "var(--space-4)" }}>

              <Card padding="md" shadow="card" border={false} radius="xl">

                <SectionHeading variant="eyebrow" spacing="first">

                  Visi & Misi

                </SectionHeading>

                <FormGrid style={{ marginTop: "var(--space-4)" }}>

                  <FormField label="Visi" htmlFor="profil-visi" fullWidth>

                    <Textarea

                      id="profil-visi"

                      value={form.visi}

                      onChange={set("visi")}

                      placeholder="Pernyataan visi pesantren..."

                      rows={4}

                    />

                  </FormField>

                  <FormField label="Misi" htmlFor="profil-misi" fullWidth>

                    <Textarea

                      id="profil-misi"

                      value={form.misi}

                      onChange={set("misi")}

                      placeholder="Pernyataan misi pesantren..."

                      rows={5}

                    />

                  </FormField>

                </FormGrid>

              </Card>

            </div>



            <div style={{ marginTop: "var(--space-4)" }}>

              <Card padding="md" shadow="card" border={false} radius="xl">

                <SectionHeading variant="eyebrow" spacing="first">

                  Tentang Pesantren

                </SectionHeading>

                <p style={helperTextStyle}>

                  Opsional. Tampil di halaman Profil Pesantren pada APK Wali jika diisi.

                </p>

                <FormGrid style={{ marginTop: "var(--space-4)" }}>

                  <FormField label="Tentang" htmlFor="profil-tentang" fullWidth>

                    <Textarea

                      id="profil-tentang"

                      value={form.tentang}

                      onChange={set("tentang")}

                      placeholder="Cerita singkat tentang pesantren..."

                      rows={6}

                    />

                  </FormField>

                </FormGrid>

              </Card>

            </div>



            <FormActionBar>

              <Button type="button" variant="primary" onClick={save} loading={saving} disabled={saving}>

                Simpan Perubahan

              </Button>

              <Button type="button" variant="outline" onClick={load} disabled={loading}>

                Muat Ulang

              </Button>

            </FormActionBar>

          </>

        )}

      </div>

    </AppShell>

  );

}



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



const previewLabelStyle = {

  fontSize: "10px",

  fontWeight: 700,

  textTransform: "uppercase",

  letterSpacing: "0.08em",

  color: "var(--neutral)",

  marginBottom: "var(--space-2)",

};

const helperTextStyle = {

  marginTop: "var(--space-2)",

  marginBottom: 0,

  fontSize: "13px",

  color: "var(--text-secondary)",

  lineHeight: 1.5,

};



const desktopFrameStyle = {

  position: "relative",

  width: "100%",

  maxHeight: 220,

  aspectRatio: "16 / 9",

  borderRadius: "var(--radius-xl)",

  overflow: "hidden",

  border: "1px solid var(--border)",

  background: "var(--surface-soft)",

};



const desktopImageStyle = {

  width: "100%",

  height: "100%",

  objectFit: "cover",

  display: "block",

};



const mobileFrameStyle = {

  width: "100%",

  maxWidth: 320,

  aspectRatio: "16 / 9",

  borderRadius: "var(--radius-lg)",

  overflow: "hidden",

  border: "1px solid var(--border)",

  background: "var(--surface-soft)",

};



const mobileImageStyle = {

  width: "100%",

  height: "100%",

  objectFit: "cover",

  display: "block",

};



const overlayStyle = {

  position: "absolute",

  left: 0,

  right: 0,

  bottom: 0,

  padding: "16px",

  background: "linear-gradient(transparent, rgba(22, 163, 74, 0.75))",

};



const overlayTitleStyle = {

  color: "#fff",

  fontWeight: 800,

  fontSize: "16px",

  lineHeight: 1.3,

};



const overlaySubStyle = {

  color: "rgba(255,255,255,0.9)",

  fontSize: "12px",

  marginTop: 4,

};



function placeholderStyle(compact) {

  return {

    width: "100%",

    height: "100%",

    minHeight: compact ? 120 : 160,

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    justifyContent: "center",

    gap: 8,

    background: "var(--primary-subtle, #DCFCE7)",

    border: "1px dashed var(--border)",

  };

}



const placeholderTextStyle = {

  fontSize: "13px",

  fontWeight: 600,

  color: "var(--text-secondary)",

};



const toggleLabelStyle = {

  display: "flex",

  alignItems: "center",

  gap: 10,

  fontSize: "14px",

  color: "var(--text-primary)",

  cursor: "pointer",

  minHeight: 44,

};



export default ProfilPesantrenPage;


