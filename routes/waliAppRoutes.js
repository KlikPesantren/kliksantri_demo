console.log(
  "WALI APP ROUTES LOADED"
);

const express =
  require("express");

const router =
  express.Router();

const pool =
  require("../db");

const waliAppService =
  require("../services/waliAppService");

const waliAppAuthMiddleware =
  require("../middleware/waliAppAuthMiddleware");

const waliSantriGuard =
  require("../middleware/waliSantriGuard");

// =====================
// POST /wali-app/login
// =====================

router.post(

  "/login",

  async (req, res) => {

    try {

      const {

        nomor_hp,
        pin

      } = req.body;

      const normalized =
        waliAppService.normalizePhone(
          nomor_hp
        );

      if (
        !normalized ||
        !waliAppService.isValidPin(pin)
      ) {

        return res.status(400).json({

          success: false,

          error:
            "Nomor HP atau PIN tidak valid"

        });

      }

      const akun =
        await waliAppService.findAkunByPhone(
          normalized
        );

      if (!akun) {

        await waliAppService.writeAudit({

          nomorHp: normalized,

          event: "login_failed",

          ipAddress: req.ip,

          userAgent:
            req.headers["user-agent"]

        });

        return res.status(401).json({

          success: false,

          error:
            "Nomor HP atau PIN salah"

        });

      }

      if (
        akun.status !== "active"
      ) {

        return res.status(403).json({

          success: false,

          error:
            "Akun wali ditangguhkan"

        });

      }

      if (
        waliAppService.isAccountLocked(
          akun
        )
      ) {

        return res.status(423).json({

          success: false,

          error:
            "Akun terkunci. Coba lagi nanti."

        });

      }

      const pinValid =
        await waliAppService.verifyPin(
          pin,
          akun.pin_hash
        );

      if (!pinValid) {

        await waliAppService.registerFailedLogin(
          akun.id
        );

        await waliAppService.writeAudit({

          nomorHp: normalized,

          event: "login_failed",

          ipAddress: req.ip,

          userAgent:
            req.headers["user-agent"]

        });

        return res.status(401).json({

          success: false,

          error:
            "Nomor HP atau PIN salah"

        });

      }

      await waliAppService.registerSuccessfulLogin(
        akun.id
      );

      const freshAkun =
        await waliAppService.findAkunByPhone(
          normalized
        );

      const loginData =
        await waliAppService.buildLoginResponse(
          freshAkun
        );

      await waliAppService.writeAudit({

        nomorHp: normalized,

        event: "login_success",

        ipAddress: req.ip,

        userAgent:
          req.headers["user-agent"]

      });

      res.json({

        success: true,

        ...loginData

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

// =====================
// GET /wali-app/me
// =====================

router.get(

  "/me",

  waliAppAuthMiddleware,

  async (req, res) => {

    try {

      const anak =
        await waliAppService.getAnakList(
          req.wali.nomor_hp
        );

      res.json({

        success: true,

        wali:
          waliAppService.buildWaliProfile({

            nomor_hp:
              req.wali.nomor_hp,

            nama:
              req.wali.nama,

            must_change_pin:
              req.wali.must_change_pin

          }),

        anak,

        santri_ids:
          req.wali.santri_ids

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

// =====================
// GET /wali-app/anak
// =====================

router.get(

  "/anak",

  waliAppAuthMiddleware,

  async (req, res) => {

    try {

      const anak =
        await waliAppService.getAnakList(
          req.wali.nomor_hp
        );

      res.json({

        success: true,

        data: anak,

        total: anak.length

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
// GET /wali-app/dashboard
// ======================

router.get(

  "/dashboard",

  waliAppAuthMiddleware,

  waliSantriGuard,

  async (req, res) => {

    const santriId = req.santriId;

    try {

      const santri =
        await pool.query(

          `
          SELECT
            s.id,
            s.nis,
            s.nama,
            s.foto,
            s.saldo,
            k.nama_kelas
          FROM santri s
          LEFT JOIN kelas k
            ON k.id = s.kelas_id
          WHERE s.id = $1
          LIMIT 1
          `,

          [santriId]

        );

      if (
        santri.rows.length === 0
      ) {

        return res.status(404).json({

          success: false,

          error: "Santri tidak ditemukan"

        });

      }

      const now = new Date();

      const bulan =
        now.getMonth() + 1;

      const tahun =
        now.getFullYear();

      const kehadiran =
        await pool.query(

          `
          SELECT
            COUNT(*) FILTER (
              WHERE status = 'H'
              OR status = 'Hadir'
            ) AS hadir,
            COUNT(*) AS total
          FROM absensi
          WHERE santri_id = $1
            AND EXTRACT(MONTH FROM tanggal::date) = $2
            AND EXTRACT(YEAR FROM tanggal::date) = $3
          `,

          [santriId, bulan, tahun]

        );

      const sahriyahAktif =
        await pool.query(

          `
          SELECT
            id,
            bulan,
            tahun,
            nominal,
            total_bayar,
            sisa_tagihan,
            status
          FROM tagihan_sahriyah
          WHERE santri_id = $1
            AND bulan = $2
            AND tahun = $3
          LIMIT 1
          `,

          [santriId, bulan, tahun]

        );

      const izinAktif =
        await pool.query(

          `
          SELECT COUNT(*) AS total
          FROM perizinan
          WHERE santri_id = $1
            AND status = 'keluar'
          `,

          [santriId]

        );

      const pelanggaranBulanIni =
        await pool.query(

          `
          SELECT COUNT(*) AS total
          FROM pelanggaran
          WHERE santri_id = $1
            AND EXTRACT(MONTH FROM tanggal::date) = $2
            AND EXTRACT(YEAR FROM tanggal::date) = $3
          `,

          [santriId, bulan, tahun]

        );

      const hafalanBulanIni =
        await pool.query(

          `
          SELECT COUNT(*) AS total
          FROM hafalan
          WHERE santri_id = $1
            AND bulan = $2
            AND tahun = $3
          `,

          [santriId, bulan, tahun]

        );

      const rataNilai =
        await pool.query(

          `
          SELECT COALESCE(
            ROUND(AVG(nilai::numeric), 0),
            0
          ) AS rata
          FROM nilai_mingguan
          WHERE santri_id = $1
            AND bulan = $2
            AND tahun = $3
          `,

          [santriId, bulan, tahun]

        );

      const kHadir =
        Number(
          kehadiran.rows[0]?.hadir || 0
        );

      const kTotal =
        Number(
          kehadiran.rows[0]?.total || 0
        );

      const pctHadir =
        kTotal === 0
          ? 0
          : Math.round(
              (kHadir / kTotal) * 100
            );

      res.json({

        success: true,

        santri_id: santriId,

        data: {

          profil: santri.rows[0],

          bulan,

          tahun,

          kehadiran: {

            hadir: kHadir,

            total: kTotal,

            persentase: pctHadir

          },

          sahriyah_aktif:
            sahriyahAktif.rows[0] || null,

          saldo_rfid:
            Number(
              santri.rows[0].saldo || 0
            ),

          izin_aktif:
            Number(
              izinAktif.rows[0]?.total || 0
            ),

          pelanggaran_bulan_ini:
            Number(
              pelanggaranBulanIni.rows[0]?.total || 0
            ),

          hafalan_bulan_ini:
            Number(
              hafalanBulanIni.rows[0]?.total || 0
            ),

          rata_nilai_bulan_ini:
            Number(
              rataNilai.rows[0]?.rata || 0
            )

        }

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
// GET /wali-app/santri/profil
// ======================

router.get(

  "/santri/profil",

  waliAppAuthMiddleware,

  waliSantriGuard,

  async (req, res) => {

    const santriId = req.santriId;

    try {

      const result =
        await pool.query(

          `
          SELECT
            s.id AS santri_id,
            s.nis,
            s.nama,
            s.alamat,
            s.orang_tua,
            s.nomor_hp_ortu,
            s.foto,
            s.saldo,
            s.limit_harian,
            k.nama_kelas,
            ws.nama AS nama_wali,
            ws.nomor_hp AS nomor_hp_wali,
            ws.alamat AS alamat_wali
          FROM santri s
          LEFT JOIN kelas k
            ON k.id = s.kelas_id
          LEFT JOIN wali_santri ws
            ON ws.santri_id = s.id
          WHERE s.id = $1
          LIMIT 1
          `,

          [santriId]

        );

      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({

          success: false,

          error: "Santri tidak ditemukan"

        });

      }

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
// GET /wali-app/sahriyah
// ======================

router.get(

  "/sahriyah",

  waliAppAuthMiddleware,

  waliSantriGuard,

  async (req, res) => {

    const santriId = req.santriId;

    const bulan =
      req.query.bulan
        ? Number(req.query.bulan)
        : null;

    const tahun =
      req.query.tahun
        ? Number(req.query.tahun)
        : null;

    try {

      let queryText = `
        SELECT
          t.id,
          t.bulan,
          t.tahun,
          t.nominal,
          t.nominal_beras,
          t.total_bayar,
          t.sisa_tagihan,
          t.beras_terbayar,
          t.sisa_beras,
          t.status,
          t.petugas,
          t.tanggal_bayar,
          t.keterangan
        FROM tagihan_sahriyah t
        WHERE t.santri_id = $1
      `;

      const params = [santriId];

      if (
        bulan &&
        bulan >= 1 &&
        bulan <= 12
      ) {

        params.push(bulan);

        queryText +=
          ` AND t.bulan = $${params.length}`;

      }

      if (tahun && tahun > 2000) {

        params.push(tahun);

        queryText +=
          ` AND t.tahun = $${params.length}`;

      }

      queryText +=
        " ORDER BY t.tahun DESC, t.bulan DESC";

      const result =
        await pool.query(
          queryText,
          params
        );

      res.json({

        success: true,

        santri_id: santriId,

        data: result.rows,

        total: result.rows.length

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
// GET /wali-app/sahriyah/:tagihan_id/riwayat
// ======================

router.get(

  "/sahriyah/:tagihan_id/riwayat",

  waliAppAuthMiddleware,

  waliSantriGuard,

  async (req, res) => {

    const santriId = req.santriId;

    const tagihanId =
      Number(req.params.tagihan_id);

    if (
      !Number.isInteger(tagihanId) ||
      tagihanId <= 0
    ) {

      return res.status(400).json({

        success: false,

        error: "tagihan_id tidak valid"

      });

    }

    try {

      const check =
        await pool.query(

          `
          SELECT id
          FROM tagihan_sahriyah
          WHERE id = $1
            AND santri_id = $2
          LIMIT 1
          `,

          [tagihanId, santriId]

        );

      if (check.rows.length === 0) {

        return res.status(403).json({

          success: false,

          error: "Tagihan tidak ditemukan atau bukan milik santri ini"

        });

      }

      const result =
        await pool.query(

          `
          SELECT
            id,
            nominal,
            nominal_beras,
            petugas,
            tanggal
          FROM pembayaran_sahriyah
          WHERE tagihan_id = $1
          ORDER BY tanggal DESC
          `,

          [tagihanId]

        );

      res.json({

        success: true,

        tagihan_id: tagihanId,

        santri_id: santriId,

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
// GET /wali-app/rfid/saldo
// ======================

router.get(

  "/rfid/saldo",

  waliAppAuthMiddleware,

  waliSantriGuard,

  async (req, res) => {

    const santriId = req.santriId;

    try {

      const result =
        await pool.query(

          `
          SELECT
            s.id AS santri_id,
            s.nama,
            s.uid_rfid,
            s.saldo,
            s.limit_harian
          FROM santri s
          WHERE s.id = $1
          LIMIT 1
          `,

          [santriId]

        );

      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({

          success: false,

          error: "Santri tidak ditemukan"

        });

      }

      const row = result.rows[0];

      res.json({

        success: true,

        data: {

          santri_id: row.santri_id,

          nama: row.nama,

          uid_rfid: row.uid_rfid,

          saldo: Number(
            row.saldo || 0
          ),

          limit_harian: Number(
            row.limit_harian || 0
          ),

          kartu_aktif:
            row.uid_rfid !== null

        }

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
// GET /wali-app/rfid/mutasi
// ======================

router.get(

  "/rfid/mutasi",

  waliAppAuthMiddleware,

  waliSantriGuard,

  async (req, res) => {

    const santriId = req.santriId;

    const limit =
      Math.min(
        Number(req.query.limit) || 20,
        100
      );

    const offset =
      Math.max(
        Number(req.query.offset) || 0,
        0
      );

    try {

      const result =
        await pool.query(

          `
          SELECT
            tr.id,
            tr.created_at,
            tr.trx_type,
            tr.nominal,
            tr.saldo_awal,
            tr.saldo_akhir,
            tr.trx_id,
            m.nama_merchant
          FROM transaksi_rfid tr
          LEFT JOIN merchant_rfid m
            ON m.id = tr.merchant_id
          WHERE tr.santri_id = $1
          ORDER BY tr.created_at DESC
          LIMIT $2
          OFFSET $3
          `,

          [santriId, limit, offset]

        );

      const countResult =
        await pool.query(

          `
          SELECT COUNT(*) AS total
          FROM transaksi_rfid
          WHERE santri_id = $1
          `,

          [santriId]

        );

      res.json({

        success: true,

        santri_id: santriId,

        pagination: {

          limit,

          offset,

          total: Number(
            countResult.rows[0]?.total || 0
          )

        },

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
// GET /wali-app/hafalan
// ======================

router.get(

  "/hafalan",

  waliAppAuthMiddleware,

  waliSantriGuard,

  async (req, res) => {

    const santriId = req.santriId;

    const now = new Date();

    const bulan =
      req.query.bulan
        ? Number(req.query.bulan)
        : now.getMonth() + 1;

    const tahun =
      req.query.tahun
        ? Number(req.query.tahun)
        : now.getFullYear();

    if (
      !Number.isInteger(bulan) ||
      bulan < 1 ||
      bulan > 12
    ) {

      return res.status(400).json({

        success: false,

        error: "Parameter bulan tidak valid (1-12)"

      });

    }

    if (
      !Number.isInteger(tahun) ||
      tahun < 2000 ||
      tahun > 2100
    ) {

      return res.status(400).json({

        success: false,

        error: "Parameter tahun tidak valid"

      });

    }

    try {

      const dataResult =
        await pool.query(

          `
          SELECT
            id,
            santri_id,
            tanggal,
            kitab,
            awal,
            akhir,
            catatan,
            bulan,
            tahun,
            pekan
          FROM hafalan
          WHERE santri_id = $1
            AND bulan = $2
            AND tahun = $3
          ORDER BY pekan ASC, tanggal ASC
          `,

          [santriId, bulan, tahun]

        );

      const ringkasanResult =
        await pool.query(

          `
          SELECT
            COUNT(*)                         AS total_entri,
            COUNT(DISTINCT pekan)            AS total_pekan
          FROM hafalan
          WHERE santri_id = $1
            AND bulan = $2
            AND tahun = $3
          `,

          [santriId, bulan, tahun]

        );

      const raw = ringkasanResult.rows[0];

      res.json({

        success: true,

        santri_id: santriId,

        bulan,

        tahun,

        ringkasan: {

          total_entri: Number(raw?.total_entri || 0),

          total_pekan: Number(raw?.total_pekan || 0)

        },

        data: dataResult.rows

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
// GET /wali-app/nilai
// ======================

router.get(

  "/nilai",

  waliAppAuthMiddleware,

  waliSantriGuard,

  async (req, res) => {

    const santriId = req.santriId;

    const now = new Date();

    const bulan =
      req.query.bulan
        ? Number(req.query.bulan)
        : now.getMonth() + 1;

    const tahun =
      req.query.tahun
        ? Number(req.query.tahun)
        : now.getFullYear();

    if (
      !Number.isInteger(bulan) ||
      bulan < 1 ||
      bulan > 12
    ) {

      return res.status(400).json({

        success: false,

        error: "Parameter bulan tidak valid (1-12)"

      });

    }

    if (
      !Number.isInteger(tahun) ||
      tahun < 2000 ||
      tahun > 2100
    ) {

      return res.status(400).json({

        success: false,

        error: "Parameter tahun tidak valid"

      });

    }

    try {

      const dataResult =
        await pool.query(

          `
          SELECT
            id,
            santri_id,
            tanggal,
            mapel,
            nilai,
            bulan,
            tahun
          FROM nilai_mingguan
          WHERE santri_id = $1
            AND bulan = $2
            AND tahun = $3
          ORDER BY tanggal DESC, mapel ASC
          `,

          [santriId, bulan, tahun]

        );

      const ringkasanResult =
        await pool.query(

          `
          SELECT
            COUNT(*)                                     AS total_mapel,
            COALESCE(ROUND(AVG(nilai::numeric), 1), 0)  AS rata_rata,
            COALESCE(MAX(nilai::numeric), 0)             AS nilai_tertinggi,
            COALESCE(MIN(nilai::numeric), 0)             AS nilai_terendah
          FROM nilai_mingguan
          WHERE santri_id = $1
            AND bulan = $2
            AND tahun = $3
          `,

          [santriId, bulan, tahun]

        );

      const raw = ringkasanResult.rows[0];

      res.json({

        success: true,

        santri_id: santriId,

        bulan,

        tahun,

        ringkasan: {

          total_mapel: Number(raw?.total_mapel || 0),

          rata_rata: Number(raw?.rata_rata || 0),

          nilai_tertinggi: Number(raw?.nilai_tertinggi || 0),

          nilai_terendah: Number(raw?.nilai_terendah || 0)

        },

        data: dataResult.rows

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
// GET /wali-app/pelanggaran
// ======================

router.get(

  "/pelanggaran",

  waliAppAuthMiddleware,

  waliSantriGuard,

  async (req, res) => {

    const santriId = req.santriId;

    const limit =
      Math.min(
        Number(req.query.limit) || 30,
        100
      );

    const offset =
      Math.max(
        Number(req.query.offset) || 0,
        0
      );

    try {

      const dataResult =
        await pool.query(

          `
          SELECT
            id,
            santri_id,
            tanggal,
            jam,
            jenis,
            tingkat,
            poin,
            catatan,
            tindakan,
            petugas
          FROM pelanggaran
          WHERE santri_id = $1
          ORDER BY tanggal DESC, id DESC
          LIMIT $2
          OFFSET $3
          `,

          [santriId, limit, offset]

        );

      const ringkasanResult =
        await pool.query(

          `
          SELECT
            COUNT(*)      AS total,
            COALESCE(SUM(poin), 0) AS total_poin
          FROM pelanggaran
          WHERE santri_id = $1
          `,

          [santriId]

        );

      const countResult =
        await pool.query(

          `
          SELECT COUNT(*) AS total
          FROM pelanggaran
          WHERE santri_id = $1
          `,

          [santriId]

        );

      const raw = ringkasanResult.rows[0];

      res.json({

        success: true,

        santri_id: santriId,

        ringkasan: {

          total: Number(raw?.total || 0),

          total_poin: Number(raw?.total_poin || 0)

        },

        pagination: {

          limit,

          offset,

          total: Number(
            countResult.rows[0]?.total || 0
          )

        },

        data: dataResult.rows

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
// GET /wali-app/perizinan
// ======================

router.get(

  "/perizinan",

  waliAppAuthMiddleware,

  waliSantriGuard,

  async (req, res) => {

    const santriId = req.santriId;

    const limit =
      Math.min(
        Number(req.query.limit) || 20,
        100
      );

    const offset =
      Math.max(
        Number(req.query.offset) || 0,
        0
      );

    try {

      const result =
        await pool.query(

          `
          SELECT
            id,
            santri_id,
            tanggal,
            alasan,
            tujuan,
            tanggal_kembali,
            jam_keluar,
            jam_kembali,
            status,
            catatan
          FROM perizinan
          WHERE santri_id = $1
          ORDER BY tanggal DESC, id DESC
          LIMIT $2
          OFFSET $3
          `,

          [santriId, limit, offset]

        );

      const countResult =
        await pool.query(

          `
          SELECT COUNT(*) AS total
          FROM perizinan
          WHERE santri_id = $1
          `,

          [santriId]

        );

      res.json({

        success: true,

        santri_id: santriId,

        pagination: {

          limit,

          offset,

          total: Number(
            countResult.rows[0]?.total || 0
          )

        },

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
// GET /wali-app/absensi
// ======================

router.get(

  "/absensi",

  waliAppAuthMiddleware,

  waliSantriGuard,

  async (req, res) => {

    const santriId = req.santriId;

    const now = new Date();

    const bulan =
      req.query.bulan
        ? Number(req.query.bulan)
        : now.getMonth() + 1;

    const tahun =
      req.query.tahun
        ? Number(req.query.tahun)
        : now.getFullYear();

    if (
      !Number.isInteger(bulan) ||
      bulan < 1 ||
      bulan > 12
    ) {

      return res.status(400).json({

        success: false,

        error: "Parameter bulan tidak valid (1-12)"

      });

    }

    if (
      !Number.isInteger(tahun) ||
      tahun < 2000 ||
      tahun > 2100
    ) {

      return res.status(400).json({

        success: false,

        error: "Parameter tahun tidak valid"

      });

    }

    try {

      // =====================
      // RINGKASAN
      // =====================

      const ringkasanResult =
        await pool.query(

          `
          SELECT
            COUNT(*) FILTER (
              WHERE status IN ('H', 'Hadir')
            ) AS hadir,
            COUNT(*) FILTER (
              WHERE status IN ('I', 'Izin')
            ) AS izin,
            COUNT(*) FILTER (
              WHERE status IN ('S', 'Sakit')
            ) AS sakit,
            COUNT(*) FILTER (
              WHERE status IN ('A', 'Alpa', 'Alfa')
            ) AS alpa,
            COUNT(*) AS total
          FROM absensi
          WHERE santri_id = $1
            AND EXTRACT(MONTH FROM tanggal::date) = $2
            AND EXTRACT(YEAR  FROM tanggal::date) = $3
          `,

          [santriId, bulan, tahun]

        );

      // =====================
      // RIWAYAT PER HARI
      // =====================

      const riwayatResult =
        await pool.query(

          `
          SELECT
            id,
            tanggal,
            sesi,
            status
          FROM absensi
          WHERE santri_id = $1
            AND EXTRACT(MONTH FROM tanggal::date) = $2
            AND EXTRACT(YEAR  FROM tanggal::date) = $3
          ORDER BY tanggal ASC, sesi ASC
          `,

          [santriId, bulan, tahun]

        );

      const raw =
        ringkasanResult.rows[0];

      res.json({

        success: true,

        santri_id: santriId,

        bulan,

        tahun,

        ringkasan: {

          hadir:
            Number(raw?.hadir || 0),

          izin:
            Number(raw?.izin || 0),

          sakit:
            Number(raw?.sakit || 0),

          alpa:
            Number(raw?.alpa || 0),

          total:
            Number(raw?.total || 0)

        },

        riwayat: riwayatResult.rows

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
// PUT /wali-app/pin
// ======================

router.put(

  "/pin",

  waliAppAuthMiddleware,

  async (req, res) => {

    const {
      pin_lama,
      pin_baru,
      konfirmasi_pin
    } = req.body;

    const akunId =
      req.wali?.wali_akun_id;

    // ── Validasi input dasar ──

    if (
      !pin_lama ||
      !pin_baru ||
      !konfirmasi_pin
    ) {

      return res.status(400).json({

        success: false,

        error:
          "pin_lama, pin_baru, dan konfirmasi_pin wajib diisi"

      });

    }

    // ── Konfirmasi harus cocok ──

    if (
      String(pin_baru) !==
      String(konfirmasi_pin)
    ) {

      return res.status(400).json({

        success: false,

        error:
          "PIN baru dan konfirmasi PIN tidak cocok"

      });

    }

    // ── PIN baru harus valid (6 digit, tidak trivial) ──

    if (
      !waliAppService.isValidPin(pin_baru)
    ) {

      return res.status(400).json({

        success: false,

        error:
          "PIN baru tidak valid. Gunakan 6 digit angka dan hindari PIN yang mudah ditebak."

      });

    }

    // ── PIN baru tidak boleh sama dengan PIN lama ──

    if (
      String(pin_lama) ===
      String(pin_baru)
    ) {

      return res.status(400).json({

        success: false,

        error:
          "PIN baru tidak boleh sama dengan PIN lama"

      });

    }

    try {

      // ── Ambil akun ──

      const akunResult =
        await pool.query(

          `
          SELECT id, nomor_hp, pin_hash, status
          FROM wali_akun
          WHERE id = $1
          LIMIT 1
          `,

          [akunId]

        );

      const akun =
        akunResult.rows[0];

      if (!akun) {

        return res.status(401).json({

          success: false,

          error: "Akun tidak ditemukan"

        });

      }

      if (akun.status !== "active") {

        return res.status(401).json({

          success: false,

          error: "Akun tidak aktif"

        });

      }

      // ── Verifikasi PIN lama ──

      const pinLamaValid =
        await waliAppService.verifyPin(
          pin_lama,
          akun.pin_hash
        );

      if (!pinLamaValid) {

        return res.status(401).json({

          success: false,

          error: "PIN lama tidak benar"

        });

      }

      // ── Hash PIN baru ──

      const newHash =
        await waliAppService.hashPin(
          pin_baru
        );

      // ── Simpan ──

      await pool.query(

        `
        UPDATE wali_akun
        SET
          pin_hash        = $1,
          must_change_pin = false,
          updated_at      = NOW()
        WHERE id = $2
        `,

        [newHash, akunId]

      );

      // ── Audit ──

      await waliAppService.writeAudit({

        nomorHp:   akun.nomor_hp,

        event:     "PIN_CHANGED",

        ipAddress:
          req.headers["x-forwarded-for"] ||
          req.socket?.remoteAddress ||
          null,

        userAgent:
          req.headers["user-agent"] || null

      });

      res.json({

        success: true,

        message:
          "PIN berhasil diubah. Gunakan PIN baru untuk login berikutnya."

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

// ================================
// GET /wali-app/profil-pesantren
// ================================

router.get(

  "/profil-pesantren",

  waliAppAuthMiddleware,

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
// GET /wali-app/pengumuman
// ======================

router.get(

  "/pengumuman",

  waliAppAuthMiddleware,

  async (req, res) => {

    try {

      const limit =
        Math.min(
          Number(req.query.limit) || 20,
          50
        );

      const offset =
        Number(req.query.offset) || 0;

      const countResult =
        await pool.query(

          `
          SELECT COUNT(*) AS total
          FROM pengumuman
          WHERE is_active = true
            AND (
              expires_at IS NULL
              OR expires_at > NOW()
            )
          `

        );

      const dataResult =
        await pool.query(

          `
          SELECT
            id,
            judul,
            isi,
            prioritas,
            published_at,
            expires_at,
            created_at
          FROM pengumuman
          WHERE is_active = true
            AND (
              expires_at IS NULL
              OR expires_at > NOW()
            )
          ORDER BY
            CASE prioritas
              WHEN 'urgent'  THEN 1
              WHEN 'penting' THEN 2
              ELSE 3
            END,
            published_at DESC
          LIMIT $1 OFFSET $2
          `,

          [limit, offset]

        );

      res.json({

        success: true,

        total: Number(
          countResult.rows[0]?.total || 0
        ),

        limit,

        offset,

        data: dataResult.rows

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

module.exports = router;
