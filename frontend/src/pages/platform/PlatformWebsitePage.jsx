import { useCallback, useEffect, useState } from "react";
import platformApi from "../../services/platformApi";
import PlatformButton from "../../components/platform/PlatformButton";

const DEFAULT_CONTENT = {
  brand: {
    website_name: "KlikPesantren",
    tagline: "Platform administrasi pesantren modern",
    whatsapp: "6281383919797",
    email: "hello@klikpesantren.com",
    instagram: "https://instagram.com/klikpesantren",
  },
  seo: {
    default_title: "KlikPesantren | Platform SaaS Operasional Pesantren Modern",
    default_description:
      "KlikPesantren membantu pesantren mengelola administrasi santri, keuangan, Wali Santri App, RFID, perizinan, pelanggaran, dan dashboard operasional.",
    canonical_base_url: "https://klikpesantren.com",
    og_image_url: "https://klikpesantren.com/landing/dashboard-admin.png",
  },
  homepage: {
    hero_title: "Platform SaaS untuk Operasional Pesantren Modern",
    hero_subtitle:
      "KlikPesantren membantu pesantren mengelola administrasi santri, keuangan, wali santri, RFID, perizinan, pelanggaran, dan dashboard operasional dalam satu sistem terintegrasi.",
    primary_cta_label: "Minta Demo",
    primary_cta_url: "/demo",
    secondary_cta_label: "Daftar Founding Partner",
    secondary_cta_url: "/founding-partner",
  },
  contact: {
    whatsapp: "6281383919797",
    email: "hello@klikpesantren.com",
    instagram: "https://instagram.com/klikpesantren",
  },
};

const sections = [
  {
    title: "Brand",
    description: "Identitas dasar website resmi KlikPesantren.",
    fields: [
      { path: "brand.website_name", label: "Website Name" },
      { path: "brand.tagline", label: "Tagline" },
    ],
  },
  {
    title: "Homepage Hero",
    description: "Konten utama yang tampil pertama kali di halaman beranda.",
    fields: [
      { path: "homepage.hero_title", label: "Hero Title" },
      { path: "homepage.hero_subtitle", label: "Hero Subtitle", type: "textarea" },
    ],
  },
  {
    title: "CTA",
    description: "Tombol utama dan sekunder di homepage.",
    fields: [
      { path: "homepage.primary_cta_label", label: "Primary CTA Label" },
      { path: "homepage.primary_cta_url", label: "Primary CTA URL" },
      { path: "homepage.secondary_cta_label", label: "Secondary CTA Label" },
      { path: "homepage.secondary_cta_url", label: "Secondary CTA URL" },
    ],
  },
  {
    title: "Kontak",
    description: "Kontak resmi yang dipakai website public.",
    fields: [
      { path: "contact.whatsapp", label: "WhatsApp" },
      { path: "contact.email", label: "Email", type: "email" },
      { path: "contact.instagram", label: "Instagram URL" },
    ],
  },
  {
    title: "SEO Basic",
    description: "Disimpan untuk CMS. SEO public tetap memakai fallback static pada Sprint 1.",
    fields: [
      { path: "seo.default_title", label: "Default Title" },
      {
        path: "seo.default_description",
        label: "Default Description",
        type: "textarea",
      },
      { path: "seo.canonical_base_url", label: "Canonical Base URL" },
      { path: "seo.og_image_url", label: "OG Image URL" },
    ],
  },
];

function mergeContent(content = {}) {
  return {
    ...DEFAULT_CONTENT,
    ...content,
    brand: { ...DEFAULT_CONTENT.brand, ...(content.brand || {}) },
    seo: { ...DEFAULT_CONTENT.seo, ...(content.seo || {}) },
    homepage: { ...DEFAULT_CONTENT.homepage, ...(content.homepage || {}) },
    contact: { ...DEFAULT_CONTENT.contact, ...(content.contact || {}) },
  };
}

function getValue(content, path) {
  return path.split(".").reduce((value, key) => value?.[key], content) || "";
}

function setValue(content, path, value) {
  const keys = path.split(".");
  const next = { ...content };
  let cursor = next;

  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      cursor[key] = value;
      return;
    }

    cursor[key] = { ...(cursor[key] || {}) };
    cursor = cursor[key];
  });

  return next;
}

