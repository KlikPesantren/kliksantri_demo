const express = require("express");
const pool = require("../db");
const {
  assertSantriInTenant,
  assertRecordInTenant,
} = require("../services/tenantScope");

const notificationService = require("../services/notificationService");

const router = express.Router();

const STATUS_KESEHATAN = new Set(["sehat", "sakit"]);
const STATUS_PENANGANAN = new Set([
  "observasi",
  "istirahat",
  "sudah_berobat",
  "pulang",
  "rawat_lanjut",
]);

const PENANGANAN_FOLLOW_UP = new Set(["observasi", "istirahat"]);

function canManage(req) {
  const role = req.user?.role;
  if (role === "superadmin" || role === "keamanan") return true;
  return false;
}

function validatePayload(body, { partial = false } = {}) {
  const {
    santri_id,
    status_kesehatan,
    keluhan,
    tindakan_pertama,
    status_penanganan,
  } = body;

  if (!partial && !santri_id) {
    return "santri_id wajib diisi";
  }

  if (status_kesehatan !== undefined && !STATUS_KESEHATAN.has(status_kesehatan)) {
    return "status_kesehatan tidak valid";
  }

  if (
    status_penanganan !== undefined &&
    !STATUS_PENANGANAN.has(status_penanganan)
  ) {
    return "status_penanganan tidak valid";
  }

  const status = status_kesehatan ?? "sehat";

  if (status === "sakit") {
    const k = keluhan ?? "";
    const t = tindakan_pertama ?? "";
    if (!partial || keluhan !== undefined || tindakan_pertama !== undefined) {
      if (!String(k).trim()) return "keluhan wajib diisi jika status sakit";
      if (!String(t).trim()) {
        return "tindakan_pertama wajib diisi jika status sakit";
      }
    }
  }

  return null;
}

