const pool = require('../db');

const PESANTREN_CODES = new Set(['PESANTREN', 'MADINAH', 'MADIN']);

function isPesantrenUnit(row) {
  if (!row || !row.unit_id) return true;
  const code = String(row.unit_kode || '').trim().toUpperCase();
  const name = String(row.unit_nama || '').trim().toLowerCase();
  return PESANTREN_CODES.has(code) || name.includes('pesantren');
}

async function requirePesantrenUnit(req, res, next) {
  try {
    if (!req.santriId || !req.tenantId) {
      return res.status(400).json({ success: false, error: 'Profil anak belum dipilih' });
    }
    const { rows } = await pool.query(
      `
      SELECT k.unit_id, u.kode AS unit_kode, u.nama AS unit_nama
      FROM santri s
      LEFT JOIN kelas k ON k.id = s.kelas_id AND k.tenant_id = s.tenant_id
      LEFT JOIN unit_pendidikan u ON u.id = k.unit_id AND u.tenant_id = s.tenant_id
      WHERE s.id = $1 AND s.tenant_id = $2
      LIMIT 1
      `,
      [req.santriId, req.tenantId],
    );
    if (!isPesantrenUnit(rows[0])) {
      return res.status(403).json({
        success: false,
        error: 'Fitur ini hanya tersedia untuk unit Pesantren',
        code: 'UNIT_FEATURE_DISABLED',
      });
    }
    req.waliUnit = rows[0] || null;
    return next();
  } catch (error) {
    console.error('[wali unit feature guard]', error);
    return res.status(500).json({ success: false, error: 'Validasi unit anak gagal' });
  }
}

module.exports = { requirePesantrenUnit, isPesantrenUnit };
