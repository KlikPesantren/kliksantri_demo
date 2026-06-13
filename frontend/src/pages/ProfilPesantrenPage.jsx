import { useEffect, useMemo, useState } from "react";

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

import { isBannerVisible, resolveTenantDisplay } from "../utils/tenantProfile";



const EMPTY_FORM = {

  nama_pesantren: "",

  alamat: "",

  telepon: "",

  email: "",

  website: "",

  logo_url: "",

  banner_url: "",

  banner_active: true,

  visi: "",

  misi: "",

};



function BannerPreview({ bannerUrl, bannerActive, name, address }) {

  const hasImage = Boolean(bannerUrl?.trim());



  return (

    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>

      <div>

        <div style={previewLabelStyle}>Desktop (16:9 · max 220px)</div>

        <div style={desktopFrameStyle}>

          {hasImage && bannerActive ? (

            <img src={bannerUrl.trim()} alt="Preview banner desktop" style={desktopImageStyle} />

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

            <img src={bannerUrl.trim()} alt="Preview banner mobile" style={mobileImageStyle} />

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

      }),

    [form.nama_pesantren, form.alamat, form.logo_url, form.banner_url, form.banner_active],

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

                  Branding

                </SectionHeading>



                <div

                  style={{

                    marginTop: "var(--space-4)",

                    padding: "var(--space-4)",

                    borderRadius: "var(--radius-lg)",

                    background: "var(--dark)",

                    border: "1px solid rgba(148, 163, 184, 0.12)",

                  }}

                >

                  <div style={previewLabelStyle}>Preview Sidebar</div>

                  <TenantBrand

                    variant="sidebar"

                    logo={previewDisplay.logo}

                    name={previewDisplay.name}

                    location={previewDisplay.address}

                  />

                </div>



                <FormGrid style={{ marginTop: "var(--space-4)" }}>

                  <FormField label="URL Logo (opsional)" htmlFor="profil-logo" fullWidth>

                    <Input

                      id="profil-logo"

                      value={form.logo_url}

                      onChange={set("logo_url")}

                      placeholder="https://cdn.pesantren.ac.id/logo.png"

                      maxLength={500}

                    />

                  </FormField>

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

                  Banner Pesantren

                </SectionHeading>

                <p

                  style={{

                    marginTop: "var(--space-2)",

                    marginBottom: 0,

                    fontSize: "13px",

                    color: "var(--text-secondary)",

                    lineHeight: 1.5,

                  }}

                >

                  Banner tampil di beranda APK Wali Santri. Rasio 16:9, disarankan min. 1280×720 px.

                </p>



                <div style={{ marginTop: "var(--space-4)" }}>

                  <BannerPreview

                    bannerUrl={form.banner_url}

                    bannerActive={form.banner_active}

                    name={previewDisplay.name}

                    address={previewDisplay.address}

                  />

                </div>



                <FormGrid style={{ marginTop: "var(--space-4)" }}>

                  <FormField label="URL Banner" htmlFor="profil-banner" fullWidth>

                    <Input

                      id="profil-banner"

                      value={form.banner_url}

                      onChange={set("banner_url")}

                      placeholder="https://cdn.pesantren.ac.id/banner.jpg"

                      maxLength={500}

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


