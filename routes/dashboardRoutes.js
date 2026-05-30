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
  persentaseMelanggar

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