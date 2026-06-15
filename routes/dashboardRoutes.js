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
      // SANTRI AKTIF / NON AKTIF
      // ======================

      let santriAktif    = Number(santri.rows[0].total);
      let santriNonAktif = 0;

      try {
        const santriStatus = await pool.query(
          `SELECT
             COUNT(*) FILTER (WHERE status = 'aktif')    AS aktif,
             COUNT(*) FILTER (WHERE status != 'aktif')   AS non_aktif
           FROM santri`
        );
        santriAktif    = Number(santriStatus.rows[0].aktif);
        santriNonAktif = Number(santriStatus.rows[0].non_aktif);
      } catch { /* kolom status tidak ada, gunakan fallback */ }

      // ======================
      // ABSENSI HARI INI
      // ======================

      const absensiHariIni = await pool.query(
        `SELECT COUNT(*) AS total FROM absensi WHERE tanggal = CURRENT_DATE`
      );

      // ======================
      // NILAI MINGGUAN TERISI BULAN INI
      // ======================

      const nilaiTerisi = await pool.query(
        `SELECT COUNT(*) AS total FROM nilai_mingguan
         WHERE bulan = $1 AND tahun = $2`,
        [new Date().getMonth() + 1, new Date().getFullYear()]
      );

      // ======================
      // SANTRI POIN TERTINGGI BULAN INI
      // ======================

      const santriPoinTertinggi = await pool.query(
        `SELECT s.nama, COUNT(p.id) AS jumlah_pelanggaran
         FROM pelanggaran p
         JOIN santri s ON p.santri_id = s.id
         WHERE EXTRACT(MONTH FROM p.tanggal) = $1
           AND EXTRACT(YEAR  FROM p.tanggal) = $2
         GROUP BY s.id, s.nama
         ORDER BY jumlah_pelanggaran DESC
         LIMIT 5`,
        [new Date().getMonth() + 1, new Date().getFullYear()]
      );

      // ======================
      // WALI AKUN
      // ======================

      let totalWaliAkun     = 0;
      let waliBelumGantiPin = 0;

      try {
        const waliAkunResult = await pool.query(
          `SELECT
             COUNT(*) AS total,
             COUNT(*) FILTER (WHERE must_change_pin = true) AS belum_ganti
           FROM wali_akun`
        );
        totalWaliAkun     = Number(waliAkunResult.rows[0].total);
        waliBelumGantiPin = Number(waliAkunResult.rows[0].belum_ganti);
      } catch { /* wali_akun belum dibuat */ }

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
s.nama,
t.sisa_tagihan
FROM tagihan_sahriyah t
LEFT JOIN santri s
ON s.id = t.santri_id
WHERE t.sisa_tagihan > 0
ORDER BY t.sisa_tagihan DESC
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

const kesehatanStats = await pool.query(`
  WITH latest AS (
    SELECT DISTINCT ON (ks.santri_id)
      ks.santri_id,
      ks.status_kesehatan,
      ks.status_penanganan
    FROM kesehatan_santri ks
    ORDER BY ks.santri_id, ks.created_at DESC
  ),
  santri_aktif AS (
    SELECT COUNT(*)::int AS total FROM santri
  )
  SELECT
    (SELECT total FROM santri_aktif) AS total_santri,
    COUNT(*) FILTER (WHERE l.status_kesehatan = 'sakit')::int AS sakit,
    COUNT(*) FILTER (
      WHERE l.status_kesehatan = 'sakit'
        AND l.status_penanganan IN ('observasi', 'istirahat')
    )::int AS perlu_tindak_lanjut
  FROM latest l
`);

const kStat = kesehatanStats.rows[0] || {};
const kTotalSantri = Number(kStat.total_santri || 0);
const kSakit = Number(kStat.sakit || 0);

      res.json({

        success: true,

        data: {

          total_santri:
            Number(santri.rows[0].total),

          santri_aktif:
            santriAktif,

          santri_non_aktif:
            santriNonAktif,

          total_kelas:
            Number(kelas.rows[0].total),

          total_wali:
            Number(wali.rows[0].total),

          total_saldo:
            Number(saldo.rows[0].total_saldo),

          persentase_kehadiran_santri:
            persentaseSantri,

          persentase_kehadiran_guru:
            persentaseGuru,

          total_hafalan:
            Number(totalHafalan.rows[0].total),

          rata_nilai:
            Math.round(rataNilai.rows[0].rata),

          absensi_hari_ini:
            Number(absensiHariIni.rows[0].total),

          nilai_terisi:
            Number(nilaiTerisi.rows[0].total),

          santri_poin_tertinggi:
            santriPoinTertinggi.rows.map(r => ({
              nama: r.nama,
              jumlah_pelanggaran: Number(r.jumlah_pelanggaran)
            })),

          total_wali_akun:
            totalWaliAkun,

          wali_belum_ganti_pin:
            waliBelumGantiPin,

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
),

kesehatan_sehat:
  Math.max(kTotalSantri - kSakit, 0),

kesehatan_sakit:
  kSakit,

kesehatan_perlu_tindak_lanjut:
  Number(kStat.perlu_tindak_lanjut || 0),

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