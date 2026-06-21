const express = require("express");
const router = express.Router();
const pool = require("../db");
const { assertRecordInTenant } = require("../services/tenantScope");
const notificationService = require("../services/notificationService");

const PUSH_PENGUMUMAN_PRIORITIES = new Set(["penting", "urgent"]);
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id, judul, isi, cover_url, prioritas,
        published_at, expires_at, is_active, created_by, created_at, tenant_id
      FROM pengumuman
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      `,
      [req.tenantId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { judul, isi, cover_url, prioritas, expires_at, is_active } = req.body;

    if (!judul || !isi) {
      return res.status(400).json({
        success: false,
        error: "judul dan isi wajib diisi",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO pengumuman (
        judul, isi, cover_url, prioritas, expires_at, is_active, tenant_id, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        judul,
        isi,
        cover_url ?? null,
        prioritas ?? "normal",
        expires_at ?? null,
        is_active !== undefined ? is_active : true,
        req.tenantId,
        req.user?.id ?? null,
      ]
    );

    const pengumumanRow = result.rows[0];
    const prioritasKey = String(
      pengumumanRow.prioritas || "normal"
    ).toLowerCase();

    if (PUSH_PENGUMUMAN_PRIORITIES.has(prioritasKey)) {
      try {
        await notificationService.sendPushToAllWaliInTenant({
          tenantId: req.tenantId,
          title:
            prioritasKey === "urgent"
              ? "Pengumuman Urgent"
              : "Pengumuman Penting",
          body: pengumumanRow.judul,
          type: "pengumuman",
          data: {
            type: "pengumuman",
            pengumuman_id: Number(pengumumanRow.id),
          },
        });
      } catch (pushErr) {
        console.log("PENGUMUMAN PUSH ERROR:", pushErr.message);
      }
    }

    res.status(201).json({ success: true, data: pengumumanRow });  } catch (err) {
    console.error("PENGUMUMAN INSERT ERROR", err);
    return res.status(500).json({
      success: false,
      error: err.message,
      detail: err.detail,
      code: err.code,
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const owned = await assertRecordInTenant("pengumuman", req.tenantId, id);
    if (!owned.ok) {
      return res.status(404).json({ success: false, error: owned.error });
    }

    const { judul, isi, cover_url, prioritas, expires_at, is_active } = req.body;

    const existing = await pool.query(
      "SELECT * FROM pengumuman WHERE id = $1 AND tenant_id = $2",
      [id, req.tenantId]
    );
    const current = existing.rows[0];
    const nextCoverUrl = Object.prototype.hasOwnProperty.call(req.body, "cover_url")
      ? (cover_url ?? null)
      : current.cover_url;

    const result = await pool.query(
      `
      UPDATE pengumuman
      SET
        judul       = COALESCE($1, judul),
        isi         = COALESCE($2, isi),
        cover_url   = $3,
        prioritas   = COALESCE($4, prioritas),
        expires_at  = $5,
        is_active   = COALESCE($6, is_active)
      WHERE id = $7 AND tenant_id = $8
      RETURNING *
      `,
      [
        judul ?? null,
        isi ?? null,
        nextCoverUrl,
        prioritas ?? null,
        expires_at !== undefined ? expires_at : null,
        is_active !== undefined ? is_active : null,
        id,
        req.tenantId,
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM pengumuman WHERE id = $1 AND tenant_id = $2 RETURNING id",
      [id, req.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Pengumuman tidak ditemukan di tenant ini",
      });
    }

    res.json({ success: true, deleted_id: Number(id) });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
