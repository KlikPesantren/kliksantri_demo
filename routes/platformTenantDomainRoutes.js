const express = require("express");
const platformAuthMiddleware = require("../middleware/platformAuthMiddleware");
const {
  createDraftDomainForTenant, getTenantDomainByTenantId, listTenantDomains,
  updateDomainStatuses, regenerateDraftDomain,
} = require("../services/tenantDomainService");

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

router.get("/tenant-domains", handle(async (_req, res) => {
  res.json({ success: true, data: await listTenantDomains() });
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

module.exports = router;
