-- MT-15: Platform settings (branding) + platform announcements

CREATE TABLE IF NOT EXISTS platform_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO platform_settings (id, settings)
VALUES (
  1,
  '{
    "platform_name": "KlikSantri",
    "tagline": "Sistem Administrasi Pesantren Modern",
    "description": "Platform administrasi digital untuk pesantren.",
    "logo_url": null,
    "support_whatsapp": null,
    "support_email": null,
    "website_url": null,
    "about_text": "KlikSantri membantu pesantren mengelola administrasi santri, keuangan, dan komunikasi wali santri.",
    "tutorial_video_url": null
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS platform_announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  video_url TEXT,
  target VARCHAR(20) NOT NULL DEFAULT 'all',
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT platform_announcements_status_check
    CHECK (status IN ('draft', 'published')),
  CONSTRAINT platform_announcements_target_check
    CHECK (target IN ('all'))
);

CREATE INDEX IF NOT EXISTS idx_platform_announcements_status
  ON platform_announcements (status, updated_at DESC);
