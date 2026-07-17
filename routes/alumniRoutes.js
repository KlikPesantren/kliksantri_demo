const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const tenantMiddleware = require("../middleware/tenantMiddleware");
const requirePermission = require("../middleware/requirePermission");

const router = express.Router();
const withTenant = [authMiddleware, tenantMiddleware];

router.get("/", ...withTenant, requirePermission("santri.view"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, s.kelas_id, k.nama_kelas
       FROM alumni a
       LEFT JOIN santri s ON s.id = a.santri_id AND s.tenant_id = a.tenant_id
       LEFT JOIN kelas k ON k.id = s.kelas_id AND k.tenant_id = a.tenant_id
       WHERE a.tenant_id = $1
       ORDER BY COALESCE(a.tahun_lulus, 0) DESC, a.nama ASC`,
      [req.tenantId],
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/", ...withTenant, requirePermission("santri.create"), async (req, res) => {
  try {
    const {
      nama, nis, jenis_kelamin, tahun_masuk, tahun_lulus, angkatan,
      status_kelulusan, kontak, alamat, pekerjaan, catatan,
    } = req.body;
    if (!String(nama || "").trim()) {
      return res.status(400).json({ success: false, error: "Nama alumni wajib diisi" });
    }
    const status = ["lulus", "keluar"].includes(String(status_kelulusan || "lulus"))
      ? String(status_kelulusan || "lulus")
      : "lulus";
    const result = await pool.query(
      `INSERT INTO alumni (
         tenant_id, nama, nis, jenis_kelamin, tahun_masuk, tahun_lulus,
         angkatan, status_kelulusan, kontak, alamat, pekerjaan, catatan
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [req.tenantId, String(nama).trim(), nis || null, jenis_kelamin || null,
        tahun_masuk || null, tahun_lulus || null, angkatan || null, status,
        kontak || null, alamat || null, pekerjaan || null, catatan || null],
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/:id", ...withTenant, requirePermission("santri.update"), async (req, res) => {
  try {
    const {
      nama, nis, jenis_kelamin, tahun_masuk, tahun_lulus, angkatan,
      status_kelulusan, kontak, alamat, pekerjaan, catatan,
    } = req.body;
    if (!String(nama || "").trim()) {
      return res.status(400).json({ success: false, error: "Nama alumni wajib diisi" });
    }
    const status = ["lulus", "keluar"].includes(String(status_kelulusan || "lulus"))
      ? String(status_kelulusan || "lulus")
      : "lulus";
    const result = await pool.query(
      `UPDATE alumni
       SET nama = $1, nis = $2, jenis_kelamin = $3, tahun_masuk = $4,
           tahun_lulus = $5, angkatan = $6, status_kelulusan = $7,
           kontak = $8, alamat = $9, pekerjaan = $10, catatan = $11,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $12 AND tenant_id = $13
       RETURNING *`,
      [String(nama).trim(), nis || null, jenis_kelamin || null,
        tahun_masuk || null, tahun_lulus || null, angkatan || null, status,
        kontak || null, alamat || null, pekerjaan || null, catatan || null,
        req.params.id, req.tenantId],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: "Data alumni tidak ditemukan" });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
