const pool = require("../db");

const STATUSES = new Set(["draft", "published"]);

function normalizeOptionalString(value) {
  if (value == null) return null;
  const str = String(value).trim();
  return str || null;
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    video_url: row.video_url || null,
    target: row.target,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function listPlatformAnnouncements({ status } = {}) {
  const params = [];
  let where = "";

  if (status) {
    where = "WHERE status = $1";
    params.push(status);
  }

  const { rows } = await pool.query(
    `SELECT id, title, body, video_url, target, status, created_at, updated_at
     FROM platform_announcements
     ${where}
     ORDER BY updated_at DESC, id DESC`,
    params
  );

  return rows.map(mapRow);
}

async function getPlatformAnnouncementById(id) {
  const { rows } = await pool.query(
    `SELECT id, title, body, video_url, target, status, created_at, updated_at
     FROM platform_announcements
     WHERE id = $1`,
    [id]
  );
  return mapRow(rows[0]);
}

async function createPlatformAnnouncement(payload = {}) {
  const title = normalizeOptionalString(payload.title);
  const body = normalizeOptionalString(payload.body);
  const video_url = normalizeOptionalString(payload.video_url);
  const status = normalizeOptionalString(payload.status) || "draft";

  if (!title) {
    const err = new Error("Judul pengumuman wajib diisi");
    err.status = 400;
    throw err;
  }
  if (!body) {
    const err = new Error("Isi pengumuman wajib diisi");
    err.status = 400;
    throw err;
  }
  if (!STATUSES.has(status)) {
    const err = new Error("Status harus draft atau published");
    err.status = 400;
    throw err;
  }

  const { rows } = await pool.query(
    `INSERT INTO platform_announcements (title, body, video_url, target, status)
     VALUES ($1, $2, $3, 'all', $4)
     RETURNING id, title, body, video_url, target, status, created_at, updated_at`,
    [title, body, video_url, status]
  );

  return mapRow(rows[0]);
}

async function updatePlatformAnnouncement(id, payload = {}) {
  const existing = await getPlatformAnnouncementById(id);
  if (!existing) {
    const err = new Error("Pengumuman tidak ditemukan");
    err.status = 404;
    throw err;
  }

  const title =
    payload.title !== undefined
      ? normalizeOptionalString(payload.title)
      : existing.title;
  const body =
    payload.body !== undefined
      ? normalizeOptionalString(payload.body)
      : existing.body;
  const video_url =
    payload.video_url !== undefined
      ? normalizeOptionalString(payload.video_url)
      : existing.video_url;
  const status =
    payload.status !== undefined
      ? normalizeOptionalString(payload.status)
      : existing.status;

  if (!title) {
    const err = new Error("Judul pengumuman wajib diisi");
    err.status = 400;
    throw err;
  }
  if (!body) {
    const err = new Error("Isi pengumuman wajib diisi");
    err.status = 400;
    throw err;
  }
  if (!STATUSES.has(status)) {
    const err = new Error("Status harus draft atau published");
    err.status = 400;
    throw err;
  }

  const { rows } = await pool.query(
    `UPDATE platform_announcements
     SET title = $1, body = $2, video_url = $3, status = $4, updated_at = NOW()
     WHERE id = $5
     RETURNING id, title, body, video_url, target, status, created_at, updated_at`,
    [title, body, video_url, status, id]
  );

  return mapRow(rows[0]);
}

async function listPublishedAnnouncementsForTenants() {
  return listPlatformAnnouncements({ status: "published" });
}

module.exports = {
  listPlatformAnnouncements,
  getPlatformAnnouncementById,
  createPlatformAnnouncement,
  updatePlatformAnnouncement,
  listPublishedAnnouncementsForTenants,
};
