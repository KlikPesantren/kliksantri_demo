const express = require("express");
const multer = require("multer");
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const tenantMiddleware = require("../middleware/tenantMiddleware");
const requirePermission = require("../middleware/requirePermission");
const { assertKelasInTenant } = require("../services/tenantScope");
const { syncWaliFromSantri } = require("../services/waliSyncService");
const {
  buildTemplateWorkbook,
  previewImport,
  commitImport,
} = require("../services/santriImportService");

const router = express.Router();
const withTenant = [authMiddleware, tenantMiddleware];

const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const name = String(file.originalname || "").toLowerCase();
    if (!name.endsWith(".xlsx")) {
      return cb(new Error("Format file harus .xlsx"));
    }
    cb(null, true);
  },
});

const withImportAuth = [
  ...withTenant,
  requirePermission("santri.create"),
];

router.get("/import/template", ...withImportAuth, (_req, res) => {
  try {
    const buffer = buildTemplateWorkbook();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="template_import_santri.xlsx"'
    );
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/import/preview", ...withImportAuth, (req, res) => {
  importUpload.single("file")(req, res, async (err) => {
    if (err) {
      const message =
        err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE"
          ? "Ukuran file maksimal 5MB"
          : err.message || "Upload gagal";
      return res.status(400).json({ success: false, error: message });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "File Excel wajib diupload",
      });
    }

    try {
      const preview = await previewImport(req.tenantId, req.file.buffer);
      res.json(preview);
    } catch (parseErr) {
      console.error(parseErr);
      res.status(400).json({
        success: false,
        error: parseErr.message || "Gagal membaca file Excel",
      });
    }
  });
});

router.post("/import/commit", ...withImportAuth, async (req, res) => {
  try {
    const { rows } = req.body;
    const result = await commitImport(req.tenantId, rows);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/", ...withTenant, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         santri.*,
         kelas.nama_kelas,
         wali_santri.nama AS nama_wali,
         wali_santri.nomor_hp
       FROM santri
       LEFT JOIN kelas
         ON santri.kelas_id = kelas.id
        AND kelas.tenant_id = santri.tenant_id
       LEFT JOIN wali_santri
         ON santri.id = wali_santri.santri_id
        AND wali_santri.tenant_id = santri.tenant_id
       WHERE santri.tenant_id = $1
       ORDER BY santri.id DESC`,
      [req.tenantId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post(
  "/",
  ...withTenant,
  requirePermission("santri.create"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const {
        nis,
        nama,
        uid_rfid,
        alamat,
        orang_tua,
        nomor_hp_ortu,
        kelas_id,
        foto,
      } = req.body;

      const kelasCheck = await assertKelasInTenant(req.tenantId, kelas_id, client);
      if (!kelasCheck.ok) {
        return res.status(400).json({ success: false, error: kelasCheck.error });
      }

      await client.query("BEGIN");

      const result = await client.query(
        `INSERT INTO santri (
           nis, nama, uid_rfid, alamat, orang_tua,
           nomor_hp_ortu, kelas_id, foto, tenant_id
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          nis,
          nama,
          uid_rfid,
          alamat,
          orang_tua,
          nomor_hp_ortu,
          kelas_id || null,
          foto,
          req.tenantId,
        ]
      );

      const santri = result.rows[0];
      const waliSync = await syncWaliFromSantri(client, {
        tenantId: req.tenantId,
        santri,
      });

      await client.query("COMMIT");

      res.json({
        success: true,
        data: santri,
        wali_sync: waliSync,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      console.log(err);
      res.status(500).json({ success: false, error: err.message });
    } finally {
      client.release();
    }
  }
);

router.put(
  "/:id",
  ...withTenant,
  requirePermission("santri.update"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { id } = req.params;
      const {
        nis,
        nama,
        uid_rfid,
        alamat,
        orang_tua,
        nomor_hp_ortu,
        kelas_id,
        foto,
      } = req.body;

      const kelasCheck = await assertKelasInTenant(req.tenantId, kelas_id, client);
      if (!kelasCheck.ok) {
        return res.status(400).json({ success: false, error: kelasCheck.error });
      }

      await client.query("BEGIN");

      const result = await client.query(
        `UPDATE santri
         SET nis = $1,
             nama = $2,
             uid_rfid = $3,
             alamat = $4,
             orang_tua = $5,
             nomor_hp_ortu = $6,
             kelas_id = $7,
             foto = $8
         WHERE id = $9 AND tenant_id = $10
         RETURNING *`,
        [
          nis,
          nama,
          uid_rfid,
          alamat,
          orang_tua,
          nomor_hp_ortu,
          kelas_id || null,
          foto,
          id,
          req.tenantId,
        ]
      );

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ success: false, error: "Santri tidak ditemukan" });
      }

      const santri = result.rows[0];
      const waliSync = await syncWaliFromSantri(client, {
        tenantId: req.tenantId,
        santri,
      });

      await client.query("COMMIT");

      res.json({
        success: true,
        data: santri,
        wali_sync: waliSync,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      console.log(err);
      res.status(500).json({ success: false, error: err.message });
    } finally {
      client.release();
    }
  }
);

router.delete(
  "/:id",
  ...withTenant,
  requirePermission("santri.delete"),
  async (req, res) => {
    try {
      const result = await pool.query(
        `DELETE FROM santri
         WHERE id = $1 AND tenant_id = $2
         RETURNING id`,
        [req.params.id, req.tenantId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: "Santri tidak ditemukan" });
      }

      res.json({ success: true });
    } catch (err) {
      console.log(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// RFID lookup — admin + tenant scoped
router.get("/rfid/:uid", ...withTenant, requirePermission("santri.view"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nama, uid_rfid, saldo, limit_harian
       FROM santri
       WHERE uid_rfid = $1
         AND tenant_id = $2`,
      [req.params.uid, req.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
