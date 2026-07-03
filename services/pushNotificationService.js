const { Expo } = require("expo-server-sdk");
const pool = require("../db");

const expo = new Expo();

function normalizeToken(token) {
  return String(token || "").trim();
}

function normalizeText(value, maxLength) {
  const text = String(value || "").trim();
  return maxLength ? text.slice(0, maxLength) : text;
}

async function registerWaliDeviceToken({
  tenantId,
  waliId,
  expoPushToken,
  platform = null,
  deviceName = null,
}) {
  const token = normalizeToken(expoPushToken);

  if (!tenantId || !waliId) {
    const err = new Error("tenantId dan waliId wajib");
    err.statusCode = 400;
    throw err;
  }

  if (!token || !Expo.isExpoPushToken(token)) {
    const err = new Error("expo_push_token tidak valid");
    err.statusCode = 400;
    throw err;
  }

  const result = await pool.query(
    `
    INSERT INTO wali_device_tokens (
      tenant_id,
      wali_id,
      expo_push_token,
      platform,
      device_name,
      is_active,
      last_seen,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
    ON CONFLICT (tenant_id, wali_id, expo_push_token)
    DO UPDATE SET
      platform = COALESCE(EXCLUDED.platform, wali_device_tokens.platform),
      device_name = COALESCE(EXCLUDED.device_name, wali_device_tokens.device_name),
      is_active = true,
      last_seen = NOW(),
      updated_at = NOW()
    RETURNING *, last_seen AS last_seen_at
    `,
    [
      tenantId,
      waliId,
      token,
      normalizeText(platform, 50) || null,
      normalizeText(deviceName, 150) || null,
    ]
  );

  return result.rows[0];
}

async function unregisterWaliDeviceToken({
  tenantId,
  waliId,
  expoPushToken,
}) {
  const token = normalizeToken(expoPushToken);

  if (!tenantId || !waliId || !token) {
    return null;
  }

  const result = await pool.query(
    `
    UPDATE wali_device_tokens
    SET is_active = false,
        updated_at = NOW()
    WHERE tenant_id = $1
      AND wali_id = $2
      AND expo_push_token = $3
    RETURNING id, tenant_id, wali_id, expo_push_token, is_active
    `,
    [tenantId, waliId, token]
  );

  return result.rows[0] || null;
}

async function deactivateToken({ tenantId, expoPushToken }) {
  const token = normalizeToken(expoPushToken);
  if (!tenantId || !token) return null;

  const result = await pool.query(
    `
    UPDATE wali_device_tokens
    SET is_active = false,
        updated_at = NOW()
    WHERE tenant_id = $1
      AND expo_push_token = $2
    RETURNING id
    `,
    [tenantId, token]
  );

  return result.rowCount;
}

async function getActiveTokensForWali({ tenantId, waliId }) {
  const result = await pool.query(
    `
    SELECT id, expo_push_token
    FROM wali_device_tokens
    WHERE tenant_id = $1
      AND wali_id = $2
      AND is_active = true
    ORDER BY last_seen DESC, id DESC
    `,
    [tenantId, waliId]
  );

  return result.rows;
}

async function sendPushToWali({
  tenantId,
  waliId,
  title,
  body,
  data = {},
}) {
  try {
    const safeTitle = normalizeText(title, 200);
    const safeBody = normalizeText(body);

    if (!tenantId || !waliId || !safeTitle || !safeBody) {
      return {
        success: false,
        skipped: true,
        reason: "missing_required_fields",
      };
    }

    const tokenRows = await getActiveTokensForWali({ tenantId, waliId });
    const validTokens = [];

    for (const row of tokenRows) {
      if (Expo.isExpoPushToken(row.expo_push_token)) {
        validTokens.push(row.expo_push_token);
      } else {
        await deactivateToken({ tenantId, expoPushToken: row.expo_push_token });
      }
    }

    if (validTokens.length === 0) {
      return {
        success: false,
        skipped: true,
        reason: "no_active_token",
      };
    }

    const messages = validTokens.map((token) => ({
      to: token,
      sound: "default",
      title: safeTitle,
      body: safeBody,
      data: {
        ...(data || {}),
        tenant_id: tenantId,
        wali_id: waliId,
      },
    }));

    const tickets = [];
    const errors = [];

    for (const chunk of expo.chunkPushNotifications(messages)) {
      const chunkTickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...chunkTickets);
    }

    for (let i = 0; i < tickets.length; i += 1) {
      const ticket = tickets[i];
      const token = validTokens[i];

      if (ticket.status === "ok") continue;

      errors.push(ticket.message || "Push ticket error");

      if (ticket.details?.error === "DeviceNotRegistered") {
        await deactivateToken({ tenantId, expoPushToken: token });
      }
    }

    return {
      success: tickets.some((ticket) => ticket.status === "ok"),
      sent: tickets.filter((ticket) => ticket.status === "ok").length,
      errors,
      tickets,
    };
  } catch (err) {
    console.log("sendPushToWali ERROR:", err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

module.exports = {
  registerWaliDeviceToken,
  unregisterWaliDeviceToken,
  sendPushToWali,
};
