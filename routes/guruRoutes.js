const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const tenantMiddleware = require("../middleware/tenantMiddleware");
const requirePermission = require("../middleware/requirePermission");
const { getScopedUnitIds } = require("../middleware/dataUnitScope");

const withTenant = [authMiddleware, tenantMiddleware];

console.log("GURU ROUTES LOADED");

router.get("/", ...withTenant, requirePermission("guru.view"), async (req, res) => {
  try {
    const { q } = req.query;
    const scopedUnitIds = await getScopedUnitIds(req);
    let query = `SELECT guru.*, u.kode AS unit_kode, u.nama AS unit_nama
                 FROM guru
                 INNER JOIN unit_pendidikan u ON u.id = guru.unit_id AND u.tenant_id = guru.tenant_id
                 WHERE guru.tenant_id = $1`;
    const params = [req.tenantId];
    if (scopedUnitIds) {
      query += " AND guru.unit_id = ANY($2::int[])";
      params.push(scopedUnitIds);
    }

    if (q) {
      const index = params.length + 1;
      query += ` AND (guru.nama ILIKE $${index} OR guru.jabatan ILIKE $${index} OR guru.email ILIKE $${index})`;
      params.push(`%${q}%`);
    }

    query += " ORDER BY guru.nama ASC";

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
      unit_id,
    } = req.body;

    if (!nama || !nama.trim()) {
      return res.status(400).json({ success: false, error: "Nama guru wajib diisi" });
    }

    const unitValue = unit_id || (await pool.query(
      `SELECT id FROM unit_pendidikan WHERE tenant_id = $1 AND UPPER(kode) = 'PESANTREN' AND is_active = true`,
      [req.tenantId],
    )).rows[0]?.id;
    const unit = await pool.query(
      `SELECT id FROM unit_pendidikan WHERE id = $1 AND tenant_id = $2 AND is_active = true`,
      [unitValue, req.tenantId],
    );
    if (unit.rows.length === 0) {
      return res.status(400).json({ success: false, error: "Unit pendidikan tidak valid" });
    }
    const scopedUnitIds = await getScopedUnitIds(req);
    if (scopedUnitIds && !scopedUnitIds.includes(Number(unitValue))) {
      return res.status(403).json({ success: false, error: "Unit berada di luar scope operator" });
    }

    const result = await pool.query(
      `INSERT INTO guru (
         nama, jabatan, nomor_hp, email, alamat,
         tanggal_masuk, status, catatan, tenant_id, unit_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
        unitValue,
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
      unit_id,
    } = req.body;

    if (!nama || !nama.trim()) {
      return res.status(400).json({ success: false, error: "Nama guru wajib diisi" });
    }

    const unitValue = unit_id || (await pool.query(
      `SELECT id FROM unit_pendidikan WHERE tenant_id = $1 AND UPPER(kode) = 'PESANTREN' AND is_active = true`,
      [req.tenantId],
    )).rows[0]?.id;
    const unit = await pool.query(
      `SELECT id FROM unit_pendidikan WHERE id = $1 AND tenant_id = $2 AND is_active = true`,
      [unitValue, req.tenantId],
    );
    if (unit.rows.length === 0) {
      return res.status(400).json({ success: false, error: "Unit pendidikan tidak valid" });
    }
    const scopedUnitIds = await getScopedUnitIds(req);
    if (scopedUnitIds && !scopedUnitIds.includes(Number(unitValue))) {
      return res.status(403).json({ success: false, error: "Unit berada di luar scope operator" });
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
           catatan       = $8,
           unit_id       = $9
       WHERE id = $10 AND tenant_id = $11
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
        unitValue,
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
