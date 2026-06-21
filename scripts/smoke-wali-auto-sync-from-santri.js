/**
 * Smoke test — Wali auto sync from santri
 * Usage: node scripts/smoke-wali-auto-sync-from-santri.js
 */
require("dotenv").config();
const XLSX = require("xlsx");
const bcrypt = require("bcryptjs");
const pool = require("../db");
const { DEFAULT_WALI_PIN } = require("../services/waliSyncService");

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const DEFAULT_SLUG = "default";
const TEST_SLUG = "tenant-wali-sync-smoke";

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

async function loginAdmin(username, password, tenantSlug) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, tenant_slug: tenantSlug }),
  });
  const body = await res.json();
  if (!body.token) throw new Error(`Login failed: ${JSON.stringify(body)}`);
  return body.token;
}

async function apiJson(token, path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

function buildImportXlsx(rows) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Santri");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

async function ensureFixtures() {
  await pool.query(
    `INSERT INTO tenants (slug, nama, status)
     VALUES ($1, 'Tenant Wali Sync', 'active')
     ON CONFLICT (slug) DO NOTHING`,
    [TEST_SLUG]
  );

  const { rows: defaultRows } = await pool.query(
    `SELECT id FROM tenants WHERE slug = $1`,
    [DEFAULT_SLUG]
  );
  const { rows: testRows } = await pool.query(
    `SELECT id FROM tenants WHERE slug = $1`,
    [TEST_SLUG]
  );

  const defaultTenantId = defaultRows[0].id;
  const testTenantId = testRows[0].id;
  const hash = await bcrypt.hash("test1234", 10);

  for (const [tenantId, username] of [
    [defaultTenantId, "admin_wali_sync"],
    [testTenantId, "admin_wali_sync_b"],
  ]) {
    const ex = await pool.query(
      `SELECT id FROM users WHERE username = $1 AND tenant_id = $2`,
      [username, tenantId]
    );
    if (!ex.rows.length) {
      await pool.query(
        `INSERT INTO users (nama, username, password, role, status, tenant_id)
         VALUES ($1, $2, $3, 'superadmin', 'Aktif', $4)`,
        [`Admin Wali Sync ${tenantId}`, username, hash, tenantId]
      );
    }
  }

  for (const tenantId of [defaultTenantId, testTenantId]) {
    await pool.query(
      `DELETE FROM wali_santri WHERE tenant_id = $1 AND (nama LIKE 'SMOKE-WALI-%' OR nomor_hp LIKE '0812999%')`,
      [tenantId]
    );
    await pool.query(
      `DELETE FROM santri WHERE tenant_id = $1 AND nis LIKE 'SMOKE-WALI-%'`,
      [tenantId]
    );
    await pool.query(
      `DELETE FROM wali_akun WHERE tenant_id = $1 AND nomor_hp LIKE '0812999%'`,
      [tenantId]
    );
  }

  let { rows: kelasRows } = await pool.query(
    `SELECT nama_kelas FROM kelas WHERE tenant_id = $1 LIMIT 1`,
    [defaultTenantId]
  );
  if (!kelasRows.length) {
    await pool.query(
      `INSERT INTO kelas (nama_kelas, tenant_id) VALUES ('SMOKE-WALI-KELAS', $1)`,
      [defaultTenantId]
    );
    kelasRows = [{ nama_kelas: "SMOKE-WALI-KELAS" }];
  }

  return { defaultTenantId, testTenantId, kelasName: kelasRows[0].nama_kelas };
}

async function run() {
  console.log("=== Smoke: Wali Auto Sync From Santri ===\n");

  const { defaultTenantId, testTenantId, kelasName } = await ensureFixtures();
  const token = await loginAdmin("admin_wali_sync", "test1234", DEFAULT_SLUG);
  const tokenB = await loginAdmin("admin_wali_sync_b", "test1234", TEST_SLUG);

  const sharedHp = "08129990001";
  const hp2 = "08129990002";
  const hpUpdated = "08129990003";

  // 1. Create santri tanpa wali
  let santri1Id;
  {
    const { res, body } = await apiJson(token, "/santri", {
      method: "POST",
      body: JSON.stringify({
        nis: "SMOKE-WALI-001",
        nama: "SMOKE-WALI-Anak Tanpa Wali",
        kelas_id: null,
      }),
    });
    santri1Id = body.data?.id;
    const ws = await pool.query(
      `SELECT COUNT(*)::int AS n FROM wali_santri WHERE santri_id = $1 AND tenant_id = $2`,
      [santri1Id, defaultTenantId]
    );
    if (res.ok && body.wali_sync?.skipped && ws.rows[0].n === 0) {
      ok("1. Create santri tanpa wali → sukses, wali tidak dibuat");
    } else {
      fail("1. Create santri tanpa wali", body);
    }
  }

  // 2. Create santri dengan wali + HP → wali_santri
  let santri2Id;
  {
    const { res, body } = await apiJson(token, "/santri", {
      method: "POST",
      body: JSON.stringify({
        nis: "SMOKE-WALI-002",
        nama: "SMOKE-WALI-Anak A",
        orang_tua: "SMOKE-WALI-Bapak A",
        nomor_hp_ortu: sharedHp,
        kelas_id: null,
      }),
    });
    santri2Id = body.data?.id;
    const ws = await pool.query(
      `SELECT * FROM wali_santri WHERE santri_id = $1 AND tenant_id = $2`,
      [santri2Id, defaultTenantId]
    );
    if (res.ok && ws.rows.length === 1 && ws.rows[0].nomor_hp === sharedHp) {
      ok("2. Create santri + wali + HP → wali_santri dibuat");
    } else {
      fail("2. wali_santri dibuat", { body, ws: ws.rows });
    }
  }

  // 3. wali_akun dibuat
  {
    const wa = await pool.query(
      `SELECT * FROM wali_akun WHERE tenant_id = $1 AND nomor_hp = $2`,
      [defaultTenantId, sharedHp]
    );
    if (wa.rows.length === 1) {
      ok("3. Create santri + wali + HP → wali_akun dibuat");
    } else {
      fail("3. wali_akun dibuat", wa.rows);
    }
  }

  // 4. Second santri same HP → no duplicate akun
  let santri3Id;
  {
    const before = await pool.query(
      `SELECT COUNT(*)::int AS n FROM wali_akun WHERE tenant_id = $1 AND nomor_hp = $2`,
      [defaultTenantId, sharedHp]
    );
    const { res, body } = await apiJson(token, "/santri", {
      method: "POST",
      body: JSON.stringify({
        nis: "SMOKE-WALI-003",
        nama: "SMOKE-WALI-Anak B",
        orang_tua: "SMOKE-WALI-Bapak A",
        nomor_hp_ortu: sharedHp,
      }),
    });
    santri3Id = body.data?.id;
    const after = await pool.query(
      `SELECT COUNT(*)::int AS n FROM wali_akun WHERE tenant_id = $1 AND nomor_hp = $2`,
      [defaultTenantId, sharedHp]
    );
    const wsCount = await pool.query(
      `SELECT COUNT(*)::int AS n FROM wali_santri WHERE tenant_id = $1 AND nomor_hp = $2`,
      [defaultTenantId, sharedHp]
    );
    if (
      res.ok &&
      before.rows[0].n === 1 &&
      after.rows[0].n === 1 &&
      wsCount.rows[0].n >= 2
    ) {
      ok("4. Santri kedua HP sama → tidak duplikasi akun");
    } else {
      fail("4. tidak duplikasi akun", { before: before.rows[0].n, after: after.rows[0].n, ws: wsCount.rows[0].n });
    }
  }

  // 5. Update nomor HP wali
  {
    const { res, body } = await apiJson(token, `/santri/${santri2Id}`, {
      method: "PUT",
      body: JSON.stringify({
        nis: "SMOKE-WALI-002",
        nama: "SMOKE-WALI-Anak A",
        orang_tua: "SMOKE-WALI-Bapak A",
        nomor_hp_ortu: hpUpdated,
      }),
    });
    const ws = await pool.query(
      `SELECT nomor_hp FROM wali_santri WHERE santri_id = $1 AND tenant_id = $2`,
      [santri2Id, defaultTenantId]
    );
    const oldAkun = await pool.query(
      `SELECT id FROM wali_akun WHERE tenant_id = $1 AND nomor_hp = $2`,
      [defaultTenantId, sharedHp]
    );
    const newAkun = await pool.query(
      `SELECT id FROM wali_akun WHERE tenant_id = $1 AND nomor_hp = $2`,
      [defaultTenantId, hpUpdated]
    );
    if (
      res.ok &&
      ws.rows[0]?.nomor_hp === hpUpdated &&
      oldAkun.rows.length >= 1 &&
      newAkun.rows.length === 1
    ) {
      ok("5. Update nomor HP wali → wali_santri update, akun lama tetap");
    } else {
      fail("5. Update nomor HP", { ws, oldAkun: oldAkun.rows.length, newAkun: newAkun.rows.length });
    }
  }

  // 6. Import Excel dengan wali + HP
  {
    const buffer = buildImportXlsx([
      {
        nama: "SMOKE-WALI-Import Anak",
        nis: "SMOKE-WALI-004",
        jenis_kelamin: "L",
        tanggal_lahir: "2012-01-01",
        alamat: "Alamat",
        nama_wali: "SMOKE-WALI-Import Wali",
        no_hp_wali: hp2,
        kelas: kelasName,
        status: "aktif",
      },
    ]);
    const form = new FormData();
    form.append("file", new Blob([buffer]), "import.xlsx");
    const previewRes = await fetch(`${BASE}/santri/import/preview`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const preview = await previewRes.json();
    const validRows = preview.rows.filter((r) => r.status === "valid");
    const commitRes = await fetch(`${BASE}/santri/import/commit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rows: validRows }),
    });
    const commit = await commitRes.json();
    const ws = await pool.query(
      `SELECT ws.* FROM wali_santri ws
       JOIN santri s ON s.id = ws.santri_id AND s.tenant_id = ws.tenant_id
       WHERE s.nis = $1 AND s.tenant_id = $2`,
      ["SMOKE-WALI-004", defaultTenantId]
    );
    if (commitRes.ok && commit.imported === 1 && ws.rows.length === 1) {
      ok("6. Import Excel wali + HP → wali otomatis dibuat");
    } else {
      fail("6. Import Excel wali sync", { commit, ws: ws.rows });
    }
  }

  // 7. Tenant isolation
  {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS n FROM wali_akun
       WHERE tenant_id = $1 AND nomor_hp LIKE '0812999%'`,
      [testTenantId]
    );
    const resB = await apiJson(tokenB, "/wali");
    const leaked = (resB.body.data || []).some((w) =>
      String(w.nomor_hp || "").startsWith("0812999")
    );
    if (rows[0].n === 0 && !leaked) {
      ok("7. Tenant isolation aman");
    } else {
      fail("7. Tenant isolation", { other: rows[0].n, leaked });
    }
  }

  // 8. Login wali app
  {
    const res = await fetch(`${BASE}/wali-app/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_slug: DEFAULT_SLUG,
        nomor_hp: hp2,
        pin: DEFAULT_WALI_PIN,
      }),
    });
    const body = await res.json();
    if (res.ok && body.token && Array.isArray(body.anak) && body.anak.length >= 1) {
      ok("8. Login wali app dengan akun auto-created sukses");
    } else {
      fail("8. Login wali app", body);
    }
  }

  // 9. must_change_pin flow
  {
    const wa = await pool.query(
      `SELECT must_change_pin FROM wali_akun WHERE tenant_id = $1 AND nomor_hp = $2`,
      [defaultTenantId, hp2]
    );
    const res = await fetch(`${BASE}/wali-app/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_slug: DEFAULT_SLUG,
        nomor_hp: hp2,
        pin: DEFAULT_WALI_PIN,
      }),
    });
    const body = await res.json();
    if (
      wa.rows[0]?.must_change_pin === true &&
      res.ok &&
      body.must_change_pin === true
    ) {
      ok("9. PIN default + must_change_pin flow existing tetap jalan");
    } else {
      fail("9. must_change_pin", { db: wa.rows[0], body });
    }
  }

  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
