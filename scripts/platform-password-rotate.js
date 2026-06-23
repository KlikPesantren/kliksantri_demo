require("dotenv").config();

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const pool = require("../db");

const username = process.env.PLATFORM_ROTATE_USERNAME || "platform";
const rounds = Number(process.env.PLATFORM_ROTATE_BCRYPT_ROUNDS || 10);

async function main() {
  if (!Number.isInteger(rounds) || rounds < 10) {
    throw new Error("PLATFORM_ROTATE_BCRYPT_ROUNDS minimal 10");
  }

  const password = crypto.randomBytes(24).toString("base64url");
  const hash = await bcrypt.hash(password, rounds);

  const result = await pool.query(
    `
    UPDATE users
    SET password = $1
    WHERE username = $2
      AND role = 'platform_superadmin'
      AND tenant_id IS NULL
    RETURNING id, username, role
    `,
    [hash, username]
  );

  if (result.rowCount !== 1) {
    throw new Error(
      `Platform superadmin '${username}' tidak ditemukan atau tidak unik`
    );
  }

  console.log("Platform credential rotated.");
  console.log("Simpan password ini sekarang. Tidak akan ditampilkan lagi.");
  console.log(`Username: ${username}`);
  console.log(`Password: ${password}`);
}

main()
  .catch((err) => {
    console.error("Platform password rotation failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
