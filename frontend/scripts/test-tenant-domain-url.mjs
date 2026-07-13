import assert from "node:assert/strict";
import { copyActiveTenantUrl, getActiveTenantUrl, normalizeTenantDomainHostname } from "../src/utils/tenantDomainUrl.js";

const active = { hostname: " AlHikmah01.KlikPesantren.com ", overall_status: "active" };
assert.equal(getActiveTenantUrl(active), "https://alhikmah01.klikpesantren.com");
assert.equal(getActiveTenantUrl({ hostname: "App.PesantrenAlfalah.com", overall_status: "active" }), "https://app.pesantrenalfalah.com");
assert.equal(getActiveTenantUrl({ ...active, overall_status: "provisioning" }), null);
for (const hostname of ["", "https://tenant.klikpesantren.com", "tenant\n.klikpesantren.com", "app.klikpesantren.com", "127.0.0.1"]) {
  assert.equal(normalizeTenantDomainHostname(hostname), null);
}

let copied = "";
const clipboardResult = await copyActiveTenantUrl(active, { clipboard: { async writeText(value) { copied = value; } } });
assert.equal(copied, "https://alhikmah01.klikpesantren.com");
assert.equal(clipboardResult.method, "clipboard");

let fallbackValue = "";
const fallbackResult = await copyActiveTenantUrl(active, {
  clipboard: { async writeText() { throw new Error("denied"); } },
  async fallbackCopy(value) { fallbackValue = value; return true; },
});
assert.equal(fallbackValue, "https://alhikmah01.klikpesantren.com");
assert.equal(fallbackResult.method, "fallback");
await assert.rejects(copyActiveTenantUrl(active, { clipboard: { async writeText() { throw new Error("denied"); } }, async fallbackCopy() { return false; } }));
await assert.rejects(copyActiveTenantUrl({ ...active, overall_status: "failed" }, {}));

console.log("tenant domain URL utility: all tests passed");
