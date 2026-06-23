const pool = require("../db");
const { detectPackageFromFeatures } = require("../config/tenantPackageConfig");

const FEATURE_STATUS_KEYS = ["rfid", "wali_app", "sahriyah", "kas_instansi"];

const CLEANUP_COUNT_TABLES = [
  ["users", "users"],
  ["santri", "santri"],
  ["guru", "guru"],
  ["wali_santri", "wali"],
  ["kelas", "kelas"],
  ["pembayaran", "pembayaran"],
  ["tagihan_sahriyah", "sahriyah"],
  ["transaksi_rfid", "rfid_transactions"],
];

const TENANT_ACTIVITY_TABLES = [
  "audit_logs",
  "users",
  "santri",
  "guru",
  "wali_santri",
  "kelas",
  "pembayaran",
  "tagihan_sahriyah",
  "pembayaran_sahriyah",
  "transaksi_rfid",
  "buku_kas",
  "kas_instansi_transaksi",
  "pengumuman",
  "perizinan",
  "pelanggaran",
  "wali_akun",
];

const DELETE_TABLE_ORDER = [
  "notification_logs",
  "wali_push_tokens",
  "rfid_sync_queue",
  "rfid_limit_override",
  "rfid_override_logs",
  "rfid_limit_settings",
  "transaksi_rfid",
  "transaksi",
  "devices",
  "merchant_rfid",
  "pembayaran_detail",
  "pembayaran_sahriyah",
  "tagihan_sahriyah",
  "pembayaran",
  "sahriyah_setting",
  "jenis_tagihan",
  "buku_kas",
  "kas_instansi_transaksi",
  "program_unit_evaluasi",
  "program_unit",
  "pengumuman",
  "perizinan",
  "pelanggaran",
  "absensi",
  "absensi_santri",
  "absensi_guru",
  "hafalan",
  "nilai_mingguan",
  "kesehatan_santri",
  "tamu",
  "santri",
  "wali_santri",
  "wali_akun",
  "guru",
  "kelas",
  "user_unit_scope",
  "unit_pendidikan",
  "profil_pesantren",
  "tenant_features",
  "audit_logs",
  "users",
];

let tableColumnsCache = null;

async function getTableColumns(client = pool) {
  if (tableColumnsCache) return tableColumnsCache;

  const { rows } = await client.query(
    `SELECT table_name, column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'`
  );

  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.table_name)) map.set(row.table_name, new Set());
    map.get(row.table_name).add(row.column_name);
  }

  tableColumnsCache = map;
  return map;
}

function hasTenantColumn(columns, tableName) {
  return columns.has(tableName) && columns.get(tableName).has("tenant_id");
}

