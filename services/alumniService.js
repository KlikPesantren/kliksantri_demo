function isAlumniStatus(status) {
  return ["lulus", "keluar"].includes(String(status || "").trim().toLowerCase());
}

function validateEffectiveExitDate(value) {
  const normalized = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw Object.assign(new Error("Tanggal efektif keluar harus berformat YYYY-MM-DD"), {
      status: 400,
      code: "INVALID_EFFECTIVE_EXIT_DATE",
    });
  }
  const parsed = new Date(`${normalized}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== normalized) {
    throw Object.assign(new Error("Tanggal efektif keluar tidak valid"), {
      status: 400,
      code: "INVALID_EFFECTIVE_EXIT_DATE",
    });
  }
  return normalized;
}

async function resolveEffectiveExitDate(client, requestedDate) {
  if (requestedDate !== undefined && requestedDate !== null && String(requestedDate).trim() !== "") {
    return validateEffectiveExitDate(requestedDate);
  }
  const current = await client.query(`SELECT TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') AS effective_exit_date`);
  return current.rows[0].effective_exit_date;
}

function yearFromDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.getFullYear();
  const match = String(value || "").match(/^(\d{4})-/);
  return match ? Number(match[1]) : null;
}

function dateOnly(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return String(value).slice(0, 10);
}

async function ensureAlumni(client, {
  tenantId,
  santri,
  status,
  membership,
  unitId,
  effectiveExitDate,
}) {
  const statusKelulusan = String(status || santri?.status || "lulus").trim().toLowerCase();
  if (!isAlumniStatus(statusKelulusan) || !santri?.id) return null;
  if (!membership?.id || Number(membership.tenant_id) !== Number(tenantId)
      || Number(membership.unit_id) !== Number(unitId)) {
    throw Object.assign(new Error("Membership sumber Alumni tidak valid"), {
      status: 400,
      code: "INVALID_ALUMNI_SOURCE_MEMBERSHIP",
    });
  }
  const exitDate = validateEffectiveExitDate(effectiveExitDate);
  const tahunLulus = yearFromDate(exitDate);
  const tahunMasuk = yearFromDate(membership.joined_at);

  const kelas = santri.kelas_id
    ? await client.query(
      `SELECT nama_kelas FROM kelas WHERE id = $1 AND tenant_id = $2`,
      [santri.kelas_id, tenantId],
    )
    : { rows: [] };
  const kelasTerakhir = kelas.rows[0]?.nama_kelas || null;

  const result = await client.query(
    `INSERT INTO alumni (
       tenant_id, santri_id, nama, nis, jenis_kelamin, alamat, kelas_terakhir,
       status_kelulusan, tahun_masuk, tahun_lulus
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (tenant_id, santri_id) DO UPDATE SET
       nama = EXCLUDED.nama,
       nis = EXCLUDED.nis,
       jenis_kelamin = EXCLUDED.jenis_kelamin,
       alamat = EXCLUDED.alamat,
       kelas_terakhir = COALESCE(EXCLUDED.kelas_terakhir, alumni.kelas_terakhir),
       status_kelulusan = EXCLUDED.status_kelulusan,
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [tenantId, santri.id, santri.nama, santri.nis, santri.jenis_kelamin, santri.alamat,
      kelasTerakhir, statusKelulusan, tahunMasuk, tahunLulus],
  );
  const alumni = result.rows[0];
  const identityKey = `SANTRI:${santri.id}`;
  const relation = await client.query(
    `INSERT INTO alumni_units (
       tenant_id, alumni_id, unit_id, identity_key, tahun_masuk, tahun_lulus,
       status_kelulusan, kelas_terakhir, source, source_santri_unit_id, effective_exit_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'santri_transition',$9,$10)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [tenantId, alumni.id, unitId, identityKey, tahunMasuk, tahunLulus,
      statusKelulusan, kelasTerakhir, membership.id, exitDate],
  );
  if (relation.rows[0]) return { alumni, alumni_unit: relation.rows[0] };

  const existing = await client.query(
    `SELECT * FROM alumni_units
     WHERE tenant_id = $1 AND unit_id = $2 AND identity_key = $3
       AND COALESCE(tahun_lulus, 0) = COALESCE($4::integer, 0)
     FOR UPDATE`,
    [tenantId, unitId, identityKey, tahunLulus],
  );
  const owned = existing.rows[0];
  if (owned && Number(owned.alumni_id) === Number(alumni.id)
      && (!owned.source_santri_unit_id || Number(owned.source_santri_unit_id) === Number(membership.id))
      && (!owned.effective_exit_at || dateOnly(owned.effective_exit_at) === exitDate)) {
    const synced = await client.query(
      `UPDATE alumni_units
       SET source_santri_unit_id = COALESCE(source_santri_unit_id, $1),
           effective_exit_at = COALESCE(effective_exit_at, $2),
           updated_at = NOW()
       WHERE id = $3 AND tenant_id = $4
       RETURNING *`,
      [membership.id, exitDate, owned.id, tenantId],
    );
    return { alumni, alumni_unit: synced.rows[0] };
  }

  throw Object.assign(new Error("Riwayat Alumni unit bertabrakan dan memerlukan review"), {
    status: 409,
    code: "ALUMNI_UNIT_TRANSITION_CONFLICT",
  });
}

module.exports = {
  ensureAlumni,
  isAlumniStatus,
  resolveEffectiveExitDate,
  validateEffectiveExitDate,
};
