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
      // ON CONFLICT DO NOTHING: jika nomor sudah ada, PIN lama tidak ditimpa
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
        ON CONFLICT (nomor_hp) DO NOTHING
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

    try {

      const {

        id

      } = req.params;

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

      const result =

        await pool.query(

          `

          UPDATE wali_santri

          SET

            nama = $1,
            nomor_hp = $2,
            alamat = $3,
            santri_id = $4

          WHERE id = $5

          RETURNING *

          `,

          [

            nama,
            normalizedHp,
            alamat,
            santri_id,
            id

          ]

        );

      // Update nama di wali_akun jika nomor_hp cocok
      await pool.query(

        `
        UPDATE wali_akun
        SET nama = $1, updated_at = NOW()
        WHERE nomor_hp = $2
        `,

        [nama, normalizedHp]

      );

      res.json({

        success: true,

        data:
          result.rows[0]

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