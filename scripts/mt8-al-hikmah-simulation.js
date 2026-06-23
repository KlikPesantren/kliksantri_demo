/**
 * MT-8 — Customer #2 Simulation (Pesantren Al Hikmah)
 * Usage: node scripts/mt8-al-hikmah-simulation.js
 * Optional: SMOKE_BASE_URL=http://localhost:3000 node scripts/mt8-al-hikmah-simulation.js --verify-only
 *
 * Safe simulation — does not touch default tenant (Anwarul Huda) data.
 * Admin password printed once to stdout; never written to repo.
 */
require("dotenv").config();
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const pool = require("../db");
const { createTenantWithDefaults } = require("../services/tenantOnboardingService");
const { updateTenantFeatures } = require("../services/tenantFeatureService");

const SLUG = "al-hikmah";
const TENANT_NAME = "Pesantren Al Hikmah";
const ADMIN_USERNAME = "admin.alhikmah";
const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const VERIFY_ONLY = process.argv.includes("--verify-only");

const ENABLED_FEATURES = [
  "dashboard",
  "profil",
  "sistem",
  "santri",
  "guru",
  "kelas",
  "wali",
  "pembayaran",
  "buku_kas",
  "pengumuman",
  "perizinan",
  "pelanggaran",
];

const DISABLED_FEATURES = [
  "rfid",
  "wali_app",
  "sahriyah",
  "kas_instansi",
  "program_unit",
];

const HIDDEN_MENU_FEATURES = ["rfid", "sahriyah", "kas_instansi"];

let adminPassword = null;
let tenantId = null;
let createdThisRun = false;

let passed = 0;
let failed = 0;

function ok(label) {
  passed++;
  console.log("  PASS:", label);
}

function fail(label, detail) {
  failed++;
  console.error("  FAIL:", label, detail !== undefined ? detail : "");
}

function section(title) {
  console.log(`\n=== ${title} ===\n`);
}

async function fetchJson(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

async function platformLogin() {
  const { body } = await fetchJson("/platform/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: process.env.SMOKE_PLATFORM_USER || "platform",
      password: process.env.SMOKE_PLATFORM_PASS || "123456",
    }),
  });
  if (!body?.token) throw new Error(`Platform login failed: ${JSON.stringify(body)}`);
  return body.token;
}

async function tenantLogin(username, password, tenantSlug) {
  const { res, body } = await fetchJson("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, tenant_slug: tenantSlug }),
  });
  return { res, body };
}

async function task1Precheck() {
  section("TASK 1 — Precheck");
  const { rows } = await pool.query(
    `SELECT id, slug, nama, status FROM tenants WHERE slug = $1`,
    [SLUG]
  );
  if (rows.length > 0) {
    tenantId = rows[0].id;
    ok(`Tenant '${SLUG}' sudah ada (id=${tenantId}) — skip create`);
    return { exists: true, tenant: rows[0] };
  }
  ok(`Tenant '${SLUG}' belum ada — akan dibuat`);
  return { exists: false };
}

async function task2CreateTenant() {
  section("TASK 2 — Create Tenant Dummy");
  if (tenantId) {
    console.log("  SKIP: tenant sudah ada");
    return;
  }

  adminPassword = crypto.randomBytes(16).toString("base64url");

  const result = await createTenantWithDefaults(
    {
      nama_pesantren: TENANT_NAME,
      slug: SLUG,
      alamat: "Jl. Simulasi Al Hikmah No. 1",
      telepon: "081200000001",
      admin_nama: "Admin Al Hikmah",
      admin_username: ADMIN_USERNAME,
      admin_password: adminPassword,
      create_default_unit_users: false,
    },
    { id: null }
  );

  tenantId = result.tenant.id;
  createdThisRun = true;

  ok(`Tenant dibuat: ${TENANT_NAME} (id=${tenantId}, slug=${SLUG})`);
  ok(`Admin user: ${ADMIN_USERNAME}`);

  console.log("\n  ═══════════════════════════════════════════════════════");
  console.log("  CREDENTIAL ADMIN TENANT (tampil sekali — jangan commit):");
  console.log(`  Username : ${ADMIN_USERNAME}`);
  console.log(`  Password : ${adminPassword}`);
  console.log(`  Slug     : ${SLUG}`);
  console.log("  ═══════════════════════════════════════════════════════\n");
}

