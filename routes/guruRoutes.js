const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const tenantMiddleware = require("../middleware/tenantMiddleware");
const requirePermission = require("../middleware/requirePermission");

const withTenant = [authMiddleware, tenantMiddleware];

console.log("GURU ROUTES LOADED");

router.get("/", ...withTenant, requirePermission("guru.view"), async (req, res) => {
  try {
    const { q } = req.query;
    let query = "SELECT * FROM guru WHERE tenant_id = $1";
    const params = [req.tenantId];

    if (q) {
      query += " AND (nama ILIKE $2 OR jabatan ILIKE $2 OR email ILIKE $2)";
      params.push(`%${q}%`);
    }

    query += " ORDER BY nama ASC";

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/", ...withTenant, requirePermission("guru.create"), async (req, res) => {
  try {
    const {
      nama,
      jabatan,
      nomor_hp,
      email,
      alamat,
      tanggal_masuk,
      status,
      catatan,
    } = req.body;

    if (!nama || !nama.trim()) {
      return res.status(400).json({ success: false, error: "Nama guru wajib diisi" });
    }

    const result = await pool.query(
      `INSERT INTO guru (
         nama, jabatan, nomor_hp, email, alamat,
         tanggal_masuk, status, catatan, tenant_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        nama.trim(),
        jabatan || null,
        nomor_hp || null,
        email || null,
        alamat || null,
        tanggal_masuk || null,
        status || "Aktif",
        catatan || null,
        req.tenantId,
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/:id", ...withTenant, requirePermission("guru.update"), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nama,
      jabatan,
      nomor_hp,
      email,
      alamat,
      tanggal_masuk,
      status,
      catatan,
    } = req.body;

    if (!nama || !nama.trim()) {
      return res.status(400).json({ success: false, error: "Nama guru wajib diisi" });
    }

    const result = await pool.query(
      `UPDATE guru
       SET nama          = $1,
           jabatan       = $2,
           nomor_hp      = $3,
           email         = $4,
           alamat        = $5,
           tanggal_masuk = $6,
           status        = $7,
           catatan       = $8
       WHERE id = $9 AND tenant_id = $10
       RETURNING *`,
      [
        nama.trim(),
        jabatan || null,
        nomor_hp || null,
        email || null,
        alamat || null,
        tanggal_masuk || null,
        status || "Aktif",
        catatan || null,
        id,
        req.tenantId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Guru tidak ditemukan" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/:id", ...withTenant, requirePermission("guru.delete"), async (req, res) => {
  try {
    const { id } = req.params;

    const check = await pool.query(
      "SELECT id, nama FROM guru WHERE id = $1 AND tenant_id = $2",
      [id, req.tenantId]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Guru tidak ditemukan" });
    }

    await pool.query("DELETE FROM guru WHERE id = $1 AND tenant_id = $2", [id, req.tenantId]);
    res.json({ success: true, message: `Guru "${check.rows[0].nama}" berhasil dihapus` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
