const pool = require("../db");

const DEFAULT_WEBSITE_CONTENT = {
  brand: {
    website_name: "KlikPesantren",
    tagline: "Platform administrasi pesantren modern",
    logo_url: "/landing/logo.png",
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

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeDeep(defaults, value) {
  if (!isPlainObject(defaults)) {
    return value === undefined ? defaults : value;
  }

  const source = isPlainObject(value) ? value : {};
  const merged = { ...defaults };

  for (const [key, defaultValue] of Object.entries(defaults)) {
    merged[key] = mergeDeep(defaultValue, source[key]);
  }

  for (const [key, sourceValue] of Object.entries(source)) {
    if (merged[key] === undefined) {
      merged[key] = sourceValue;
    }
  }

  return merged;
}

function normalizeContent(content) {
  return mergeDeep(DEFAULT_WEBSITE_CONTENT, content || {});
}

async function ensureWebsiteSettingsRow() {
  await pool.query(
    `INSERT INTO platform_website_settings (
       id,
       content,
       published_content,
       status,
       updated_at,
       published_at
     )
     VALUES (1, $1::jsonb, $1::jsonb, 'published', NOW(), NOW())
     ON CONFLICT (id) DO NOTHING`,
    [JSON.stringify(DEFAULT_WEBSITE_CONTENT)]
  );
}

async function getWebsiteSettingsForPlatform() {
  await ensureWebsiteSettingsRow();

  const { rows } = await pool.query(
    `SELECT
       content,
       published_content,
       status,
       updated_by,
       published_by,
       updated_at,
       published_at
     FROM platform_website_settings
     WHERE id = 1`
  );

  const row = rows[0] || {};

  return {
    content: normalizeContent(row.content),
    published_content: row.published_content
      ? normalizeContent(row.published_content)
      : null,
    status: row.status || "draft",
    updated_by: row.updated_by || null,
    published_by: row.published_by || null,
    updated_at: row.updated_at || null,
    published_at: row.published_at || null,
  };
}

async function getPublishedWebsiteContent() {
  const settings = await getWebsiteSettingsForPlatform();
  return {
    content: normalizeContent(settings.published_content || settings.content),
    updated_at: settings.updated_at,
    published_at: settings.published_at,
  };
}

async function updateWebsiteDraft(content, userId) {
  if (!isPlainObject(content)) {
    const err = new Error("Content website harus berupa object");
    err.status = 400;
    throw err;
  }

  await ensureWebsiteSettingsRow();
  const nextContent = normalizeContent(content);

  const { rows } = await pool.query(
    `UPDATE platform_website_settings
     SET
       content = $1::jsonb,
       status = 'draft',
       updated_by = $2,
       updated_at = NOW()
     WHERE id = 1
     RETURNING
       content,
       published_content,
       status,
       updated_by,
       published_by,
       updated_at,
       published_at`,
    [JSON.stringify(nextContent), userId || null]
  );

  const row = rows[0] || {};

  return {
    content: normalizeContent(row.content),
    published_content: row.published_content
      ? normalizeContent(row.published_content)
      : null,
    status: row.status || "draft",
    updated_by: row.updated_by || null,
    published_by: row.published_by || null,
    updated_at: row.updated_at || null,
    published_at: row.published_at || null,
  };
}

async function publishWebsiteContent(userId) {
  await ensureWebsiteSettingsRow();

  const { rows } = await pool.query(
    `UPDATE platform_website_settings
     SET
       published_content = content,
       status = 'published',
       published_by = $1,
       published_at = NOW(),
       updated_at = NOW()
     WHERE id = 1
     RETURNING
       content,
       published_content,
       status,
       updated_by,
       published_by,
       updated_at,
       published_at`,
    [userId || null]
  );

  const row = rows[0] || {};

  return {
    content: normalizeContent(row.content),
    published_content: row.published_content
      ? normalizeContent(row.published_content)
      : null,
    status: row.status || "published",
    updated_by: row.updated_by || null,
    published_by: row.published_by || null,
    updated_at: row.updated_at || null,
    published_at: row.published_at || null,
  };
}

module.exports = {
  DEFAULT_WEBSITE_CONTENT,
  getPublishedWebsiteContent,
  getWebsiteSettingsForPlatform,
  publishWebsiteContent,
  updateWebsiteDraft,
};