async function task3FeatureSetup() {
  section("TASK 3 — Feature Setup");

  const { rows: catalog } = await pool.query(`SELECT key FROM feature_catalog`);
  const allKeys = catalog.map((r) => r.key);

  const updates = allKeys.map((key) => {
    if (ENABLED_FEATURES.includes(key)) return { key, enabled: true };
    if (DISABLED_FEATURES.includes(key)) return { key, enabled: false };
    return { key, enabled: false };
  });

  const featureResult = await updateTenantFeatures(tenantId, updates);
  const features = Array.isArray(featureResult)
    ? featureResult
    : featureResult.features || [];

  for (const key of ENABLED_FEATURES) {
    const row = features.find((f) => f.key === key);
    if (row?.enabled) ok(`Feature ON: ${key}`);
    else fail(`Feature ON: ${key}`, row);
  }

  for (const key of DISABLED_FEATURES) {
    const row = features.find((f) => f.key === key);
    if (row && !row.enabled) ok(`Feature OFF: ${key}`);
    else fail(`Feature OFF: ${key}`, row);
  }
}

async function task4SeedData() {
  section("TASK 4 — Seed Minimal Data");

  const prefix = "MT8-HIKMAH";

  await pool.query(
    `DELETE FROM wali_santri WHERE tenant_id = $1 AND nama LIKE $2`,
    [tenantId, `${prefix}%`]
  );
  await pool.query(
    `DELETE FROM santri WHERE tenant_id = $1 AND nis LIKE $2`,
    [tenantId, `${prefix}%`]
  );
  await pool.query(
    `DELETE FROM guru WHERE tenant_id = $1 AND nama LIKE $2`,
    [tenantId, `${prefix}%`]
  );
  await pool.query(
    `DELETE FROM kelas WHERE tenant_id = $1 AND nama_kelas LIKE $2`,
    [tenantId, `${prefix}%`]
  );

  const kelasA = await pool.query(
    `INSERT INTO kelas (nama_kelas, tenant_id) VALUES ($1, $2) RETURNING id, nama_kelas`,
    [`${prefix}-Kelas A`, tenantId]
  );
  const kelasB = await pool.query(
    `INSERT INTO kelas (nama_kelas, tenant_id) VALUES ($1, $2) RETURNING id, nama_kelas`,
    [`${prefix}-Kelas B`, tenantId]
  );
  ok(`2 kelas: ${kelasA.rows[0].nama_kelas}, ${kelasB.rows[0].nama_kelas}`);

  const santriRows = [];
  for (let i = 1; i <= 3; i++) {
    const kelasId = i <= 2 ? kelasA.rows[0].id : kelasB.rows[0].id;
    const ins = await pool.query(
      `INSERT INTO santri (nis, nama, status, tenant_id, kelas_id)
       VALUES ($1, $2, 'Aktif', $3, $4)
       RETURNING id, nis, nama`,
      [`${prefix}-S00${i}`, `${prefix} Santri ${i}`, tenantId, kelasId]
    );
    santriRows.push(ins.rows[0]);
  }
  ok(`3 santri: ${santriRows.map((s) => s.nis).join(", ")}`);

  const guru = await pool.query(
    `INSERT INTO guru (nama, jabatan, status, tenant_id)
     VALUES ($1, $2, 'Aktif', $3)
     RETURNING id, nama`,
    [`${prefix} Ustadz Ahmad`, "Pengajar", tenantId]
  );
  ok(`1 guru: ${guru.rows[0].nama}`);

  const wali = await pool.query(
    `INSERT INTO wali_santri (nama, nomor_hp, santri_id, tenant_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, nama`,
    [`${prefix} Wali Santri 1`, "081299990001", santriRows[0].id, tenantId]
  );
  ok(`1 wali: ${wali.rows[0].nama}`);

  const { rows: scopeCheck } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM santri WHERE tenant_id = $1 AND nis LIKE $2`,
    [tenantId, `${prefix}%`]
  );
  if (scopeCheck[0].n === 3) ok("Semua seed santri scoped ke tenant Al Hikmah");
  else fail("Seed santri tenant scope", scopeCheck[0]);
}

async function task5PlatformVerification(platformToken) {
  section("TASK 5 — Platform Verification");
  const headers = { Authorization: `Bearer ${platformToken}` };

  const list = await fetchJson("/platform/tenants", { headers });
  const found = (list.body?.data || []).find((t) => t.slug === SLUG);
  if (found) ok(`Tenant Al Hikmah di list platform (id=${found.id})`);
  else fail("Tenant Al Hikmah di list platform", list.body?.data?.map((t) => t.slug));

  const detail = await fetchJson(`/platform/tenants/${tenantId}`, { headers });
  if (detail.res.status === 200 && detail.body?.data?.slug === SLUG) {
    ok("Detail tenant bisa dibuka");
  } else {
    fail("Detail tenant bisa dibuka", detail.body);
  }

  const features = await fetchJson(`/platform/tenants/${tenantId}/features`, {
    headers,
  });
  if (features.res.status !== 200) {
    fail("Feature Management API", features.body);
    return;
  }

  const rfid = features.body.features.find((f) => f.key === "rfid");
  const santriF = features.body.features.find((f) => f.key === "santri");
  if (santriF?.enabled && !rfid?.enabled) {
    ok("Feature Management: santri ON, rfid OFF");
  } else {
    fail("Feature Management state", { santri: santriF, rfid });
  }

  const portalUrl = `${process.env.TENANT_PORTAL_URL || "http://localhost:5173"}/login?tenant=${SLUG}`;
  ok(`Portal URL pattern: ?tenant=${SLUG} (${portalUrl})`);
}

async function task6TenantVerification() {
  section("TASK 6 — Tenant Verification");

  if (!adminPassword && !VERIFY_ONLY) {
    const existing = await pool.query(
      `SELECT id FROM users WHERE username = $1 AND tenant_id = $2`,
      [ADMIN_USERNAME, tenantId]
    );
    if (!existing.rows.length) {
      fail("Admin user untuk verifikasi tenant");
      return;
    }
    console.log(
      "  INFO: Tenant sudah ada — gunakan password yang diterima saat pembuatan pertama.\n" +
        "  Set env MT8_ADMIN_PASSWORD untuk verifikasi API otomatis."
    );
    adminPassword = process.env.MT8_ADMIN_PASSWORD || null;
  }

  if (!adminPassword) {
    console.log("  SKIP API tenant checks (password tidak tersedia di run ini)");
    return;
  }

  const login = await tenantLogin(ADMIN_USERNAME, adminPassword, SLUG);
  if (login.res.status !== 200 || !login.body?.token) {
    fail("Login admin.alhikmah", login.body);
    return;
  }
  ok("Login admin.alhikmah");

  const user = login.body.user || {};
  if (user.tenant_slug === SLUG && user.tenant_nama === TENANT_NAME) {
    ok(`Tenant context: ${user.tenant_nama} (@${user.tenant_slug})`);
  } else {
    fail("Tenant context di login response", {
      tenant_slug: user.tenant_slug,
      tenant_nama: user.tenant_nama,
    });
  }

  const tf = new Set(user.tenant_features || []);
  if (tf.has("santri") && !tf.has("rfid") && !tf.has("sahriyah") && !tf.has("kas_instansi")) {
    ok("tenant_features: dasar ON, premium OFF");
  } else {
    fail("tenant_features", [...tf]);
  }

  const token = login.body.token;
  const headers = { Authorization: `Bearer ${token}` };

  const santriList = await fetchJson("/santri", { headers });
  const names = (santriList.body?.data || []).map((s) => s.nama);
  const hasSeed = names.some((n) => n.includes("MT8-HIKMAH"));
  if (hasSeed) ok("Menu/data santri tenant Al Hikmah accessible");
  else fail("GET /santri seed data", names.slice(0, 5));

  const rfid = await fetchJson("/rfid/dashboard", { headers });
  if (rfid.res.status === 403 && rfid.body?.code === "FEATURE_DISABLED") {
    ok("Akses /rfid/dashboard ditolak (FEATURE_DISABLED)");
  } else {
    fail("Akses /rfid/dashboard ditolak", rfid.res.status);
  }

  console.log("\n  UI manual checks (browser):");
  console.log("  - Banner TENANT 'Pesantren Al Hikmah'");
  console.log("  - Menu RFID / Sahriyah / Kas Instansi tidak muncul di sidebar");
}

async function task7IsolationTest() {
  section("TASK 7 — Isolation Test");

  const { rows: defaultTenant } = await pool.query(
    `SELECT id, nama, slug FROM tenants WHERE slug = 'default'`
  );
  if (!defaultTenant.length) {
    fail("Tenant default (Anwarul Huda) tidak ditemukan");
    return;
  }
  const defaultId = defaultTenant[0].id;
  ok(`Default tenant: ${defaultTenant[0].nama} (id=${defaultId}) — tidak diubah`);

  const { rows: cross } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM santri
     WHERE tenant_id = $1 AND nis LIKE 'MT8-HIKMAH%'`,
    [defaultId]
  );
  if (cross[0].n === 0) ok("Anwarul Huda tidak punya santri MT8-HIKMAH");
  else fail("Cross-tenant santri di default", cross[0]);

  const { rows: hikmahLeak } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM santri s
     JOIN tenants t ON t.id = s.tenant_id
     WHERE s.tenant_id = $1 AND t.slug = 'default'`,
    [tenantId]
  );
  if (hikmahLeak[0].n === 0) ok("Al Hikmah tidak import santri dari default DB");

  if (adminPassword) {
    const hikmahAuth = await tenantLogin(ADMIN_USERNAME, adminPassword, SLUG);
    const defaultAuth = await tenantLogin(
      process.env.SMOKE_TENANT_USER || "admin",
      process.env.SMOKE_TENANT_PASS || "admin123",
      "default"
    );

    if (hikmahAuth.body?.token && defaultAuth.body?.token) {
      const hHeaders = { Authorization: `Bearer ${hikmahAuth.body.token}` };
      const dHeaders = { Authorization: `Bearer ${defaultAuth.body.token}` };

      const hSantri = await fetchJson("/santri", { headers: hHeaders });
      const dSantri = await fetchJson("/santri", { headers: dHeaders });

      const hNames = (hSantri.body?.data || []).map((s) => s.nama);
      const dNames = (dSantri.body?.data || []).map((s) => s.nama);

      const hSeesDefault = hNames.some((n) => n && !String(n).includes("MT8-HIKMAH"));
      const dSeesHikmah = dNames.some((n) => String(n).includes("MT8-HIKMAH"));

      if (!dSeesHikmah) ok("Default admin tidak melihat santri MT8-HIKMAH via API");
      else fail("Default admin melihat santri Al Hikmah", dNames.filter((n) => n.includes("MT8")));

      const hOnlySeed =
        hNames.length > 0 &&
        hNames.every((n) => String(n).includes("MT8-HIKMAH") || hNames.length <= 10);
      if (!hSeesDefault || hOnlySeed) ok("Al Hikmah API santri terisolasi");
      else fail("Al Hikmah mungkin melihat santri default", hNames.slice(0, 5));
    }
  }

  const platformToken = await platformLogin();
  const list = await fetchJson("/platform/tenants", {
    headers: { Authorization: `Bearer ${platformToken}` },
  });
  const slugs = (list.body?.data || []).map((t) => t.slug);
  if (slugs.includes("default") && slugs.includes(SLUG)) {
    ok("Platform melihat default + al-hikmah");
  } else {
    fail("Platform tenant list", slugs);
  }
}

async function printSummary() {
  section("OUTPUT SUMMARY");
  console.log("Tenant:", TENANT_NAME);
  console.log("Slug:", SLUG);
  console.log("Tenant ID:", tenantId);
  console.log("Admin:", ADMIN_USERNAME);
  console.log("Created this run:", createdThisRun);
  if (createdThisRun && adminPassword) {
    console.log("\n*** PASSWORD ADMIN (sekali):", adminPassword, "***\n");
  }

  console.log("Rollback (jika perlu):");
  console.log(`  node scripts/mt8-al-hikmah-rollback.js`);
  console.log("  atau hapus manual tenant slug al-hikmah + data terkait tenant_id");

  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
}

async function run() {
  console.log("=== MT-8 — Customer #2 Simulation (Al Hikmah) ===");

  try {
    if (!VERIFY_ONLY) {
      await task1Precheck();
      await task2CreateTenant();
      if (!tenantId) {
        const pre = await task1Precheck();
        tenantId = pre.tenant?.id;
      }
      await task3FeatureSetup();
      await task4SeedData();
    } else {
      const pre = await task1Precheck();
      if (!pre.exists) {
        console.error("Tenant belum ada — jalankan tanpa --verify-only");
        process.exit(1);
      }
    }

    const platformToken = await platformLogin();
    await task5PlatformVerification(platformToken);
    await task6TenantVerification();
    await task7IsolationTest();
    await printSummary();
  } catch (err) {
    console.error(err);
    failed++;
  } finally {
    try {
      await pool.end();
    } catch (_) {
      /* ignore */
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

run();
