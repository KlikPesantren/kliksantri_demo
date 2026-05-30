const pool = require("../db");

exports.getSantri = async (req, res) => {

  try {

    const result =
      await pool.query(
        "SELECT * FROM santri ORDER BY id DESC"
      );

    res.json(result.rows);

  } catch (err) {

    console.log(err);

    res.status(500).json({

      error: "Database Error"

    });

  }

};

exports.createSantri = async (req, res) => {

  try {

    const {

      uid_rfid,
      nama,
      nis,
      kelas,
      kamar,
      nama_wali,
      no_hp_wali,
      limit_harian

    } = req.body;

    const result = await pool.query(

      `INSERT INTO santri (

        uid_rfid,
        nama,
        nis,
        kelas,
        kamar,
        nama_wali,
        no_hp_wali,
        limit_harian,
        status

      )

      VALUES (

        $1,$2,$3,$4,$5,$6,$7,$8,true

      )

      RETURNING *`,

      [

        uid_rfid,
        nama,
        nis,
        kelas,
        kamar,
        nama_wali,
        no_hp_wali,
        limit_harian

      ]

    );

    res.json({

      success: true,

      data: result.rows[0]

    });

  } catch (err) {

    console.log(err);

    res.status(500).json({

      error: "Insert Failed"

    });

  }

};

exports.getSantriByUid =
  async (req, res) => {

    try {

      const { uid } =
        req.params;

      const result =
        await pool.query(

          "SELECT * FROM santri WHERE uid_rfid = $1",

          [uid]

        );

      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({

          success: false,

          error:
            "Santri tidak ditemukan"

        });

      }

      res.json({

        success: true,

        data:
          result.rows[0]

      });

    } catch (err) {

      console.log(err);

      res.status(500).json({

        success: false,

        error:
          "Gagal ambil santri"

      });

    }

};

exports.updateSantri =
  async (req, res) => {

    try {

      const { id } =
        req.params;

      const {

        uid_rfid,
        nama,
        nis,
        kelas,
        kamar,
        nama_wali,
        no_hp_wali,
        limit_harian

      } = req.body;

      await pool.query(

        `UPDATE santri SET

          uid_rfid = $1,
          nama = $2,
          nis = $3,
          kelas = $4,
          kamar = $5,
          nama_wali = $6,
          no_hp_wali = $7,
          limit_harian = $8

        WHERE id = $9`,

        [

          uid_rfid,
          nama,
          nis,
          kelas,
          kamar,
          nama_wali,
          no_hp_wali,
          limit_harian,
          id

        ]

      );

      res.json({

        success: true,

        message:
          "Santri berhasil diupdate"

      });

    } catch (err) {

      console.log(err);

      res.status(500).json({

        success: false,

        error:
          "Update gagal"

      });

    }

};

exports.deleteSantri =
  async (req, res) => {

    try {

      const { id } =
        req.params;

      await pool.query(

        "DELETE FROM santri WHERE id = $1",

        [id]

      );

      res.json({

        success: true,

        message:
          "Santri berhasil dihapus"

      });

    } catch (err) {

      console.log(err);

      res.status(500).json({

        success: false,

        error:
          "Hapus gagal"

      });

    }

};