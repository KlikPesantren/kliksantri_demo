const waliAppService = require("../services/waliAppService");
const { getTenantById, buildInactiveTenantPayload } = require("../services/tenantService");

const waliAppAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "Token tidak ada",
      });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        success: false,
        error: "Format token tidak valid",
      });
    }

    const token = parts[1];
    const decoded = waliAppService.verifyWaliToken(token);

    if (!decoded.tenant_id) {
      return res.status(401).json({
        success: false,
        error: "Token wali kedaluwarsa. Silakan login ulang.",
      });
    }

    const akun = await waliAppService.getAkunStatus(decoded.wali_akun_id);

    if (!akun) {
      return res.status(401).json({
        success: false,
        error: "Akun tidak ditemukan",
      });
    }

    if (Number(akun.tenant_id) !== Number(decoded.tenant_id)) {
      return res.status(401).json({
        success: false,
        error: "Token tidak valid untuk pesantren ini",
      });
    }

    if (akun.status !== "active") {
      return res.status(403).json({
        success: false,
        error: "Akun wali ditangguhkan",
      });
    }

    const tenant = await getTenantById(decoded.tenant_id);
    if (!tenant) {
      return res.status(403).json({
        success: false,
        error: "Pesantren tidak ditemukan",
      });
    }

    if (tenant.status !== "active") {
      return res.status(403).json(buildInactiveTenantPayload());
    }

    const isPinChangeRequest = req.method === "PUT" && req.path === "/pin";
    const isSessionProfileRequest = req.method === "GET" && req.path === "/me";
    if (akun.must_change_pin === true && !isPinChangeRequest && !isSessionProfileRequest) {
      return res.status(403).json({
        success: false,
        code: "PIN_CHANGE_REQUIRED",
        error: "PIN awal harus diubah sebelum melanjutkan",
      });
    }

    if (
      waliAppService.isTokenVersionEnabled() &&
      Number(decoded.token_version ?? 0) !== Number(akun.token_version)
    ) {
      return res.status(401).json({
        success: false,
        error: "Sesi sudah tidak berlaku. Silakan login ulang.",
      });
    }

    const tenantId = Number(decoded.tenant_id);
    const santriIds = await waliAppService.getSantriIdsForPhone(
      akun.nomor_hp,
      tenantId
    );

    req.tenantId = tenantId;
    req.tenantSlug = tenant.slug || null;

    req.wali = {
      wali_akun_id: akun.id,
      nomor_hp: akun.nomor_hp,
      nama: akun.nama,
      must_change_pin: akun.must_change_pin,
      tenant_id: tenantId,
      tenant_slug: tenant.slug || null,
      santri_ids: santriIds,
      token_payload: decoded,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "Token tidak valid",
    });
  }
};

module.exports = waliAppAuthMiddleware;
