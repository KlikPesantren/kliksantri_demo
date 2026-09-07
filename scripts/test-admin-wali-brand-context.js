const assert = require("assert");
const fs = require("fs");

const publicTenantRoute = fs.readFileSync("routes/publicTenantRoutes.js", "utf8");
const tenantProfile = fs.readFileSync("frontend/src/utils/tenantProfile.js", "utf8");
const publicBrandRoute = fs.readFileSync("routes/publicBrandRoutes.js", "utf8");
const waliBuildBrand = fs.readFileSync("wali-app/src/config/buildBrand.js", "utf8");
const waliFixture = JSON.parse(fs.readFileSync("wali-app/brands/anwarulhuda.test.json", "utf8"));
const adminBrand = fs.readFileSync("frontend/src/constants/adminProductBrand.js", "utf8");
const tenantService = fs.readFileSync("services/tenantService.js", "utf8");
const platformUpdateService = fs.readFileSync("services/tenantPlatformUpdateService.js", "utf8");
const migration = fs.readFileSync("migrations/089_tenant_admin_display_name.sql", "utf8");

assert.match(publicTenantRoute, /tenant_display_name:\s*tenant\.tenant_display_name\s*\|\|\s*tenant\.nama/);
assert.match(publicTenantRoute, /nama:\s*tenant\.tenant_display_name\s*\|\|\s*tenant\.nama/);
assert.doesNotMatch(publicTenantRoute, /nama:\s*whiteLabel\?\.app_name/);
assert.match(tenantProfile, /publicProfile\.tenant_display_name\?\.trim\(\)/);
assert.match(tenantService, /tenant_display_name/);
assert.match(platformUpdateService, /patch\.tenant_display_name/);
assert.match(migration, /ADD COLUMN IF NOT EXISTS tenant_display_name/);
assert.doesNotMatch(publicTenantRoute, /replace\(|Pondok Pesantren|Yayasan/);
assert.match(tenantProfile, /publicProfile\.nama\?\.trim\(\)/);
assert.match(publicTenantRoute, /whiteLabel\?\.logo_url\s*\|\|\s*tenant\.logo_url/);
assert.match(publicTenantRoute, /whiteLabel\?\.slogan\s*\|\|\s*tenant\.tagline/);
assert.match(publicTenantRoute, /powered_by_klikpesantren:\s*true/);

assert.equal(waliFixture.app_name, "Wali Anwarul Huda");
assert.equal(waliFixture.package_id, "com.klikpesantren.anwarulhuda.wali");
assert.match(publicBrandRoute, /app_name/);
assert.match(waliBuildBrand, /raw\.app_name\s*\|\|\s*'WaliSantri'/);
assert.match(waliBuildBrand, /poweredByKlikPesantren:\s*true/);
assert.match(adminBrand, /Khodimul Ma'had/);
assert.doesNotMatch(publicTenantRoute, /anwarulhuda|tenant_id\s*[=:]\s*1/i);

console.log("admin / wali branding context separation: PASS");
