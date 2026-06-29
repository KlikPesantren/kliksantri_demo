const express = require("express");
const router = express.Router();
const pool = require("../db");
const {
  resolveKelasScopeAccess,
  isKelasAllowed,
  kelasScopeSql,
} = require("../middleware/kelasScope");

async function loadAccess(req, res) {
  const access = await resolveKelasScopeAccess(req);
  if (access.denied) {
    res.status(access.status || 403).json({
      success: false,
      error: access.error || "Akses ditolak",
    });
    return null;
  }
  return access;
}

async function assertSantriAllowed(access, santriId) {
  const { rows } = await pool.query(
    `SELECT id, kelas_id
     FROM santri
     WHERE id = $1
       AND tenant_id = $2`,
    [santriId, access.tenantId]
  );

  if (rows.length === 0) {
    return { ok: false, status: 400, error: "Santri tidak ditemukan di tenant ini" };
  }

  if (!isKelasAllowed(access, rows[0].kelas_id)) {
    return { ok: false, status: 403, error: "Akses kelas ditolak" };
  }

  return { ok: true, santri: rows[0] };
}

router.get("/kelas", async (req, res) => {
  try {
    const access = await loadAccess(req, res);
    if (!access) return;

    const params = [access.tenantId];
    let query = `SELECT id, nama_kelas
                 FROM kelas
                 WHERE tenant_id = $1`;

    const scope = kelasScopeSql(access, "id", 2);
    query += scope.clause;
    params.push(...scope.params);
    query += " ORDER BY id ASC";

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
});

router.get("/santri", async (req, res) => {
  try {
    const access = await loadAccess(req, res);
    if (!access) return;

    const kelasId = req.query.kelas_id ? Number(req.query.kelas_id) : null;
    const params = [access.tenantId];
    let query = `SELECT id, nis, nama, kelas_id
                 FROM santri
                 WHERE tenant_id = $1`;
    let idx = 2;

    const scope = kelasScopeSql(access, "kelas_id", idx);
    query += scope.clause;
    params.push(...scope.params);
    idx = scope.nextIndex;

    if (kelasId) {
      if (!isKelasAllowed(access, kelasId)) {
        return res.status(403).json({ success: false, error: "Akses kelas ditolak" });
      }
      query += ` AND kelas_id = $${idx}`;
      params.push(kelasId);
    }

    query += " ORDER BY nama ASC, id ASC";

    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const access = await loadAccess(req, res);
    if (!access) return;

    const bulan = req.query.bulan ? Number(req.query.bulan) : null;
    const tahun = req.query.tahun ? Number(req.query.tahun) : null;

    let query = `SELECT id, santri_id, sesi, status,
                  TO_CHAR(tanggal::date, 'YYYY-MM-DD') AS tanggal
                 FROM absensi a
                 WHERE a.tenant_id = $1
                   AND EXISTS (
                     SELECT 1
                     FROM santri s
                     WHERE s.id = a.santri_id
                       AND s.tenant_id = a.tenant_id`;
    const params = [req.tenantId];
    let paramIdx = 2;

    const scope = kelasScopeSql(access, "s.kelas_id", paramIdx);
    query += scope.clause;
    params.push(...scope.params);
    paramIdx = scope.nextIndex;

    query += `)`;

    if (bulan && tahun) {
      query += ` AND EXTRACT(MONTH FROM a.tanggal::date) = $${paramIdx}`
             + ` AND EXTRACT(YEAR FROM a.tanggal::date) = $${paramIdx + 1}`;
      params.push(bulan, tahun);
      paramIdx += 2;
    } else if (bulan) {
      query += ` AND EXTRACT(MONTH FROM a.tanggal::date) = $${paramIdx}`;
      params.push(bulan);
      paramIdx += 1;
    } else if (tahun) {
      query += ` AND EXTRACT(YEAR FROM a.tanggal::date) = $${paramIdx}`;
      params.push(tahun);
    }

    query += " ORDER BY a.tanggal ASC, a.id ASC";

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const access = await loadAccess(req, res);
    if (!access) return;

    if (!access.canManage) {
      return res.status(403).json({
        success: false,
        error: "Role belum memiliki izin kelola absensi",
      });
    }

    const { santri_id, tanggal, sesi, status } = req.body;

    if (!status || status === "") {
      return res.status(400).json({
        success: false,
        error: "Status absensi wajib diisi",
      });
    }

    const santriCheck = await assertSantriAllowed(access, santri_id);
    if (!santriCheck.ok) {
      return res.status(santriCheck.status || 400).json({
        success: false,
        error: santriCheck.error,
      });
    }

    const result = await pool.query(
      `INSERT INTO absensi (santri_id, tanggal, sesi, status, tenant_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (santri_id, tanggal, sesi)
       DO UPDATE SET status = EXCLUDED.status, tenant_id = EXCLUDED.tenant_id
       RETURNING *`,
      [santri_id, tanggal, sesi, status, req.tenantId]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
