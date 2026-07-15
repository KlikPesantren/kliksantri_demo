const express = require("express");
const pool = require("../db");
const requirePermission = require("../middleware/requirePermission");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const kelasId = req.query.kelas_id ? Number(req.query.kelas_id) : null;
    const result = await pool.query(
      `SELECT mp.id, mp.nama, mp.aktif,
              CASE WHEN $2::int IS NULL THEN false ELSE EXISTS (
                SELECT 1 FROM kelas_mata_pelajaran kmp
                WHERE kmp.mata_pelajaran_id = mp.id
                  AND kmp.kelas_id = $2
                  AND kmp.tenant_id = $1
              ) END AS ditugaskan
       FROM mata_pelajaran mp
       WHERE mp.tenant_id = $1 AND mp.aktif = true
       ORDER BY mp.nama ASC`,
      [req.tenantId, kelasId],
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/", requirePermission("nilai.manage"), async (req, res) => {
  try {
    const nama = String(req.body?.nama || "").trim();
    if (!nama || nama.length > 120) {
      return res.status(400).json({ success: false, error: "Nama mata pelajaran wajib diisi" });
    }
    const result = await pool.query(
      `INSERT INTO mata_pelajaran (tenant_id, nama)
       VALUES ($1, $2)
       ON CONFLICT (tenant_id, nama) DO UPDATE SET aktif = true
       RETURNING *`,
      [req.tenantId, nama],
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/assign", requirePermission("nilai.manage"), async (req, res) => {
  try {
    const kelasId = Number(req.body?.kelas_id);
    const mapelId = Number(req.body?.mata_pelajaran_id);
    if (!Number.isInteger(kelasId) || !Number.isInteger(mapelId)) {
      return res.status(400).json({ success: false, error: "Kelas dan mata pelajaran wajib dipilih" });
    }
    const result = await pool.query(
      `INSERT INTO kelas_mata_pelajaran (tenant_id, kelas_id, mata_pelajaran_id, urutan)
       SELECT $1, k.id, mp.id,
              COALESCE((SELECT MAX(urutan) + 1 FROM kelas_mata_pelajaran WHERE tenant_id = $1 AND kelas_id = k.id), 1)
       FROM kelas k JOIN mata_pelajaran mp ON mp.id = $3 AND mp.tenant_id = $1
       WHERE k.id = $2 AND k.tenant_id = $1
       ON CONFLICT (tenant_id, kelas_id, mata_pelajaran_id) DO NOTHING
       RETURNING *`,
      [req.tenantId, kelasId, mapelId],
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: "Kelas atau mapel tidak ditemukan" });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/assign/:kelasId/:mapelId", requirePermission("nilai.manage"), async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM kelas_mata_pelajaran
       WHERE tenant_id = $1 AND kelas_id = $2 AND mata_pelajaran_id = $3
       RETURNING id`,
      [req.tenantId, Number(req.params.kelasId), Number(req.params.mapelId)],
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: "Mapel belum ditugaskan" });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
