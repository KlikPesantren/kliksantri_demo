require("dotenv").config();

const bcrypt =
  require("bcryptjs");

const jwt =
  require("jsonwebtoken");

const pool =
  require("../db");

const WALI_JWT_SECRET =
  process.env.WALI_JWT_SECRET ||
  "WALI_DEV_SECRET_CHANGE_IN_PRODUCTION";

const WALI_JWT_EXPIRES =
  process.env.WALI_JWT_EXPIRES ||
  "30d";

const MAX_FAILED_ATTEMPTS = 5;

const LOCKOUT_MINUTES = 15;

const BLOCKED_PINS = [
  "000000",
  "123456",
  "111111",
  "654321"
];

// =====================
// PHONE
// =====================

const normalizePhone = (raw) => {

  if (
    raw === undefined ||
    raw === null ||
    raw === ""
  ) {

    return null;

  }

  let digits =
    String(raw).replace(/\D/g, "");

  if (digits.length === 0) {

    return null;

  }

  if (digits.startsWith("0")) {

    digits = "62" + digits.slice(1);

  }

  else if (
    !digits.startsWith("62")
  ) {

    digits = "62" + digits;

  }

  return digits;

};

// =====================
// PIN
// =====================

const isValidPin = (pin) => {

  if (
    typeof pin !== "string" &&
    typeof pin !== "number"
  ) {

    return false;

  }

  const value =
    String(pin);

  if (
    !/^\d{6}$/.test(value)
  ) {

    return false;

  }

  if (
    BLOCKED_PINS.includes(value)
  ) {

    return false;

  }

  return true;

};

const hashPin = async (pin) => {

  return bcrypt.hash(
    String(pin),
    10
  );

};

const verifyPin = async (
  plainPin,
  pinHash
) => {

  return bcrypt.compare(
    String(plainPin),
    pinHash
  );

};

// =====================
// ACCOUNT
// =====================

const findAkunByPhone = async (
  nomorHp
) => {

  const result =
    await pool.query(

      `
      SELECT *
      FROM wali_akun
      WHERE nomor_hp = $1
      LIMIT 1
      `,

      [nomorHp]

    );

  return result.rows[0] || null;

};

const isAccountLocked = (akun) => {

  if (
    !akun ||
    !akun.locked_until
  ) {

    return false;

  }

  return (
    new Date(akun.locked_until) >
    new Date()
  );

};

const registerFailedLogin = async (
  akunId
) => {

  const result =
    await pool.query(

      `
      UPDATE wali_akun
      SET
        failed_attempts = failed_attempts + 1,
        locked_until = CASE
          WHEN failed_attempts + 1 >= $2
          THEN NOW() + ($3 || ' minutes')::INTERVAL
          ELSE locked_until
        END,
        updated_at = NOW()
      WHERE id = $1
      RETURNING failed_attempts, locked_until
      `,

      [
        akunId,
        MAX_FAILED_ATTEMPTS,
        String(LOCKOUT_MINUTES)
      ]

    );

  return result.rows[0];

};

const registerSuccessfulLogin = async (
  akunId
) => {

  await pool.query(

    `
    UPDATE wali_akun
    SET
      failed_attempts = 0,
      locked_until = NULL,
      last_login = NOW(),
      updated_at = NOW()
    WHERE id = $1
    `,

    [akunId]

  );

};

const getAkunStatus = async (
  waliAkunId
) => {

  const result =
    await pool.query(

      `
      SELECT
        id,
        nomor_hp,
        nama,
        status,
        must_change_pin
      FROM wali_akun
      WHERE id = $1
      LIMIT 1
      `,

      [waliAkunId]

    );

  return result.rows[0] || null;

};

// =====================
// ANAK / SANTRI
// =====================

const getSantriIdsForPhone = async (
  nomorHp
) => {

  const result =
    await pool.query(

      `
      SELECT DISTINCT ws.santri_id
      FROM wali_santri ws
      INNER JOIN santri s
        ON s.id = ws.santri_id
      WHERE ws.nomor_hp = $1
      ORDER BY ws.santri_id ASC
      `,

      [nomorHp]

    );

  return result.rows.map(
    (row) => row.santri_id
  );

};

const getAnakList = async (
  nomorHp
) => {

  const result =
    await pool.query(

      `
      SELECT DISTINCT ON (s.id)
        s.id AS santri_id,
        s.nis,
        s.nama,
        s.foto,
        k.nama_kelas
      FROM wali_santri ws
      INNER JOIN santri s
        ON s.id = ws.santri_id
      LEFT JOIN kelas k
        ON k.id = s.kelas_id
      WHERE ws.nomor_hp = $1
      ORDER BY s.id ASC, ws.id DESC
      `,

      [nomorHp]

    );

  return result.rows;

};

const ownsSantri = async (
  nomorHp,
  santriId
) => {

  const ids =
    await getSantriIdsForPhone(
      nomorHp
    );

  return ids.includes(
    Number(santriId)
  );

};

// =====================
// JWT
// =====================

const signWaliToken = (
  akun,
  santriIds
) => {

  const payload = {

    typ: "wali",

    iss: "kliksantri-wali",

    sub: akun.nomor_hp,

    wali_akun_id: akun.id,

    santri_ids: santriIds

  };

  const token =
    jwt.sign(
      payload,
      WALI_JWT_SECRET,
      {
        expiresIn: WALI_JWT_EXPIRES
      }
    );

  return token;

};

const verifyWaliToken = (token) => {

  const decoded =
    jwt.verify(
      token,
      WALI_JWT_SECRET
    );

  if (
    decoded.typ !== "wali"
  ) {

    throw new Error(
      "Invalid token type"
    );

  }

  return decoded;

};

// =====================
// AUDIT
// =====================

const writeAudit = async ({
  nomorHp,
  event,
  ipAddress,
  userAgent
}) => {

  try {

    await pool.query(

      `
      INSERT INTO wali_app_audit (
        nomor_hp,
        event,
        ip_address,
        user_agent
      )
      VALUES ($1, $2, $3, $4)
      `,

      [
        nomorHp || null,
        event,
        ipAddress || null,
        userAgent || null
      ]

    );

  }

  catch (err) {

    console.log(
      "WALI AUDIT ERROR:",
      err.message
    );

  }

};

// =====================
// PROFILE BUILDERS
// =====================

const buildWaliProfile = (
  akun
) => {

  return {

    nomor_hp: akun.nomor_hp,

    nama: akun.nama || null,

    must_change_pin:
      akun.must_change_pin === true

  };

};

const buildLoginResponse = async (
  akun
) => {

  const anak =
    await getAnakList(
      akun.nomor_hp
    );

  const santriIds =
    anak.map(
      (item) => item.santri_id
    );

  const token =
    signWaliToken(
      akun,
      santriIds
    );

  return {

    token,

    expires_in: WALI_JWT_EXPIRES,

    wali:
      buildWaliProfile(akun),

    anak,

    must_change_pin:
      akun.must_change_pin === true

  };

};

module.exports = {

  normalizePhone,
  isValidPin,
  hashPin,
  verifyPin,
  findAkunByPhone,
  isAccountLocked,
  registerFailedLogin,
  registerSuccessfulLogin,
  getAkunStatus,
  getSantriIdsForPhone,
  getAnakList,
  ownsSantri,
  signWaliToken,
  verifyWaliToken,
  writeAudit,
  buildWaliProfile,
  buildLoginResponse,
  WALI_JWT_SECRET

};
