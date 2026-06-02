const express =
require("express");

const router =
express.Router();

const pool =
require("../db");


// ======================
// GET ALL TAGIHAN
// ======================

router.get(

  "/",

  async (req,res) => {

    try {

      const result =

        await pool.query(

          `

          SELECT

            t.*,

            s.nama

          FROM tagihan_sahriyah t

          LEFT JOIN santri s

          ON t.santri_id = s.id

          ORDER BY

          t.tahun DESC,

          t.bulan DESC

          `

        );

      res.json({

        success:true,

        data:
        result.rows

      });

    }

    catch(err){

      console.log(err);

      res.status(500).json({

        success:false,

        error:
        err.message

      });

    }

  }

);


// ======================
// GENERATE TAGIHAN
// ======================

router.post(

  "/generate",

  async (req,res) => {

    try {

      const {

        bulan,

        tahun

      } = req.body;

      const santri =

        await pool.query(

          `

          SELECT

            s.id,

            ss.nominal_uang,

            ss.nominal_beras,

            ss.keterangan

          FROM santri s

          LEFT JOIN

          sahriyah_setting ss

          ON s.id = ss.santri_id

          ORDER BY s.id

          `

        );

      for (

        const s

        of

        santri.rows

      ) {
        console.log(
  "DATA SANTRI:",
  s
);

        const cek =

          await pool.query(

            `

            SELECT id

            FROM tagihan_sahriyah

            WHERE

            santri_id = $1

            AND bulan = $2

            AND tahun = $3

            `,

            [

              s.id,

              bulan,

              tahun

            ]

          );

        if (

          cek.rows.length === 0

        ) {

          await pool.query(

            `

            INSERT INTO

            tagihan_sahriyah(

              santri_id,

              bulan,

              tahun,

              nominal,

              nominal_beras,

              keterangan

            )

            VALUES(

              $1,$2,$3,$4,$5,$6

            )

            `,

            [

              s.id,

              bulan,

              tahun,

              s.nominal_uang || 0,

              s.nominal_beras || 0,

              s.keterangan || ""

            ]

          );

        }

      }

      res.json({

        success:true,

        message:
        "Tagihan berhasil dibuat"

      });

    }

    catch(err){

      console.log(err);

      res.status(500).json({

        success:false,

        error:
        err.message

      });

    }

  }

);


// ======================
// BAYAR SAHRIYAH
// ======================

router.put(

  "/bayar/:id",

  async (req,res) => {

    try {

      const {

  nominal,
  beras,
  petugas

} = req.body;

const tagihan =

  await pool.query(

    `

    SELECT

      t.*,

      s.nama

    FROM tagihan_sahriyah t

    LEFT JOIN santri s

    ON t.santri_id = s.id

    WHERE t.id = $1

    `,

    [

      req.params.id

    ]

  );

      if (

        tagihan.rows.length === 0

      ) {

        return res.status(404)

        .json({

          success:false

        });

      }

      const data =

        tagihan.rows[0];

      const totalBayarBaru =

        Number(
          data.total_bayar || 0
        )

        +

        Number(
          nominal
        );

      const sisaTagihanBaru =

        Number(
          data.nominal
        )

        -

        totalBayarBaru;

      const berasTerbayarBaru =

  Number(
    data.beras_terbayar || 0
  )

  +

  Number(
    beras || 0
  );

const sisaBerasBaru =

  Number(
    data.nominal_beras || 0
  )

  -

  berasTerbayarBaru;

  let status =

  "Belum Lunas";

if (

  totalBayarBaru > 0 ||
  berasTerbayarBaru > 0

) {

  status =

    "Cicilan";

}

if (

  sisaTagihanBaru <= 0 &&

  sisaBerasBaru <= 0

) {

  status =

    "Lunas";

}

      const tanggalBayar =

  status === "Lunas"

    ? new Date()

    : data.tanggal_bayar;

await pool.query(

  `

  UPDATE

  tagihan_sahriyah

  SET

  total_bayar = $1,

  sisa_tagihan = $2,

  beras_terbayar = $3,

  sisa_beras = $4,

  status = $5,

  petugas = $6,

  tanggal_bayar = $7

WHERE id = $8

  `,

  [

  totalBayarBaru,

  Math.max(
    0,
    sisaTagihanBaru
  ),

  berasTerbayarBaru,

  Math.max(
    0,
    sisaBerasBaru
  ),

  status,

  petugas,

  tanggalBayar,

  req.params.id

]

);

console.log(
  "BERAS MASUK:",
  beras
);

await pool.query(

  `

INSERT INTO pembayaran_sahriyah(

  tagihan_id,

  nominal,

  nominal_beras,

  petugas

)

VALUES(

  $1,

  $2,

  $3,

  $4

)

  `,

  [
  req.params.id,
  nominal,
  beras,
  petugas
]

);

      await pool.query(

        `

        INSERT INTO

        buku_kas(

          tanggal,

          jenis,

          kategori,

          keterangan,

          nominal,

          petugas

        )

        VALUES(

          CURRENT_TIMESTAMP,

          'Masuk',

          'Sahriyah',

          $3,

          $1,

          $2

        )

        `,

        [

  nominal,

  petugas,

  `Pembayaran Sahriyah - ${data.nama}`

]

      );

     res.json({

  success:true,

  total_bayar:
  totalBayarBaru,

  sisa_tagihan:
  Math.max(
    0,
    sisaTagihanBaru
  ),

  beras_terbayar:
  berasTerbayarBaru,

  sisa_beras:
  Math.max(
    0,
    sisaBerasBaru
  ),

  status

});

    }

    catch(err){

      console.log(err);

      res.status(500).json({

        success:false,

        error:
        err.message

      });

    }

  }

);

router.get(

  "/riwayat/:id",

  async (req,res) => {

    try {

      const result =

        await pool.query(

          `

          SELECT *

          FROM pembayaran_sahriyah

          WHERE tagihan_id = $1

          ORDER BY tanggal DESC

          `,

          [

            req.params.id

          ]

        );

      res.json({

        success:true,

        data: result.rows

      });

    }

    catch(err){

      console.log(err);

      res.status(500).json({

        success:false,

        error: err.message

      });

    }

  }

);

// ======================
// HAPUS TAGIHAN SAHRIYAH
// ======================

router.delete(

  "/:id",

  async (req,res) => {

    try {

      await pool.query(

        `

        DELETE FROM pembayaran_sahriyah

        WHERE tagihan_id = $1

        `,

        [

          req.params.id

        ]

      );

      await pool.query(

        `

        DELETE FROM tagihan_sahriyah

        WHERE id = $1

        `,

        [

          req.params.id

        ]

      );

      res.json({

        success:true

      });

    }

    catch(err){

      console.log(err);

      res.status(500).json({

        success:false,

        error: err.message

      });

    }

  }

);

module.exports =
router;