const express = require("express");
const router = express.Router();
const pool = require("../db");
const requirePermission = require("../middleware/requirePermission");
const {
  resolveProgramUnitAccess,
  getUnitByKode,
  getUnitById,
  isUnitAllowed,
  unitScopeSql,
} = require("../middleware/programUnitAccess");

const VALID_STATUS = new Set(["draft", "berjalan", "selesai", "dibatalkan"]);
const VALID_EFEKTIVITAS = new Set([
  "sangat_efektif",
  "efektif",
  "cukup_efektif",
  "kurang_efektif",
  "tidak_efektif",
]);

function parsePositiveInt(value, fallback) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n <= 0) {
    return fallback;
  }
  return n;
}

function parseNonNegativeNumber(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    return fallback;
  }
  return n;
}

function computeCapaianPersen(targetAngka, realisasiAngka) {
  const target = Number(targetAngka);
  const realisasi = Number(realisasiAngka);
  if (!Number.isFinite(target) || target <= 0) {
    return 0;
  }
  return Math.round((realisasi / target) * 10000) / 100;
}

function mapProgramRow(row) {
  return {
    ...row,
    target_angka: Number(row.target_angka),
    realisasi_angka: Number(row.realisasi_angka),
    capaian_persen: computeCapaianPersen(row.target_angka, row.realisasi_angka),
    progress_terakhir:
      row.progress_terakhir != null ? Number(row.progress_terakhir) : null,
  };
}

