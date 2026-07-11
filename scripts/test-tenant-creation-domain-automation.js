const assert = require("assert");
const {
  createTenantWithDomainAutomation,
  isAutoProvisionDomainEnabled,
} = require("../services/tenantCreationDomainService");

assert.strictEqual(isAutoProvisionDomainEnabled({ domainType: "subdomain" }, {}), true);
assert.strictEqual(isAutoProvisionDomainEnabled({ domainType: "subdomain" }, { TENANT_DOMAIN_AUTO_PROVISION: "false" }), false);
assert.strictEqual(isAutoProvisionDomainEnabled({ domainType: "custom" }, {}), false);
assert.strictEqual(isAutoProvisionDomainEnabled({ domainType: "custom", explicit: true }, {}), true);

(async () => {
  const order = [];
  const domains = new Map();
  let providerCalls = 0;
  const dependencies = {
    env: { TENANT_DOMAIN_AUTO_PROVISION: "true" },
    async createTenant(payload) {
      order.push("tenant-committed");
      return { tenant: { id: 10, slug: payload.slug }, package: "basic" };
    },
    async createDraftDomain(tenant) {
      order.push("draft-created");
      if (!domains.has(tenant.id)) domains.set(tenant.id, { id: 77, tenant_id: tenant.id, hostname: `${tenant.slug}.klikpesantren.com`, overall_status: "draft" });
      return domains.get(tenant.id);
    },
    async provisionDomain(id) {
      order.push("provision-called"); providerCalls += 1;
      const domain = domains.get(10); domain.overall_status = "active";
      return { ...domain, id };
    },
  };

  const success = await createTenantWithDomainAutomation({ slug: "alhikmah01" }, { id: 1 }, dependencies);
  assert.deepStrictEqual(order, ["tenant-committed", "draft-created", "provision-called"]);
  assert.strictEqual(success.tenantResult.tenant.slug, "alhikmah01");
  assert.strictEqual(success.tenantDomain.hostname, "alhikmah01.klikpesantren.com");
  assert.strictEqual(success.tenantDomain.overall_status, "active");

  order.length = 0;
  await createTenantWithDomainAutomation({ slug: "alhikmah01" }, { id: 1 }, dependencies);
  assert.strictEqual(domains.size, 1, "retry tidak boleh membuat tenant_domain duplikat");

  let failedState = "pending";
  const failure = await createTenantWithDomainAutomation({ slug: "gagal-provider" }, { id: 1 }, {
    ...dependencies,
    async createTenant(payload) { return { tenant: { id: 11, slug: payload.slug } }; },
    async createDraftDomain(tenant) { return { id: 88, tenant_id: tenant.id, hostname: `${tenant.slug}.klikpesantren.com` }; },
    async provisionDomain() { failedState = "failed"; throw new Error("Operasi domain provider gagal"); },
  });
  assert.strictEqual(failure.tenantResult.tenant.id, 11, "tenant tetap berhasil saat provider gagal");
  assert.strictEqual(failure.tenantDomainError, "Operasi domain provider gagal");
  assert.strictEqual(failedState, "failed");

  providerCalls = 0;
  const disabled = await createTenantWithDomainAutomation({ slug: "tanpa-auto", autoProvisionDomain: false }, { id: 1 }, dependencies);
  assert.strictEqual(disabled.autoProvisionAttempted, false);
  assert.strictEqual(providerCalls, 0);

  let customDraftCalls = 0;
  const custom = await createTenantWithDomainAutomation({ slug: "custom-domain", domain_type: "custom" }, { id: 1 }, {
    ...dependencies,
    async createDraftDomain() { customDraftCalls += 1; },
  });
  assert.strictEqual(custom.autoProvisionAttempted, false);
  assert.strictEqual(customDraftCalls, 0);

  console.log("tenant creation domain automation: all tests passed");
})().catch((error) => { console.error(error); process.exit(1); });
