const pool = require("../db");
const {
  detectPackageFromFeatures,
  normalizePackage,
  resolveEnabledFeatures,
} = require("../config/tenantPackageConfig");

const CORE_FEATURES = new Set(["dashboard", "profil", "sistem"]);

let cache = new Map();
let cacheAt = 0;
const TTL_MS = 60 * 1000;

function invalidateCache(tenantId) {
  if (tenantId) {
    cache.delete(Number(tenantId));
    return;
  }
  cache = new Map();
  cacheAt = 0;
}

async function loadTenantFeatureState(tenantId) {
  const tid = Number(tenantId);
  const now = Date.now();

  if (cache.has(tid) && now - cacheAt < TTL_MS) {
    return cache.get(tid);
  }

  const { rows } = await pool.query(
    `SELECT
       fc.key,
       fc.label,
       fc.description,
       fc.is_core,
       fc.sort_order,
       COALESCE(tf.enabled, true) AS enabled
     FROM feature_catalog fc
     LEFT JOIN tenant_features tf
       ON tf.feature_key = fc.key AND tf.tenant_id = $1
     ORDER BY fc.sort_order ASC, fc.key ASC`,
    [tid]
  );

  const features = rows.map((row) => ({
    key: row.key,
    label: row.label,
    description: row.description,
    is_core: row.is_core === true,
    sort_order: row.sort_order,
    enabled: row.is_core ? true : row.enabled === true,
  }));

  const enabledKeys = new Set(
    features.filter((f) => f.enabled).map((f) => f.key)
  );

  const state = { features, enabledKeys };
  cache.set(tid, state);
  cacheAt = now;
  return state;
}

async function isFeatureEnabled(tenantId, featureKey) {
  if (!featureKey) return true;
  if (CORE_FEATURES.has(featureKey)) return true;

  const state = await loadTenantFeatureState(tenantId);
  return state.enabledKeys.has(featureKey);
}

async function getEnabledFeatureKeys(tenantId) {
  const state = await loadTenantFeatureState(tenantId);
  return [...state.enabledKeys];
}

async function getTenantFeaturesForPlatform(tenantId) {
  const state = await loadTenantFeatureState(tenantId);
  return state.features;
}

async function getTenantFeatureManagementState(tenantId) {
  const features = await getTenantFeaturesForPlatform(tenantId);
  return {
    features,
    current_package: detectPackageFromFeatures(features),
  };
}

async function updateTenantFeatures(tenantId, updates) {
  const tid = Number(tenantId);
  if (!Array.isArray(updates) || updates.length === 0) {
    return getTenantFeaturesForPlatform(tid);
  }

  const { rows: catalogRows } = await pool.query(
    `SELECT key, is_core FROM feature_catalog`
  );
  const catalog = new Map(catalogRows.map((r) => [r.key, r]));

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const item of updates) {
      const key = String(item?.key || "").trim();
      if (!key || !catalog.has(key)) {
        const err = new Error(`Feature tidak dikenal: ${key || "(kosong)"}`);
        err.status = 400;
        throw err;
      }

      if (catalog.get(key).is_core && item.enabled === false) {
        const err = new Error(`Feature core "${key}" tidak bisa dimatikan`);
        err.status = 400;
        throw err;
      }

      const enabled = item.enabled !== false;

      await client.query(
        `INSERT INTO tenant_features (tenant_id, feature_key, enabled, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (tenant_id, feature_key) DO UPDATE SET
           enabled = EXCLUDED.enabled,
           updated_at = NOW()`,
        [tid, key, enabled]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  invalidateCache(tid);
  return getTenantFeatureManagementState(tid);
}

async function seedTenantFeaturesAllEnabled(tenantId, client = pool) {
  const tid = Number(tenantId);
  await client.query(
    `INSERT INTO tenant_features (tenant_id, feature_key, enabled, updated_at)
     SELECT $1, fc.key, true, NOW()
     FROM feature_catalog fc
     ON CONFLICT (tenant_id, feature_key) DO NOTHING`,
    [tid]
  );
  invalidateCache(tid);
}

async function seedTenantFeaturesFromPackage(
  tenantId,
  packageName,
  customFeatures = [],
  client = pool
) {
  const tid = Number(tenantId);
  const enabledSet = resolveEnabledFeatures(packageName, customFeatures);

  const { rows: catalog } = await client.query(
    `SELECT key, is_core FROM feature_catalog ORDER BY sort_order, key`
  );

  for (const row of catalog) {
    const enabled = row.is_core ? true : enabledSet.has(row.key);
    await client.query(
      `INSERT INTO tenant_features (tenant_id, feature_key, enabled, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (tenant_id, feature_key) DO UPDATE SET
         enabled = EXCLUDED.enabled,
         updated_at = NOW()`,
      [tid, row.key, enabled]
    );
  }

  invalidateCache(tid);
  return [...enabledSet].sort();
}

async function applyTenantPackage(tenantId, packageName) {
  const pkg = normalizePackage(packageName);
  if (!["basic", "standard", "premium"].includes(pkg)) {
    const err = new Error("Package harus basic, standard, atau premium");
    err.status = 400;
    throw err;
  }

  await seedTenantFeaturesFromPackage(tenantId, pkg);
  return getTenantFeatureManagementState(tenantId);
}

module.exports = {
  CORE_FEATURES,
  invalidateCache,
  isFeatureEnabled,
  getEnabledFeatureKeys,
  getTenantFeaturesForPlatform,
  getTenantFeatureManagementState,
  updateTenantFeatures,
  applyTenantPackage,
  seedTenantFeaturesAllEnabled,
  seedTenantFeaturesFromPackage,
};