async function countTenantRows(client, columns, tableName, tenantId) {
  if (!hasTenantColumn(columns, tableName)) return 0;
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS n FROM ${tableName} WHERE tenant_id = $1`,
    [tenantId]
  );
  return rows[0].n;
}

async function getTenantFeatureSummary(tenantIds, client = pool) {
  const ids = tenantIds.map(Number).filter(Boolean);
  if (ids.length === 0) return new Map();

  const { rows } = await client.query(
    `SELECT
       fc.key,
       fc.label,
       fc.is_core,
       tenant_ids.tenant_id,
       COALESCE(tf.enabled, true) AS enabled
     FROM feature_catalog fc
     CROSS JOIN unnest($1::int[]) tenant_ids(tenant_id)
     LEFT JOIN tenant_features tf
       ON tf.feature_key = fc.key AND tf.tenant_id = tenant_ids.tenant_id
     ORDER BY fc.sort_order ASC, fc.key ASC`,
    [ids]
  );

  const byTenant = new Map();
  for (const row of rows) {
    if (!byTenant.has(row.tenant_id)) byTenant.set(row.tenant_id, []);
    byTenant.get(row.tenant_id).push({
      key: row.key,
      label: row.label,
      is_core: row.is_core === true,
      enabled: row.is_core === true ? true : row.enabled === true,
    });
  }

  const summary = new Map();
  for (const tenantId of ids) {
    const features = byTenant.get(tenantId) || [];
    const enabled = features.filter((feature) => feature.enabled);
    const disabled = features.filter(
      (feature) => !feature.enabled && !feature.is_core
    );
    const enabledSet = new Set(enabled.map((feature) => feature.key));

    summary.set(tenantId, {
      current_package: detectPackageFromFeatures(features),
      feature_enabled_count: enabled.length,
      feature_disabled_count: disabled.length,
      feature_status: Object.fromEntries(
        FEATURE_STATUS_KEYS.map((key) => [key, enabledSet.has(key)])
      ),
    });
  }

  return summary;
}

async function getLastActivity(tenantId, client = pool) {
  const columns = await getTableColumns(client);
  const candidates = TENANT_ACTIVITY_TABLES.filter(
    (table) =>
      hasTenantColumn(columns, table) && columns.get(table).has("created_at")
  );

  const values = await Promise.all(
    candidates.map(async (table) => {
      const { rows } = await client.query(
        `SELECT MAX(created_at) AS last_at FROM ${table} WHERE tenant_id = $1`,
        [tenantId]
      );
      return rows[0].last_at;
    })
  );

  return values
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null;
}

async function getTenantHealth(tenantId, client = pool) {
  const tid = Number(tenantId);
  const featureSummary = await getTenantFeatureSummary([tid], client);
  const { rows } = await client.query(
    `SELECT
       t.id,
       t.slug,
       t.nama,
       t.status,
       (SELECT COUNT(*)::int FROM users u WHERE u.tenant_id = t.id) AS total_user,
       (SELECT COUNT(*)::int FROM santri s WHERE s.tenant_id = t.id AND LOWER(s.status) = 'aktif') AS total_santri,
       (SELECT COUNT(*)::int FROM guru g WHERE g.tenant_id = t.id AND LOWER(g.status) = 'aktif') AS total_guru,
       (SELECT COUNT(*)::int FROM wali_santri w WHERE w.tenant_id = t.id) AS total_wali,
       (SELECT COUNT(*)::int FROM kelas k WHERE k.tenant_id = t.id) AS total_kelas
     FROM tenants t
     WHERE t.id = $1`,
    [tid]
  );

  if (rows.length === 0) return null;

  const feature = featureSummary.get(tid) || {
    current_package: { id: "custom", label: "Custom" },
    feature_enabled_count: 0,
    feature_disabled_count: 0,
    feature_status: {},
  };

  return {
    tenant_id: tid,
    total_santri: rows[0].total_santri,
    total_guru: rows[0].total_guru,
    total_wali: rows[0].total_wali,
    total_user: rows[0].total_user,
    total_kelas: rows[0].total_kelas,
    status: rows[0].status,
    feature_enabled_count: feature.feature_enabled_count,
    feature_disabled_count: feature.feature_disabled_count,
    current_package: feature.current_package,
    last_activity_at: await getLastActivity(tid, client),
    feature_status: feature.feature_status,
  };
}

async function attachTenantListHealth(rows, client = pool) {
  const ids = rows.map((row) => Number(row.id)).filter(Boolean);
  const featureSummary = await getTenantFeatureSummary(ids, client);

  return rows.map((row) => {
    const feature = featureSummary.get(Number(row.id)) || {
      current_package: { id: "custom", label: "Custom" },
      feature_enabled_count: 0,
      feature_disabled_count: 0,
    };

    return {
      ...row,
      current_package: feature.current_package,
      feature_enabled_count: feature.feature_enabled_count,
      feature_disabled_count: feature.feature_disabled_count,
    };
  });
}

async function getTenantCleanupSummary(tenantId, client = pool) {
  const columns = await getTableColumns(client);
  const counts = {};

  for (const [tableName, key] of CLEANUP_COUNT_TABLES) {
    counts[key] = await countTenantRows(client, columns, tableName, tenantId);
  }

  return counts;
}

async function deleteTenantSafely(tenant, platformUser, client) {
  const columns = await getTableColumns(client);
  const deleted = {};

  for (const tableName of DELETE_TABLE_ORDER) {
    if (tableName === "user_unit_scope") {
      const { rowCount } = await client.query(
        `DELETE FROM user_unit_scope uus
         USING users u
         WHERE uus.user_id = u.id AND u.tenant_id = $1`,
        [tenant.id]
      );
      deleted[tableName] = rowCount;
      continue;
    }

    if (!hasTenantColumn(columns, tableName)) continue;

    const { rowCount } = await client.query(
      `DELETE FROM ${tableName} WHERE tenant_id = $1`,
      [tenant.id]
    );
    deleted[tableName] = rowCount;
  }

  const tenantDelete = await client.query(
    `DELETE FROM tenants WHERE id = $1 RETURNING id, slug, nama, status`,
    [tenant.id]
  );

  if (tenantDelete.rows.length === 0) {
    const err = new Error("Tenant tidak ditemukan saat delete");
    err.status = 404;
    throw err;
  }

  await client.query(
    `INSERT INTO audit_logs (device_id, event_type, detail, tenant_id)
     VALUES ($1, $2, $3, NULL)`,
    [
      `platform:${platformUser?.id ?? "system"}`,
      "platform.tenant.deleted",
      JSON.stringify({
        deleted_tenant_id: tenant.id,
        slug: tenant.slug,
        nama: tenant.nama,
        status: tenant.status,
        deleted_by: platformUser?.id ?? null,
        deleted_by_username: platformUser?.username ?? null,
        deleted_counts: deleted,
      }),
    ]
  );

  return deleted;
}

module.exports = {
  attachTenantListHealth,
  getTenantHealth,
  getTenantCleanupSummary,
  deleteTenantSafely,
};
