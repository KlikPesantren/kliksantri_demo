const express = require("express");
const router = express.Router();
const pool = require("../db");
const requirePermission = require("../middleware/requirePermission");
const {
  resolveUnitAccess,
  getUnitByKode,
  isUnitAllowed,
} = require("../middleware/unitScope");

const VALID_JENIS = new Set(["Masuk", "Keluar"]);

function parsePositiveInt(value, fallback) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n <= 0) {
    return fallback;
  }
  return n;
}

function validateJenis(jenis) {
  if (!VALID_JENIS.has(jenis)) {
    return "jenis harus Masuk atau Keluar";
  }
  return null;
}

function validateNominal(nominal) {
  const n = Number(nominal);
  if (!Number.isFinite(n) || n <= 0) {
    return "nominal harus lebih dari 0";
  }
  return null;
}

async function loadAccess(req, res) {
  const access = await resolveUnitAccess(req);
  if (access.denied) {
    res.status(access.status || 403).json({
      success: false,
      error: access.error || "Akses ditolak",
    });
    return null;
  }
  return access;
}

async function loadUnit(req, res, access) {
  const unit = await getUnitByKode(req.params.kode, access.tenantId);
  if (!unit || !unit.is_active) {
    res.status(404).json({
      success: false,
      error: "Unit tidak ditemukan",
    });
    return null;
  }

  if (!isUnitAllowed(access, unit.id)) {
    res.status(403).json({
      success: false,
      error: "Akses unit ditolak",
    });
    return null;
  }

  return unit;
}

function requireManage(access, res) {
  if (!access.canManage) {
    res.status(403).json({
      success: false,
      error: "Akses ditolak — hanya read-only",
    });
    return false;
  }
  return true;
}

