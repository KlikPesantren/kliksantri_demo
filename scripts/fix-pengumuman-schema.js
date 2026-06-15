/**
 * Apply migration 017 + schema verify + pengumuman API smoke test (DB level).
 * Run: node scripts/fix-pengumuman-schema.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const pool = require("../db");
const {
  applySqlMigration,
  runFullSchemaAudit,
  printSchemaAuditReport,
} = require("../utils/schemaAudit");

const INSERT_SQL = `
  INSERT INTO pengumuman (judul, isi, cover_url, prioritas, expires_at, is_active)
  VALUES ($1, $2, $3, $4, $5, $6)
  RETURNING id, judul, cover_url
`;

const GET_SQL = `
  SELECT id, judul, isi, cover_url, prioritas, published_at, expires_at, is_active, created_by, created_at
  FROM pengumuman
  ORDER BY id DESC
  LIMIT 5
`;

const TINY_COVER =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA//2Q==";

async function verifySchema() {
  const { rows } = await pool.query(
    `SELECT column_name, data_type
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'pengumuman'
     ORDER BY ordinal_position`
  );
  console.log("\n=== pengumuman schema ===");
  console.table(rows);
  return rows.map((r) => r.column_name);
}

async function testInserts() {
  const client = await pool.connect();
  const createdIds = [];

  try {
    console.log("\n=== Test A: POST without cover ===");
    const a = await client.query(INSERT_SQL, [
      `Audit A ${Date.now()}`,
      "Isi tanpa cover",
      null,
      "normal",
      null,
      true,
    ]);
    createdIds.push(a.rows[0].id);
    console.log("OK id=", a.rows[0].id);

    console.log("\n=== Test B: POST with cover ===");
    const b = await client.query(INSERT_SQL, [
      `Audit B ${Date.now()}`,
      "Isi dengan cover",
      TINY_COVER,
      "penting",
      null,
      true,
    ]);
    createdIds.push(b.rows[0].id);
    console.log("OK id=", b.rows[0].id, "cover_len=", b.rows[0].cover_url?.length ?? 0);

    console.log("\n=== Test C: GET pengumuman ===");
    const c = await client.query(GET_SQL);
    console.log("OK rows=", c.rows.length);

    await client.query("DELETE FROM pengumuman WHERE id = ANY($1::int[])", [createdIds]);
    console.log("\nCleanup: removed test rows", createdIds);
  } finally {
    client.release();
  }
}

async function main() {
  console.log("Applying migrations/017_pengumuman_cover.sql ...");
  await applySqlMigration("migrations/017_pengumuman_cover.sql");
  console.log("Migration 017 applied.");

  const columns = await verifySchema();
  const expected = [
    "id",
    "judul",
    "isi",
    "cover_url",
    "prioritas",
    "published_at",
    "expires_at",
    "is_active",
    "created_by",
    "created_at",
  ];
  const missing = expected.filter((c) => !columns.includes(c));
  if (missing.length) {
    console.error("Still missing columns:", missing);
    process.exit(1);
  }

  const report = await runFullSchemaAudit();
  printSchemaAuditReport(report);

  await testInserts();
  await pool.end();
  console.log("\nAll pengumuman schema tests passed.");
}

main().catch((err) => {
  console.error(err);
  pool.end();
  process.exit(1);
});
