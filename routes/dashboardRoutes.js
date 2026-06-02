const express = require("express");

const pool = require("../db");

const router = express.Router();

// ======================
// DASHBOARD SUMMARY
// ======================

router.get(

  "/summary",

  async (req, res) => {

    try {

      const santri =
        await pool.query(
          `SELECT COUNT(*) AS total FROM santri`
        );

      const kelas =
        await pool.query(
          `SELECT COUNT(*) AS total FROM kelas`
        );

      const wali =
        await pool.query(
          `SELECT COUNT(*) AS total FROM wali_santri`
        );

      const saldo =
        await pool.query(

          `

          SELECT COALESCE(
            SUM(saldo),
            0
          ) AS total_saldo

          FROM santri

          `

        );


      // ======================
      // ABSENSI SANTRI
      // ======================

      const hadirSantri =
        await pool.query(

          `

          SELECT COUNT(*) AS total

          FROM absensi

          WHERE status = 'H'
             OR status = 'Hadir'

          `

        );

      const totalAbsensi =
        await pool.query(

          `

          SELECT COUNT(*) AS total

          FROM absensi

          `

        );

      // ======================
      // HAFALAN BULAN INI
      // ======================

      const totalHafalan =
        await pool.query(

          `

          SELECT COUNT(*) AS total

          FROM hafalan

          WHERE bulan = $1
            AND tahun = $2

          `,

          [

            new Date().getMonth() + 1,

            new Date().getFullYear()

          ]

        );

      // ======================
      // RATA NILAI
      // ======================

      const rataNilai =
        await pool.query(

          `

          SELECT COALESCE(
            AVG(nilai),
            0
          ) AS rata

          FROM nilai_mingguan

          WHERE bulan = $1
            AND tahun = $2

          `,

          [

            new Date().getMonth() + 1,

            new Date().getFullYear()

          ]

        );

      // ======================
      // ABSENSI GURU
      // ======================

      let persentaseGuru = 0;

      try {

        const guruHadir =
          await pool.query(

            `

            SELECT COALESCE(
              SUM(total_hadir),
              0
            ) AS total

            FROM absensi_guru

            `

          );

        const guruTotal =
          await pool.query(

            `

            SELECT COALESCE(

              SUM(

                total_hadir +
                total_izin +
                total_sakit +
                total_alfa

              ),

              0

            ) AS total

            FROM absensi_guru

            `

          );

        persentaseGuru =

          Number(
            guruTotal.rows[0].total
          ) === 0

            ? 0

            : Math.round(

                (

                  Number(
                    guruHadir.rows[0].total
                  )

                  /

                  Number(
                    guruTotal.rows[0].total
                  )

                ) * 100

              );

      }

      catch {

        persentaseGuru = 0;

      }

      // ======================
      // PERSENTASE SANTRI
      // ======================

      const persentaseSantri =

        Number(
          totalAbsensi.rows[0].total
        ) === 0

          ? 0

          : Math.round(

              (

                Number(
                  hadirSantri.rows[0].total
                )

                /

                Number(
                  totalAbsensi.rows[0].total
                )

              ) * 100

            );

      // ======================
// BELUM KEMBALI
// ======================

const belumKembali =
  await pool.query(

    `

    SELECT COUNT(*) AS total

    FROM perizinan

    WHERE status = 'keluar'

    `

  );

  // ======================
// PERIZINAN BULAN INI
// ======================

const totalPerizinan =
  await pool.query(

    `

    SELECT COUNT(*) AS total

    FROM perizinan

    WHERE EXTRACT(MONTH FROM tanggal) = $1
      AND EXTRACT(YEAR FROM tanggal) = $2

    `,

    [

      new Date().getMonth() + 1,

      new Date().getFullYear()

    ]

  );

  // ======================
// PELANGGARAN BULAN INI
// ======================

const totalPelanggaran =
  await pool.query(

    `

    SELECT COUNT(*) AS total

    FROM pelanggaran

    WHERE EXTRACT(MONTH FROM tanggal) = $1
      AND EXTRACT(YEAR FROM tanggal) = $2

    `,

    [

      new Date().getMonth() + 1,

      new Date().getFullYear()

    ]

  );

  // ======================
// SANTRI MELANGGAR
// ======================

const santriMelanggar =
  await pool.query(

    `

    SELECT COUNT(
      DISTINCT santri_id
    ) AS total

    FROM pelanggaran

    WHERE EXTRACT(MONTH FROM tanggal) = $1
      AND EXTRACT(YEAR FROM tanggal) = $2

    `,

    [

      new Date().getMonth() + 1,

      new Date().getFullYear()

    ]

  );

const persentaseMelanggar =

  Number(
    santri.rows[0].total
  ) === 0

    ? 0

    : Math.round(

        (

          Number(
            santriMelanggar.rows[0].total
          )

          /

          Number(
            santri.rows[0].total
          )

        ) * 100

      );

      // ======================
      // RESPONSE
      // ======================

      console.log(
  "hadirSantri =",
  hadirSantri.rows[0].total
);

console.log(
  "totalAbsensi =",
  totalAbsensi.rows[0].total
);

console.log(
  "persentaseSantri =",
  persentaseSantri
);


// ======================
// DASHBOARD KEUANGAN
// ======================

const kasMasuk =
await pool.query(

`

SELECT

COALESCE(
SUM(nominal),
0
) AS total

FROM buku_kas

WHERE jenis = 'Masuk'

AND EXTRACT(
MONTH FROM tanggal
) = $1

AND EXTRACT(
YEAR FROM tanggal
) = $2

`,

[
new Date().getMonth()+1,
new Date().getFullYear()
]

);

const kasKeluar =
await pool.query(

`

SELECT

COALESCE(
SUM(nominal),
0
) AS total

FROM buku_kas

WHERE jenis = 'Keluar'

AND EXTRACT(
MONTH FROM tanggal
) = $1

AND EXTRACT(
YEAR FROM tanggal
) = $2

`,

[
new Date().getMonth()+1,
new Date().getFullYear()
]

);

const pembayaranSahriyah =
await pool.query(

`

SELECT

COALESCE(
SUM(total_bayar),
0
) AS total

FROM tagihan_sahriyah

`

);

const tunggakanSahriyah =
await pool.query(

`

SELECT

COALESCE(
SUM(sisa_tagihan),
0
) AS total

FROM tagihan_sahriyah

`

);

// ======================
// GRAFIK KAS
// ======================

const grafikKas =
await pool.query(

`

SELECT

EXTRACT(
MONTH FROM tanggal
) AS bulan,

COALESCE(

SUM(

CASE

WHEN jenis = 'Masuk'

THEN nominal

ELSE 0

END

),

0

) AS masuk,

COALESCE(

SUM(

CASE

WHEN jenis = 'Keluar'

THEN nominal

ELSE 0

END

),

0

) AS keluar

FROM buku_kas

WHERE

EXTRACT(
YEAR FROM tanggal
) = $1

GROUP BY bulan

ORDER BY bulan

`,

[
new Date().getFullYear()
]

);

// ======================
// TRANSAKSI TERBARU
// ======================

const transaksiTerbaru =
await pool.query(

`

SELECT

id,
tanggal,
jenis,
kategori,
keterangan,
nominal,
petugas

FROM buku_kas

ORDER BY tanggal DESC,
id DESC

LIMIT 10

`

);

// ======================
// PEMBAYARAN TERBARU
// ======================

const pembayaranTerbaru =
await pool.query(

`

SELECT

p.id,
p.nama_tagihan,
p.nominal_bayar,
p.sisa_tunggakan,
p.status,

s.nama

FROM pembayaran p

LEFT JOIN santri s

ON p.santri_id = s.id

ORDER BY p.id DESC

LIMIT 10

`

);

// ======================
// TOP TUNGGAKAN
// ======================

const topTunggakan =
await pool.query(

`

SELECT

nama,
sisa_tagihan

FROM tagihan_sahriyah

WHERE sisa_tagihan > 0

ORDER BY sisa_tagihan DESC

LIMIT 10

`

);


      // ======================
      // DAFTAR TAMU
      // ======================

const tamuHariIni =
await pool.query(`
SELECT COUNT(*) total
FROM tamu
WHERE tanggal = CURRENT_DATE
`);

const tamuBulanIni =
await pool.query(`
SELECT COUNT(*) total
FROM tamu
WHERE EXTRACT(MONTH FROM tanggal)=EXTRACT(MONTH FROM CURRENT_DATE)
AND EXTRACT(YEAR FROM tanggal)=EXTRACT(YEAR FROM CURRENT_DATE)
`);

const tamuMasihDidalam =
await pool.query(`
SELECT COUNT(*) total
FROM tamu
WHERE status='Masuk'
`);

      res.json({

        success: true,

        data: {

          total_santri:
            Number(
              santri.rows[0].total
            ),

          total_kelas:
            Number(
              kelas.rows[0].total
            ),

          total_wali:
            Number(
              wali.rows[0].total
            ),

          total_saldo:
            Number(
              saldo.rows[0].total_saldo
            ),

          persentase_kehadiran_santri:
            persentaseSantri,

          persentase_kehadiran_guru:
            persentaseGuru,

          total_hafalan:
            Number(
              totalHafalan.rows[0].total
            ),

          rata_nilai:
  Math.round(
    rataNilai.rows[0].rata
  ),

belum_kembali:
  Number(
    belumKembali.rows[0].total
  ),

total_perizinan:
  Number(
    totalPerizinan.rows[0].total
  ),

total_pelanggaran:
  Number(
    totalPelanggaran.rows[0].total
  ),

persentase_melanggar:
  persentaseMelanggar,

  kas_masuk:
  Number(
    kasMasuk.rows[0].total
  ),

kas_keluar:
  Number(
    kasKeluar.rows[0].total
  ),

saldo_kas:
  Number(
    kasMasuk.rows[0].total
  )
  -
  Number(
    kasKeluar.rows[0].total
  ),

total_pembayaran:
  Number(
    pembayaranSahriyah.rows[0].total
  ),

total_tunggakan:
  Number(
    tunggakanSahriyah.rows[0].total
  ),

grafik_kas:
  grafikKas.rows,

transaksi_terbaru:
  transaksiTerbaru.rows,

pembayaran_terbaru:
  pembayaranTerbaru.rows,

top_tunggakan:
topTunggakan.rows,

tamu_hari_ini:
Number(
  tamuHariIni.rows[0].total
),

tamu_bulan_ini:
Number(
  tamuBulanIni.rows[0].total
),

tamu_masih_didalam:
Number(
  tamuMasihDidalam.rows[0].total
)

        }

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

module.exports = router;