/**
 * Smoke test — Import Santri Excel
 * Usage: node scripts/smoke-import-santri-excel.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const bcrypt = require("bcryptjs");
const pool = require("../db");

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const DEFAULT_SLUG = "default";
const TEST_SLUG = "tenant-import-santri";

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

function buildXlsxBuffer(rows) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Santri");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

async function login(username, password, tenantSlug) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, tenant_slug: tenantSlug }),
  });
  const body = await res.json();
  if (!body.token) {
    throw new Error(`Login failed: ${JSON.stringify(body)}`);
  }
  return body.token;
}

async function uploadPreview(token, buffer, filename = "import.xlsx") {
  const form = new FormData();
  form.append("file", new Blob([buffer]), filename);
  const res = await fetch(`${BASE}/santri/import/preview`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const body = await res.json();
  return { res, body };
}

async function ensureFixtures() {
  await pool.query(
    `INSERT INTO tenants (slug, nama, status)
     VALUES ($1, 'Tenant Import Test', 'active')
     ON CONFLICT (slug) DO NOTHING`,
    [TEST_SLUG]
  );

  const { rows: tenants } = await pool.query(
    `SELECT id FROM tenants WHERE slug IN ($1, $2)`,
    [DEFAULT_SLUG, TEST_SLUG]
  );
  const defaultTenant = tenants.find((t) => true);
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
    [defaultTenantId, "admin_import_smoke"],
    [testTenantId, "admin_import_smoke_b"],
  ]) {
    const existing = await pool.query(
      `SELECT id FROM users WHERE username = $1 AND tenant_id = $2`,
      [username, tenantId]
    );
    if (!existing.rows.length) {
      await pool.query(
        `INSERT INTO users (nama, username, password, role, status, tenant_id)
         VALUES ($1, $2, $3, 'superadmin', 'Aktif', $4)`,
        [`Admin Import ${tenantId}`, username, hash, tenantId]
      );
    }
  }

  await pool.query(
    `DELETE FROM wali_santri WHERE tenant_id = ANY($1::int[]) AND nama LIKE 'SMOKE-IMPORT-%'`,
    [[defaultTenantId, testTenantId]]
  );
  await pool.query(
    `DELETE FROM santri WHERE tenant_id = ANY($1::int[]) AND nis LIKE 'SMOKE-IMP-%'`,
    [[defaultTenantId, testTenantId]]
  );

  const { rows: kelasDefault } = await pool.query(
    `SELECT id, nama_kelas FROM kelas WHERE tenant_id = $1 LIMIT 1`,
    [defaultTenantId]
  );
  let kelasName = kelasDefault[0]?.nama_kelas;
  if (!kelasName) {
    await pool.query(
      `INSERT INTO kelas (nama_kelas, tenant_id) VALUES ('SMOKE-IMPORT-KELAS', $1)`,
      [defaultTenantId]
    );
    kelasName = "SMOKE-IMPORT-KELAS";
  }

  await pool.query(
    `INSERT INTO kelas (nama_kelas, tenant_id)
     VALUES ('SMOKE-IMPORT-KELAS-B', $1)
     ON CONFLICT DO NOTHING`,
    [testTenantId]
  );

  return { defaultTenantId, testTenantId, kelasName };
}

async function run() {
  console.log("=== Smoke: Import Santri Excel ===\n");

  const { defaultTenantId, testTenantId, kelasName } = await ensureFixtures();
  const tokenDefault = await login("admin_import_smoke", "test1234", DEFAULT_SLUG);
  const tokenTest = await login("admin_import_smoke_b", "test1234", TEST_SLUG);

  // 1. Download template
  {
    const res = await fetch(`${BASE}/santri/import/template`, {
      headers: { Authorization: `Bearer ${tokenDefault}` },
    });
    const buf = Buffer.from(await res.arrayBuffer());
    if (res.ok && buf.length > 500) {
      ok("1. Download template sukses");
    } else {
      fail("1. Download template sukses", res.status);
    }
  }

  const validRows = [
    {
      nama: "SMOKE-IMPORT-Ahmad",
      nis: "SMOKE-IMP-001",
      jenis_kelamin: "L",
      tanggal_lahir: "2012-01-10",
      alamat: "Alamat A",
      nama_wali: "SMOKE-IMPORT-Wali A",
      no_hp_wali: "081200011001",
      kelas: kelasName,
      status: "aktif",
      tenant_id: 99999,
    },
    {
      nama: "SMOKE-IMPORT-Siti",
      nis: "SMOKE-IMP-002",
      jenis_kelamin: "P",
      tanggal_lahir: "2013-02-11",
      alamat: "Alamat B",
      nama_wali: "SMOKE-IMPORT-Wali B",
      no_hp_wali: "081200011002",
      kelas: kelasName,
      status: "aktif",
    },
  ];

  const invalidKelasRows = [
    {
      nama: "SMOKE-IMPORT-Invalid",
      nis: "SMOKE-IMP-999",
      jenis_kelamin: "L",
      tanggal_lahir: "2012-01-10",
      alamat: "Alamat X",
      nama_wali: "Wali X",
      no_hp_wali: "081200011999",
      kelas: "KELAS-TIDAK-ADA-IMPORT",
      status: "aktif",
    },
  ];

  const duplicateNisRows = [
    {
      nama: "SMOKE-IMPORT-Dup 1",
      nis: "SMOKE-IMP-DUP",
      jenis_kelamin: "L",
      kelas: kelasName,
      status: "aktif",
    },
    {
      nama: "SMOKE-IMPORT-Dup 2",
      nis: "SMOKE-IMP-DUP",
      jenis_kelamin: "P",
      kelas: kelasName,
      status: "aktif",
    },
  ];

  // 2. Preview valid
  let previewValid;
  {
    const buffer = buildXlsxBuffer(validRows);
    const { res, body } = await uploadPreview(tokenDefault, buffer);
    previewValid = body;
    if (
      res.ok &&
      body.success &&
      body.valid_rows === 2 &&
      body.invalid_rows === 0
    ) {
      ok("2. Preview Excel valid sukses");
    } else {
      fail("2. Preview Excel valid sukses", JSON.stringify(body));
    }
  }

  // 3. Preview kelas salah
  {
    const buffer = buildXlsxBuffer(invalidKelasRows);
    const { res, body } = await uploadPreview(tokenDefault, buffer);
    const row = body.rows?.[0];
    if (
      res.ok &&
      body.invalid_rows === 1 &&
      row?.status === "invalid" &&
      row.errors?.some((e) => e.includes("kelas"))
    ) {
      ok("3. Preview kelas salah gagal per row");
    } else {
      fail("3. Preview kelas salah gagal per row", JSON.stringify(body));
    }
  }

  // 4. Commit insert
  {
    const validOnly = previewValid.rows.filter((r) => r.status === "valid");
    const res = await fetch(`${BASE}/santri/import/commit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenDefault}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rows: validOnly }),
    });
    const body = await res.json();
    if (res.ok && body.success && body.imported === 2) {
      ok("4. Commit insert santri tenant saat ini");
    } else {
      fail("4. Commit insert santri tenant saat ini", JSON.stringify(body));
    }
  }

  // 5. Tenant isolation
  {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS n FROM santri
       WHERE tenant_id = $1 AND nis LIKE 'SMOKE-IMP-%'`,
      [testTenantId]
    );
    const res = await fetch(`${BASE}/santri`, {
      headers: { Authorization: `Bearer ${tokenTest}` },
    });
    const body = await res.json();
    const leaked = (body.data || []).some((s) => String(s.nis || "").startsWith("SMOKE-IMP-"));
    if (rows[0].n === 0 && !leaked) {
      ok("5. Tenant isolation aman");
    } else {
      fail("5. Tenant isolation aman", { dbOther: rows[0].n, leaked });
    }
  }

  // 6. NIS duplicate ditolak
  {
    const buffer = buildXlsxBuffer(duplicateNisRows);
    const { body } = await uploadPreview(tokenDefault, buffer);
    const dupInvalid = body.rows?.filter((r) => r.status === "invalid").length;
    if (body.invalid_rows >= 1 && dupInvalid >= 1) {
      ok("6. NIS duplicate ditolak");
    } else {
      fail("6. NIS duplicate ditolak", JSON.stringify(body));
    }

    const { body: body2 } = await uploadPreview(tokenDefault, buffer);
    const commitRes = await fetch(`${BASE}/santri/import/commit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenDefault}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rows: [
          {
            row_number: 2,
            data: {
              nama: "SMOKE-IMPORT-Existing",
              nis: "SMOKE-IMP-001",
              jenis_kelamin: "L",
              tanggal_lahir: null,
              alamat: null,
              nama_wali: null,
              no_hp_wali: null,
              kelas: kelasName,
              kelas_id: previewValid.rows[0].data.kelas_id,
              status: "aktif",
            },
          },
        ],
      }),
    });
    const commitBody = await commitRes.json();
    if (commitBody.imported === 0 && commitBody.failed >= 1) {
      ok("6b. NIS duplicate existing DB ditolak saat commit");
    } else {
      fail("6b. NIS duplicate existing DB ditolak saat commit", JSON.stringify(commitBody));
    }
  }

  // 7. File non-xlsx ditolak
  {
    const form = new FormData();
    form.append("file", new Blob(["not excel"]), "invalid.txt");
    const res = await fetch(`${BASE}/santri/import/preview`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenDefault}` },
      body: form,
    });
    const body = await res.json();
    if (res.status === 400 && body.error) {
      ok("7. File non-xlsx ditolak");
    } else {
      fail("7. File non-xlsx ditolak", res.status);
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
