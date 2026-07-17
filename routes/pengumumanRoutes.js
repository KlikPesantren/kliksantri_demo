const express = require("express");
const router = express.Router();
const pool = require("../db");
const { assertRecordInTenant } = require("../services/tenantScope");
const notificationService = require("../services/notificationService");
const { getScopedUnitIds } = require("../middleware/dataUnitScope");

function buildPengumumanNotificationTitle(prioritas) {
  const key = String(prioritas || "normal").trim().toLowerCase();
  if (key === "urgent") return "Pengumuman Urgent";
  if (key === "penting") return "Pengumuman Penting";
  return "Pengumuman Baru";
}

async function sendPengumumanNotification({ tenantId, pengumuman }) {
  if (!pengumuman?.is_active) return;

  try {
    const notifResult = await notificationService.sendInAppToAllWaliInTenant({
      tenantId,
      title: buildPengumumanNotificationTitle(pengumuman.prioritas),
      body: pengumuman.judul,
      type: "pengumuman",
      data: {
        type: "pengumuman",
        pengumuman_id: Number(pengumuman.id),
        ref_table: "pengumuman",
        ref_id: Number(pengumuman.id),
      },
    });
    console.log("PENGUMUMAN IN-APP NOTIFICATION RESULT:", notifResult);
  } catch (notifErr) {
    console.log("PENGUMUMAN IN-APP NOTIFICATION ERROR:", notifErr.message);
  }
}

router.get("/", async (req, res) => {
  try {
    const scopedUnitIds = await getScopedUnitIds(req);
    const result = await pool.query(
      `
      SELECT
        id, judul, isi, cover_url, prioritas, unit_id,
        published_at, expires_at, is_active, created_by, created_at, tenant_id
      FROM pengumuman
      WHERE tenant_id = $1
        AND ($2::int[] IS NULL OR unit_id = ANY($2::int[]))
      ORDER BY created_at DESC
      `,
      [req.tenantId, scopedUnitIds]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { judul, isi, cover_url, prioritas, expires_at, is_active, unit_id } = req.body;
    const unitValue = unit_id || (await pool.query(
      `SELECT id FROM unit_pendidikan WHERE tenant_id = $1 AND UPPER(kode) = 'PESANTREN' AND is_active = true`,
      [req.tenantId],
    )).rows[0]?.id;
    const unitCheck = await pool.query(
      `SELECT id FROM unit_pendidikan WHERE id = $1 AND tenant_id = $2 AND is_active = true`,
      [unitValue, req.tenantId],
    );
    if (unitCheck.rows.length === 0) return res.status(400).json({ success: false, error: "Unit pendidikan tidak valid" });

    if (!judul || !isi) {
      return res.status(400).json({
        success: false,
        error: "judul dan isi wajib diisi",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO pengumuman (
        judul, isi, cover_url, prioritas, expires_at, is_active, tenant_id, created_by, unit_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
        unitValue,
      ]
    );

    const pengumumanRow = result.rows[0];

    res.status(201).json({ success: true, data: pengumumanRow });

    setImmediate(() => {
      sendPengumumanNotification({
        tenantId: req.tenantId,
        pengumuman: pengumumanRow,
      });
    });
  } catch (err) {
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

    const existing = await pool.query(
      "SELECT * FROM pengumuman WHERE id = $1 AND tenant_id = $2",
      [id, req.tenantId]
    );
    const current = existing.rows[0];
    const { judul, isi, cover_url, prioritas, expires_at, is_active, unit_id } = req.body;
    const scopedUnitIds = await getScopedUnitIds(req);
    if (scopedUnitIds && !scopedUnitIds.includes(Number(current?.unit_id))) {
      return res.status(403).json({ success: false, error: "Pengumuman berada di luar unit operator" });
    }
    const nextUnitId = unit_id ?? current?.unit_id;
    const unitCheck = await pool.query(
      `SELECT id FROM unit_pendidikan WHERE id = $1 AND tenant_id = $2 AND is_active = true`,
      [nextUnitId, req.tenantId],
    );
    if (unitCheck.rows.length === 0) return res.status(400).json({ success: false, error: "Unit pendidikan tidak valid" });
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
        is_active   = COALESCE($6, is_active),
        unit_id     = $7
      WHERE id = $8 AND tenant_id = $9
      RETURNING *
      `,
      [
        judul ?? null,
        isi ?? null,
        nextCoverUrl,
        prioritas ?? null,
        expires_at !== undefined ? expires_at : null,
        is_active !== undefined ? is_active : null,
        nextUnitId,
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
