const express =
  require("express");

const router =
  express.Router();

const pool =
  require("../db");

// ======================
// GET /profil-pesantren
// ======================

router.get(

  "/",

  async (req, res) => {

    try {

      const result =
        await pool.query(

          `
          SELECT
            id,
            nama_pesantren,
            alamat,
            telepon,
            email,
            website,
            logo_url,
            visi,
            misi,
            updated_at
          FROM profil_pesantren
          ORDER BY id
          LIMIT 1
          `

        );

      res.json({

        success: true,

        data: result.rows[0] ?? null

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
// PUT /profil-pesantren
// Singleton upsert — selalu id = 1
// ======================

router.put(

  "/",

  async (req, res) => {

    try {

      const {
        nama_pesantren,
        alamat,
        telepon,
        email,
        website,
        logo_url,
        visi,
        misi
      } = req.body;

      if (!nama_pesantren) {

        return res.status(400).json({

          success: false,

          error: "nama_pesantren wajib diisi"

        });

      }

      const result =
        await pool.query(

          `
          INSERT INTO profil_pesantren (
            id,
            nama_pesantren,
            alamat,
            telepon,
            email,
            website,
            logo_url,
            visi,
            misi,
            updated_at
          )
          VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, NOW())
          ON CONFLICT (id) DO UPDATE SET
            nama_pesantren = EXCLUDED.nama_pesantren,
            alamat         = EXCLUDED.alamat,
            telepon        = EXCLUDED.telepon,
            email          = EXCLUDED.email,
            website        = EXCLUDED.website,
            logo_url       = EXCLUDED.logo_url,
            visi           = EXCLUDED.visi,
            misi           = EXCLUDED.misi,
            updated_at     = NOW()
          RETURNING *
          `,

          [
            nama_pesantren,
            alamat   ?? null,
            telepon  ?? null,
            email    ?? null,
            website  ?? null,
            logo_url ?? null,
            visi     ?? null,
            misi     ?? null
          ]

        );

      res.json({

        success: true,

        data: result.rows[0]

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
