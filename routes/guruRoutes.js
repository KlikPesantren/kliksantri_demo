const express        = require("express");
const router         = express.Router();
const pool           = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

// ======================
// GET /guru?q=xxx
// ======================
console.log("GURU ROUTES LOADED");

router.get("/", async (req, res) => {
  try {
    const { q } = req.query;
    let query    = "SELECT * FROM guru";
    const params = [];

    if (q) {
      query += " WHERE nama ILIKE $1 OR jabatan ILIKE $1 OR email ILIKE $1";
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

// ======================
// POST /guru
// Boleh: superadmin, pendidikan
// ======================

router.post("/", authMiddleware, async (req, res) => {
  try {
    const role = req.user?.role;
    if (!["superadmin", "pendidikan"].includes(role)) {
      return res.status(403).json({ success: false, error: "Akses ditolak" });
    }

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
      `INSERT INTO guru (nama, jabatan, nomor_hp, email, alamat, tanggal_masuk, status, catatan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        nama.trim(),
        jabatan       || null,
        nomor_hp      || null,
        email         || null,
        alamat        || null,
        tanggal_masuk || null,
        status        || "Aktif",
        catatan       || null,
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// PUT /guru/:id
// Boleh: superadmin, pendidikan
// ======================

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const role = req.user?.role;
    if (!["superadmin", "pendidikan"].includes(role)) {
      return res.status(403).json({ success: false, error: "Akses ditolak" });
    }

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
       WHERE id = $9
       RETURNING *`,
      [
        nama.trim(),
        jabatan       || null,
        nomor_hp      || null,
        email         || null,
        alamat        || null,
        tanggal_masuk || null,
        status        || "Aktif",
        catatan       || null,
        id,
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

// ======================
// DELETE /guru/:id
// Hanya superadmin
// CATATAN: Hapus fisik hanya jika tidak ada data historis.
// Lebih disarankan gunakan PUT untuk set status = 'Nonaktif'.
// ======================

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const role = req.user?.role;
    if (role !== "superadmin") {
      return res.status(403).json({ success: false, error: "Hanya superadmin yang dapat menghapus data guru" });
    }

    const { id } = req.params;

    const check = await pool.query("SELECT id, nama FROM guru WHERE id = $1", [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Guru tidak ditemukan" });
    }

    await pool.query("DELETE FROM guru WHERE id = $1", [id]);
    res.json({ success: true, message: `Guru "${check.rows[0].nama}" berhasil dihapus` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
