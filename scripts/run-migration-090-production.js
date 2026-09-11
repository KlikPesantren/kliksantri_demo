const pool = require("../db");
const { readMigration, recordMigration } = require("../utils/migrationLedger");

const FILENAME = "090_sahriyah_membership_idempotency_and_alumni_transition.sql";

async function fingerprint(client, table, moneyColumns) {
  const sums = moneyColumns.map((column) =>
    `COALESCE(SUM(COALESCE(${column}, 0)), 0)::text AS ${column}_sum`).join(", ");
  const result = await client.query(
    `SELECT COUNT(*)::integer AS row_count,
            MD5(COALESCE(STRING_AGG(TO_JSONB(t)::text, E'\\n' ORDER BY id), '')) AS row_hash
            ${sums ? `, ${sums}` : ""}
     FROM ${table} t`,
  );
  return result.rows[0];
}

async function financialSnapshot(client) {
  return {
    tagihan_sahriyah: await fingerprint(client, "tagihan_sahriyah", ["nominal", "nominal_beras", "total_bayar", "sisa_tagihan"]),
    pembayaran_sahriyah: await fingerprint(client, "pembayaran_sahriyah", ["nominal", "nominal_beras"]),
    buku_kas: await fingerprint(client, "buku_kas", ["nominal"]),
  };
}

async function schemaSnapshot(client) {
  const result = await client.query(
    `SELECT
       TO_REGCLASS('public.uq_tagihan_sahriyah_membership_period') IS NOT NULL AS modern_unique,
       TO_REGCLASS('public.uq_tagihan_sahriyah_legacy_identity_period') IS NOT NULL AS legacy_unique,
       TO_REGCLASS('public.tagihan_sahriyah_tenant_santri_bulan_tahun_key') IS NOT NULL AS old_unique,
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='alumni_units' AND column_name='source_santri_unit_id') AS source_membership_column,
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='alumni_units' AND column_name='effective_exit_at') AS effective_exit_column,
       EXISTS (SELECT 1 FROM pg_constraint WHERE conname='alumni_units_source_membership_tenant_fkey' AND conrelid='public.alumni_units'::regclass AND convalidated) AS source_membership_fk,
       TO_REGCLASS('public.uq_alumni_units_source_membership') IS NOT NULL AS source_membership_unique,
       (SELECT COUNT(*)::integer FROM schema_migrations WHERE filename=$1) AS ledger_count`,
    [FILENAME],
  );
  return result.rows[0];
}

async function duplicateSnapshot(client) {
  const result = await client.query(
    `SELECT
       (SELECT COUNT(*)::integer FROM (
          SELECT 1 FROM tagihan_sahriyah
          WHERE unit_id IS NOT NULL AND santri_unit_id IS NOT NULL
          GROUP BY tenant_id, unit_id, santri_unit_id, bulan, tahun HAVING COUNT(*) > 1
        ) d) AS modern_duplicates,
       (SELECT COUNT(*)::integer FROM (
          SELECT 1 FROM tagihan_sahriyah
          WHERE unit_id IS NULL OR santri_unit_id IS NULL
          GROUP BY tenant_id, santri_id, bulan, tahun HAVING COUNT(*) > 1
        ) d) AS legacy_duplicates`,
  );
  return result.rows[0];
}

async function main() {
  const rehearsal = process.argv.includes("--rollback-rehearsal");
  const confirm = process.argv.includes("--confirm-production");
  if (!rehearsal && !confirm) {
    throw new Error("Gunakan --rollback-rehearsal atau --confirm-production");
  }

  const client = await pool.connect();
  try {
    const beforeSchema = await schemaSnapshot(client);
    if (Number(beforeSchema.ledger_count)) throw new Error(`ALREADY_APPLIED:${JSON.stringify(beforeSchema)}`);
    const beforeFinancial = await financialSnapshot(client);
    const beforeDuplicates = await duplicateSnapshot(client);
    if (Number(beforeDuplicates.modern_duplicates) || Number(beforeDuplicates.legacy_duplicates)) {
      throw new Error(`DUPLICATE_PREFLIGHT_FAILED:${JSON.stringify(beforeDuplicates)}`);
    }

    await client.query("BEGIN");
    const migration = readMigration(FILENAME);
    await client.query(migration.executionSql);
    await recordMigration(client, migration);
    const afterSchema = await schemaSnapshot(client);
    const afterFinancial = await financialSnapshot(client);
    const afterDuplicates = await duplicateSnapshot(client);
    const checks = {
      replacement_indexes_present: afterSchema.modern_unique && afterSchema.legacy_unique,
      obsolete_tenant_identity_key_removed: !afterSchema.old_unique,
      alumni_transition_schema_present: afterSchema.source_membership_column
        && afterSchema.effective_exit_column && afterSchema.source_membership_fk
        && afterSchema.source_membership_unique,
      ledger_recorded: Number(afterSchema.ledger_count) === 1,
      no_duplicate_collision: Number(afterDuplicates.modern_duplicates) === 0
        && Number(afterDuplicates.legacy_duplicates) === 0,
      financial_rows_and_amounts_unchanged: JSON.stringify(afterFinancial) === JSON.stringify(beforeFinancial),
    };
    if (Object.values(checks).some((value) => !value)) {
      throw new Error(`MIGRATION_090_CHECK_FAILED:${JSON.stringify({ checks, beforeFinancial, afterFinancial })}`);
    }

    if (rehearsal) {
      await client.query("ROLLBACK");
      const rollbackSchema = await schemaSnapshot(client);
      const rollbackPass = JSON.stringify(rollbackSchema) === JSON.stringify(beforeSchema);
      console.log(JSON.stringify({
        mode: "PRODUCTION_ROLLBACK_REHEARSAL",
        before_schema: beforeSchema,
        after_schema: afterSchema,
        financial: beforeFinancial,
        duplicates: afterDuplicates,
        checks,
        rollback: rollbackPass ? "PASS" : "FAIL",
      }, null, 2));
      if (!rollbackPass) process.exitCode = 1;
      return;
    }

    await client.query("COMMIT");
    console.log(JSON.stringify({
      mode: "PRODUCTION_APPLY",
      migration: FILENAME,
      schema: afterSchema,
      financial: afterFinancial,
      duplicates: afterDuplicates,
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

if (require.main === module) {
  main().catch((error) => {
    console.error(JSON.stringify({ status: "FAIL", reason: error.message }));
    process.exit(1);
  });
}

module.exports = { duplicateSnapshot, financialSnapshot, schemaSnapshot };
