const express = require("express");
const pool = require("../db");
const { assertRecordInTenant } = require("../services/tenantScope");
const requirePermission = require("../middleware/requirePermission");

const router = express.Router();

const ALLOWED_TYPES = new Set([
  "youtube",
  "website",
  "whatsapp",
  "live",
  "form",
  "donation",
  "pdf",
  "drive",
  "instagram",
  "facebook",
  "tiktok",
  "telegram",
  "other",
]);

function isSafeUrl(value) {
  const url = String(value || "").trim();
  if (!url) return false;

  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return true;
    if (parsed.protocol === "whatsapp:") return true;
    return false;
  } catch {
    return false;
  }
}

function isHttpUrl(value) {
  try {
    const parsed = new URL(String(value || "").trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeType(value) {
  const type = String(value || "other").trim().toLowerCase();
  return ALLOWED_TYPES.has(type) ? type : "other";
}

function normalizePayload(body = {}, { partial = false } = {}) {
  const has = (key) => Object.prototype.hasOwnProperty.call(body, key);
  const title = has("title") ? String(body.title || "").trim() : undefined;
  const url = has("url") ? String(body.url || "").trim() : undefined;

  if (!partial || has("title")) {
    if (!title) {
      const err = new Error("Judul tautan wajib diisi");
      err.status = 400;
      throw err;
    }
  }

  if (!partial || has("url")) {
    if (!isSafeUrl(url)) {
      const err = new Error("URL harus valid dan memakai http, https, atau whatsapp");
      err.status = 400;
      throw err;
    }
  }

  if (has("thumbnail_url") && body.thumbnail_url && !isHttpUrl(body.thumbnail_url)) {
    const err = new Error("Thumbnail URL harus valid dan memakai http atau https");
    err.status = 400;
    throw err;
  }

  const payload = {};
  if (has("title")) payload.title = title;
  if (has("description")) payload.description = String(body.description || "").trim() || null;
  if (has("url")) payload.url = url;
  if (has("type")) payload.type = normalizeType(body.type);
  if (has("thumbnail_url")) {
    payload.thumbnail_url = String(body.thumbnail_url || "").trim() || null;
  }
  if (has("is_active")) payload.is_active = body.is_active !== false;
  if (has("sort_order")) payload.sort_order = Number.parseInt(body.sort_order, 10) || 0;
  return payload;
}

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT *
       FROM wali_home_links
       WHERE tenant_id = $1
       ORDER BY sort_order ASC, id ASC`,
      [req.tenantId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("[wali-home-links list]", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/", requirePermission("pengumuman.manage"), async (req, res) => {
  try {
    const payload = normalizePayload({
      ...req.body,
      title: req.body?.title,
      url: req.body?.url,
    });
    const { rows } = await pool.query(
      `INSERT INTO wali_home_links (
         tenant_id, title, description, url, type, thumbnail_url, is_active, sort_order
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.tenantId,
        payload.title,
        payload.description,
        payload.url,
        payload.type || "other",
        payload.thumbnail_url,
        payload.is_active !== undefined ? payload.is_active : true,
        payload.sort_order || 0,
      ]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("[wali-home-links create]", err);
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

router.put("/:id", requirePermission("pengumuman.manage"), async (req, res) => {
  try {
    const owned = await assertRecordInTenant("wali_home_links", req.tenantId, req.params.id);
    if (!owned.ok) {
      return res.status(404).json({ success: false, error: owned.error });
    }

    const payload = normalizePayload(req.body, { partial: true });
    const has = (key) => Object.prototype.hasOwnProperty.call(payload, key);
    const { rows } = await pool.query(
      `UPDATE wali_home_links
       SET title = COALESCE($1, title),
           description = CASE WHEN $2::boolean THEN $3 ELSE description END,
           url = COALESCE($4, url),
           type = COALESCE($5, type),
           thumbnail_url = CASE WHEN $6::boolean THEN $7 ELSE thumbnail_url END,
           is_active = COALESCE($8, is_active),
           sort_order = COALESCE($9, sort_order),
           updated_at = NOW()
       WHERE id = $10 AND tenant_id = $11
       RETURNING *`,
      [
        has("title") ? payload.title : null,
        has("description"),
        has("description") ? payload.description : null,
        payload.url ?? null,
        payload.type ?? null,
        has("thumbnail_url"),
        has("thumbnail_url") ? payload.thumbnail_url : null,
        payload.is_active,
        payload.sort_order,
        req.params.id,
        req.tenantId,
      ]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("[wali-home-links update]", err);
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

router.delete("/:id", requirePermission("pengumuman.manage"), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `DELETE FROM wali_home_links
       WHERE id = $1 AND tenant_id = $2
       RETURNING id`,
      [req.params.id, req.tenantId]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, error: "Tautan tidak ditemukan" });
    }
    res.json({ success: true, deleted_id: Number(req.params.id) });
  } catch (err) {
    console.error("[wali-home-links delete]", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
