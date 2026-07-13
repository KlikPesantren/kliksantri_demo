const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-admin-secret-not-for-production";
process.env.WALI_JWT_SECRET = "test-wali-secret-not-for-production";
process.env.WALI_JWT_ALLOW_LEGACY_NO_AUD = "true";
process.env.WALI_TOKEN_VERSION_ENABLED = "true";

const {
  signWaliToken,
  verifyWaliToken,
  WALI_JWT_SECRET,
  WALI_JWT_ISSUER,
  WALI_JWT_AUDIENCE,
  WALI_JWT_ALGORITHM,
} = require("../services/waliAppService");

const account = { id: 7, nomor_hp: "081200000000", token_version: 4 };
const tenant = { id: 3, slug: "demo" };
const payload = {
  typ: "wali",
  sub: account.nomor_hp,
  wali_akun_id: account.id,
  nomor_hp: account.nomor_hp,
  tenant_id: tenant.id,
  tenant_slug: tenant.slug,
  santri_ids: [11],
  token_version: account.token_version,
};

const signRaw = (overrides = {}, options = {}) =>
  jwt.sign(
    { ...payload, ...overrides },
    WALI_JWT_SECRET,
    {
      algorithm: WALI_JWT_ALGORITHM,
      issuer: WALI_JWT_ISSUER,
      expiresIn: "5m",
      ...options,
    }
  );

const currentToken = signWaliToken(account, [11], tenant);
const currentHeader = jwt.decode(currentToken, { complete: true }).header;
const currentPayload = verifyWaliToken(currentToken);
assert.equal(currentHeader.alg, WALI_JWT_ALGORITHM);
assert.equal(currentPayload.iss, WALI_JWT_ISSUER);
assert.equal(currentPayload.aud, WALI_JWT_AUDIENCE);
assert.equal(currentPayload.typ, "wali");
assert.equal(currentPayload.token_version, account.token_version);

const legacyToken = signRaw();
assert.equal(verifyWaliToken(legacyToken).aud, undefined);

assert.throws(() => verifyWaliToken(signRaw({}, { audience: "wrong-client" })));
assert.throws(() => verifyWaliToken(signRaw({}, { issuer: "wrong-issuer" })));
assert.throws(() => verifyWaliToken(signRaw({ typ: "admin" })));

const hs384Token = jwt.sign(payload, WALI_JWT_SECRET, {
  algorithm: "HS384",
  issuer: WALI_JWT_ISSUER,
  audience: WALI_JWT_AUDIENCE,
  expiresIn: "5m",
});
assert.throws(() => verifyWaliToken(hs384Token));

console.log("Wali JWT hardening checks passed");
