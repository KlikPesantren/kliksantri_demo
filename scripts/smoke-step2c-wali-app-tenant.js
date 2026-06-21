/**
 * Smoke test — Step 2C Wali App tenant isolation
 * Usage: node scripts/smoke-step2c-wali-app-tenant.js
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../db");

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3011";
const TEST_SLUG = "tenant-test-2c";
const TEST_HP = "081299988877";
const TEST_PIN = "456789";
const MARKER = "SMOKE-2C";

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

async function fetchJson(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

async function waliLogin(tenantSlug, nomorHp, pin) {
  return fetchJson("/wali-app/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenant_slug: tenantSlug,
      nomor_hp: nomorHp,
      pin,
    }),
  });
}

async function ensureFixtures() {
  const hash = await bcrypt.hash(TEST_PIN, 10);

  await pool.query(
    `INSERT INTO tenants (slug, nama, status)
     VALUES ($1, 'Pesantren Test 2C', 'active')
     ON CONFLICT (slug) DO NOTHING`,
    [TEST_SLUG]
  );

  const { rows: testT } = await pool.query(
    `SELECT id FROM tenants WHERE slug = $1`,
    [TEST_SLUG]
  );
  const testTenantId = testT[0].id;

  const { rows: defT } = await pool.query(
    `SELECT id FROM tenants WHERE slug = 'default'`
  );
  const defaultTenantId = defT[0].id;

  async function upsertWali(tenantId, hp, nama) {
    const ex = await pool.query(
      `SELECT id FROM wali_akun WHERE tenant_id = $1 AND nomor_hp = $2`,
      [tenantId, hp]
    );
    if (!ex.rows.length) {
      const ins = await pool.query(
        `INSERT INTO wali_akun (nomor_hp, pin_hash, nama, status, must_change_pin, tenant_id)
         VALUES ($1, $2, $3, 'active', false, $4) RETURNING id`,
        [hp, hash, nama, tenantId]
      );
      return ins.rows[0].id;
    }
    await pool.query(
      `UPDATE wali_akun SET pin_hash = $1, status = 'active' WHERE id = $2`,
      [hash, ex.rows[0].id]
    );
    return ex.rows[0].id;
  }

  await upsertWali(defaultTenantId, TEST_HP, "Wali Default 2C Smoke");
  await upsertWali(testTenantId, TEST_HP, "Wali Test 2C Smoke");

  let kelasId;
  const kelasEx = await pool.query(
    `SELECT id FROM kelas WHERE tenant_id = $1 AND nama_kelas = $2`,
    [testTenantId, `${MARKER}-KELAS`]
  );
  if (!kelasEx.rows.length) {
    const ins = await pool.query(
      `INSERT INTO kelas (nama_kelas, tenant_id) VALUES ($1, $2) RETURNING id`,
      [`${MARKER}-KELAS`, testTenantId]
    );
    kelasId = ins.rows[0].id;
  } else {
    kelasId = kelasEx.rows[0].id;
  }

  let santriId;
  const santriEx = await pool.query(
    `SELECT id FROM santri WHERE tenant_id = $1 AND nis = $2`,
    [testTenantId, `${MARKER}-NIS`]
  );
  if (!santriEx.rows.length) {
    const ins = await pool.query(
      `INSERT INTO santri (nis, nama, kelas_id, tenant_id)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [`${MARKER}-NIS`, `${MARKER}-SANTRI`, kelasId, testTenantId]
    );
    santriId = ins.rows[0].id;
  } else {
    santriId = santriEx.rows[0].id;
  }

  await pool.query(
    `DELETE FROM wali_santri WHERE santri_id = $1 AND tenant_id = $2`,
    [santriId, testTenantId]
  );
  await pool.query(
    `INSERT INTO wali_santri (santri_id, nama, nomor_hp, tenant_id)
     VALUES ($1, $2, $3, $4)`,
    [santriId, "Wali Test", TEST_HP, testTenantId]
  );

  await pool.query(
    `DELETE FROM tagihan_sahriyah
     WHERE tenant_id = $1 AND santri_id = $2`,
    [testTenantId, santriId]
  );
  const tagihan = await pool.query(
    `INSERT INTO tagihan_sahriyah
       (santri_id, tenant_id, bulan, tahun, nominal, total_bayar, sisa_tagihan, status)
     VALUES ($1, $2, 6, 2026, 500000, 0, 500000, 'belum_lunas')
     RETURNING id`,
    [santriId, testTenantId]
  );

  await pool.query(
    `DELETE FROM pengumuman WHERE tenant_id = $1 AND judul LIKE $2`,
    [testTenantId, `${MARKER}-%`]
  );
  await pool.query(
    `INSERT INTO pengumuman (judul, isi, prioritas, is_active, tenant_id)
     VALUES ($1, 'Isi smoke test', 'normal', true, $2)`,
    [`${MARKER}-PENGUMUMAN`, testTenantId]
  );

  const profEx = await pool.query(
    `SELECT id FROM profil_pesantren WHERE tenant_id = $1`,
    [testTenantId]
  );
  if (!profEx.rows.length) {
    await pool.query(
      `INSERT INTO profil_pesantren (nama_pesantren, tenant_id)
       VALUES ($1, $2)`,
      [`${MARKER}-PESANTREN`, testTenantId]
    );
  } else {
    await pool.query(
      `UPDATE profil_pesantren SET nama_pesantren = $1 WHERE tenant_id = $2`,
      [`${MARKER}-PESANTREN`, testTenantId]
    );
  }

  let defaultSantriId = null;
  const defSantri = await pool.query(
    `SELECT s.id FROM santri s
     INNER JOIN wali_santri ws ON ws.santri_id = s.id AND ws.tenant_id = s.tenant_id
     WHERE ws.nomor_hp = $1 AND s.tenant_id = $2
     LIMIT 1`,
    [TEST_HP, defaultTenantId]
  );
  if (defSantri.rows.length) {
    defaultSantriId = defSantri.rows[0].id;
  }

  return {
    testTenantId,
    defaultTenantId,
    testSantriId: santriId,
    defaultSantriId,
    tagihanId: tagihan.rows[0].id,
  };
}

async function run() {
  console.log(`Smoke Step 2C — ${BASE}\n`);
  const fx = await ensureFixtures();

  const testLogin = await waliLogin(TEST_SLUG, TEST_HP, TEST_PIN);
  if (testLogin.res.status === 200 && testLogin.body.token) {
    ok("wali login tenant test berhasil");
  } else {
    fail("wali login tenant test", testLogin.body);
    await pool.end();
    process.exit(1);
  }

  const defaultWrong = await waliLogin("default", "089999999999", TEST_PIN);
  if (defaultWrong.res.status === 401) {
    ok("wali tenant default tidak login HP tidak terdaftar");
  } else {
    fail("wali tenant default HP tidak terdaftar", defaultWrong.res.status);
  }

  const crossLogin = await waliLogin(
    "default",
    TEST_HP,
    fx.defaultSantriId ? TEST_PIN : "000001"
  );
  if (fx.defaultSantriId && crossLogin.res.status === 200) {
    ok("wali HP sama bisa login di tenant masing-masing (default)");
  } else if (!fx.defaultSantriId && crossLogin.res.status === 401) {
    ok("wali tenant A tidak login HP milik tenant B saja (default tanpa wali+santri)");
  } else {
    fail("login cross-tenant HP", {
      status: crossLogin.res.status,
      defaultSantriId: fx.defaultSantriId,
    });
  }

  const testToken = testLogin.body.token;
  const testH = {
    Authorization: `Bearer ${testToken}`,
    "X-Santri-Id": String(fx.testSantriId),
  };

  const defaultLogin = fx.defaultSantriId
    ? await waliLogin("default", TEST_HP, TEST_PIN)
    : null;
  const defaultToken = defaultLogin?.body?.token;

  if (defaultToken && fx.defaultSantriId) {
    const { res: crossDash } = await fetchJson("/wali-app/dashboard", {
      headers: {
        Authorization: `Bearer ${defaultToken}`,
        "X-Santri-Id": String(fx.testSantriId),
      },
    });
    if (crossDash.status === 403) {
      ok("X-Santri-Id cross-tenant ditolak (403)");
    } else {
      fail("X-Santri-Id cross-tenant", crossDash.status);
    }
  } else {
    const { res: crossDash } = await fetchJson("/wali-app/dashboard", {
      headers: {
        Authorization: `Bearer ${testToken}`,
        "X-Santri-Id": "999999999",
      },
    });
    if (crossDash.status === 403) {
      ok("X-Santri-Id santri bukan milik wali ditolak (403)");
    } else {
      fail("X-Santri-Id invalid", crossDash.status);
    }
  }

  const { res: dashRes, body: dashBody } = await fetchJson("/wali-app/dashboard", {
    headers: testH,
  });
  if (dashRes.status === 200 && dashBody.data?.profil?.nama?.includes(MARKER)) {
    ok("dashboard wali scoped tenant");
  } else {
    fail("dashboard wali scoped", { status: dashRes.status, dashBody });
  }

  const { res: sahRes, body: sahBody } = await fetchJson("/wali-app/sahriyah", {
    headers: testH,
  });
  if (sahRes.status === 200 && (sahBody.data || []).length >= 1) {
    ok("sahriyah wali scoped tenant");
  } else {
    fail("sahriyah wali scoped", sahBody);
  }

  const { res: riwRes } = await fetchJson(
    `/wali-app/sahriyah/${fx.tagihanId}/riwayat`,
    { headers: testH }
  );
  if (riwRes.status === 200) ok("pembayaran sahriyah riwayat scoped");
  else fail("pembayaran sahriyah riwayat", riwRes.status);

  const { res: pengRes, body: pengBody } = await fetchJson("/wali-app/pengumuman", {
    headers: { Authorization: `Bearer ${testToken}` },
  });
  const hasMarker = (pengBody.data || []).some((p) =>
    String(p.judul || "").includes(MARKER)
  );
  if (pengRes.status === 200 && hasMarker) ok("pengumuman scoped tenant");
  else fail("pengumuman scoped", pengBody);

  if (defaultToken) {
    const { body: defPeng } = await fetchJson("/wali-app/pengumuman", {
      headers: { Authorization: `Bearer ${defaultToken}` },
    });
    const leak = (defPeng.data || []).some((p) =>
      String(p.judul || "").includes(MARKER)
    );
    if (!leak) ok("pengumuman tenant default tidak lihat marker test");
    else fail("pengumuman leak antar tenant", defPeng.data);
  }

  const { res: profRes, body: profBody } = await fetchJson(
    "/wali-app/profil-pesantren",
    { headers: { Authorization: `Bearer ${testToken}` } }
  );
  if (
    profRes.status === 200 &&
    String(profBody.data?.nama_pesantren || "").includes(MARKER)
  ) {
    ok("profil pesantren scoped tenant");
  } else {
    fail("profil pesantren scoped", profBody);
  }

  const payload = JSON.parse(
    Buffer.from(testToken.split(".")[1], "base64url").toString()
  );
  if (
    payload.wali_akun_id &&
    payload.nomor_hp &&
    payload.tenant_id &&
    payload.tenant_slug === TEST_SLUG
  ) {
    ok("JWT wali berisi tenant_id + tenant_slug");
  } else {
    fail("JWT wali payload", payload);
  }

  console.log(`\n=== ${passed} passed, ${failed} failed ===`);
  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(async (err) => {
  console.error("ERR", err);
  await pool.end();
  process.exit(1);
});
