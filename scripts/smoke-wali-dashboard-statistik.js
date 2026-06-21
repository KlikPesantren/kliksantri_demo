/**
 * Smoke — GET /wali-app/dashboard must include statistik_pesantren
 * Usage: node scripts/smoke-wali-dashboard-statistik.js
 */
require("dotenv").config();

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const TENANT_SLUG = process.env.SMOKE_TENANT_SLUG || "default";
const WALI_HP = process.env.SMOKE_WALI_HP || "081234567890";
const WALI_PIN = process.env.SMOKE_WALI_PIN || "456789";

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

async function main() {
  console.log("\n=== Smoke: Wali Dashboard statistik_pesantren ===");
  console.log("BASE:", BASE);

  const login = await fetchJson("/wali-app/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenant_slug: TENANT_SLUG,
      nomor_hp: WALI_HP,
      pin: WALI_PIN,
    }),
  });

  if (login.res.status !== 200 || !login.body?.token) {
    fail("wali login", { status: login.res.status, body: login.body });
    console.log(`\nResult: ${passed} passed, ${failed} failed\n`);
    process.exit(1);
  }
  ok("wali login");

  const token = login.body.token;
  const santriId = login.body.anak?.[0]?.santri_id;
  if (!santriId) {
    fail("wali has active santri", login.body.anak);
    process.exit(1);
  }
  ok("wali has santri_id");

  const dash = await fetchJson("/wali-app/dashboard", {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Santri-Id": String(santriId),
    },
  });

  if (dash.res.status !== 200) {
    fail("GET /wali-app/dashboard", { status: dash.res.status, body: dash.body });
    process.exit(1);
  }
  ok("GET /wali-app/dashboard → 200");

  const keys = Object.keys(dash.body?.data || {});
  if (!keys.includes("statistik_pesantren")) {
    fail("data.statistik_pesantren exists", { keys });
  } else {
    ok("data.statistik_pesantren exists");
  }

  const stats = dash.body?.data?.statistik_pesantren;
  const required = ["total_santri_aktif", "total_guru", "total_kelas"];
  for (const field of required) {
    if (stats == null || typeof stats[field] !== "number") {
      fail(`statistik_pesantren.${field} is number`, stats);
    } else {
      ok(`statistik_pesantren.${field} = ${stats[field]}`);
    }
  }

  console.log("\nExample statistik_pesantren:", JSON.stringify(stats, null, 2));
  console.log(`\nResult: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