function PlatformWebsitePage() {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [status, setStatus] = useState("draft");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [publishedAt, setPublishedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadContent = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await platformApi.get("/platform/website/content");
      const data = res.data?.data || {};
      setContent(mergeContent(data.content || {}));
      setStatus(data.status || "draft");
      setUpdatedAt(data.updated_at || null);
      setPublishedAt(data.published_at || null);
    } catch (err) {
      setError(err.response?.data?.error || "Gagal memuat konten website");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const updateField = (path, value) => {
    setContent((current) => setValue(current, path, value));
  };

  const saveDraft = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await platformApi.put("/platform/website/content", {
        content,
      });
      const data = res.data?.data || {};
      setContent(mergeContent(data.content || content));
      setStatus(data.status || "draft");
      setUpdatedAt(data.updated_at || null);
      setPublishedAt(data.published_at || null);
      setSuccess("Draft website resmi berhasil disimpan.");
    } catch (err) {
      setError(err.response?.data?.error || "Gagal menyimpan draft website");
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    setPublishing(true);
    setError("");
    setSuccess("");
    try {
      const res = await platformApi.post("/platform/website/publish");
      const data = res.data?.data || {};
      setContent(mergeContent(data.content || content));
      setStatus(data.status || "published");
      setUpdatedAt(data.updated_at || null);
      setPublishedAt(data.published_at || null);
      setSuccess("Konten website resmi berhasil dipublish.");
    } catch (err) {
      setError(err.response?.data?.error || "Gagal publish website");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div>
      <div style={headerStyle}>
        <div>
          <h1 className="platform-page-title">Website Resmi</h1>
          <p className="platform-page-subtitle">
            Edit konten website resmi klikpesantren.com. Layout tetap dari kode,
            konten dari database platform.
          </p>
        </div>
        <div style={statusStyle}>
          <span style={statusBadgeStyle}>{status}</span>
          {publishedAt ? (
            <span>Published {new Date(publishedAt).toLocaleString("id-ID")}</span>
          ) : null}
        </div>
      </div>

      {error ? <div className="theme-alert theme-alert--danger">{error}</div> : null}
      {success ? <div className="theme-alert theme-alert--success">{success}</div> : null}

      <div className="platform-compact-card">
        {loading ? (
          <p className="theme-muted">Memuat konten website...</p>
        ) : (
          <div style={sectionStackStyle}>
            {sections.map((section) => (
              <section key={section.title} style={sectionStyle}>
                <div>
                  <h2 className="theme-section-title">{section.title}</h2>
                  <p className="theme-muted" style={{ marginTop: -4 }}>
                    {section.description}
                  </p>
                </div>

                <div style={formGridStyle}>
                  {section.fields.map((field) => (
                    <label
                      key={field.path}
                      className="theme-field-label"
                      style={field.type === "textarea" ? fullFieldStyle : undefined}
                    >
                      {field.label}
                      {field.type === "textarea" ? (
                        <textarea
                          className="theme-field"
                          value={getValue(content, field.path)}
                          onChange={(event) =>
                            updateField(field.path, event.target.value)
                          }
                          rows={4}
                        />
                      ) : (
                        <input
                          className="theme-field"
                          type={field.type || "text"}
                          value={getValue(content, field.path)}
                          onChange={(event) =>
                            updateField(field.path, event.target.value)
                          }
                        />
                      )}
                    </label>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <div style={actionsStyle}>
          <PlatformButton
            variant="secondary"
            onClick={loadContent}
            disabled={loading || saving || publishing}
          >
            Refresh
          </PlatformButton>
          <PlatformButton
            variant="secondary"
            onClick={saveDraft}
            loading={saving}
            disabled={loading || publishing}
          >
            Simpan Draft
          </PlatformButton>
          <PlatformButton
            variant="primary"
            onClick={publish}
            loading={publishing}
            disabled={loading || saving}
          >
            Publish
          </PlatformButton>
        </div>

        {updatedAt ? (
          <p className="theme-muted" style={{ marginTop: 12, marginBottom: 0, fontSize: 12 }}>
            Terakhir disimpan: {new Date(updatedAt).toLocaleString("id-ID")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 18,
};

const statusStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  color: "var(--text-secondary)",
  fontSize: 12,
};

const statusBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 26,
  padding: "0 10px",
  borderRadius: 999,
  background: "var(--primary-subtle)",
  color: "var(--primary)",
  fontWeight: 800,
  textTransform: "uppercase",
};

const sectionStackStyle = {
  display: "grid",
  gap: 18,
};

const sectionStyle = {
  display: "grid",
  gap: 12,
  paddingBottom: 18,
  borderBottom: "1px solid var(--border)",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 14,
};

const fullFieldStyle = {
  gridColumn: "1 / -1",
};

const actionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 18,
};

export default PlatformWebsitePage;