// GET /kas-instansi/konsolidasi — harus sebelum /:kode/*
router.get(
  "/konsolidasi",
  requirePermission("kas_instansi.konsolidasi"),
  async (req, res) => {
    try {
      const role = req.user?.role;
      if (role !== "superadmin" && role !== "pimpinan_yayasan") {
        return res.status(403).json({
          success: false,
          error: "Akses konsolidasi hanya untuk pimpinan yayasan",
        });
      }

      const bulan = parsePositiveInt(req.query.bulan, new Date().getMonth() + 1);
      const tahun = parsePositiveInt(req.query.tahun, new Date().getFullYear());
      const tenantId = req.tenantId;

      const pondokResult = await pool.query(
        `
        SELECT
          COALESCE(SUM(nominal) FILTER (
            WHERE jenis = 'Masuk'
              AND EXTRACT(MONTH FROM tanggal) = $1
              AND EXTRACT(YEAR FROM tanggal) = $2
          ), 0) AS pemasukan_bulan,
          COALESCE(SUM(nominal) FILTER (
            WHERE jenis = 'Keluar'
              AND EXTRACT(MONTH FROM tanggal) = $1
              AND EXTRACT(YEAR FROM tanggal) = $2
          ), 0) AS pengeluaran_bulan,
          COALESCE(SUM(CASE WHEN jenis = 'Masuk' THEN nominal ELSE -nominal END), 0) AS saldo_akhir_alltime
        FROM buku_kas
        WHERE tenant_id = $3
        `,
        [bulan, tahun, tenantId]
      );

      const pondok = pondokResult.rows[0];
      const pondokMasuk = Number(pondok.pemasukan_bulan);
      const pondokKeluar = Number(pondok.pengeluaran_bulan);
      const pondokSaldoBulan = pondokMasuk - pondokKeluar;
      const pondokAllTime = Number(pondok.saldo_akhir_alltime);

      const unitsResult = await pool.query(
        `
        SELECT
          u.id,
          u.kode,
          u.nama,
          u.sort_order,
          COALESCE(SUM(t.nominal) FILTER (
            WHERE t.jenis = 'Masuk'
              AND EXTRACT(MONTH FROM t.tanggal) = $1
              AND EXTRACT(YEAR FROM t.tanggal) = $2
          ), 0) AS pemasukan_bulan,
          COALESCE(SUM(t.nominal) FILTER (
            WHERE t.jenis = 'Keluar'
              AND EXTRACT(MONTH FROM t.tanggal) = $1
              AND EXTRACT(YEAR FROM t.tanggal) = $2
          ), 0) AS pengeluaran_bulan,
          COALESCE(SUM(
            CASE WHEN t.jenis = 'Masuk' THEN t.nominal ELSE -t.nominal END
          ), 0) AS saldo_akhir_alltime
        FROM unit_pendidikan u
        LEFT JOIN kas_instansi_transaksi t
          ON t.unit_id = u.id
         AND t.tenant_id = u.tenant_id
        WHERE u.is_active = true
          AND u.tenant_id = $3
        GROUP BY u.id, u.kode, u.nama, u.sort_order
        ORDER BY u.sort_order ASC, u.id ASC
        `,
        [bulan, tahun, tenantId]
      );

      const units = unitsResult.rows.map((row) => {
        const pemasukan = Number(row.pemasukan_bulan);
        const pengeluaran = Number(row.pengeluaran_bulan);
        return {
          kode: row.kode,
          nama: row.nama,
          pemasukan_bulan: pemasukan,
          pengeluaran_bulan: pengeluaran,
          saldo_bulan: pemasukan - pengeluaran,
          saldo_akhir_alltime: Number(row.saldo_akhir_alltime),
          readonly: true,
        };
      });

      const totalPemasukanBulan =
        pondokMasuk +
        units.reduce((sum, u) => sum + u.pemasukan_bulan, 0);
      const totalPengeluaranBulan =
        pondokKeluar +
        units.reduce((sum, u) => sum + u.pengeluaran_bulan, 0);
      const totalSaldoBulan = totalPemasukanBulan - totalPengeluaranBulan;
      const totalKasYayasan =
        pondokAllTime +
        units.reduce((sum, u) => sum + u.saldo_akhir_alltime, 0);

      res.json({
        success: true,
        data: {
          periode: { bulan, tahun },
          kpi: {
            total_kas_yayasan: totalKasYayasan,
            total_pemasukan_bulan: totalPemasukanBulan,
            total_pengeluaran_bulan: totalPengeluaranBulan,
            jumlah_unit_aktif: units.length,
          },
          kas_pondok: {
            kode: "PONDOK",
            label: "Kas Pondok (Buku Kas Pesantren)",
            pemasukan_bulan: pondokMasuk,
            pengeluaran_bulan: pondokKeluar,
            saldo_bulan: pondokSaldoBulan,
            saldo_akhir_alltime: pondokAllTime,
            readonly: true,
            source: "buku_kas",
          },
          units,
          total_yayasan: {
            pemasukan_bulan: totalPemasukanBulan,
            pengeluaran_bulan: totalPengeluaranBulan,
            saldo_bulan: totalSaldoBulan,
            saldo_akhir_alltime: totalKasYayasan,
          },
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// GET /kas-instansi/units
router.get(
  "/units",
  requirePermission("kas_instansi.view"),
  async (req, res) => {
    try {
      const access = await loadAccess(req, res);
      if (!access) return;

      let query;
      let params = [];

      if (access.mode === "ALL") {
        query = `
          SELECT id, kode, nama, is_active, sort_order
          FROM unit_pendidikan
          WHERE is_active = true
            AND tenant_id = $1
          ORDER BY sort_order ASC, id ASC
        `;
        params = [access.tenantId];
      } else {
        query = `
          SELECT u.id, u.kode, u.nama, u.is_active, u.sort_order
          FROM unit_pendidikan u
          WHERE u.is_active = true
            AND u.tenant_id = $2
            AND u.id = ANY($1::int[])
          ORDER BY u.sort_order ASC, u.id ASC
        `;
        params = [access.unitIds, access.tenantId];
      }

      const { rows } = await pool.query(query, params);

      res.json({
        success: true,
        data: rows.map((row) => ({
          ...row,
          can_manage: Boolean(access.canManage),
        })),
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// GET /kas-instansi/:kode/ringkasan
router.get(
  "/:kode/ringkasan",
  requirePermission("kas_instansi.view"),
  async (req, res) => {
    try {
      const access = await loadAccess(req, res);
      if (!access) return;

      const unit = await loadUnit(req, res, access);
      if (!unit) return;

      const bulan = parsePositiveInt(req.query.bulan, new Date().getMonth() + 1);
      const tahun = parsePositiveInt(req.query.tahun, new Date().getFullYear());

      const { rows } = await pool.query(
        `
        SELECT
          COALESCE(SUM(nominal) FILTER (
            WHERE jenis = 'Masuk'
              AND EXTRACT(MONTH FROM tanggal) = $2
              AND EXTRACT(YEAR FROM tanggal) = $3
          ), 0) AS pemasukan_bulan,
          COALESCE(SUM(nominal) FILTER (
            WHERE jenis = 'Keluar'
              AND EXTRACT(MONTH FROM tanggal) = $2
              AND EXTRACT(YEAR FROM tanggal) = $3
          ), 0) AS pengeluaran_bulan,
          COALESCE(SUM(nominal) FILTER (
            WHERE jenis = 'Masuk'
              AND EXTRACT(YEAR FROM tanggal) = $3
          ), 0) AS pemasukan_tahun,
          COALESCE(SUM(nominal) FILTER (
            WHERE jenis = 'Keluar'
              AND EXTRACT(YEAR FROM tanggal) = $3
          ), 0) AS pengeluaran_tahun,
          COALESCE(SUM(CASE WHEN jenis = 'Masuk' THEN nominal ELSE -nominal END), 0) AS saldo_akhir_alltime,
          COUNT(*) FILTER (
            WHERE EXTRACT(MONTH FROM tanggal) = $2
              AND EXTRACT(YEAR FROM tanggal) = $3
          ) AS jumlah_transaksi_bulan
        FROM kas_instansi_transaksi
        WHERE unit_id = $1
          AND tenant_id = $4
        `,
        [unit.id, bulan, tahun, access.tenantId]
      );

      const stats = rows[0];
      const pemasukanBulan = Number(stats.pemasukan_bulan);
      const pengeluaranBulan = Number(stats.pengeluaran_bulan);
      const pemasukanTahun = Number(stats.pemasukan_tahun);
      const pengeluaranTahun = Number(stats.pengeluaran_tahun);

      res.json({
        success: true,
        data: {
          unit: {
            kode: unit.kode,
            nama: unit.nama,
          },
          periode: { bulan, tahun },
          pemasukan_bulan: pemasukanBulan,
          pengeluaran_bulan: pengeluaranBulan,
          saldo_bulan: pemasukanBulan - pengeluaranBulan,
          pemasukan_tahun: pemasukanTahun,
          pengeluaran_tahun: pengeluaranTahun,
          saldo_akhir_tahun: pemasukanTahun - pengeluaranTahun,
          saldo_akhir_alltime: Number(stats.saldo_akhir_alltime),
          jumlah_transaksi_bulan: Number(stats.jumlah_transaksi_bulan),
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// GET /kas-instansi/:kode/transaksi
router.get(
  "/:kode/transaksi",
  requirePermission("kas_instansi.view"),
  async (req, res) => {
    try {
      const access = await loadAccess(req, res);
      if (!access) return;

      const unit = await loadUnit(req, res, access);
      if (!unit) return;

      const bulan = parsePositiveInt(req.query.bulan, new Date().getMonth() + 1);
      const tahun = parsePositiveInt(req.query.tahun, new Date().getFullYear());
      const page = parsePositiveInt(req.query.page, 1);
      const limit = Math.min(parsePositiveInt(req.query.limit, 50), 200);
      const offset = (page - 1) * limit;
      const jenis = req.query.jenis || null;
      const q = (req.query.q || "").trim();

      const params = [unit.id, bulan, tahun, access.tenantId];
      let extraWhere = " AND t.tenant_id = $4";

      if (jenis && VALID_JENIS.has(jenis)) {
        params.push(jenis);
        extraWhere += ` AND t.jenis = $${params.length}`;
      }

      if (q) {
        params.push(`%${q.toLowerCase()}%`);
        extraWhere += ` AND (
          LOWER(t.kategori) LIKE $${params.length}
          OR LOWER(COALESCE(t.keterangan, '')) LIKE $${params.length}
          OR LOWER(COALESCE(t.petugas, '')) LIKE $${params.length}
        )`;
      }

      const countResult = await pool.query(
        `
        SELECT COUNT(*) AS total
        FROM kas_instansi_transaksi t
        WHERE t.unit_id = $1
          AND EXTRACT(MONTH FROM t.tanggal) = $2
          AND EXTRACT(YEAR FROM t.tanggal) = $3
          ${extraWhere}
        `,
        params
      );

      params.push(limit, offset);

      const { rows } = await pool.query(
        `
        WITH filtered AS (
          SELECT
            t.id,
            t.unit_id,
            t.tanggal,
            t.jenis,
            t.kategori,
            t.keterangan,
            t.nominal,
            t.petugas,
            t.created_by,
            t.created_at
          FROM kas_instansi_transaksi t
          WHERE t.unit_id = $1
            AND EXTRACT(MONTH FROM t.tanggal) = $2
            AND EXTRACT(YEAR FROM t.tanggal) = $3
            ${extraWhere}
        ),
        ordered AS (
          SELECT
            f.*,
            SUM(CASE WHEN f.jenis = 'Masuk' THEN f.nominal ELSE -f.nominal END)
              OVER (ORDER BY f.tanggal ASC, f.id ASC) AS saldo_berjalan
          FROM filtered f
        )
        SELECT *
        FROM ordered
        ORDER BY tanggal DESC, id DESC
        LIMIT $${params.length - 1}
        OFFSET $${params.length}
        `,
        params
      );

      res.json({
        success: true,
        data: {
          items: rows,
          pagination: {
            page,
            limit,
            total: Number(countResult.rows[0].total),
          },
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// POST /kas-instansi/:kode/transaksi
router.post(
  "/:kode/transaksi",
  requirePermission("kas_instansi.manage"),
  async (req, res) => {
    try {
      const access = await loadAccess(req, res);
      if (!access) return;
      if (!requireManage(access, res)) return;

      const unit = await loadUnit(req, res, access);
      if (!unit) return;

      const { tanggal, jenis, kategori, keterangan, nominal, petugas } =
        req.body;

      const jenisErr = validateJenis(jenis);
      if (jenisErr) {
        return res.status(400).json({ success: false, error: jenisErr });
      }

      const nominalErr = validateNominal(nominal);
      if (nominalErr) {
        return res.status(400).json({ success: false, error: nominalErr });
      }

      if (!kategori || !String(kategori).trim()) {
        return res
          .status(400)
          .json({ success: false, error: "kategori wajib diisi" });
      }

      const { rows } = await pool.query(
        `
        INSERT INTO kas_instansi_transaksi (
          unit_id, tenant_id, tanggal, jenis, kategori, keterangan, nominal, petugas, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        `,
        [
          unit.id,
          access.tenantId,
          tanggal || new Date().toISOString().split("T")[0],
          jenis,
          String(kategori).trim(),
          keterangan || null,
          Number(nominal),
          petugas || req.user.nama || null,
          req.user.id,
        ]
      );

      res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// PUT /kas-instansi/:kode/transaksi/:id
router.put(
  "/:kode/transaksi/:id",
  requirePermission("kas_instansi.manage"),
  async (req, res) => {
    try {
      const access = await loadAccess(req, res);
      if (!access) return;
      if (!requireManage(access, res)) return;

      const unit = await loadUnit(req, res, access);
      if (!unit) return;

      const { tanggal, jenis, kategori, keterangan, nominal, petugas } =
        req.body;

      const jenisErr = validateJenis(jenis);
      if (jenisErr) {
        return res.status(400).json({ success: false, error: jenisErr });
      }

      const nominalErr = validateNominal(nominal);
      if (nominalErr) {
        return res.status(400).json({ success: false, error: nominalErr });
      }

      if (!kategori || !String(kategori).trim()) {
        return res
          .status(400)
          .json({ success: false, error: "kategori wajib diisi" });
      }

      const { rows } = await pool.query(
        `
        UPDATE kas_instansi_transaksi
        SET
          tanggal = $1,
          jenis = $2,
          kategori = $3,
          keterangan = $4,
          nominal = $5,
          petugas = $6
        WHERE id = $7
          AND unit_id = $8
          AND tenant_id = $9
        RETURNING *
        `,
        [
          tanggal,
          jenis,
          String(kategori).trim(),
          keterangan || null,
          Number(nominal),
          petugas || req.user.nama || null,
          req.params.id,
          unit.id,
          access.tenantId,
        ]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Transaksi tidak ditemukan",
        });
      }

      res.json({ success: true, data: rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// DELETE /kas-instansi/:kode/transaksi/:id
router.delete(
  "/:kode/transaksi/:id",
  requirePermission("kas_instansi.manage"),
  async (req, res) => {
    try {
      const access = await loadAccess(req, res);
      if (!access) return;
      if (!requireManage(access, res)) return;

      const unit = await loadUnit(req, res, access);
      if (!unit) return;

      const { rowCount } = await pool.query(
        `
        DELETE FROM kas_instansi_transaksi
        WHERE id = $1
          AND unit_id = $2
          AND tenant_id = $3
        `,
        [req.params.id, unit.id, access.tenantId]
      );

      if (rowCount === 0) {
        return res.status(404).json({
          success: false,
          error: "Transaksi tidak ditemukan",
        });
      }

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

module.exports = router;
