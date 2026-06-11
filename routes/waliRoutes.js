console.log(
  "WALI ROUTES LOADED"
);

const express =
require("express");

const router =
express.Router();

const pool =
require("../db");

const bcrypt =
require("bcryptjs");

const waliAppService =
require("../services/waliAppService");

const DEFAULT_PIN = "456789";

// ======================
// GET ALL WALI
// ======================

router.get(

  "/",

  async (req, res) => {

    try {

      const result =

        await pool.query(

          `

          SELECT

            wali_santri.*,

            santri.nama
            AS nama_santri

          FROM wali_santri

          LEFT JOIN santri

          ON wali_santri.santri_id =
          santri.id

          ORDER BY wali_santri.id DESC

          `

        );

      res.json({

        success: true,

        data:
          result.rows

      });

    }

    catch (err) {

      console.log(err);

      res.status(500).json({

        success: false,

        error:
          err.message

      });

    }

  }

);

// ======================
// CREATE WALI
// ======================

router.post(

  "/",

  async (req, res) => {

    const client =
      await pool.connect();

    try {

      const {

        nama,
        nomor_hp,
        alamat,
        santri_id

      } = req.body;

      // Normalisasi ke format 08xxx sebelum disimpan
      const normalizedHp =
        waliAppService.normalizePhone(nomor_hp);

      if (!normalizedHp) {

        return res.status(400).json({

          success: false,

          error: "Nomor HP tidak valid"

        });

      }

      await client.query("BEGIN");

      // 1. Insert ke wali_santri (relasi data santri)
      const result =

        await client.query(

          `
          INSERT INTO wali_santri (
            nama,
            nomor_hp,
            alamat,
            santri_id
          )
          VALUES ($1,$2,$3,$4)
          RETURNING *
          `,

          [
            nama,
            normalizedHp,
            alamat,
            santri_id
          ]

        );

      // 2. Upsert ke wali_akun dengan PIN default
      // ON CONFLICT DO UPDATE: jika nomor sudah ada, nama ikut diperbarui
      // PIN lama dipertahankan (tidak ditimpa) dengan EXCLUDED.pin_hash hanya jika baru
      const pinHash =
        await bcrypt.hash(
          DEFAULT_PIN,
          10
        );

      await client.query(

        `
        INSERT INTO wali_akun (
          nomor_hp,
          nama,
          pin_hash,
          status,
          must_change_pin
        )
        VALUES ($1, $2, $3, 'active', true)
        ON CONFLICT (nomor_hp) DO UPDATE SET
          nama       = EXCLUDED.nama,
          updated_at = NOW()
        `,

        [
          normalizedHp,
          nama,
          pinHash
        ]

      );

      await client.query("COMMIT");

      res.json({

        success: true,

        data:
          result.rows[0]

      });

    }

    catch (err) {

      await client.query("ROLLBACK");

      console.log(err);

      res.status(500).json({

        success: false,

        error:
          err.message

      });

    }

    finally {

      client.release();

    }

  }

);

// ======================
// UPDATE WALI
// ======================

router.put(

  "/:id",

  async (req, res) => {

    const client = await pool.connect();

    try {

      const { id } = req.params;

      const {
        nama,
        nomor_hp,
        alamat,
        santri_id
      } = req.body;

      const normalizedHp =
        waliAppService.normalizePhone(nomor_hp);

      if (!normalizedHp) {
        return res.status(400).json({
          success: false,
          error: "Nomor HP tidak valid"
        });
      }

      await client.query("BEGIN");

      // Ambil nomor HP lama sebelum diubah
      const oldResult = await client.query(
        "SELECT nomor_hp FROM wali_santri WHERE id = $1",
        [id]
      );
      const oldHp = oldResult.rows[0]?.nomor_hp || null;

      // Update wali_santri
      const result = await client.query(
        `UPDATE wali_santri
         SET nama = $1, nomor_hp = $2, alamat = $3, santri_id = $4
         WHERE id = $5
         RETURNING *`,
        [nama, normalizedHp, alamat, santri_id, id]
      );

      // Jika nomor HP berubah, rename di wali_akun
      if (oldHp && oldHp !== normalizedHp) {
        await client.query(
          `UPDATE wali_akun
           SET nomor_hp = $1, nama = $2, updated_at = NOW()
           WHERE nomor_hp = $3`,
          [normalizedHp, nama, oldHp]
        );
      }

      // UPSERT wali_akun dengan nomor HP baru
      // - Jika belum ada akun → buat akun dengan PIN default
      // - Jika sudah ada → update nama saja (PIN tidak ditimpa)
      const pinHash = await bcrypt.hash(DEFAULT_PIN, 10);

      await client.query(
        `INSERT INTO wali_akun (nomor_hp, nama, pin_hash, status, must_change_pin)
         VALUES ($1, $2, $3, 'active', true)
         ON CONFLICT (nomor_hp) DO UPDATE SET
           nama       = EXCLUDED.nama,
           updated_at = NOW()`,
        [normalizedHp, nama, pinHash]
      );

      await client.query("COMMIT");

      res.json({
        success: true,
        data: result.rows[0]
      });

    }

    catch (err) {

      await client.query("ROLLBACK");

      console.log(err);

      res.status(500).json({
        success: false,
        error: err.message
      });

    }

    finally {
      client.release();
    }

  }

);

