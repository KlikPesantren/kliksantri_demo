-- CMS Website Resmi KlikPesantren
-- Layout tetap dari kode, konten website resmi disimpan sebagai JSONB.

CREATE TABLE IF NOT EXISTS platform_website_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_content JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  updated_by INT REFERENCES users(id) ON DELETE SET NULL,
  published_by INT REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  CONSTRAINT platform_website_settings_status_check
    CHECK (status IN ('draft', 'published'))
);

INSERT INTO platform_website_settings (
  id,
  content,
  published_content,
  status,
  updated_at,
  published_at
)
VALUES (
  1,
  '{
    "brand": {
      "website_name": "KlikPesantren",
      "tagline": "Platform administrasi pesantren modern",
      "logo_url": "/landing/logo.png",
      "whatsapp": "6281383919797",
      "email": "hello@klikpesantren.com",
      "instagram": "https://instagram.com/klikpesantren"
    },
    "seo": {
      "default_title": "KlikPesantren | Platform SaaS Operasional Pesantren Modern",
      "default_description": "KlikPesantren membantu pesantren mengelola administrasi santri, keuangan, Wali Santri App, RFID, perizinan, pelanggaran, dan dashboard operasional.",
      "canonical_base_url": "https://klikpesantren.com",
      "og_image_url": "https://klikpesantren.com/landing/dashboard-admin.png"
    },
    "homepage": {
      "hero_title": "Platform SaaS untuk Operasional Pesantren Modern",
      "hero_subtitle": "KlikPesantren membantu pesantren mengelola administrasi santri, keuangan, wali santri, RFID, perizinan, pelanggaran, dan dashboard operasional dalam satu sistem terintegrasi.",
      "primary_cta_label": "Minta Demo",
      "primary_cta_url": "/demo",
      "secondary_cta_label": "Daftar Founding Partner",
      "secondary_cta_url": "/founding-partner"
    },
    "contact": {
      "whatsapp": "6281383919797",
      "email": "hello@klikpesantren.com",
      "instagram": "https://instagram.com/klikpesantren"
    }
  }'::jsonb,
  '{
    "brand": {
      "website_name": "KlikPesantren",
      "tagline": "Platform administrasi pesantren modern",
      "logo_url": "/landing/logo.png",
      "whatsapp": "6281383919797",
      "email": "hello@klikpesantren.com",
      "instagram": "https://instagram.com/klikpesantren"
    },
    "seo": {
      "default_title": "KlikPesantren | Platform SaaS Operasional Pesantren Modern",
      "default_description": "KlikPesantren membantu pesantren mengelola administrasi santri, keuangan, Wali Santri App, RFID, perizinan, pelanggaran, dan dashboard operasional.",
      "canonical_base_url": "https://klikpesantren.com",
      "og_image_url": "https://klikpesantren.com/landing/dashboard-admin.png"
    },
    "homepage": {
      "hero_title": "Platform SaaS untuk Operasional Pesantren Modern",
      "hero_subtitle": "KlikPesantren membantu pesantren mengelola administrasi santri, keuangan, wali santri, RFID, perizinan, pelanggaran, dan dashboard operasional dalam satu sistem terintegrasi.",
      "primary_cta_label": "Minta Demo",
      "primary_cta_url": "/demo",
      "secondary_cta_label": "Daftar Founding Partner",
      "secondary_cta_url": "/founding-partner"
    },
    "contact": {
      "whatsapp": "6281383919797",
      "email": "hello@klikpesantren.com",
      "instagram": "https://instagram.com/klikpesantren"
    }
  }'::jsonb,
  'published',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;
