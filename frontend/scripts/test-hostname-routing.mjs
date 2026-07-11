import assert from "node:assert/strict";
import { resolveHostname } from "../src/utils/hostnameRouting.js";

assert.equal(resolveHostname("klikpesantren.com").type, "official");
assert.equal(resolveHostname("app.klikpesantren.com").type, "legacy-app");
assert.equal(resolveHostname("anwarulhuda.klikpesantren.com").type, "tenant");
assert.equal(resolveHostname("app.pesantrenalfalah.com").type, "custom-domain");
assert.equal(resolveHostname("APP.PESANTRENALFALAH.COM:443").type, "custom-domain");
assert.equal(resolveHostname("localhost:5173").type, "local");
assert.equal(resolveHostname("not a host").type, "unknown");

console.log("hostname routing: all tests passed");
