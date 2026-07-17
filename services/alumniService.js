function isAlumniStatus(status) {
  return ["lulus", "keluar"].includes(String(status || "").trim().toLowerCase());
}

async function ensureAlumni(client, { tenantId, santri, status }) {
  const statusKelulusan = String(status || santri?.status || "lulus").trim().toLowerCase();
  if (!isAlumniStatus(statusKelulusan) || !santri?.id) return null;

  const kelas = santri.kelas_id
    ? await client.query(
      `SELECT nama_kelas FROM kelas WHERE id = $1 AND tenant_id = $2`,
      [santri.kelas_id, tenantId],
    )
    : { rows: [] };
  const kelasTerakhir = kelas.rows[0]?.nama_kelas || null;

  const result = await client.query(
    `INSERT INTO alumni (
       tenant_id, santri_id, nama, nis, jenis_kelamin, alamat, kelas_terakhir, status_kelulusan
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (tenant_id, santri_id) DO UPDATE SET
       nama = EXCLUDED.nama,
       nis = EXCLUDED.nis,
       jenis_kelamin = EXCLUDED.jenis_kelamin,
       alamat = EXCLUDED.alamat,
       kelas_terakhir = COALESCE(EXCLUDED.kelas_terakhir, alumni.kelas_terakhir),
       status_kelulusan = EXCLUDED.status_kelulusan,
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [tenantId, santri.id, santri.nama, santri.nis, santri.jenis_kelamin, santri.alamat, kelasTerakhir, statusKelulusan],
  );
  return result.rows[0] || null;
}

module.exports = { ensureAlumni, isAlumniStatus };
