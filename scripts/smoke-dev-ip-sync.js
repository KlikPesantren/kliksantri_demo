/**
 * Smoke — LAN dev IP connectivity (CORS + auth endpoints)
 * Usage: node scripts/smoke-dev-ip-sync.js
 */
require("dotenv").config();

const API = process.env.SMOKE_BASE_URL || "http://10.10.2.140:3000";
const FRONTEND = process.env.SMOKE_FRONTEND_URL || "http://10.10.2.140:5173";

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

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  const body = await res.json().catch(() => ({}));
  return { res, body, headers: res.headers };
}

async function run() {
  console.log("=== Smoke: Dev IP Sync ===\n");
  console.log("API:", API);
  console.log("Frontend origin:", FRONTEND);

  try {
    const health = await fetchJson(`${API}/public/tenants/default/branding`).catch(() => null);
    if (health?.res?.status === 200 || health?.res?.status === 404) {
      ok("Backend reachable on LAN IP");
    } else {
      const ping = await fetch(`${API}/platform/auth/login`, {
        method: "OPTIONS",
        headers: { Origin: FRONTEND, "Access-Control-Request-Method": "POST" },
      }).catch(() => null);
      if (ping?.ok || ping?.status === 204 || ping?.status === 200) {
        ok("Backend reachable on LAN IP");
      } else {
        fail("Backend reachable", API);
      }
    }

    const corsPreflight = await fetch(`${API}/auth/login`, {
      method: "OPTIONS",
      headers: {
        Origin: FRONTEND,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
    });
    const acao = corsPreflight.headers.get("access-control-allow-origin");
    if (corsPreflight.status < 400 && (acao === "*" || acao === FRONTEND)) {
      ok("CORS preflight tenant login OK");
    } else {
      fail("CORS preflight", { status: corsPreflight.status, acao });
    }

    const platformLogin = await fetchJson(`${API}/platform/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: FRONTEND,
      },
      body: JSON.stringify({
        username: process.env.SMOKE_PLATFORM_USER || "platform",
        password: process.env.SMOKE_PLATFORM_PASS || "123456",
      }),
    });
    if (platformLogin.res.status === 200 && platformLogin.body?.token) {
      ok("Platform login via LAN API");
    } else {
      fail("Platform login", platformLogin.body);
    }

    const tenantLogin = await fetchJson(`${API}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: FRONTEND,
      },
      body: JSON.stringify({
        username: process.env.SMOKE_TENANT_USER || "admin",
        password: process.env.SMOKE_TENANT_PASS || "admin123",
        tenant_slug: "default",
      }),
    });
    if (tenantLogin.res.status === 200 && tenantLogin.body?.token) {
      ok("Tenant login via LAN API");
    } else {
      fail("Tenant login", tenantLogin.body);
    }

    if (platformLogin.body?.token) {
      const dash = await fetchJson(`${API}/platform/stats/summary`, {
        headers: {
          Authorization: `Bearer ${platformLogin.body.token}`,
          Origin: FRONTEND,
        },
      });
      if (dash.res.status === 200 && dash.body?.summary) {
        ok("Platform dashboard API");
      } else {
        fail("Platform dashboard", dash.body);
      }
    }

    if (tenantLogin.body?.token) {
      const dash = await fetchJson(`${API}/dashboard/summary`, {
        headers: {
          Authorization: `Bearer ${tenantLogin.body.token}`,
          Origin: FRONTEND,
        },
      });
      if (dash.res.status === 200) {
        ok("Tenant dashboard API");
      } else {
        fail("Tenant dashboard", dash.res.status);
      }
    }
  } catch (err) {
    console.error(err);
    failed++;
  }

  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
