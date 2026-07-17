function isAlumniStatus(status) {
  return ["lulus", "keluar"].includes(String(status || "").trim().toLowerCase());
}

async function ensureAlumni(client, { tenantId, santri, status }) {
  const statusKelulusan = String(status || santri?.status || "lulus").trim().toLowerCase();
  if (!isAlumniStatus(statusKelulusan) || !santri?.id) return null;

  const result = await client.query(
    `INSERT INTO alumni (
       tenant_id, santri_id, nama, nis, jenis_kelamin, alamat, status_kelulusan
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (tenant_id, santri_id) DO UPDATE SET
       nama = EXCLUDED.nama,
       nis = EXCLUDED.nis,
       jenis_kelamin = EXCLUDED.jenis_kelamin,
       alamat = EXCLUDED.alamat,
       status_kelulusan = EXCLUDED.status_kelulusan,
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [tenantId, santri.id, santri.nama, santri.nis, santri.jenis_kelamin, santri.alamat, statusKelulusan],
  );
  return result.rows[0] || null;
}

module.exports = { ensureAlumni, isAlumniStatus };
