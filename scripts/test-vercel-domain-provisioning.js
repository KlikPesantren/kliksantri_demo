const assert = require("assert");
const { createVercelDomainService } = require("../services/vercelDomainService");
const { calculateOverallStatus, provisionFullTenantDomain, retryVercelProvisioning, validateTenantHostname } = require("../services/tenantDomainService");

const env = { VERCEL_API_TOKEN: "test-secret", VERCEL_PROJECT_ID: "project-test", VERCEL_TEAM_ID: "team-test", VERCEL_DOMAIN_DRY_RUN: "false" };
const hostname = "anwarulhuda.klikpesantren.com";
const response = (status, body) => ({ ok: status >= 200 && status < 300, status, async json() { return body; } });

(async () => {
  const calls = [];
  const service = createVercelDomainService({ env, fetchImpl: async (url, options = {}) => {
    calls.push({ url, method: options.method || "GET" });
    if ((options.method || "GET") === "GET") return response(404, { error: { code: "not_found" } });
    return response(200, { name: hostname, verified: true });
  } });
  const added = await service.addDomain(hostname);
  assert.strictEqual(added.verified, true);
  assert.strictEqual(calls[0].url.startsWith("https://api.vercel.com/v9/projects/project-test/domains/"), true);
  assert.strictEqual(calls[1].method, "POST");

  let duplicateCalls = 0;
  const duplicateService = createVercelDomainService({ env, fetchImpl: async () => { duplicateCalls += 1; return response(200, { name: hostname, verified: true }); } });
  const duplicate = await duplicateService.addDomain(hostname);
  assert.strictEqual(duplicate.reused, true); assert.strictEqual(duplicateCalls, 1);

  const issuingService = createVercelDomainService({ env, fetchImpl: async () => response(200, { name: hostname, verified: false }) });
  assert.strictEqual((await issuingService.checkSsl(hostname)).status, "issuing");

  let sslCalls = 0;
  const activeSslService = createVercelDomainService({ env, fetchImpl: async () => {
    sslCalls += 1; return sslCalls === 1 ? response(200, { name: hostname, verified: true }) : response(200, { misconfigured: false });
  } });
  assert.strictEqual((await activeSslService.checkSsl(hostname)).status, "active");

  const rollbackMethods = [];
  const rollbackService = createVercelDomainService({ env, fetchImpl: async (_url, options = {}) => {
    rollbackMethods.push(options.method || "GET"); return response(200, { name: hostname, verified: true });
  } });
  assert.strictEqual((await rollbackService.removeDomain(hostname)).removed, true);
  assert.deepStrictEqual(rollbackMethods, ["GET", "DELETE"]);

  const timeoutService = createVercelDomainService({ env, timeoutMs: 5, fetchImpl: async (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener("abort", () => { const error = new Error("aborted"); error.name = "AbortError"; reject(error); });
  }) });
  await assert.rejects(timeoutService.getDomain(hostname), (error) => error.timedOut === true);

  for (const status of [401, 403]) {
    const authService = createVercelDomainService({ env, fetchImpl: async () => response(status, { error: { code: "forbidden", message: `Denied ${env.VERCEL_API_TOKEN}` }, authorization: env.VERCEL_API_TOKEN }) });
    await assert.rejects(authService.getDomain(hostname), (error) => error.status === status && !JSON.stringify(error.sanitizedProviderBody).includes(env.VERCEL_API_TOKEN));
  }
  const missingService = createVercelDomainService({ env, fetchImpl: async () => response(404, { error: { code: "not_found" } }) });
  assert.strictEqual(await missingService.getDomain(hostname), null);
  assert.throws(() => validateTenantHostname("app.klikpesantren.com"));
  assert.throws(() => validateTenantHostname("tenant.example.com"));

  assert.strictEqual(calculateOverallStatus({ tenant_status: "active", dns_status: "active", vercel_status: "verified", ssl_status: "active" }), "active");
  assert.strictEqual(calculateOverallStatus({ tenant_status: "active", dns_status: "active", vercel_status: "verified", ssl_status: "issuing" }), "provisioning");

  const state = { id: 7, tenant_id: 3, hostname, tenant_status: "active", dns_status: "pending", vercel_status: "pending", ssl_status: "pending", overall_status: "draft" };
  const client = { release() {}, async query(sql, params = []) {
    if (["BEGIN", "COMMIT", "ROLLBACK"].includes(sql)) return { rows: [] };
    if (sql.includes("FOR UPDATE OF td")) return { rows: [{ ...state }] };
    if (sql.includes("INSERT INTO audit_logs")) return { rows: [] };
    if (sql.includes("UPDATE tenant_domains") && sql.includes("vercel_status = $2")) {
      [state.dns_status, state.vercel_status, state.ssl_status, state.overall_status] = params.slice(0, 4); return { rows: [{ ...state }] };
    }
    if (sql.includes("UPDATE tenant_domains")) { state.dns_status = params[0]; state.overall_status = params[1]; return { rows: [{ ...state }] }; }
    throw new Error(`Unexpected SQL: ${sql}`);
  } };
  const db = { async connect() { return client; } };
  const dnsService = { config: { target: "target.vercel-dns.com" }, normalizeCloudflareError: () => "DNS failed", async createTenantCname() { return { id: "cf-record" }; } };
  const vercelService = { config: { dryRun: false }, normalizeVercelError: () => "Vercel failed", async addDomain() { return { verified: true }; }, async checkSsl() { return { ready: true }; } };
  const activated = await provisionFullTenantDomain(7, 1, { db, dnsService, vercelService });
  assert.strictEqual(activated.overall_status, "active");
  state.dns_status = "active"; state.vercel_status = "failed"; state.ssl_status = "pending"; state.overall_status = "failed";
  const retried = await retryVercelProvisioning(7, 1, { db, vercelService });
  assert.strictEqual(retried.vercel_status, "verified");

  console.log("vercel domain provisioning: all tests passed");
})().catch((error) => { console.error(error); process.exit(1); });
