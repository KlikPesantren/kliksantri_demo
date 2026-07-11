const assert = require("assert");
const {
  buildTenantHostname,
  createDraftDomainForTenant,
  validateTenantHostname,
} = require("../services/tenantDomainService");

assert.strictEqual(buildTenantHostname("anwarulhuda"), "anwarulhuda.klikpesantren.com");
assert.strictEqual(validateTenantHostname("Al-Falah.KlikPesantren.com"), "al-falah.klikpesantren.com");

for (const slug of ["app", "-alfalah", "alfalah-", "al--falah", "ab", "Al_Falah"]) {
  assert.throws(() => buildTenantHostname(slug), Error, `slug ${slug} seharusnya ditolak`);
}

function fakeDatabase(existing = null) {
  let row = existing;
  return {
    async query(sql, params) {
      if (sql.includes("INSERT INTO tenant_domains")) {
        if (row) return { rows: [] };
        row = { id: 1, tenant_id: params[0], hostname: params[1], overall_status: "draft" };
        return { rows: [row] };
      }
      if (sql.includes("WHERE hostname = $1")) return { rows: row ? [row] : [] };
      throw new Error(`Query fake tidak dikenali: ${sql}`);
    },
  };
}

(async () => {
  const tenant = { id: 10, slug: "darussalam" };
  const db = fakeDatabase();
  const first = await createDraftDomainForTenant(tenant, { id: 1 }, db);
  const second = await createDraftDomainForTenant(tenant, { id: 1 }, db);
  assert.strictEqual(first.id, second.id, "backfill/draft harus idempotent");

  const duplicateDb = fakeDatabase({ id: 2, tenant_id: 99, hostname: "darussalam.klikpesantren.com" });
  await assert.rejects(
    createDraftDomainForTenant(tenant, { id: 1 }, duplicateDb),
    (error) => error.status === 409,
    "hostname tenant lain harus ditolak"
  );
  console.log("tenant domain foundation: all tests passed");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
