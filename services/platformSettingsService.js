const pool = require("../db");

const DEFAULT_SETTINGS = {
  platform_name: "KlikPesantren",
  tagline: "Sistem Administrasi Pesantren Modern",
  description: "Platform administrasi digital untuk pesantren.",
  logo_url: null,
  support_whatsapp: null,
  support_email: null,
  website_url: null,
  about_text:
    "KlikPesantren membantu pesantren mengelola administrasi santri, keuangan, dan komunikasi wali santri.",
  tutorial_video_url: null,
};

const EDITABLE_KEYS = Object.keys(DEFAULT_SETTINGS);

function normalizeOptionalString(value) {
  if (value == null) return null;
  const str = String(value).trim();
  return str || null;
}

function mergeSettings(raw = {}) {
  const merged = { ...DEFAULT_SETTINGS };
  for (const key of EDITABLE_KEYS) {
    if (raw[key] !== undefined) {
      merged[key] =
        typeof DEFAULT_SETTINGS[key] === "string"
          ? normalizeOptionalString(raw[key])
          : raw[key] ?? null;
    }
  }
  return merged;
}

async function ensureSettingsRow() {
  await pool.query(
    `INSERT INTO platform_settings (id, settings)
     VALUES (1, $1::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [JSON.stringify(DEFAULT_SETTINGS)]
  );
}

async function getPlatformSettings() {
  await ensureSettingsRow();
  const { rows } = await pool.query(
    `SELECT settings, updated_at FROM platform_settings WHERE id = 1`
  );
  const row = rows[0];
  return {
    settings: mergeSettings(row?.settings || {}),
    updated_at: row?.updated_at || null,
  };
}

async function updatePlatformSettings(patch = {}) {
  const current = await getPlatformSettings();
  const next = mergeSettings({ ...current.settings, ...patch });

  const { rows } = await pool.query(
    `UPDATE platform_settings
     SET settings = $1::jsonb, updated_at = NOW()
     WHERE id = 1
     RETURNING settings, updated_at`,
    [JSON.stringify(next)]
  );

  return {
    settings: mergeSettings(rows[0]?.settings || next),
    updated_at: rows[0]?.updated_at || null,
  };
}

module.exports = {
  DEFAULT_SETTINGS,
  EDITABLE_KEYS,
  getPlatformSettings,
  updatePlatformSettings,
};
