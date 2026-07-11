function isAutoProvisionDomainEnabled({ domainType = "subdomain", explicit } = {}, env = process.env) {
  if (domainType !== "subdomain") return explicit === true;
  if (typeof explicit === "boolean") return explicit;
  return String(env.TENANT_DOMAIN_AUTO_PROVISION || "true").trim().toLowerCase() !== "false";
}

async function createTenantWithDomainAutomation(payload, platformUser, dependencies) {
  const {
    createTenant,
    createDraftDomain,
    provisionDomain,
    env = process.env,
  } = dependencies;

  // createTenant baru resolve setelah transaksi onboarding berhasil di-COMMIT.
  const tenantResult = await createTenant(payload, platformUser);
  const domainType = payload.domain_type || "subdomain";
  const autoProvision = isAutoProvisionDomainEnabled(
    { domainType, explicit: payload.autoProvisionDomain },
    env
  );

  if (domainType !== "subdomain" && payload.autoProvisionDomain !== true) {
    return { tenantResult, tenantDomain: null, tenantDomainError: null, autoProvisionAttempted: false };
  }

  let tenantDomain = null;
  let tenantDomainError = null;
  try {
    tenantDomain = await createDraftDomain(tenantResult.tenant, platformUser);
    if (autoProvision) {
      tenantDomain = await provisionDomain(tenantDomain.id, platformUser.id);
    }
  } catch (error) {
    tenantDomainError = error.message || "Provisioning domain tenant gagal";
    console.error("[tenant-domain-auto-provision]", {
      tenantId: tenantResult.tenant?.id || null,
      slug: tenantResult.tenant?.slug || null,
      error: tenantDomainError,
    });
  }

  return { tenantResult, tenantDomain, tenantDomainError, autoProvisionAttempted: autoProvision };
}

module.exports = { isAutoProvisionDomainEnabled, createTenantWithDomainAutomation };

