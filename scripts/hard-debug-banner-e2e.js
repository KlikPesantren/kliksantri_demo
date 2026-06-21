/**
 * Hard debug banner E2E — simulates upload → save → wali fetch
 * Usage: node scripts/hard-debug-banner-e2e.js
 * Requires: server running on BASE (default http://10.25.150.36:3000)
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

const BASE =
  process.env.BANNER_DEBUG_BASE ||
  process.env.SMOKE_BASE_URL ||
  "http://10.25.150.36:3000";

const TENANT_SLUG = process.env.SMOKE_TENANT_SLUG || "default";
const WALI_HP = process.env.SMOKE_WALI_HP || "085215914881";
const WALI_PIN = process.env.SMOKE_WALI_PIN || "456789";

function resolveMediaUrl(url, cacheBust) {
  if (!url) return null;
  let resolved = url;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    resolved = `${BASE.replace(/\/$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
  }
  if (cacheBust != null && cacheBust !== "") {
    const sep = resolved.includes("?") ? "&" : "?";
    return `${resolved}${sep}v=${encodeURIComponent(String(cacheBust))}`;
  }
  return resolved;
}

async function findAdminCredentials() {
  const { rows } = await pool.query(
    `SELECT u.username, u.password, u.tenant_id
     FROM users u
     JOIN tenants t ON t.id = u.tenant_id
     WHERE t.slug = $1 AND u.status = 'Aktif'
     ORDER BY u.id
     LIMIT 5`,
    [TENANT_SLUG]
  );
  return rows;
}

async function loginAdmin(username, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, tenant_slug: TENANT_SLUG }),
  });
  const body = await res.json();
  if (!body.token) throw new Error(`Admin login failed: ${JSON.stringify(body)}`);
  return body.token;
}

async function loginWali() {
  const res = await fetch(`${BASE}/wali-app/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenant_slug: TENANT_SLUG,
      nomor_hp: WALI_HP,
      pin: WALI_PIN,
    }),
  });
  const body = await res.json();
  if (!body.token) throw new Error(`Wali login failed: ${JSON.stringify(body)}`);
  return body.token;
}

async function getProfilAdmin(token) {
  const res = await fetch(`${BASE}/profil-pesantren`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  return body.data;
}

async function uploadBanner(token) {
  const pngPath = path.join(__dirname, "..", "wali-app", "assets", "icon.png");
  if (!fs.existsSync(pngPath)) {
    throw new Error(`Test image not found: ${pngPath}`);
  }
  const blob = new Blob([fs.readFileSync(pngPath)], { type: "image/png" });
  const form = new FormData();
  form.append("file", blob, "banner-debug.png");

  const res = await fetch(`${BASE}/upload/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const body = await res.json();
  const url = body.url ?? body.data?.url ?? null;
  console.log("[ADMIN BANNER UPLOAD RESPONSE]", url);
  if (!url) throw new Error(`Upload failed: ${JSON.stringify(body)}`);
  return url;
}

async function saveProfil(token, profil, bannerUrl) {
  const payload = {
    nama_pesantren: profil.nama_pesantren || "Pesantren",
    alamat: profil.alamat ?? null,
    telepon: profil.telepon ?? null,
    email: profil.email ?? null,
    website: profil.website ?? null,
    logo_url: profil.logo_url ?? null,
    banner_url: bannerUrl,
    banner_active: profil.banner_active !== false,
    splash_logo_url: profil.splash_logo_url ?? null,
    app_icon_url: profil.app_icon_url ?? null,
    tagline: profil.tagline ?? null,
    tentang: profil.tentang ?? null,
    visi: profil.visi ?? null,
    misi: profil.misi ?? null,
  };
  console.log("[ADMIN SAVE PAYLOAD banner_url]", payload.banner_url);
  console.log("[ADMIN FORM banner_url AFTER UPLOAD]", bannerUrl);

  const res = await fetch(`${BASE}/profil-pesantren`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  if (!body.success) throw new Error(`PUT failed: ${JSON.stringify(body)}`);
  return body.data;
}

async function getWaliProfil(token) {
  const res = await fetch(`${BASE}/wali-app/profil-pesantren`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function main() {
  console.log("=== HARD DEBUG BANNER E2E ===");
  console.log("BASE:", BASE);
  console.log("TENANT:", TENANT_SLUG);

  const before = await pool.query(
    `SELECT banner_url, updated_at FROM profil_pesantren
     WHERE tenant_id = (SELECT id FROM tenants WHERE slug = $1 LIMIT 1) LIMIT 1`,
    [TENANT_SLUG]
  );
  console.log("\n--- BEFORE DB ---");
  console.log(JSON.stringify(before.rows[0] ?? null));

  const admins = await findAdminCredentials();
  if (!admins.length) throw new Error("No admin user for tenant");

  let token = null;
  for (const row of admins) {
    try {
      token = await loginAdmin(row.username, "admin123");
      break;
    } catch {
      try {
        token = await loginAdmin(row.username, "password");
        break;
      } catch {
        /* try next */
      }
    }
  }
  if (!token) {
    console.log("Trying first admin with env SMOKE_ADMIN_PASSWORD...");
    const pwd = process.env.SMOKE_ADMIN_PASSWORD || "456789";
    token = await loginAdmin(admins[0].username, pwd);
  }

  const profil = await getProfilAdmin(token);
  const uploadUrl = await uploadBanner(token);
  const saved = await saveProfil(token, profil, uploadUrl);

  console.log("\n--- BACKEND UPDATED ROW (from PUT response) ---");
  console.log("[BACKEND PROFIL UPDATED ROW banner_url]", saved?.banner_url ?? null);
  console.log("[BACKEND PROFIL UPDATED ROW updated_at]", saved?.updated_at ?? null);

  const afterDb = await pool.query(
    `SELECT banner_url, updated_at FROM profil_pesantren
     WHERE tenant_id = (SELECT id FROM tenants WHERE slug = $1 LIMIT 1) LIMIT 1`,
    [TENANT_SLUG]
  );
  console.log("\n--- AFTER DB ---");
  console.log(JSON.stringify(afterDb.rows[0] ?? null));

  const waliToken = await loginWali();
  const waliRes = await getWaliProfil(waliToken);
  const row = waliRes.data;
  console.log("\n--- WALI API (check server log for [WALI PROFIL RESPONSE ...]) ---");
  console.log("[WALI PROFIL RESPONSE banner_url]", row?.banner_url ?? null);
  console.log("[WALI PROFIL RESPONSE updated_at]", row?.updated_at ?? null);

  const heroUrl = resolveMediaUrl(row?.banner_url, row?.updated_at);
  console.log("[WALI HERO resolvedBannerUrl]", heroUrl);

  console.log("\n=== SUMMARY ===");
  console.log("UPLOAD URL =", uploadUrl);
  console.log("SAVE PAYLOAD =", uploadUrl);
  console.log("BACKEND UPDATED ROW =", saved?.banner_url);
  console.log("WALI API RESPONSE =", row?.banner_url);
  console.log("WALI HERO URL =", heroUrl);

  const chainOk =
    uploadUrl === saved?.banner_url &&
    saved?.banner_url === row?.banner_url &&
    heroUrl?.includes(uploadUrl.split("?")[0].replace(/^\//, "uploads") ? uploadUrl.replace(/^\//, "") : uploadUrl);
  const chainOkSimple =
    uploadUrl === saved?.banner_url && saved?.banner_url === row?.banner_url;

  console.log("\nCHAIN MATCH (upload→save→wali path):", chainOkSimple ? "YES" : "NO");
  if (!chainOkSimple) {
    console.log("BREAKPOINT:");
    if (uploadUrl !== saved?.banner_url) console.log("  → PUT response ≠ upload URL");
    if (saved?.banner_url !== row?.banner_url) console.log("  → Wali API ≠ DB/PUT (tenant mismatch?)");
  }
}

main()
  .catch((e) => {
    console.error("FAIL:", e.message);
    process.exit(1);
  })
  .finally(() => pool.end());
