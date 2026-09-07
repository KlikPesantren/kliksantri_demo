const pool = require("../db");
const { readMigration, recordMigration } = require("../utils/migrationLedger");

const FILENAME = "089_tenant_admin_display_name.sql";

async function columnExists(client) {
  const result = await client.query(
    "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tenants' AND column_name='tenant_display_name') AS value"
  );
  return result.rows[0].value === true;
}

async function snapshot(client) {
  const hasColumn = await columnExists(client);
  return {
    column_exists: hasColumn,
    tenant_count: Number((await client.query("SELECT COUNT(*) AS value FROM tenants")).rows[0].value),
    configured_count: hasColumn
      ? Number((await client.query("SELECT COUNT(*) AS value FROM tenants WHERE tenant_display_name IS NOT NULL")).rows[0].value)
      : 0,
    constraint_exists: Boolean((await client.query(
      "SELECT 1 FROM pg_constraint WHERE conname='tenants_display_name_not_blank' AND conrelid='public.tenants'::regclass"
    )).rows[0]),
    ledger_count: Number((await client.query(
      "SELECT COUNT(*) AS value FROM schema_migrations WHERE filename=$1",
      [FILENAME]
    )).rows[0].value),
  };
}

async function main() {
  const rehearsal = process.argv.includes("--rollback-rehearsal");
  const confirm = process.argv.includes("--confirm-production");
  if (!rehearsal && !confirm) {
    throw new Error("Gunakan --rollback-rehearsal atau --confirm-production");
  }

  const client = await pool.connect();
  try {
    const before = await snapshot(client);
    if (before.ledger_count) throw new Error("ALREADY_APPLIED:" + JSON.stringify(before));

    await client.query("BEGIN");
    const migration = readMigration(FILENAME);
    await client.query(migration.executionSql);
    await recordMigration(client, migration);

    const after = await snapshot(client);
    const checks = {
      column_exists: after.column_exists,
      constraint_exists: after.constraint_exists,
      ledger_recorded: after.ledger_count === 1,
      no_tenant_rows_added_or_removed: after.tenant_count === before.tenant_count,
      no_destructive_backfill: after.configured_count === before.configured_count,
    };
    if (Object.values(checks).some((value) => !value)) {
      throw new Error("PRODUCTION_CHECK_FAILED:" + JSON.stringify(checks));
    }

    if (rehearsal) {
      await client.query("ROLLBACK");
      const rollback = await snapshot(client);
      const rollbackPass = JSON.stringify(rollback) === JSON.stringify(before);
      console.log(JSON.stringify({
        mode: "PRODUCTION_ROLLBACK_REHEARSAL",
        target: { database: process.env.DB_NAME, host: process.env.DB_HOST },
        before,
        after,
        checks,
        rollback: rollbackPass ? "PASS" : "FAIL",
      }, null, 2));
      if (!rollbackPass) process.exitCode = 1;
      return;
    }

    await client.query("COMMIT");
    console.log(JSON.stringify({
      mode: "PRODUCTION_APPLY",
      target: { database: process.env.DB_NAME, host: process.env.DB_HOST },
      migration: FILENAME,
      before,
      after,
      checks,
      status: "PASS",
    }, null, 2));
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {}
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "FAIL", reason: error.message }));
  process.exit(1);
});
