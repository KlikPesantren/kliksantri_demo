const express =
  require("express");

const router =
  express.Router();

const pool =
  require("../db");

// ======================
// GET /pengumuman
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
            judul,
            isi,
            cover_url,
            prioritas,
            published_at,
            expires_at,
            is_active,
            created_by,
            created_at
          FROM pengumuman
          ORDER BY created_at DESC
          `

        );

      res.json({

        success: true,

        data: result.rows

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
// POST /pengumuman
// ======================

router.post(

  "/",

  async (req, res) => {

    try {

      const {
        judul,
        isi,
        cover_url,
        prioritas,
        expires_at,
        is_active
      } = req.body;

      if (!judul || !isi) {

        return res.status(400).json({

          success: false,

          error: "judul dan isi wajib diisi"

        });

      }

      const result =
        await pool.query(

          `
          INSERT INTO pengumuman (
            judul,
            isi,
            cover_url,
            prioritas,
            expires_at,
            is_active
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
          `,

          [
            judul,
            isi,
            cover_url ?? null,
            prioritas ?? "normal",
            expires_at ?? null,
            is_active !== undefined
              ? is_active
              : true
          ]

        );

      res.status(201).json({

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

// ======================
// PUT /pengumuman/:id
// ======================

router.put(

  "/:id",

  async (req, res) => {

    try {

      const { id } = req.params;

      const {
        judul,
        isi,
        cover_url,
        prioritas,
        expires_at,
        is_active
      } = req.body;

      const existing =
        await pool.query(

          "SELECT * FROM pengumuman WHERE id = $1",

          [id]

        );

      if (existing.rows.length === 0) {

        return res.status(404).json({

          success: false,

          error: "Pengumuman tidak ditemukan"

        });

      }

      const current = existing.rows[0];
      const nextCoverUrl = Object.prototype.hasOwnProperty.call(req.body, "cover_url")
        ? (cover_url ?? null)
        : current.cover_url;

      const result =
        await pool.query(

          `
          UPDATE pengumuman
          SET
            judul       = COALESCE($1, judul),
            isi         = COALESCE($2, isi),
            cover_url   = $3,
            prioritas   = COALESCE($4, prioritas),
            expires_at  = $5,
            is_active   = COALESCE($6, is_active)
          WHERE id = $7
          RETURNING *
          `,

          [
            judul ?? null,
            isi ?? null,
            nextCoverUrl,
            prioritas ?? null,
            expires_at !== undefined ? expires_at : null,
            is_active !== undefined ? is_active : null,
            id
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

// ======================
// DELETE /pengumuman/:id
// ======================

router.delete(

  "/:id",

  async (req, res) => {

    try {

      const { id } = req.params;

      const result =
        await pool.query(

          "DELETE FROM pengumuman WHERE id = $1 RETURNING id",

          [id]

        );

      if (result.rows.length === 0) {

        return res.status(404).json({

          success: false,

          error: "Pengumuman tidak ditemukan"

        });

      }

      res.json({

        success: true,

        deleted_id: Number(id)

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
