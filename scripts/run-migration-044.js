/**
 * Run migration 044 — tenant feature management
 * Usage: node scripts/run-migration-044.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

async function run() {
  const sqlPath = path.join(
    __dirname,
    "../migrations/044_tenant_feature_management.sql"
  );
  await pool.query(fs.readFileSync(sqlPath, "utf8"));
  console.log("Migration 044 OK");

  const { rows: catalog } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM feature_catalog`
  );
  console.log("feature_catalog count:", catalog[0].n);
  if (catalog[0].n < 20) {
    console.error("FAIL: expected at least 20 features in catalog");
    process.exit(1);
  }

  const { rows: tenants } = await pool.query(`SELECT id, slug FROM tenants`);
  for (const t of tenants) {
    const { rows: tf } = await pool.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE enabled = true)::int AS enabled
       FROM tenant_features WHERE tenant_id = $1`,
      [t.id]
    );
    console.log(`tenant ${t.slug}:`, tf[0]);
    if (tf[0].total !== catalog[0].n) {
      console.error(`FAIL: tenant ${t.slug} missing feature rows`);
      process.exit(1);
    }
  }

  const { rows: defaultTenant } = await pool.query(
    `SELECT COUNT(*)::int AS disabled
     FROM tenant_features tf
     JOIN tenants t ON t.id = tf.tenant_id
     WHERE t.slug = 'default' AND tf.enabled = false`
  );
  console.log("default tenant disabled features:", defaultTenant[0].disabled);

  await pool.end();
}

run().catch((err) => {
  console.error("ERR", err.message);
  process.exit(1);
});
