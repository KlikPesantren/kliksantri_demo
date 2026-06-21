const pool = require("../db");

async function assertKelasInTenant(tenantId, kelasId, client = pool) {
  if (kelasId === null || kelasId === undefined || kelasId === "") {
    return { ok: true };
  }

  const { rows } = await client.query(
    `SELECT id FROM kelas WHERE id = $1 AND tenant_id = $2`,
    [kelasId, tenantId]
  );

  if (rows.length === 0) {
    return { ok: false, error: "Kelas tidak ditemukan di tenant ini" };
  }

  return { ok: true };
}

async function assertSantriInTenant(tenantId, santriId, client = pool) {
  if (santriId === null || santriId === undefined || santriId === "") {
    return { ok: true };
  }

  const { rows } = await client.query(
    `SELECT id FROM santri WHERE id = $1 AND tenant_id = $2`,
    [santriId, tenantId]
  );

  if (rows.length === 0) {
    return { ok: false, error: "Santri tidak ditemukan di tenant ini" };
  }

  return { ok: true };
}

async function assertPembayaranInTenant(tenantId, pembayaranId, client = pool) {
  const { rows } = await client.query(
    `SELECT id FROM pembayaran WHERE id = $1 AND tenant_id = $2`,
    [pembayaranId, tenantId]
  );
  if (rows.length === 0) {
    return { ok: false, error: "Pembayaran tidak ditemukan di tenant ini" };
  }
  return { ok: true };
}

async function assertTagihanInTenant(tenantId, tagihanId, client = pool) {
  const { rows } = await client.query(
    `SELECT id FROM tagihan_sahriyah WHERE id = $1 AND tenant_id = $2`,
    [tagihanId, tenantId]
  );
  if (rows.length === 0) {
    return { ok: false, error: "Tagihan tidak ditemukan di tenant ini" };
  }
  return { ok: true };
}

async function assertGuruInTenant(tenantId, guruId, client = pool) {
  if (guruId === null || guruId === undefined || guruId === "") {
    return { ok: true };
  }

  const { rows } = await client.query(
    `SELECT id FROM guru WHERE id = $1 AND tenant_id = $2`,
    [guruId, tenantId]
  );

  if (rows.length === 0) {
    return { ok: false, error: "Guru tidak ditemukan di tenant ini" };
  }

  return { ok: true };
}

const TENANT_TABLE_LABELS = {
  pelanggaran: "Pelanggaran tidak ditemukan di tenant ini",
  perizinan: "Perizinan tidak ditemukan di tenant ini",
  kesehatan_santri: "Data kesehatan tidak ditemukan di tenant ini",
  tamu: "Tamu tidak ditemukan di tenant ini",
  hafalan: "Hafalan tidak ditemukan di tenant ini",
  nilai_mingguan: "Nilai tidak ditemukan di tenant ini",
  pengumuman: "Pengumuman tidak ditemukan di tenant ini",
};

async function assertRecordInTenant(table, tenantId, recordId, client = pool) {
  const label = TENANT_TABLE_LABELS[table];
  if (!label) {
    return { ok: false, error: "Tabel tidak didukung untuk tenant scope" };
  }

  const { rows } = await client.query(
    `SELECT id FROM ${table} WHERE id = $1 AND tenant_id = $2`,
    [recordId, tenantId]
  );

  if (rows.length === 0) {
    return { ok: false, error: label };
  }

  return { ok: true };
}

module.exports = {
  assertKelasInTenant,
  assertSantriInTenant,
  assertGuruInTenant,
  assertPembayaranInTenant,
  assertTagihanInTenant,
  assertRecordInTenant,
};
