const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { validateCustomDomainHostname } = require("../services/domainHostnameService");
const { createCustomTenantDomain, resolveActiveTenantByHostname } = require("../services/customTenantDomainService");
const { provisionVercelForTenantDomain, reconcileCustomDomain } = require("../services/tenantDomainService");

assert.strictEqual(validateCustomDomainHostname("App.PesantrenAlfalah.com"), "app.pesantrenalfalah.com");
for (const value of ["https://app.example.com", "app.example.com/path", "app.example.com?q=1", "app.example.com#x", "app example.com", "app\n.example.com", "*.example.com", "localhost", "127.0.0.1", "tenant.klikpesantren.com"]) {
  assert.throws(() => validateCustomDomainHostname(value), value);
}

const migration = fs.readFileSync(path.join(__dirname, "../migrations/055_custom_tenant_domains.sql"), "utf8");
assert.match(migration, /domain_type[\s\S]*platform_subdomain/);
assert.match(migration, /custom_domain/);
assert.match(migration, /dns_managed BOOLEAN NOT NULL DEFAULT TRUE/i);
assert.match(migration, /CHECK \(domain_type IN \('platform_subdomain', 'custom_domain'\)\)/);

function createDb(existing = null) {
  let row = existing;
  return { async query(sql, params) {
    if (sql.startsWith("SELECT id, slug")) return { rows: [{ id: params[0], slug: "alfalah", nama: "Al Falah", status: "active" }] };
    if (sql.startsWith("SELECT * FROM tenant_domains WHERE hostname")) return { rows: row ? [row] : [] };
    if (sql.startsWith("INSERT INTO tenant_domains")) {
      row = { id: 9, tenant_id: params[0], hostname: params[1], domain_type: "custom_domain", dns_managed: false, dns_status: "pending", vercel_status: "pending", ssl_status: "pending", overall_status: "provisioning", is_primary: false };
      return { rows: [row] };
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  } };
}

(async () => {
  const db = createDb();
  const created = await createCustomTenantDomain({ tenantId: 3, hostname: "App.PesantrenAlfalah.com" }, 1, db);
  assert.strictEqual(created.hostname, "app.pesantrenalfalah.com");
  assert.strictEqual(created.dns_managed, false);
  assert.strictEqual(created.is_primary, false);
  const same = await createCustomTenantDomain({ tenantId: 3, hostname: "app.pesantrenalfalah.com" }, 1, db);
  assert.strictEqual(same.idempotent, true);
  const otherDb = createDb({ id: 2, tenant_id: 99, hostname: "app.pesantrenalfalah.com" });
  await assert.rejects(createCustomTenantDomain({ tenantId: 3, hostname: "app.pesantrenalfalah.com" }, 1, otherDb), (error) => error.status === 409);

  let lookupParam = null;
  const resolved = await resolveActiveTenantByHostname("APP.PESANTRENALFALAH.COM:443", { async query(_sql, params) { lookupParam = params[0]; return { rows: [{ tenant_id: 3, slug: "alfalah", hostname: params[0] }] }; } });
  assert.strictEqual(lookupParam, "app.pesantrenalfalah.com");
  assert.strictEqual(resolved.tenant_id, 3);

  function lifecycleDb(initial = {}) {
    const state = { id: 9, tenant_id: 3, hostname: "app.pesantrenalfalah.com", domain_type: "custom_domain", dns_managed: false, tenant_status: "active", dns_status: "pending", vercel_status: "pending", ssl_status: "pending", overall_status: "provisioning", ...initial };
    const client = { release() {}, async query(sql, params = []) {
      if (["BEGIN", "COMMIT", "ROLLBACK"].includes(sql)) return { rows: [] };
      if (sql.includes("FOR UPDATE OF td")) return { rows: [{ ...state }] };
      if (sql.includes("INSERT INTO audit_logs")) return { rows: [] };
      if (sql.includes("UPDATE tenant_domains")) {
        [state.dns_status, state.vercel_status, state.ssl_status, state.overall_status] = params.slice(0, 4);
        state.last_error = params[4]; state.metadata = { ...(state.metadata || {}), ...JSON.parse(params[5]) };
        return { rows: [{ ...state }] };
      }
      throw new Error(`Unexpected lifecycle SQL: ${sql}`);
    } };
    return { state, db: { async connect() { return client; } } };
  }

  const provisionState = lifecycleDb();
  let vercelCalls = 0; let cloudflareCalls = 0;
  const vercel = { config: { dryRun: false }, normalizeVercelError: () => "Vercel gagal", async addDomain() { vercelCalls += 1; return { verified: false }; }, async verifyDomain() { return { verified: false }; }, async getDnsInstructions() { return { status: "pending", records: [{ type: "CNAME", name: "app.pesantrenalfalah.com", value: "target.vercel-dns.com" }] }; } };
  const provisioned = await provisionVercelForTenantDomain(9, 1, { db: provisionState.db, vercelService: vercel, dnsService: { async createTenantCname() { cloudflareCalls += 1; } } });
  assert.strictEqual(vercelCalls, 1); assert.strictEqual(cloudflareCalls, 0);
  assert.strictEqual(provisioned.dns_status, "pending");
  assert.strictEqual(provisioned.vercel_status, "adding");

  const failedState = lifecycleDb();
  await assert.rejects(provisionVercelForTenantDomain(9, 1, { db: failedState.db, vercelService: { config: { dryRun: false }, normalizeVercelError: () => "Operasi provider gagal", async addDomain() { const error = new Error("provider secret response"); error.status = 403; throw error; } } }), /Operasi provider gagal/);
  assert.strictEqual(failedState.state.vercel_status, "failed");
  assert.strictEqual(failedState.state.hostname, "app.pesantrenalfalah.com");

  const pendingState = lifecycleDb();
  const pending = await reconcileCustomDomain(9, 1, { db: pendingState.db, vercelService: { config: { dryRun: false }, normalizeVercelError: () => "Vercel gagal", async getDomain() { return { verified: false }; }, async verifyDomain() { return { verified: false }; }, async getDnsInstructions() { return { status: "pending", records: [] }; } } });
  assert.strictEqual(pending.dns_status, "pending"); assert.strictEqual(pending.ssl_status, "pending");

  const sslPendingState = lifecycleDb();
  const sslPending = await reconcileCustomDomain(9, 1, { db: sslPendingState.db, vercelService: { config: { dryRun: false }, normalizeVercelError: () => "Vercel gagal", async getDomain() { return { verified: true }; }, async getDnsInstructions() { return { status: "active", records: [] }; }, async checkSsl() { return { ready: false }; } } });
  assert.strictEqual(sslPending.vercel_status, "verified"); assert.strictEqual(sslPending.ssl_status, "issuing");

  const activeState = lifecycleDb();
  const active = await reconcileCustomDomain(9, 1, { db: activeState.db, vercelService: { config: { dryRun: false }, normalizeVercelError: () => "Vercel gagal", async getDomain() { return { verified: true }; }, async getDnsInstructions() { return { status: "active", records: [] }; }, async checkSsl() { return { ready: true }; } } });
  assert.strictEqual(active.overall_status, "active");

  const incompleteState = lifecycleDb();
  const incomplete = await reconcileCustomDomain(9, 1, { db: incompleteState.db, vercelService: { config: { dryRun: false }, normalizeVercelError: () => "Vercel gagal", async getDomain() { return { verified: true }; }, async getDnsInstructions() { return { status: "pending", records: [] }; }, async checkSsl() { return { ready: true }; } } });
  assert.notStrictEqual(incomplete.overall_status, "active");

  console.log("custom tenant domain: all tests passed");
})().catch((error) => { console.error(error); process.exit(1); });
