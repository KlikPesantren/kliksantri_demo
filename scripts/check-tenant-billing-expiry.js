/**
 * Check tenant billing expiry.
 *
 * Default: dry run only.
 * Apply overdue: BILLING_APPLY=1 node scripts/check-tenant-billing-expiry.js
 * Suspend after grace: BILLING_SUSPEND=1 (requires BILLING_APPLY=1)
 *
 * BILLING_GRACE_DAYS default 7 — overdue tenants past grace may be suspended.
 */
require("dotenv").config();
const pool = require("../db");

const GRACE_DAYS = Number.parseInt(process.env.BILLING_GRACE_DAYS || "7", 10);

function formatRow(row) {
  const expires = row.subscription_expires_at;
  return `- ${row.slug} (${row.nama}) plan=${row.plan_code} status=${row.billing_status} expires=${expires?.toISOString?.() || expires}`;
}

async function run() {
  const apply = process.env.BILLING_APPLY === "1";
  const suspend = process.env.BILLING_SUSPEND === "1";

  const { rows: expiredRows } = await pool.query(
    `SELECT id, slug, nama, plan_code, billing_status, subscription_expires_at
     FROM tenants
     WHERE subscription_expires_at < NOW()
       AND billing_status IN ('active', 'trial')
       AND slug <> 'default'
     ORDER BY subscription_expires_at ASC`
  );

  const { rows: graceRows } = await pool.query(
    `SELECT id, slug, nama, plan_code, billing_status, subscription_expires_at
     FROM tenants
     WHERE billing_status = 'overdue'
       AND subscription_expires_at < NOW() - ($1::int * INTERVAL '1 day')
       AND slug <> 'default'
       AND status = 'active'
     ORDER BY subscription_expires_at ASC`,
    [GRACE_DAYS]
  );

  console.log(
    `Billing expiry check (grace=${GRACE_DAYS}d). Mode: ${apply ? "APPLY" : "DRY RUN"}${suspend ? " + SUSPEND" : ""}`
  );
  console.log(`Expired (active/trial -> overdue): ${expiredRows.length}`);
  for (const row of expiredRows) console.log(formatRow(row));

  console.log(`Overdue past grace (-> billing suspended + tenant suspended): ${graceRows.length}`);
  for (const row of graceRows) console.log(formatRow(row));

  if (apply && expiredRows.length > 0) {
    const ids = expiredRows.map((row) => row.id);
    const updated = await pool.query(
      `UPDATE tenants
       SET billing_status = 'overdue', updated_at = NOW()
       WHERE id = ANY($1::int[])
         AND billing_status IN ('active', 'trial')
       RETURNING id, slug, nama, billing_status`,
      [ids]
    );

    console.log(`Updated to overdue: ${updated.rows.length}`);
    for (const row of updated.rows) {
      console.log(`- ${row.slug} (${row.nama}) -> ${row.billing_status}`);
    }
  } else if (!apply && expiredRows.length > 0) {
    console.log("Dry run. Set BILLING_APPLY=1 to mark expired tenants as overdue.");
  }

  if (suspend) {
    if (!apply) {
      console.log("BILLING_SUSPEND=1 ignored without BILLING_APPLY=1.");
    } else if (graceRows.length > 0) {
      const ids = graceRows.map((row) => row.id);
      const updated = await pool.query(
        `UPDATE tenants
         SET
           billing_status = 'suspended',
           status = 'suspended',
           suspended_at = COALESCE(suspended_at, NOW()),
           suspended_reason = COALESCE(
             suspended_reason,
             $2
           ),
           updated_at = NOW()
         WHERE id = ANY($1::int[])
           AND billing_status = 'overdue'
           AND slug <> 'default'
         RETURNING id, slug, nama, billing_status, status`,
        [ids, `Billing overdue > ${GRACE_DAYS} hari`]
      );

      console.log(`Suspended after grace: ${updated.rows.length}`);
      for (const row of updated.rows) {
        console.log(
          `- ${row.slug} billing=${row.billing_status} tenant=${row.status}`
        );
      }
    } else {
      console.log("No overdue tenants past grace period to suspend.");
    }
  } else if (graceRows.length > 0) {
    console.log(
      `Dry run. Set BILLING_SUSPEND=1 with BILLING_APPLY=1 to suspend overdue tenants after ${GRACE_DAYS} day grace.`
    );
  }

  await pool.end();
}

run().catch(async (err) => {
  console.error("ERR", err.message);
  try {
    await pool.end();
  } catch (_) {
    /* ignore */
  }
  process.exit(1);
});
