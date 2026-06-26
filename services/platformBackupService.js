const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { spawn } = require("child_process");

const BACKUP_DIR = path.resolve(
  process.env.BACKUP_DIR || path.join(__dirname, "..", "backups")
);
const UPLOAD_DIR = path.join(BACKUP_DIR, "uploads");
const BACKUP_PREFIX = "kliksantri";
const BACKUP_EXT = ".backup";

function pad(value) {
  return String(value).padStart(2, "0");
}

function buildTimestamp(date = new Date()) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("_") + "_" + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

function buildBackupFilename(date = new Date()) {
  return `${BACKUP_PREFIX}_${buildTimestamp(date)}${BACKUP_EXT}`;
}

function assertBackupFilename(filename) {
  const safe = path.basename(String(filename || ""));
  if (safe !== filename || !safe.endsWith(BACKUP_EXT)) {
    const err = new Error("Nama file backup tidak valid");
    err.statusCode = 400;
    throw err;
  }
  return safe;
}

function resolveBackupPath(filename) {
  const safe = assertBackupFilename(filename);
  const fullPath = path.resolve(BACKUP_DIR, safe);
  if (!fullPath.startsWith(`${BACKUP_DIR}${path.sep}`)) {
    const err = new Error("Path backup tidak valid");
    err.statusCode = 400;
    throw err;
  }
  return fullPath;
}

async function ensureBackupDirectories() {
  await fsp.mkdir(BACKUP_DIR, { recursive: true });
  await fsp.mkdir(UPLOAD_DIR, { recursive: true });
}

function getDatabaseCommandConfig() {
  const databaseUrl = process.env.DATABASE_URL;
  const dbName = process.env.DB_NAME;
  const dbHost = process.env.DB_HOST;
  const dbUser = process.env.DB_USER;
  const dbPort = process.env.DB_PORT || "5432";
  const dbPassword = process.env.DB_PASSWORD || "";

  if (databaseUrl) {
    return {
      connectionArg: databaseUrl,
      env: { ...process.env },
    };
  }

  if (!dbName || !dbHost || !dbUser) {
    const err = new Error("Env database belum lengkap untuk backup/restore");
    err.statusCode = 500;
    throw err;
  }

  return {
    args: [
      "--host",
      dbHost,
      "--port",
      String(dbPort),
      "--username",
      dbUser,
      "--dbname",
      dbName,
    ],
    env: {
      ...process.env,
      PGPASSWORD: dbPassword,
    },
  };
}

function runPostgresCommand(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (err) => {
      reject(err);
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      const err = new Error(stderr || stdout || `${command} gagal dengan code ${code}`);
      err.code = code;
      err.stderr = stderr;
      reject(err);
    });
  });
}

async function ensurePostgresTool(command) {
  try {
    await runPostgresCommand(command, ["--version"], process.env);
  } catch (err) {
    if (err.code === "ENOENT") {
      const toolErr = new Error("PostgreSQL tools belum tersedia di server.");
      toolErr.statusCode = 503;
      throw toolErr;
    }
    throw err;
  }
}

async function statBackupFile(filename) {
  const fullPath = resolveBackupPath(filename);
  const stat = await fsp.stat(fullPath);
  return {
    filename,
    size: stat.size,
    created_at: stat.birthtime || stat.mtime,
  };
}

async function listBackups() {
  await ensureBackupDirectories();
  const entries = await fsp.readdir(BACKUP_DIR, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(BACKUP_EXT)) continue;
    files.push(await statBackupFile(entry.name));
  }

  return files.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

async function createBackup() {
  await ensureBackupDirectories();

  let filename = buildBackupFilename();
  let outputPath = resolveBackupPath(filename);

  while (fs.existsSync(outputPath)) {
    filename = buildBackupFilename(new Date(Date.now() + 1000));
    outputPath = resolveBackupPath(filename);
  }

  const pgDumpPath = process.env.PG_DUMP_PATH || "pg_dump";
  await ensurePostgresTool(pgDumpPath);

  const dbConfig = getDatabaseCommandConfig();
  const connectionArgs = dbConfig.connectionArg ? [dbConfig.connectionArg] : dbConfig.args;
  const args = [
    "--format=custom",
    "--no-owner",
    "--no-privileges",
    "--file",
    outputPath,
    ...connectionArgs,
  ];

  try {
    await runPostgresCommand(pgDumpPath, args, dbConfig.env);
    return statBackupFile(filename);
  } catch (err) {
    await fsp.rm(outputPath, { force: true }).catch(() => {});
    throw err;
  }
}

async function restoreBackup(uploadedPath) {
  if (!uploadedPath) {
    const err = new Error("File restore harus berekstensi .backup");
    err.statusCode = 400;
    throw err;
  }

  const pgRestorePath = process.env.PG_RESTORE_PATH || "pg_restore";
  await ensurePostgresTool(pgRestorePath);

  const dbConfig = getDatabaseCommandConfig();
  const connectionArgs = dbConfig.connectionArg
    ? ["--dbname", dbConfig.connectionArg]
    : dbConfig.args;
  const args = [
    "--clean",
    "--if-exists",
    "--no-owner",
    "--no-privileges",
    "--exit-on-error",
    "--single-transaction",
    ...connectionArgs,
    uploadedPath,
  ];

  return runPostgresCommand(pgRestorePath, args, dbConfig.env);
}

module.exports = {
  BACKUP_DIR,
  UPLOAD_DIR,
  createBackup,
  listBackups,
  restoreBackup,
  resolveBackupPath,
  assertBackupFilename,
  ensureBackupDirectories,
};