async function loadAccess(req, res) {
  const access = await resolveProgramUnitAccess(req);
  if (access.denied) {
    res.status(access.status || 403).json({
      success: false,
      error: access.error || "Akses ditolak",
    });
    return null;
  }
  return access;
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

async function loadProgramById(id, access) {
  const params = [id, access.tenantId];
  const scope = unitScopeSql(access, "p.unit_id", 3);
  params.push(...scope.params);
  const { rows } = await pool.query(
    `
    SELECT
      p.*,
      u.kode AS unit_kode,
      u.nama AS unit_nama,
      (
        SELECT e.progress
        FROM program_unit_evaluasi e
        WHERE e.program_id = p.id
          AND e.tenant_id = p.tenant_id
        ORDER BY e.tahun DESC, e.bulan DESC, e.id DESC
        LIMIT 1
      ) AS progress_terakhir
    FROM program_unit p
    JOIN unit_pendidikan u ON u.id = p.unit_id AND u.tenant_id = p.tenant_id
    WHERE p.id = $1
      AND p.tenant_id = $2
      AND p.status <> 'dibatalkan'
      ${scope.clause}
    `,
    params
  );
  return rows[0] || null;
}

async function loadEvaluasiById(evaluasiId, access) {
  const params = [evaluasiId, access.tenantId];
  const scope = unitScopeSql(access, "p.unit_id", 3);
  params.push(...scope.params);
  const { rows } = await pool.query(
    `
    SELECT
      e.*,
      p.unit_id,
      p.nama_program,
      u.kode AS unit_kode
    FROM program_unit_evaluasi e
    JOIN program_unit p ON p.id = e.program_id AND p.tenant_id = e.tenant_id
    JOIN unit_pendidikan u ON u.id = p.unit_id AND u.tenant_id = p.tenant_id
    WHERE e.id = $1
      AND e.tenant_id = $2
      ${scope.clause}
    `,
    params
  );
  return rows[0] || null;
}

async function resolveUnitFromQuery(queryUnit, access, res) {
  if (!queryUnit) {
    return null;
  }

  const unit = await getUnitByKode(queryUnit, access.tenantId);
  if (!unit || !unit.is_active) {
    res.status(404).json({
      success: false,
      error: "Unit tidak ditemukan",
    });
    return undefined;
  }

  if (!isUnitAllowed(access, unit.id)) {
    res.status(403).json({
      success: false,
      error: "Akses unit ditolak",
    });
    return undefined;
  }

  return unit;
}

async function buildSummary(access, filters) {
  const params = [access.tenantId];
  let idx = 2;
  let where = "WHERE p.status <> 'dibatalkan' AND p.tenant_id = $1";

  const scope = unitScopeSql(access, "p.unit_id", idx);
  where += scope.clause;
  params.push(...scope.params);
  idx = scope.nextIndex;

  if (filters.unitId) {
    where += ` AND p.unit_id = $${idx}`;
    params.push(filters.unitId);
    idx += 1;
  }

  if (filters.status && VALID_STATUS.has(filters.status)) {
    where += ` AND p.status = $${idx}`;
    params.push(filters.status);
    idx += 1;
  }

  if (filters.q) {
    where += ` AND (
      p.nama_program ILIKE $${idx}
      OR p.target_program ILIKE $${idx}
      OR p.penanggung_jawab ILIKE $${idx}
      OR p.deskripsi ILIKE $${idx}
    )`;
    params.push(`%${filters.q}%`);
    idx += 1;
  }

  const { rows } = await pool.query(
    `
    SELECT
      COUNT(*)::int AS jumlah_program,
      COUNT(*) FILTER (WHERE p.status = 'berjalan')::int AS program_berjalan,
      COUNT(*) FILTER (WHERE p.status = 'selesai')::int AS program_selesai,
      COALESCE(
        AVG(
          CASE
            WHEN p.target_angka > 0
            THEN (p.realisasi_angka / p.target_angka) * 100
            ELSE NULL
          END
        ),
        0
      ) AS rata_rata_progress
    FROM program_unit p
    ${where}
    `,
    params
  );

  const row = rows[0];
  return {
    jumlah_program: row.jumlah_program,
    program_berjalan: row.program_berjalan,
    program_selesai: row.program_selesai,
    rata_rata_progress: Math.round(Number(row.rata_rata_progress) * 100) / 100,
  };
}

// GET /program-unit/units
router.get(
  "/units",
  requirePermission("program_unit.view"),
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

// GET /program-unit
router.get(
  "/",
  requirePermission("program_unit.view"),
  async (req, res) => {
    try {
      const access = await loadAccess(req, res);
      if (!access) return;

      const page = parsePositiveInt(req.query.page, 1);
      const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
      const offset = (page - 1) * limit;
      const q = String(req.query.q || "").trim();
      const status = String(req.query.status || "").trim().toLowerCase();

      const unitFilter = await resolveUnitFromQuery(req.query.unit, access, res);
      if (unitFilter === undefined) return;

      const filters = {
        unitId: unitFilter?.id || null,
        status: VALID_STATUS.has(status) ? status : null,
        q: q || null,
      };

      const params = [access.tenantId];
      let idx = 2;
      let where = "WHERE p.status <> 'dibatalkan' AND p.tenant_id = $1";

      const scope = unitScopeSql(access, "p.unit_id", idx);
      where += scope.clause;
      params.push(...scope.params);
      idx = scope.nextIndex;

      if (filters.unitId) {
        where += ` AND p.unit_id = $${idx}`;
        params.push(filters.unitId);
        idx += 1;
      }

      if (filters.status) {
        where += ` AND p.status = $${idx}`;
        params.push(filters.status);
        idx += 1;
      }

      if (filters.q) {
        where += ` AND (
          p.nama_program ILIKE $${idx}
          OR p.target_program ILIKE $${idx}
          OR p.penanggung_jawab ILIKE $${idx}
          OR p.deskripsi ILIKE $${idx}
        )`;
        params.push(`%${filters.q}%`);
        idx += 1;
      }

      const countResult = await pool.query(
        `SELECT COUNT(*)::int AS total FROM program_unit p ${where}`,
        params
      );

      const listParams = [...params, limit, offset];
      const { rows } = await pool.query(
        `
        SELECT
          p.*,
          u.kode AS unit_kode,
          u.nama AS unit_nama,
          (
            SELECT e.progress
            FROM program_unit_evaluasi e
            WHERE e.program_id = p.id
              AND e.tenant_id = p.tenant_id
            ORDER BY e.tahun DESC, e.bulan DESC, e.id DESC
            LIMIT 1
          ) AS progress_terakhir
        FROM program_unit p
        JOIN unit_pendidikan u ON u.id = p.unit_id AND u.tenant_id = p.tenant_id
        ${where}
        ORDER BY p.updated_at DESC, p.id DESC
        LIMIT $${idx} OFFSET $${idx + 1}
        `,
        listParams
      );

      const summary = await buildSummary(access, filters);

      res.json({
        success: true,
        data: {
          items: rows.map(mapProgramRow),
          pagination: {
            page,
            limit,
            total: countResult.rows[0].total,
          },
          summary,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// PUT /program-unit/evaluasi/:evaluasiId — before /:id
router.put(
  "/evaluasi/:evaluasiId",
  requirePermission("program_unit.manage"),
  async (req, res) => {
    try {
      const access = await loadAccess(req, res);
      if (!access) return;
      if (!requireManage(access, res)) return;

      const evaluasi = await loadEvaluasiById(req.params.evaluasiId, access);
      if (!evaluasi) {
        return res.status(404).json({
          success: false,
          error: "Evaluasi tidak ditemukan",
        });
      }

      const {
        bulan,
        tahun,
        progress,
        kendala,
        solusi,
        catatan,
        efektivitas,
      } = req.body;

      const bulanNum = parsePositiveInt(bulan, evaluasi.bulan);
      const tahunNum = parsePositiveInt(tahun, evaluasi.tahun);
      const progressNum = Math.min(
        100,
        Math.max(0, parsePositiveInt(progress, evaluasi.progress))
      );

      if (!VALID_EFEKTIVITAS.has(efektivitas)) {
        return res.status(400).json({
          success: false,
          error: "efektivitas tidak valid",
        });
      }

      const { rows } = await pool.query(
        `
        UPDATE program_unit_evaluasi
        SET
          bulan = $1,
          tahun = $2,
          progress = $3,
          kendala = $4,
          solusi = $5,
          catatan = $6,
          efektivitas = $7
        WHERE id = $8
          AND tenant_id = $9
        RETURNING *
        `,
        [
          bulanNum,
          tahunNum,
          progressNum,
          kendala ?? null,
          solusi ?? null,
          catatan ?? null,
          efektivitas,
          evaluasi.id,
          access.tenantId,
        ]
      );

      res.json({ success: true, data: rows[0] });
    } catch (err) {
      if (err.code === "23505") {
        return res.status(409).json({
          success: false,
          error: "Evaluasi untuk bulan/tahun ini sudah ada",
        });
      }
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// DELETE /program-unit/evaluasi/:evaluasiId
router.delete(
  "/evaluasi/:evaluasiId",
  requirePermission("program_unit.manage"),
  async (req, res) => {
    try {
      const access = await loadAccess(req, res);
      if (!access) return;
      if (!requireManage(access, res)) return;

      const evaluasi = await loadEvaluasiById(req.params.evaluasiId, access);
      if (!evaluasi) {
        return res.status(404).json({
          success: false,
          error: "Evaluasi tidak ditemukan",
        });
      }

      await pool.query(
        "DELETE FROM program_unit_evaluasi WHERE id = $1 AND tenant_id = $2",
        [evaluasi.id, access.tenantId]
      );

      res.json({ success: true, message: "Evaluasi dihapus" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// GET /program-unit/:id/evaluasi
router.get(
  "/:id/evaluasi",
  requirePermission("program_unit.view"),
  async (req, res) => {
    try {
      const access = await loadAccess(req, res);
      if (!access) return;

      const program = await loadProgramById(req.params.id, access);
      if (!program) {
        return res.status(404).json({
          success: false,
          error: "Program tidak ditemukan",
        });
      }

      const { rows } = await pool.query(
        `
        SELECT e.*, u.nama AS created_by_nama
        FROM program_unit_evaluasi e
        LEFT JOIN users u ON u.id = e.created_by
        WHERE e.program_id = $1
          AND e.tenant_id = $2
        ORDER BY e.tahun DESC, e.bulan DESC, e.id DESC
        `,
        [program.id, access.tenantId]
      );

      res.json({ success: true, data: rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// POST /program-unit/:id/evaluasi
router.post(
  "/:id/evaluasi",
  requirePermission("program_unit.manage"),
  async (req, res) => {
    try {
      const access = await loadAccess(req, res);
      if (!access) return;
      if (!requireManage(access, res)) return;

      const program = await loadProgramById(req.params.id, access);
      if (!program) {
        return res.status(404).json({
          success: false,
          error: "Program tidak ditemukan",
        });
      }

      const {
        bulan,
        tahun,
        progress,
        kendala,
        solusi,
        catatan,
        efektivitas,
      } = req.body;

      const bulanNum = parsePositiveInt(bulan, null);
      const tahunNum = parsePositiveInt(tahun, null);
      const progressNum = Math.min(
        100,
        Math.max(0, parsePositiveInt(progress, 0))
      );

      if (!bulanNum || bulanNum > 12) {
        return res.status(400).json({
          success: false,
          error: "bulan wajib (1-12)",
        });
      }

      if (!tahunNum) {
        return res.status(400).json({
          success: false,
          error: "tahun wajib",
        });
      }

      if (!VALID_EFEKTIVITAS.has(efektivitas)) {
        return res.status(400).json({
          success: false,
          error: "efektivitas tidak valid",
        });
      }

      const { rows } = await pool.query(
        `
        INSERT INTO program_unit_evaluasi (
          program_id, tenant_id, bulan, tahun, progress, kendala, solusi, catatan,
          efektivitas, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
        `,
        [
          program.id,
          access.tenantId,
          bulanNum,
          tahunNum,
          progressNum,
          kendala ?? null,
          solusi ?? null,
          catatan ?? null,
          efektivitas,
          req.user.id,
        ]
      );

      res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
      if (err.code === "23505") {
        return res.status(409).json({
          success: false,
          error: "Evaluasi untuk bulan/tahun ini sudah ada",
        });
      }
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// GET /program-unit/:id
router.get(
  "/:id",
  requirePermission("program_unit.view"),
  async (req, res) => {
    try {
      const access = await loadAccess(req, res);
      if (!access) return;

      const program = await loadProgramById(req.params.id, access);
      if (!program) {
        return res.status(404).json({
          success: false,
          error: "Program tidak ditemukan",
        });
      }

      res.json({ success: true, data: mapProgramRow(program) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// POST /program-unit
router.post(
  "/",
  requirePermission("program_unit.manage"),
  async (req, res) => {
    try {
      const access = await loadAccess(req, res);
      if (!access) return;
      if (!requireManage(access, res)) return;

      const {
        unit_id: bodyUnitId,
        unit_kode: bodyUnitKode,
        nama_program,
        deskripsi,
        target_program,
        target_angka,
        realisasi_angka,
        penanggung_jawab,
        tanggal_mulai,
        tanggal_selesai,
        status,
      } = req.body;

      if (!nama_program?.trim()) {
        return res.status(400).json({
          success: false,
          error: "nama_program wajib diisi",
        });
      }

      let unit = null;
      if (bodyUnitId) {
        unit = await getUnitById(bodyUnitId, access.tenantId);
      } else if (bodyUnitKode) {
        unit = await getUnitByKode(bodyUnitKode, access.tenantId);
      }

      if (!unit || !unit.is_active) {
        return res.status(400).json({
          success: false,
          error: "unit_id / unit_kode tidak valid",
        });
      }

      if (!isUnitAllowed(access, unit.id)) {
        return res.status(403).json({
          success: false,
          error: "Akses unit ditolak",
        });
      }

      const statusVal = status || "draft";
      if (!VALID_STATUS.has(statusVal)) {
        return res.status(400).json({
          success: false,
          error: "status tidak valid",
        });
      }

      const { rows } = await pool.query(
        `
        INSERT INTO program_unit (
          unit_id, tenant_id, nama_program, deskripsi, target_program,
          target_angka, realisasi_angka, penanggung_jawab,
          tanggal_mulai, tanggal_selesai, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
        `,
        [
          unit.id,
          access.tenantId,
          nama_program.trim(),
          deskripsi ?? null,
          target_program ?? null,
          parseNonNegativeNumber(target_angka, 0),
          parseNonNegativeNumber(realisasi_angka, 0),
          penanggung_jawab ?? null,
          tanggal_mulai || null,
          tanggal_selesai || null,
          statusVal,
        ]
      );

      const created = await loadProgramById(rows[0].id, access);
      res.status(201).json({ success: true, data: mapProgramRow(created) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// PUT /program-unit/:id
router.put(
  "/:id",
  requirePermission("program_unit.manage"),
  async (req, res) => {
    try {
      const access = await loadAccess(req, res);
      if (!access) return;
      if (!requireManage(access, res)) return;

      const existing = await loadProgramById(req.params.id, access);
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: "Program tidak ditemukan",
        });
      }

      const {
        unit_id: bodyUnitId,
        unit_kode: bodyUnitKode,
        nama_program,
        deskripsi,
        target_program,
        target_angka,
        realisasi_angka,
        penanggung_jawab,
        tanggal_mulai,
        tanggal_selesai,
        status,
      } = req.body;

      let unitId = existing.unit_id;

      if (bodyUnitId || bodyUnitKode) {
        const unit = bodyUnitId
          ? await getUnitById(bodyUnitId, access.tenantId)
          : await getUnitByKode(bodyUnitKode, access.tenantId);

        if (!unit || !unit.is_active) {
          return res.status(400).json({
            success: false,
            error: "unit tidak valid",
          });
        }

        if (!isUnitAllowed(access, unit.id)) {
          return res.status(403).json({
            success: false,
            error: "Akses unit ditolak",
          });
        }

        unitId = unit.id;
      }

      const statusVal = status ?? existing.status;
      if (!VALID_STATUS.has(statusVal)) {
        return res.status(400).json({
          success: false,
          error: "status tidak valid",
        });
      }

      if (!nama_program?.trim()) {
        return res.status(400).json({
          success: false,
          error: "nama_program wajib diisi",
        });
      }

      await pool.query(
        `
        UPDATE program_unit
        SET
          unit_id = $1,
          nama_program = $2,
          deskripsi = $3,
          target_program = $4,
          target_angka = $5,
          realisasi_angka = $6,
          penanggung_jawab = $7,
          tanggal_mulai = $8,
          tanggal_selesai = $9,
          status = $10,
          updated_at = NOW()
        WHERE id = $11
          AND tenant_id = $12
        `,
        [
          unitId,
          nama_program.trim(),
          deskripsi ?? null,
          target_program ?? null,
          parseNonNegativeNumber(target_angka, existing.target_angka),
          parseNonNegativeNumber(realisasi_angka, existing.realisasi_angka),
          penanggung_jawab ?? null,
          tanggal_mulai || null,
          tanggal_selesai || null,
          statusVal,
          existing.id,
          access.tenantId,
        ]
      );

      const updated = await loadProgramById(existing.id, access);
      res.json({ success: true, data: mapProgramRow(updated) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// DELETE /program-unit/:id — soft delete via status dibatalkan
router.delete(
  "/:id",
  requirePermission("program_unit.manage"),
  async (req, res) => {
    try {
      const access = await loadAccess(req, res);
      if (!access) return;
      if (!requireManage(access, res)) return;

      const existing = await loadProgramById(req.params.id, access);
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: "Program tidak ditemukan",
        });
      }

      await pool.query(
        `
        UPDATE program_unit
        SET status = 'dibatalkan', updated_at = NOW()
        WHERE id = $1
          AND tenant_id = $2
        `,
        [existing.id, access.tenantId]
      );

      res.json({ success: true, message: "Program dibatalkan" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

module.exports = router;