// ======================
// SYNC AKUN
// POST /wali/sync-akun
// Sinkronisasi seluruh wali_santri → wali_akun
// ======================

router.post(

  "/sync-akun",

  async (req, res) => {

    try {

      // Ambil semua wali_santri dengan nomor HP valid
      const waliList = await pool.query(
        `SELECT id, nomor_hp, nama
         FROM wali_santri
         WHERE nomor_hp IS NOT NULL
           AND TRIM(nomor_hp) <> ''
         ORDER BY id ASC`
      );

      let created = 0;
      let updated = 0;

      for (const wali of waliList.rows) {

        const pinHash = await bcrypt.hash(DEFAULT_PIN, 10);

        const result = await pool.query(
          `INSERT INTO wali_akun (nomor_hp, nama, pin_hash, status, must_change_pin)
           VALUES ($1, $2, $3, 'active', true)
           ON CONFLICT (nomor_hp) DO UPDATE SET
             nama       = EXCLUDED.nama,
             updated_at = NOW()
           RETURNING (xmax = 0) AS is_insert`,
          [wali.nomor_hp, wali.nama, pinHash]
        );

        // xmax = 0 → baris baru (INSERT), xmax != 0 → update
        if (result.rows[0]?.is_insert) {
          created++;
        } else {
          updated++;
        }

      }

      res.json({
        success: true,
        total:   waliList.rows.length,
        created,
        updated
      });

    }

    catch (err) {

      console.log(err);

      res.status(500).json({
        success: false,
        error: err.message
      });

    }

  }

);

// ======================
// DELETE WALI
// ======================

router.delete(

  "/:id",

  async (req, res) => {

    try {

      const {

        id

      } = req.params;

      await pool.query(

        `

        DELETE FROM wali_santri

        WHERE id = $1

        `,

        [id]

      );

      res.json({

        success: true,

        message:
          "Wali deleted"

      });

    }

    catch (err) {

      console.log(err);

      res.status(500).json({

        success: false,

        error:
          err.message

      });

    }

  }

);

// ======================
// RESET PIN WALI
// PUT /wali/:id/reset-pin
// ======================

router.put(

  "/:id/reset-pin",

  async (req, res) => {

    try {

      const { id } = req.params;

      // Ambil nomor_hp dari wali_santri
      const waliResult =
        await pool.query(
          `SELECT nomor_hp FROM wali_santri WHERE id = $1`,
          [id]
        );

      if (waliResult.rows.length === 0) {

        return res.status(404).json({
          success: false,
          error: "Data wali tidak ditemukan"
        });

      }

      const nomor_hp =
        waliResult.rows[0].nomor_hp;

      const newHash =
        await bcrypt.hash(DEFAULT_PIN, 10);

      const updated =
        await pool.query(

          `
          UPDATE wali_akun
          SET
            pin_hash = $1,
            must_change_pin = true,
            failed_attempts = 0,
            locked_until = NULL,
            updated_at = NOW()
          WHERE nomor_hp = $2
          RETURNING id, nomor_hp, must_change_pin
          `,

          [newHash, nomor_hp]

        );

      if (updated.rows.length === 0) {

        return res.status(404).json({
          success: false,
          error: "Akun wali tidak ditemukan. Wali belum punya akun login."
        });

      }

      res.json({
        success: true,
        message: `PIN berhasil direset ke ${DEFAULT_PIN}`,
        data: updated.rows[0]
      });

    }

    catch (err) {

      console.log(err);

      res.status(500).json({
        success: false,
        error: err.message
      });

    }

  }

);

module.exports =
router;