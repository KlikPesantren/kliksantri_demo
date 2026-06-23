const pool = require("../db");
const { detectPackageFromFeatures } = require("../config/tenantPackageConfig");

function getDateRanges(now = new Date()) {
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfTomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );

  return {
    startOfMonth,
    startOfNextMonth,
    startOfToday,
    startOfTomorrow,
  };
}

function mapTenantRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.nama,
    status: row.status,
    plan_code: row.plan_code || null,
    billing_status: row.billing_status || null,
    subscription_expires_at: row.subscription_expires_at || null,
    onboarded_at: row.onboarded_at,
  };
}

async function attachPackageLabels(tenants) {
  const tenantIds = tenants.map((tenant) => tenant.id);
  if (tenantIds.length === 0) return tenants;

  const { rows } = await pool.query(
    `
    SELECT
      t.id AS tenant_id,
      fc.key,
      COALESCE(tf.enabled, true) AS enabled
    FROM tenants t
    CROSS JOIN feature_catalog fc
    LEFT JOIN tenant_features tf
      ON tf.tenant_id = t.id
     AND tf.feature_key = fc.key
    WHERE t.id = ANY($1::int[])
    ORDER BY t.id, fc.sort_order, fc.key
    `,
    [tenantIds]
  );

  const featuresByTenant = new Map();
  for (const row of rows) {
    if (!featuresByTenant.has(row.tenant_id)) {
      featuresByTenant.set(row.tenant_id, []);
    }
    featuresByTenant.get(row.tenant_id).push({
      key: row.key,
      enabled: row.enabled === true,
    });
  }

  return tenants.map((tenant) => ({
    ...tenant,
    current_package: detectPackageFromFeatures(
      featuresByTenant.get(tenant.id) || []
    ),
  }));
}

function buildRecentActivity({ recentTenants, billingWatch, tenantHealth }) {
  const items = [];

  for (const tenant of recentTenants.slice(0, 4)) {
    items.push({
      type: "tenant_created",
      label: "Tenant baru",
      title: tenant.name,
      meta: tenant.slug,
      at: tenant.onboarded_at,
      tenant_id: tenant.id,
    });
  }

  for (const tenant of billingWatch.overdue.slice(0, 3)) {
    items.push({
      type: "billing_overdue",
      label: "Billing overdue",
      title: tenant.name,
      meta: tenant.billing_status,
      at: tenant.subscription_expires_at,
      tenant_id: tenant.id,
    });
  }

  for (const tenant of billingWatch.expiring_soon.slice(0, 3)) {
    items.push({
      type: "billing_expiring",
      label: "Expiring soon",
      title: tenant.name,
      meta: tenant.subscription_expires_at,
      at: tenant.subscription_expires_at,
      tenant_id: tenant.id,
    });
  }

  for (const tenant of tenantHealth
    .filter((tenant) => tenant.status !== "active")
    .slice(0, 3)) {
    items.push({
      type: "tenant_status",
      label: "Status tenant",
      title: tenant.name,
      meta: tenant.status,
      at: tenant.onboarded_at,
      tenant_id: tenant.id,
    });
  }

  return items
    .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))
    .slice(0, 8);
}

