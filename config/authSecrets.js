require("dotenv").config();

function requireSecret(name) {
  const value = process.env[name];
  if (!value || String(value).trim() === "") {
    throw new Error(`${name} wajib diset. Tidak ada fallback secret untuk production.`);
  }
  return value;
}

const JWT_SECRET = requireSecret("JWT_SECRET");
const WALI_JWT_SECRET = requireSecret("WALI_JWT_SECRET");

module.exports = {
  JWT_SECRET,
  WALI_JWT_SECRET,
};
