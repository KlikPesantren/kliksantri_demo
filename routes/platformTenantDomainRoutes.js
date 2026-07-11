const express = require("express");
const platformAuthMiddleware = require("../middleware/platformAuthMiddleware");
const {
  createDraftDomainForTenant, getTenantDomainByTenantId, listTenantDomains,
  updateDomainStatuses, regenerateDraftDomain,
  provisionDnsForTenantDomain, retryDnsProvisioning, rollbackDnsProvisioning,
  reconcileDnsStatus,
  provisionVercelForTenantDomain, retryVercelProvisioning, rollbackVercelProvisioning,
  reconcileVercelStatus, reconcileSslStatus, provisionFullTenantDomain,
  getTenantDomainById, reconcileCustomDomain,
} = require("../services/tenantDomainService");
const { createCustomTenantDomain } = require("../services/customTenantDomainService");

const router = express.Router();
router.use(platformAuthMiddleware);
router.use((req, res, next) => {
  if (req.platformUser?.role !== "platform_superadmin") {
    return res.status(403).json({ success: false, error: "Hanya platform_superadmin yang boleh mengelola domain tenant" });
  }
  next();
});

const handle = (handler) => async (req, res) => {
  try { await handler(req, res); }
  catch (error) { res.status(error.status || (error.code === "23505" ? 409 : 500)).json({ success: false, error: error.message }); }
};

const dnsRateBuckets = new Map();
function dnsProvisionRateLimit(req, res, next) {
  const key = String(req.platformUser.id);
  const now = Date.now();
  const current = dnsRateBuckets.get(key);
  const bucket = !current || now - current.startedAt >= 60_000
    ? { startedAt: now, count: 0 }
    : current;
  bucket.count += 1;
  dnsRateBuckets.set(key, bucket);
  if (bucket.count > 10) {
    return res.status(429).json({ success: false, error: "Terlalu banyak operasi DNS. Coba lagi sebentar." });
  }
  next();
}

router.get("/tenant-domains", handle(async (_req, res) => {
  res.json({ success: true, data: await listTenantDomains() });
}));
router.post("/tenant-domains/custom", dnsProvisionRateLimit, handle(async (req, res) => {
  const created = await createCustomTenantDomain(req.body || {}, req.platformUser.id);
  let data = created;
  let provisioningError = null;
  try { data = await provisionVercelForTenantDomain(created.id, req.platformUser.id); }
  catch (error) { provisioningError = error.message; data = await getTenantDomainById(created.id) || created; }
  res.status(201).json({ success: true, data, idempotent: Boolean(created.idempotent), provisioning_error: provisioningError });
}));
router.get("/tenants/:tenantId/domain", handle(async (req, res) => {
  const data = await getTenantDomainByTenantId(req.params.tenantId);
  res.status(data ? 200 : 404).json(data ? { success: true, data } : { success: false, error: "Draft domain tenant belum tersedia" });
}));
router.post("/tenants/:tenantId/domain/draft", handle(async (req, res) => {
  res.status(201).json({ success: true, data: await createDraftDomainForTenant(req.params.tenantId, req.platformUser) });
}));
router.patch("/tenants/:tenantId/domain/status", handle(async (req, res) => {
  res.json({ success: true, data: await updateDomainStatuses(req.params.tenantId, req.body || {}, req.platformUser) });
}));
router.post("/tenants/:tenantId/domain/regenerate", handle(async (req, res) => {
  res.json({ success: true, data: await regenerateDraftDomain(req.params.tenantId, req.platformUser) });
}));

router.post("/tenant-domains/:domainId/provision-dns", dnsProvisionRateLimit, handle(async (req, res) => {
  res.json({ success: true, data: await provisionDnsForTenantDomain(req.params.domainId, req.platformUser.id) });
}));
router.post("/tenant-domains/:domainId/retry-dns", dnsProvisionRateLimit, handle(async (req, res) => {
  res.json({ success: true, data: await retryDnsProvisioning(req.params.domainId, req.platformUser.id) });
}));
router.post("/tenant-domains/:domainId/rollback-dns", dnsProvisionRateLimit, handle(async (req, res) => {
  res.json({ success: true, data: await rollbackDnsProvisioning(req.params.domainId, req.platformUser.id) });
}));
router.post("/tenant-domains/:domainId/reconcile-dns", dnsProvisionRateLimit, handle(async (req, res) => {
  res.json({ success: true, data: await reconcileDnsStatus(req.params.domainId, req.platformUser.id) });
}));
router.post("/tenant-domains/:domainId/provision-vercel", dnsProvisionRateLimit, handle(async (req, res) => {
  res.json({ success: true, data: await provisionVercelForTenantDomain(req.params.domainId, req.platformUser.id) });
}));
router.post("/tenant-domains/:domainId/retry-vercel", dnsProvisionRateLimit, handle(async (req, res) => {
  res.json({ success: true, data: await retryVercelProvisioning(req.params.domainId, req.platformUser.id) });
}));
router.post("/tenant-domains/:domainId/rollback-vercel", dnsProvisionRateLimit, handle(async (req, res) => {
  res.json({ success: true, data: await rollbackVercelProvisioning(req.params.domainId, req.platformUser.id) });
}));
router.post("/tenant-domains/:domainId/reconcile-vercel", dnsProvisionRateLimit, handle(async (req, res) => {
  res.json({ success: true, data: await reconcileVercelStatus(req.params.domainId, req.platformUser.id) });
}));
router.post("/tenant-domains/:domainId/reconcile-ssl", dnsProvisionRateLimit, handle(async (req, res) => {
  res.json({ success: true, data: await reconcileSslStatus(req.params.domainId, req.platformUser.id) });
}));
router.post("/tenant-domains/:domainId/provision-all", dnsProvisionRateLimit, handle(async (req, res) => {
  res.json({ success: true, data: await provisionFullTenantDomain(req.params.domainId, req.platformUser.id) });
}));
router.post("/tenant-domains/:domainId/reconcile", dnsProvisionRateLimit, handle(async (req, res) => {
  res.json({ success: true, data: await reconcileCustomDomain(req.params.domainId, req.platformUser.id) });
}));

module.exports = router;