router.get("/stats/hari-ini", async (req, res) => {
  try {
    const result = await pool.query(
      `
      WITH latest AS (
        SELECT DISTINCT ON (ks.santri_id)
          ks.santri_id,
          ks.status_kesehatan,
          ks.status_penanganan
        FROM kesehatan_santri ks
        INNER JOIN santri s ON s.id = ks.santri_id AND s.tenant_id = ks.tenant_id
        WHERE ks.tenant_id = $1
        ORDER BY ks.santri_id, ks.created_at DESC
      ),
      santri_aktif AS (
        SELECT COUNT(*)::int AS total FROM santri WHERE tenant_id = $1
      )
      SELECT
        (SELECT total FROM santri_aktif) AS total_santri,
        COUNT(*) FILTER (WHERE l.status_kesehatan = 'sakit')::int AS sakit,
        COUNT(*) FILTER (
          WHERE l.status_kesehatan = 'sakit'
            AND l.status_penanganan = ANY($2::text[])
        )::int AS perlu_tindak_lanjut
      FROM latest l
      `,
      [req.tenantId, [...PENANGANAN_FOLLOW_UP]]
    );

    const row = result.rows[0] || {};
    const total = Number(row.total_santri || 0);
    const sakit = Number(row.sakit || 0);
    const perlu = Number(row.perlu_tindak_lanjut || 0);
    const sehat = Math.max(total - sakit, 0);

    res.json({
      success: true,
      data: {
        sehat,
        sakit,
        perlu_tindak_lanjut: perlu,
        total_santri: total,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const offset = (page - 1) * limit;
    const search = String(req.query.search || "").trim();
    const statusFilter = String(req.query.status_kesehatan || "").trim();

    const conditions = ["k.tenant_id = $1"];
    const params = [req.tenantId];
    let i = 2;

    if (search) {
      conditions.push(`s.nama ILIKE $${i}`);
      params.push(`%${search}%`);
      i += 1;
    }

    if (statusFilter && STATUS_KESEHATAN.has(statusFilter)) {
      conditions.push(`k.status_kesehatan = $${i}`);
      params.push(statusFilter);
      i += 1;
    }

    const where = `WHERE ${conditions.join(" AND ")}`;

    const countResult = await pool.query(
      `
      SELECT COUNT(*)::int AS total
      FROM kesehatan_santri k
      LEFT JOIN santri s ON s.id = k.santri_id AND s.tenant_id = k.tenant_id
      ${where}
      `,
      params
    );

    const dataResult = await pool.query(
      `
      SELECT k.*, s.nama AS nama_santri
      FROM kesehatan_santri k
      LEFT JOIN santri s ON s.id = k.santri_id AND s.tenant_id = k.tenant_id
      ${where}
      ORDER BY k.created_at DESC
      LIMIT $${i} OFFSET $${i + 1}
      `,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total: countResult.rows[0]?.total || 0,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `
      SELECT k.*, s.nama AS nama_santri
      FROM kesehatan_santri k
      LEFT JOIN santri s ON s.id = k.santri_id AND s.tenant_id = k.tenant_id
      WHERE k.id = $1 AND k.tenant_id = $2
      `,
      [id, req.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Data kesehatan tidak ditemukan",
      });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/", async (req, res) => {
  if (!canManage(req)) {
    return res.status(403).json({ success: false, error: "Akses ditolak" });
  }

  try {
    const errorMsg = validatePayload(req.body);
    if (errorMsg) {
      return res.status(400).json({ success: false, error: errorMsg });
    }

    const {
      santri_id,
      status_kesehatan = "sehat",
      keluhan,
      tindakan_pertama,
      status_penanganan = "observasi",
    } = req.body;

    const santriCheck = await assertSantriInTenant(req.tenantId, santri_id);
    if (!santriCheck.ok) {
      return res.status(400).json({ success: false, error: santriCheck.error });
    }

    const result = await pool.query(
      `
      INSERT INTO kesehatan_santri (
        santri_id, status_kesehatan, keluhan, tindakan_pertama,
        status_penanganan, created_by, tenant_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        santri_id,
        status_kesehatan,
        keluhan?.trim() || null,
        tindakan_pertama?.trim() || null,
        status_penanganan,
        req.user?.id ?? null,
        req.tenantId,
      ]
    );

    const kesehatanRow = result.rows[0];

    if (kesehatanRow.status_kesehatan === "sakit") {
      try {
        await notificationService.sendPushToWaliBySantriId({
          tenantId: req.tenantId,
          santriId: kesehatanRow.santri_id,
          title: "Kesehatan Santri",
          type: "kesehatan",
          data: {
            type: "kesehatan",
            santri_id: Number(kesehatanRow.santri_id),
          },
        });
      } catch (pushErr) {
        console.log("KESEHATAN PUSH ERROR:", pushErr.message);
      }
    }

    res.status(201).json({ success: true, data: kesehatanRow });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  if (!canManage(req)) {
    return res.status(403).json({ success: false, error: "Akses ditolak" });
  }

  try {
    const { id } = req.params;
    const existing = await pool.query(
      "SELECT * FROM kesehatan_santri WHERE id = $1 AND tenant_id = $2",
      [id, req.tenantId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Data kesehatan tidak ditemukan",
      });
    }

    const merged = { ...existing.rows[0], ...req.body };
    const errorMsg = validatePayload(merged, { partial: true });
    if (errorMsg) {
      return res.status(400).json({ success: false, error: errorMsg });
    }

    const {
      santri_id,
      status_kesehatan,
      keluhan,
      tindakan_pertama,
      status_penanganan,
    } = req.body;

    if (santri_id !== undefined && santri_id !== null) {
      const santriCheck = await assertSantriInTenant(req.tenantId, santri_id);
      if (!santriCheck.ok) {
        return res.status(400).json({ success: false, error: santriCheck.error });
      }
    }

    const result = await pool.query(
      `
      UPDATE kesehatan_santri
      SET
        santri_id = COALESCE($1, santri_id),
        status_kesehatan = COALESCE($2, status_kesehatan),
        keluhan = COALESCE($3, keluhan),
        tindakan_pertama = COALESCE($4, tindakan_pertama),
        status_penanganan = COALESCE($5, status_penanganan),
        updated_at = NOW()
      WHERE id = $6 AND tenant_id = $7
      RETURNING *
      `,
      [
        santri_id ?? null,
        status_kesehatan ?? null,
        keluhan !== undefined ? (keluhan?.trim() || null) : null,
        tindakan_pertama !== undefined
          ? (tindakan_pertama?.trim() || null)
          : null,
        status_penanganan ?? null,
        id,
        req.tenantId,
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  if (!canManage(req)) {
    return res.status(403).json({ success: false, error: "Akses ditolak" });
  }

  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM kesehatan_santri WHERE id = $1 AND tenant_id = $2 RETURNING id",
      [id, req.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Data kesehatan tidak ditemukan",
      });
    }

    res.json({ success: true, deleted_id: Number(id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
