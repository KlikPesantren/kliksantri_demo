const assert = require("assert");
const {
  createCloudflareDnsService,
  getCloudflareStartupValidation,
} = require("../services/cloudflareDnsService");
const { validateTenantHostname, retryDnsProvisioning, rollbackDnsProvisioning } = require("../services/tenantDomainService");

const env = {
  CLOUDFLARE_API_TOKEN: "test-token",
  CLOUDFLARE_ZONE_ID: "test-zone",
  TENANT_DOMAIN_TARGET: "target.vercel-dns.com",
};

function response(result, status = 200) {
  return { ok: status >= 200 && status < 300, status, async json() { return { success: this.ok, result }; } };
}

(async () => {
  const createdCalls = [];
  const createService = createCloudflareDnsService({ env, fetchImpl: async (_url, options = {}) => {
    createdCalls.push(options.method || "GET");
    if (!options.method) return response([]);
    return response({ id: "record-new", name: "anwarulhuda.klikpesantren.com", content: env.TENANT_DOMAIN_TARGET });
  } });
  const created = await createService.createTenantCname("anwarulhuda.klikpesantren.com");
  assert.strictEqual(created.id, "record-new");
  assert.deepStrictEqual(createdCalls, ["GET", "POST"]);

  const existingService = createCloudflareDnsService({ env, fetchImpl: async () => response([
    { id: "record-existing", name: "anwarulhuda.klikpesantren.com", content: "target.vercel-dns.com" },
  ]) });
  const existing = await existingService.createTenantCname("anwarulhuda.klikpesantren.com");
  assert.strictEqual(existing.reused, true);

  const conflictService = createCloudflareDnsService({ env, fetchImpl: async () => response([
    { id: "record-conflict", name: "anwarulhuda.klikpesantren.com", content: "wrong.example.com" },
  ]) });
  await assert.rejects(conflictService.createTenantCname("anwarulhuda.klikpesantren.com"), (error) => error.code === "DNS_TARGET_CONFLICT");

  let dryFetchCalled = false;
  const dryService = createCloudflareDnsService({ env: { TENANT_DOMAIN_TARGET: "target.vercel-dns.com", CLOUDFLARE_DNS_DRY_RUN: "true" }, fetchImpl: async () => { dryFetchCalled = true; } });
  const dryResult = await dryService.createTenantCname("anwarulhuda.klikpesantren.com");
  assert.strictEqual(dryResult.dryRun, true);
  assert.strictEqual(dryFetchCalled, false);

  const startup = getCloudflareStartupValidation({
    CLOUDFLARE_API_TOKEN: "hidden",
    CLOUDFLARE_ZONE_ID: "zone",
    TENANT_DOMAIN_TARGET: "target.vercel-dns.com",
    CLOUDFLARE_DNS_DRY_RUN: "false",
  });
  assert.deepStrictEqual(startup, {
    tokenConfigured: true,
    zoneIdConfigured: true,
    targetConfigured: true,
    targetValid: true,
    dryRunEnabled: false,
    dryRunValueValid: true,
    ready: true,
  });

  const providerFailureService = createCloudflareDnsService({ env, fetchImpl: async () => ({
    ok: false,
    status: 403,
    async json() {
      return { success: false, errors: [{ code: 9109, message: `Denied ${env.CLOUDFLARE_API_TOKEN}` }], authorization: env.CLOUDFLARE_API_TOKEN };
    },
  }) });
  await assert.rejects(
    providerFailureService.getDnsRecord("anwarulhuda.klikpesantren.com"),
    (error) => {
      assert.strictEqual(error.cloudflareEndpoint.startsWith("/zones/{zone_id}/dns_records?"), true);
      assert.strictEqual(error.providerStatus, 403);
      assert.deepStrictEqual(error.providerErrors, [9109]);
      assert.strictEqual(JSON.stringify(error.sanitizedProviderBody).includes(env.CLOUDFLARE_API_TOKEN), false);
      assert.strictEqual(error.providerMessages[0].includes(env.CLOUDFLARE_API_TOKEN), false);
      return true;
    }
  );

  assert.throws(() => validateTenantHostname("klikpesantren.com"));
  assert.throws(() => validateTenantHostname("app.klikpesantren.com"));
  assert.throws(() => validateTenantHostname("tenant.example.com"));

  function fakeDb(initialDnsStatus = "failed") {
    const domain = { id: 7, tenant_id: 3, hostname: "anwarulhuda.klikpesantren.com", dns_status: initialDnsStatus, overall_status: "failed" };
    const client = {
      async query(sql, params = []) {
        if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") return { rows: [] };
        if (sql.includes("FOR UPDATE OF td")) return { rows: [domain] };
        if (sql.includes("UPDATE tenant_domains")) {
          domain.dns_status = params[0]; domain.overall_status = params[1]; domain.last_error = params[2];
          return { rows: [{ ...domain }] };
        }
        if (sql.includes("INSERT INTO audit_logs")) return { rows: [] };
        throw new Error(`Unexpected query: ${sql}`);
      },
      release() {},
    };
    return { async connect() { return client; }, domain };
  }

  const retryDb = fakeDb();
  let retryCalled = 0;
  const orchestrationDns = {
    config: { target: "target.vercel-dns.com", dryRun: false },
    normalizeCloudflareError: () => "Operasi DNS Cloudflare gagal",
    async createTenantCname() { retryCalled += 1; return { id: "record-retry" }; },
    async deleteTenantDnsRecord() { return { id: "record-retry", deleted: true }; },
  };
  const retried = await retryDnsProvisioning(7, 1, { db: retryDb, dnsService: orchestrationDns });
  assert.strictEqual(retryCalled, 1);
  assert.strictEqual(retried.dns_status, "active");

  const rollbackDb = fakeDb("active");
  const rolledBack = await rollbackDnsProvisioning(7, 1, { db: rollbackDb, dnsService: orchestrationDns });
  assert.strictEqual(rolledBack.dns_status, "pending");

  console.log("cloudflare dns provisioning: all tests passed");
})().catch((error) => { console.error(error); process.exit(1); });
