const {
  isFeatureEnabled,
} = require("../services/tenantFeatureService");

function resolveTenantId(req) {
  if (req.tenantId != null) return Number(req.tenantId);
  if (req.user?.tenant_id != null) return Number(req.user.tenant_id);
  return null;
}

function requireTenantFeature(featureKey) {
  return async (req, res, next) => {
    try {
      const tenantId = resolveTenantId(req);

      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: "Tenant context tidak tersedia",
        });
      }

      const enabled = await isFeatureEnabled(tenantId, featureKey);

      if (!enabled) {
        return res.status(403).json({
          success: false,
          error: "Fitur tidak aktif untuk pesantren ini",
          feature: featureKey,
          code: "FEATURE_DISABLED",
        });
      }

      next();
    } catch (err) {
      console.error("[requireTenantFeature]", err);
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  };
}

function requireAnyTenantFeature(featureKeys) {
  return async (req, res, next) => {
    try {
      const tenantId = resolveTenantId(req);

      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: "Tenant context tidak tersedia",
        });
      }

      const checks = await Promise.all(
        featureKeys.map((featureKey) => isFeatureEnabled(tenantId, featureKey)),
      );

      if (!checks.some(Boolean)) {
        return res.status(403).json({
          success: false,
          error: "Fitur tidak aktif untuk pesantren ini",
          feature: featureKeys,
          code: "FEATURE_DISABLED",
        });
      }

      next();
    } catch (err) {
      console.error("[requireAnyTenantFeature]", err);
      res.status(500).json({ success: false, error: err.message });
    }
  };
}

requireTenantFeature.requireAnyTenantFeature = requireAnyTenantFeature;
module.exports = requireTenantFeature;
