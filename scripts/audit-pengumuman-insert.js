/**
 * Read-only schema check + test INSERT (diagnostic).
 * Run: node scripts/audit-pengumuman-insert.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const pool = require("../db");

const INSERT_SQL = `
  INSERT INTO pengumuman (
    judul,
    isi,
    cover_url,
    prioritas,
    expires_at,
    is_active
  )
  VALUES ($1, $2, $3, $4, $5, $6)
  RETURNING id, judul
`;

const INSERT_COLUMNS = [
  "judul",
  "isi",
  "cover_url",
  "prioritas",
  "expires_at",
  "is_active",
];

const TEST_PAYLOAD = {
  judul: "Audit Test Pengumuman",
  isi: "Isi uji coba audit INSERT.",
  cover_url: null,
  prioritas: "normal",
  expires_at: null,
  is_active: true,
};

async function main() {
  console.log("=== SCHEMA: pengumuman columns ===");
  const schema = await pool.query(
    `SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'pengumuman'
     ORDER BY ordinal_position`
  );
  console.table(schema.rows);

  const columnNames = schema.rows.map((r) => r.column_name);
  console.log("\n=== INSERT audit ===");
  console.log("Table: pengumuman");
  console.log("INSERT columns:", INSERT_COLUMNS.length, INSERT_COLUMNS);
  console.log("Placeholders: $1..$6 (6)");
  console.log(
    "Missing in DB:",
    INSERT_COLUMNS.filter((c) => !columnNames.includes(c))
  );
  console.log(
    "Extra in INSERT vs listed columns:",
    INSERT_COLUMNS.filter((c) => !columnNames.includes(c))
  );

  console.log("\n=== Test INSERT (will rollback) ===");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(INSERT_SQL, [
      TEST_PAYLOAD.judul,
      TEST_PAYLOAD.isi,
      TEST_PAYLOAD.cover_url,
      TEST_PAYLOAD.prioritas,
      TEST_PAYLOAD.expires_at,
      TEST_PAYLOAD.is_active,
    ]);
    console.log("INSERT OK (test row id):", result.rows[0]);
    await client.query("ROLLBACK");
    console.log("ROLLBACK OK — no data persisted.");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("\n=== INSERT FAILED ===");
    console.error("message:", err.message);
    console.error("code:", err.code);
    console.error("detail:", err.detail);
    console.error("column:", err.column);
    console.error("stack:", err.stack);
  } finally {
    client.release();
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  pool.end();
  process.exit(1);
});
