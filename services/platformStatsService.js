const pool = require("../db");

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
    onboarded_at: row.onboarded_at,
  };
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
      SELECT id, slug, nama, status, onboarded_at
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
  ]);

  const tc = tenantCounts.rows[0];
  const et = entityTotals.rows[0];
  const act = activity.rows[0];

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
    tenant_status_breakdown: statusBreakdown.rows.map((r) => ({
      status: r.status,
      count: r.count,
    })),
    recent_tenants: recentTenants.rows.map(mapTenantRow),
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