async function getPlatformStatsSummary() {
  const ranges = getDateRanges();
  const {
    startOfMonth,
    startOfNextMonth,
    startOfToday,
    startOfTomorrow,
  } = ranges;

  const [
    tenantCounts,
    statusBreakdown,
    entityTotals,
    activity,
    recentTenants,
    topSantri,
    topPayments,
    topRfid,
    billingCounts,
    tenantHealthRows,
    billingWatchRows,
    featureUsageRows,
  ] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*)::int AS total_tenants,
        COUNT(*) FILTER (WHERE status = 'active')::int AS active_tenants,
        COUNT(*) FILTER (WHERE status = 'suspended')::int AS suspended_tenants,
        COUNT(*) FILTER (WHERE status = 'trial')::int AS trial_tenants
      FROM tenants
    `),
    pool.query(`
      SELECT status, COUNT(*)::int AS count
      FROM tenants
      GROUP BY status
      ORDER BY count DESC
    `),
    pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM users WHERE tenant_id IS NOT NULL) AS total_users,
        (SELECT COUNT(*)::int FROM santri) AS total_santri,
        (SELECT COUNT(*)::int FROM wali_santri) AS total_wali,
        (SELECT COUNT(*)::int FROM guru) AS total_guru,
        (SELECT COUNT(*)::int FROM kelas) AS total_kelas,
        (SELECT COUNT(*)::int FROM unit_pendidikan) AS total_units,
        (SELECT COUNT(*)::int FROM devices) AS total_devices,
        (SELECT COUNT(*)::int FROM devices WHERE status = 'online') AS online_devices
    `),
    pool.query(
      `
      SELECT
        (SELECT COUNT(*)::int FROM tenants
         WHERE onboarded_at >= $1 AND onboarded_at < $2) AS new_tenants_this_month,
        (SELECT COUNT(*)::int FROM pembayaran
         WHERE tanggal_bayar >= $1 AND tanggal_bayar < $2) AS payments_this_month_count,
        (SELECT COALESCE(SUM(nominal_bayar), 0)::bigint FROM pembayaran
         WHERE tanggal_bayar >= $1 AND tanggal_bayar < $2) AS payments_this_month_nominal,
        (SELECT COUNT(*)::int FROM transaksi_rfid
         WHERE created_at >= $3 AND created_at < $4) AS rfid_transactions_today,
        (SELECT COALESCE(SUM(nominal), 0)::bigint FROM transaksi_rfid
         WHERE created_at >= $3 AND created_at < $4) AS rfid_nominal_today
      `,
      [startOfMonth, startOfNextMonth, startOfToday, startOfTomorrow]
    ),
    pool.query(`
      SELECT
        id, slug, nama, status, onboarded_at,
        plan_code, billing_status, subscription_expires_at
      FROM tenants
      ORDER BY onboarded_at DESC NULLS LAST, id DESC
      LIMIT 8
    `),
    pool.query(`
      SELECT t.id, t.slug, t.nama, COUNT(s.id)::int AS metric_count
      FROM tenants t
      LEFT JOIN santri s ON s.tenant_id = t.id
      GROUP BY t.id, t.slug, t.nama
      ORDER BY metric_count DESC, t.nama ASC
      LIMIT 5
    `),
    pool.query(
      `
      SELECT t.id, t.slug, t.nama,
             COUNT(p.id)::int AS metric_count,
             COALESCE(SUM(p.nominal_bayar), 0)::bigint AS metric_nominal
      FROM tenants t
      LEFT JOIN pembayaran p
        ON p.tenant_id = t.id
       AND p.tanggal_bayar >= $1
       AND p.tanggal_bayar < $2
      GROUP BY t.id, t.slug, t.nama
      HAVING COUNT(p.id) > 0
      ORDER BY metric_nominal DESC, metric_count DESC
      LIMIT 5
      `,
      [startOfMonth, startOfNextMonth]
    ),
    pool.query(
      `
      SELECT t.id, t.slug, t.nama,
             COUNT(tr.id)::int AS metric_count,
             COALESCE(SUM(tr.nominal), 0)::bigint AS metric_nominal
      FROM tenants t
      LEFT JOIN transaksi_rfid tr
        ON tr.tenant_id = t.id
       AND tr.created_at >= $1
       AND tr.created_at < $2
      GROUP BY t.id, t.slug, t.nama
      HAVING COUNT(tr.id) > 0
      ORDER BY metric_count DESC, metric_nominal DESC
      LIMIT 5
      `,
      [startOfToday, startOfTomorrow]
    ),
    pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE billing_status = 'active')::int AS active_subscriptions,
        COUNT(*) FILTER (WHERE billing_status = 'trial')::int AS trial_tenants,
        COUNT(*) FILTER (WHERE billing_status = 'overdue')::int AS overdue_tenants,
        COUNT(*) FILTER (
          WHERE billing_status IN ('active', 'trial')
            AND subscription_expires_at >= NOW()
            AND subscription_expires_at < NOW() + INTERVAL '7 days'
        )::int AS expiring_soon_7_days
      FROM tenants
    `),
    pool.query(`
      SELECT
        t.id,
        t.slug,
        t.nama,
        t.status,
        t.plan_code,
        t.billing_status,
        t.subscription_expires_at,
        t.onboarded_at,
        (SELECT COUNT(*)::int FROM santri s WHERE s.tenant_id = t.id) AS total_santri,
        (SELECT COUNT(*)::int FROM users u WHERE u.tenant_id = t.id) AS total_users,
        (
          SELECT COUNT(*)::int
          FROM feature_catalog fc
          LEFT JOIN tenant_features tf
            ON tf.tenant_id = t.id
           AND tf.feature_key = fc.key
          WHERE COALESCE(tf.enabled, true) = true
        ) AS enabled_features,
        (
          SELECT COUNT(*)::int
          FROM feature_catalog fc
          LEFT JOIN tenant_features tf
            ON tf.tenant_id = t.id
           AND tf.feature_key = fc.key
          WHERE COALESCE(tf.enabled, true) = false
        ) AS disabled_features
      FROM tenants t
      ORDER BY
        CASE
          WHEN t.status <> 'active' THEN 0
          WHEN t.billing_status IN ('overdue', 'suspended', 'cancelled') THEN 1
          WHEN t.subscription_expires_at < NOW() + INTERVAL '7 days' THEN 2
          ELSE 3
        END,
        t.onboarded_at DESC NULLS LAST,
        t.id DESC
      LIMIT 8
    `),
    pool.query(`
      SELECT
        id,
        slug,
        nama,
        status,
        plan_code,
        billing_status,
        subscription_expires_at,
        onboarded_at
      FROM tenants
      WHERE billing_status IN ('overdue', 'suspended')
         OR (
          billing_status IN ('active', 'trial')
          AND subscription_expires_at >= NOW()
          AND subscription_expires_at < NOW() + INTERVAL '7 days'
        )
      ORDER BY
        CASE
          WHEN billing_status = 'overdue' THEN 0
          WHEN billing_status = 'suspended' THEN 1
          ELSE 2
        END,
        subscription_expires_at ASC NULLS LAST
      LIMIT 12
    `),
    pool.query(`
      SELECT
        fc.key,
        COUNT(t.id) FILTER (WHERE COALESCE(tf.enabled, true) = true)::int
          AS enabled_tenants
      FROM feature_catalog fc
      CROSS JOIN tenants t
      LEFT JOIN tenant_features tf
        ON tf.tenant_id = t.id
       AND tf.feature_key = fc.key
      WHERE fc.key IN ('rfid', 'wali_app', 'sahriyah', 'kas_instansi')
      GROUP BY fc.key
    `),
  ]);

  const tc = tenantCounts.rows[0];
  const et = entityTotals.rows[0];
  const act = activity.rows[0];
  const bc = billingCounts.rows[0];

  const recentTenantRows = await attachPackageLabels(
    recentTenants.rows.map(mapTenantRow)
  );
  const tenantHealth = await attachPackageLabels(
    tenantHealthRows.rows.map((row) => ({
      ...mapTenantRow(row),
      total_santri: row.total_santri,
      total_users: row.total_users,
      enabled_features: row.enabled_features,
      disabled_features: row.disabled_features,
    }))
  );
  const billingWatchTenants = await attachPackageLabels(
    billingWatchRows.rows.map(mapTenantRow)
  );
  const billingWatch = {
    overdue: billingWatchTenants.filter((tenant) => tenant.billing_status === "overdue"),
    expiring_soon: billingWatchTenants.filter(
      (tenant) =>
        ["active", "trial"].includes(tenant.billing_status) &&
        tenant.subscription_expires_at &&
        new Date(tenant.subscription_expires_at) >= new Date() &&
        new Date(tenant.subscription_expires_at) <
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    ),
    suspended: billingWatchTenants.filter(
      (tenant) => tenant.billing_status === "suspended"
    ),
  };

  const featureUsage = {
    rfid: 0,
    wali_app: 0,
    sahriyah: 0,
    kas_instansi: 0,
  };
  for (const row of featureUsageRows.rows) {
    featureUsage[row.key] = row.enabled_tenants;
  }

  return {
    success: true,
    summary: {
      total_tenants: tc.total_tenants,
      active_tenants: tc.active_tenants,
      suspended_tenants: tc.suspended_tenants,
      trial_tenants: tc.trial_tenants,
      total_users: et.total_users,
      total_santri: et.total_santri,
      total_wali: et.total_wali,
      total_guru: et.total_guru,
      total_kelas: et.total_kelas,
      total_units: et.total_units,
      total_devices: et.total_devices,
      online_devices: et.online_devices,
    },
    activity: {
      new_tenants_this_month: act.new_tenants_this_month,
      payments_this_month_count: act.payments_this_month_count,
      payments_this_month_nominal: Number(act.payments_this_month_nominal),
      rfid_transactions_today: act.rfid_transactions_today,
      rfid_nominal_today: Number(act.rfid_nominal_today),
    },
    billing: {
      active_subscriptions: bc.active_subscriptions,
      trial_tenants: bc.trial_tenants,
      overdue_tenants: bc.overdue_tenants,
      expiring_soon_7_days: bc.expiring_soon_7_days,
    },
    tenant_status_breakdown: statusBreakdown.rows.map((r) => ({
      status: r.status,
      count: r.count,
    })),
    recent_tenants: recentTenantRows,
    tenant_health: tenantHealth,
    billing_watch: billingWatch,
    feature_usage: featureUsage,
    recent_activity: buildRecentActivity({
      recentTenants: recentTenantRows,
      billingWatch,
      tenantHealth,
    }),
    top_tenants: {
      by_santri: topSantri.rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.nama,
        count: r.metric_count,
      })),
      by_payments_this_month: topPayments.rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.nama,
        count: r.metric_count,
        nominal: Number(r.metric_nominal),
      })),
      by_rfid_today: topRfid.rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.nama,
        count: r.metric_count,
        nominal: Number(r.metric_nominal),
      })),
    },
    generated_at: new Date().toISOString(),
  };
}

module.exports = {
  getDateRanges,
  getPlatformStatsSummary,
};
