require("dotenv").config();

const fs = require("fs");
const path = require("path");
const pool = require("./db");

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

function migrationSortKey(filename) {
  const match = filename.match(/^(\d+)/);
  return match ? Number.parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
}

function listMigrationFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort((a, b) => {
      const order = migrationSortKey(a) - migrationSortKey(b);
      return order !== 0 ? order : a.localeCompare(b);
    });
}

async function run() {
  const files = listMigrationFiles();

  if (files.length === 0) {
    console.log("No .sql migration files found in migrations/");
    process.exit(0);
  }

  console.log(`Database: ${process.env.DB_NAME} @ ${process.env.DB_HOST}`);
  console.log(`Found ${files.length} migration file(s):\n`);
  files.forEach((file, index) => console.log(`  ${index + 1}. ${file}`));
  console.log("");

  await pool.query("SELECT 1");
  console.log("Connected.\n");

  for (const file of files) {
    const sqlPath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(sqlPath, "utf8");

    console.log(`Running: ${file}`);

    try {
      await pool.query(sql);
      console.log(`OK: ${file}\n`);
    } catch (err) {
      console.error(`FAILED: ${file}`);
      console.error(err.message);
      await pool.end();
      process.exit(1);
    }
  }

  await pool.end();
  console.log("Migration selesai.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
