const fs = require("fs");
const path = require("path");
const pool = require("../db");

const STARTUP_CHECKS = [
  { table: "pengumuman", column: "cover_url" },
];

const QUERY_EXPECTED_COLUMNS = {
  pengumuman: [
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
  ],
  profil_pesantren: [
    "id",
    "nama_pesantren",
    "alamat",
    "telepon",
    "email",
    "website",
    "logo_url",
    "visi",
    "misi",
    "updated_at",
    "banner_url",
    "banner_active",
    "splash_logo_url",
    "app_icon_url",
    "tagline",
    "tentang",
  ],
};

const MIGRATION_COLUMN_HINTS = {
  "017_pengumuman_cover.sql": [{ table: "pengumuman", column: "cover_url" }],
  "018_profil_pesantren_banner.sql": [
    { table: "profil_pesantren", column: "banner_url" },
    { table: "profil_pesantren", column: "banner_active" },
  ],
  "019_profil_pesantren_white_label.sql": [
    { table: "profil_pesantren", column: "splash_logo_url" },
    { table: "profil_pesantren", column: "app_icon_url" },
    { table: "profil_pesantren", column: "tagline" },
    { table: "profil_pesantren", column: "tentang" },
  ],
};

async function getTableColumns(tableName) {
  const { rows } = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [tableName]
  );
  return new Set(rows.map((r) => r.column_name));
}

async function runStartupSchemaAudit() {
  for (const { table, column } of STARTUP_CHECKS) {
    try {
      const columns = await getTableColumns(table);
      if (!columns.has(column)) {
        console.error(`[SCHEMA AUDIT] Missing column ${table}.${column}`);
      }
    } catch (err) {
      console.error(`[SCHEMA AUDIT] Failed checking ${table}.${column}:`, err.message);
    }
  }
}

async function runFullSchemaAudit() {
  const missingColumns = [];
  const missingTables = [];
  const pendingMigrations = [];

  for (const [table, expectedCols] of Object.entries(QUERY_EXPECTED_COLUMNS)) {
    let columns;
    try {
      columns = await getTableColumns(table);
    } catch (err) {
      missingTables.push({ table, reason: err.message });
      continue;
    }

    if (columns.size === 0) {
      missingTables.push({ table, reason: "table not found or has no columns" });
      continue;
    }

    for (const col of expectedCols) {
      if (!columns.has(col)) {
        missingColumns.push(`${table}.${col}`);
      }
    }
  }

  for (const [file, hints] of Object.entries(MIGRATION_COLUMN_HINTS)) {
    for (const { table, column } of hints) {
      const columns = await getTableColumns(table);
      if (!columns.has(column)) {
        pendingMigrations.push({ file, table, column });
      }
    }
  }

  return { missingColumns, missingTables, pendingMigrations };
}

function printSchemaAuditReport(report) {
  console.log("\n=== SCHEMA AUDIT REPORT ===\n");
  console.log("Missing Columns:");
  if (report.missingColumns.length === 0) {
    console.log("  (none)");
  } else {
    report.missingColumns.forEach((c) => console.log(`  - ${c}`));
  }
  console.log("\nMissing Tables:");
  if (report.missingTables.length === 0) {
    console.log("  (none)");
  } else {
    report.missingTables.forEach((t) =>
      console.log(`  - ${t.table}: ${t.reason}`)
    );
  }
  console.log("\nPending Migrations:");
  if (report.pendingMigrations.length === 0) {
    console.log("  (none)");
  } else {
    const seen = new Set();
    for (const item of report.pendingMigrations) {
      const key = `${item.file}:${item.table}.${item.column}`;
      if (seen.has(key)) continue;
      seen.add(key);
      console.log(`  - ${item.file} → missing ${item.table}.${item.column}`);
    }
  }
  console.log("");
}

async function applySqlMigration(relativePath) {
  const fullPath = path.join(__dirname, "..", relativePath);
  const sql = fs.readFileSync(fullPath, "utf8");
  await pool.query(sql);
  return fullPath;
}

module.exports = {
  runStartupSchemaAudit,
  runFullSchemaAudit,
  printSchemaAuditReport,
  applySqlMigration,
  QUERY_EXPECTED_COLUMNS,
};
