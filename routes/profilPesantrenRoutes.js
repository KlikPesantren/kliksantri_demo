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
            banner_url,
            COALESCE(banner_active, TRUE) AS banner_active,
            splash_logo_url,
            app_icon_url,
            tagline,
            tentang,
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
        banner_url,
        banner_active,
        splash_logo_url,
        app_icon_url,
        tagline,
        tentang,
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
            banner_url,
            banner_active,
            splash_logo_url,
            app_icon_url,
            tagline,
            tentang,
            visi,
            misi,
            updated_at
          )
          VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
          ON CONFLICT (id) DO UPDATE SET
            nama_pesantren = EXCLUDED.nama_pesantren,
            alamat         = EXCLUDED.alamat,
            telepon        = EXCLUDED.telepon,
            email          = EXCLUDED.email,
            website        = EXCLUDED.website,
            logo_url       = EXCLUDED.logo_url,
            banner_url     = EXCLUDED.banner_url,
            banner_active  = EXCLUDED.banner_active,
            splash_logo_url = EXCLUDED.splash_logo_url,
            app_icon_url   = EXCLUDED.app_icon_url,
            tagline        = EXCLUDED.tagline,
            tentang        = EXCLUDED.tentang,
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
            banner_url ?? null,
            banner_active !== false,
            splash_logo_url ?? null,
            app_icon_url ?? null,
            tagline ?? null,
            tentang ?? null,
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
