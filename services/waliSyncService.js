const bcrypt = require("bcryptjs");
const waliAppService = require("./waliAppService");

const DEFAULT_WALI_PIN = "456789";

function normalizePhone(phone) {
  return waliAppService.normalizePhone(phone);
}

/**
 * Ensure wali_akun exists for tenant+phone. Never resets PIN on existing account.
 */
async function ensureWaliAccount(client, { tenantId, namaWali, nomorHpWali }) {
  const nomorHp = normalizePhone(nomorHpWali);
  if (!nomorHp) {
    return { ok: false, skipped: true, reason: "invalid_phone" };
  }

  const nama = String(namaWali || "").trim() || "Wali";

  const existing = await client.query(
    `SELECT id, nomor_hp, must_change_pin
     FROM wali_akun
     WHERE tenant_id = $1 AND nomor_hp = $2`,
    [tenantId, nomorHp]
  );

  if (existing.rows.length > 0) {
    await client.query(
      `UPDATE wali_akun
       SET nama = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3`,
      [nama, existing.rows[0].id, tenantId]
    );
    return {
      ok: true,
      created: false,
      wali_akun_id: existing.rows[0].id,
      nomor_hp: nomorHp,
    };
  }

  const pinHash = await bcrypt.hash(DEFAULT_WALI_PIN, 10);
  const inserted = await client.query(
    `INSERT INTO wali_akun (tenant_id, nomor_hp, nama, pin_hash, status, must_change_pin)
     VALUES ($1, $2, $3, $4, 'active', true)
     RETURNING id, nomor_hp, must_change_pin`,
    [tenantId, nomorHp, nama, pinHash]
  );

  return {
    ok: true,
    created: true,
    wali_akun_id: inserted.rows[0].id,
    nomor_hp: nomorHp,
    must_change_pin: inserted.rows[0].must_change_pin === true,
  };
}

/**
 * Create or update wali_santri for a santri row. Requires valid phone to sync.
 */
async function ensureWaliForSantri(
  client,
  { tenantId, santriId, namaWali, nomorHpWali, alamat, santriNama }
) {
  const nomorHp = normalizePhone(nomorHpWali);
  if (!nomorHp) {
    return {
      ok: true,
      skipped: true,
      reason: "no_valid_phone",
    };
  }

  const nama =
    String(namaWali || "").trim() ||
    (santriNama ? `Wali ${santriNama}` : "Wali");

  const existing = await client.query(
    `SELECT id, nomor_hp
     FROM wali_santri
     WHERE santri_id = $1 AND tenant_id = $2
     LIMIT 1`,
    [santriId, tenantId]
  );

  let waliRow;
  let phoneChanged = false;
  const previousPhone = existing.rows[0]?.nomor_hp || null;

  if (existing.rows.length > 0) {
    phoneChanged = previousPhone && previousPhone !== nomorHp;
    const updated = await client.query(
      `UPDATE wali_santri
       SET nama = $1, nomor_hp = $2, alamat = COALESCE($3, alamat)
       WHERE id = $4 AND tenant_id = $5
       RETURNING *`,
      [nama, nomorHp, alamat || null, existing.rows[0].id, tenantId]
    );
    waliRow = updated.rows[0];
  } else {
    const inserted = await client.query(
      `INSERT INTO wali_santri (nama, nomor_hp, alamat, santri_id, tenant_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nama, nomorHp, alamat || null, santriId, tenantId]
    );
    waliRow = inserted.rows[0];
  }

  await client.query(
    `UPDATE santri
     SET wali_id = $1
     WHERE id = $2 AND tenant_id = $3`,
    [waliRow.id, santriId, tenantId]
  );

  const account = await ensureWaliAccount(client, {
    tenantId,
    namaWali: nama,
    nomorHpWali: nomorHp,
  });

  return {
    ok: true,
    skipped: false,
    wali_santri_id: waliRow.id,
    nomor_hp: nomorHp,
    phone_changed: phoneChanged,
    previous_phone: phoneChanged ? previousPhone : null,
    account,
    warning: phoneChanged
      ? "Nomor HP wali berubah. Akun lama tidak dihapus otomatis."
      : null,
  };
}

/**
 * Sync wali from santri fields (orang_tua / nomor_hp_ortu).
 */
async function syncWaliFromSantri(client, { tenantId, santri }) {
  if (!santri?.id) {
    return { ok: false, error: "Santri tidak valid" };
  }

  const namaWali = santri.orang_tua ?? santri.nama_wali ?? null;
  const nomorHpWali = santri.nomor_hp_ortu ?? santri.no_hp_wali ?? null;

  if (!normalizePhone(nomorHpWali)) {
    return {
      ok: true,
      skipped: true,
      reason: "no_valid_phone",
    };
  }

  return ensureWaliForSantri(client, {
    tenantId,
    santriId: santri.id,
    namaWali,
    nomorHpWali,
    alamat: santri.alamat || null,
    santriNama: santri.nama,
  });
}

module.exports = {
  DEFAULT_WALI_PIN,
  normalizePhone,
  ensureWaliAccount,
  ensureWaliForSantri,
  syncWaliFromSantri,
};
