const jwt = require("jsonwebtoken");
const pool = require("../db");
const waliAppService = require("../services/waliAppService");
const { JWT_SECRET } = require("../config/authSecrets");

const API_BASE = String(process.env.SMOKE_API_BASE || "https://api.klikpesantren.com").replace(/\/$/, "");

async function apiGet(path, token, headers = {}) {
  const startedAt = performance.now();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, ...headers },
  });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { raw: text.slice(0, 500) }; }
  return { status: response.status, duration_ms: Math.round(performance.now() - startedAt), body };
}

function summarizeApi(result, kind) {
  const base = {
    status: result.status,
    duration_ms: result.duration_ms,
    success: result.body?.success === true,
    code: result.body?.code || null,
    error: result.body?.error || null,
  };
  if (kind === "saldo") {
    return {
      ...base,
      santri_id: result.body?.data?.santri_id ?? null,
      saldo: result.body?.data?.saldo ?? null,
      rfid_enabled: result.body?.data?.rfid_enabled ?? null,
    };
  }
  if (kind === "mutasi") {
    return {
      ...base,
      total: result.body?.pagination?.total ?? null,
      returned: Array.isArray(result.body?.data) ? result.body.data.length : null,
    };
  }
  if (kind === "features") {
    return {
      ...base,
      unit_id: result.body?.data?.unit_id ?? null,
      wallet: result.body?.data?.wallet ?? null,
      rfid: result.body?.data?.rfid ?? null,
    };
  }
  const rows = Array.isArray(result.body?.data) ? result.body.data : [];
  return {
    ...base,
    matches: rows.length,
    santri_id: rows[0]?.id ?? null,
    unit_id: rows[0]?.unit_id ?? null,
    wallet_account_id: rows[0]?.wallet_account_id ?? null,
    saldo: rows[0]?.saldo ?? null,
  };
}

async function financialSnapshot(client) {
  const { rows } = await client.query(`
    SELECT
      (SELECT COUNT(*)::int FROM wallet_accounts) AS wallet_accounts,
      (SELECT COALESCE(SUM(current_balance), 0)::text FROM wallet_accounts) AS balance_total,
      (SELECT COUNT(*)::int FROM wallet_transactions) AS wallet_transactions,
      (SELECT COALESCE(SUM(amount), 0)::text FROM wallet_transactions) AS transaction_amount_total
  `);
  return rows[0];
}

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN READ ONLY");

    const { rows: columns } = await client.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('wallet_accounts', 'wallet_transactions', 'santri_units', 'santri')
      ORDER BY table_name, ordinal_position
    `);
    const { rows: indexes } = await client.query(`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('wallet_accounts', 'wallet_transactions')
      ORDER BY tablename, indexname
    `);
    const financialBefore = await financialSnapshot(client);
    const { rows: availabilityRows } = await client.query(`
      WITH contexts AS (
        SELECT su.tenant_id, su.unit_id, su.santri_id, wa.id AS wallet_account_id,
          COALESCE(wallet_feature.enabled, false) AS wallet_enabled,
          (SELECT COUNT(*)::int FROM wallet_transactions wt
            WHERE wt.wallet_account_id = wa.id
              AND wt.tenant_id = su.tenant_id
              AND wt.unit_id = su.unit_id) AS transaction_count
        FROM wali_akun wali
        JOIN wali_santri ws
          ON ws.tenant_id = wali.tenant_id AND ws.nomor_hp = wali.nomor_hp
        JOIN santri_units su
          ON su.tenant_id = ws.tenant_id AND su.santri_id = ws.santri_id
         AND su.status = 'active' AND su.left_at IS NULL
        JOIN tenants t ON t.id = su.tenant_id AND t.status = 'active'
        JOIN unit_pendidikan unit
          ON unit.id = su.unit_id AND unit.tenant_id = su.tenant_id AND unit.is_active = true
        LEFT JOIN unit_features wallet_feature
          ON wallet_feature.tenant_id = su.tenant_id AND wallet_feature.unit_id = su.unit_id
         AND wallet_feature.feature_key = 'wallet'
        LEFT JOIN wallet_accounts wa
          ON wa.tenant_id = su.tenant_id AND wa.unit_id = su.unit_id AND wa.santri_id = su.santri_id
         AND wa.status = 'active'
        WHERE wali.status = 'active' AND wali.must_change_pin = false
      )
      SELECT
        COUNT(*) FILTER (WHERE wallet_enabled)::int AS wallet_on,
        COUNT(*) FILTER (WHERE wallet_enabled AND wallet_account_id IS NULL)::int AS wallet_on_no_account,
        COUNT(*) FILTER (WHERE wallet_enabled AND transaction_count = 0)::int AS wallet_on_no_transactions,
        COUNT(*) FILTER (WHERE NOT wallet_enabled)::int AS wallet_off
      FROM contexts
    `);

    const { rows: candidates } = await client.query(`
      SELECT
        wali.id AS wali_akun_id,
        wali.nomor_hp,
        wali.token_version,
        t.id AS tenant_id,
        t.slug AS tenant_slug,
        su.santri_id,
        su.unit_id,
        s.nis,
        wallet_feature.enabled AS wallet_enabled,
        COALESCE(rfid_feature.enabled, false) AS rfid_enabled,
        wa.id AS wallet_account_id,
        wa.current_balance,
        s.saldo AS legacy_saldo,
        (SELECT COUNT(*)::int FROM wallet_transactions wt
          WHERE wt.wallet_account_id = wa.id
            AND wt.tenant_id = su.tenant_id
            AND wt.unit_id = su.unit_id) AS transaction_count
      FROM wali_akun wali
      JOIN tenants t ON t.id = wali.tenant_id AND t.status = 'active'
      JOIN wali_santri ws
        ON ws.tenant_id = wali.tenant_id AND ws.nomor_hp = wali.nomor_hp
      JOIN santri_units su
        ON su.tenant_id = ws.tenant_id AND su.santri_id = ws.santri_id
       AND su.status = 'active' AND su.left_at IS NULL
      JOIN santri s ON s.id = su.santri_id AND s.tenant_id = su.tenant_id
      JOIN unit_pendidikan unit
        ON unit.id = su.unit_id AND unit.tenant_id = su.tenant_id AND unit.is_active = true
      JOIN unit_features wallet_feature
        ON wallet_feature.tenant_id = su.tenant_id AND wallet_feature.unit_id = su.unit_id
       AND wallet_feature.feature_key = 'wallet' AND wallet_feature.enabled = true
      LEFT JOIN unit_features rfid_feature
        ON rfid_feature.tenant_id = su.tenant_id AND rfid_feature.unit_id = su.unit_id
       AND rfid_feature.feature_key = 'rfid'
      LEFT JOIN wallet_accounts wa
        ON wa.tenant_id = su.tenant_id AND wa.unit_id = su.unit_id AND wa.santri_id = su.santri_id
      WHERE wali.status = 'active'
        AND wali.must_change_pin = false
      ORDER BY (wa.id IS NOT NULL) DESC, transaction_count DESC, wali.id
      LIMIT 1
    `);
    const candidate = candidates[0];
    if (!candidate) throw new Error("No safe owned-child Wallet-enabled production candidate found");
    const { rows: negativeTargets } = await client.query(`
      SELECT
        (SELECT su2.santri_id
           FROM santri_units su2
          WHERE su2.tenant_id = $1 AND su2.unit_id = $2
            AND su2.status = 'active' AND su2.left_at IS NULL
            AND NOT EXISTS (
              SELECT 1 FROM wali_santri ws2
               WHERE ws2.tenant_id = $1 AND ws2.santri_id = su2.santri_id
                 AND ws2.nomor_hp = $3
            )
          ORDER BY su2.santri_id LIMIT 1) AS foreign_family_santri_id,
        (SELECT unit2.id
           FROM unit_pendidikan unit2
          WHERE unit2.tenant_id = $1 AND unit2.id <> $2 AND unit2.is_active = true
          ORDER BY unit2.id LIMIT 1) AS foreign_unit_id,
        (SELECT su3.santri_id
           FROM santri_units su3
          WHERE su3.tenant_id <> $1 AND su3.status = 'active' AND su3.left_at IS NULL
          ORDER BY su3.tenant_id, su3.santri_id LIMIT 1) AS cross_tenant_santri_id
    `, [candidate.tenant_id, candidate.unit_id, candidate.nomor_hp]);
    const negativeTarget = negativeTargets[0];

    const { rows: accounts } = await client.query(
      `SELECT id, nomor_hp, nama, token_version FROM wali_akun
       WHERE id = $1 AND tenant_id = $2 AND status = 'active'`,
      [candidate.wali_akun_id, candidate.tenant_id],
    );
    const { rows: tenants } = await client.query(
      "SELECT id, slug, nama FROM tenants WHERE id = $1 AND status = 'active'",
      [candidate.tenant_id],
    );
    const anak = await waliAppService.getAnakList(candidate.nomor_hp, candidate.tenant_id);
    const waliToken = waliAppService.signWaliToken(accounts[0], anak, tenants[0]);

    const { rows: admins } = await client.query(`
      SELECT u.id, u.username, u.nama, u.role, u.tenant_id, u.token_version, t.slug AS tenant_slug
      FROM users u JOIN tenants t ON t.id = u.tenant_id
      WHERE u.tenant_id = $1 AND LOWER(TRIM(u.status)) IN ('active', 'aktif')
        AND u.role = 'superadmin'
      ORDER BY u.id LIMIT 1
    `, [candidate.tenant_id]);
    const admin = admins[0];
    const adminToken = admin ? jwt.sign({
      id: admin.id,
      username: admin.username,
      nama: admin.nama,
      role: admin.role,
      tenant_id: admin.tenant_id,
      tenant_slug: admin.tenant_slug,
      token_version: Number(admin.token_version) || 0,
    }, JWT_SECRET, { expiresIn: "10m" }) : null;

    await client.query("ROLLBACK");

    const waliHeaders = {
      "X-Santri-Id": String(candidate.santri_id),
      "X-Unit-Id": String(candidate.unit_id),
    };
    const [saldo, mutasi, features, adminLookup, foreignFamily, foreignUnit, crossTenant, invalidSession] = await Promise.all([
      apiGet("/wali-app/rfid/saldo", waliToken, waliHeaders),
      apiGet("/wali-app/rfid/mutasi?page=1&limit=20", waliToken, waliHeaders),
      apiGet("/wali-app/features", waliToken, waliHeaders),
      adminToken
        ? apiGet(`/rfid/santri/search?search=${encodeURIComponent(candidate.nis || candidate.santri_id)}&limit=20`, adminToken, { "X-Unit-Id": String(candidate.unit_id) })
        : Promise.resolve({ status: null, duration_ms: null, body: { skipped: "no active tenant superadmin" } }),
      negativeTarget.foreign_family_santri_id
        ? apiGet("/wali-app/rfid/saldo", waliToken, {
          "X-Santri-Id": String(negativeTarget.foreign_family_santri_id),
          "X-Unit-Id": String(candidate.unit_id),
        })
        : Promise.resolve({ status: null, duration_ms: null, body: { skipped: "no foreign-family target" } }),
      negativeTarget.foreign_unit_id
        ? apiGet("/wali-app/rfid/saldo", waliToken, {
          "X-Santri-Id": String(candidate.santri_id),
          "X-Unit-Id": String(negativeTarget.foreign_unit_id),
        })
        : Promise.resolve({ status: null, duration_ms: null, body: { skipped: "no foreign-unit target" } }),
      negativeTarget.cross_tenant_santri_id
        ? apiGet("/wali-app/rfid/saldo", waliToken, {
          "X-Santri-Id": String(negativeTarget.cross_tenant_santri_id),
          "X-Unit-Id": String(candidate.unit_id),
        })
        : Promise.resolve({ status: null, duration_ms: null, body: { skipped: "no cross-tenant target" } }),
      apiGet("/wali-app/rfid/saldo", `${waliToken.slice(0, -1)}x`, waliHeaders),
    ]);
    await client.query("BEGIN READ ONLY");
    const financialAfter = await financialSnapshot(client);
    await client.query("ROLLBACK");

    const safeCandidate = {
      wali_akun_id: candidate.wali_akun_id,
      tenant_id: candidate.tenant_id,
      tenant_slug: candidate.tenant_slug,
      santri_id: candidate.santri_id,
      unit_id: candidate.unit_id,
      wallet_enabled: candidate.wallet_enabled,
      rfid_enabled: candidate.rfid_enabled,
      wallet_account_id: candidate.wallet_account_id,
      current_balance: candidate.current_balance,
      legacy_saldo: candidate.legacy_saldo,
      transaction_count: candidate.transaction_count,
    };
    const schemaSummary = Object.fromEntries(
      ["santri", "santri_units", "wallet_accounts", "wallet_transactions"].map((table) => [
        table,
        columns.filter((column) => column.table_name === table).map((column) => column.column_name),
      ]),
    );
    console.log(JSON.stringify({
      marker: "wali-wallet-production-audit",
      mode: "READ_ONLY",
      schema: {
        columns: schemaSummary,
        indexes: indexes.map((index) => ({ table: index.tablename, name: index.indexname, definition: index.indexdef })),
      },
      financial_safety: {
        before: financialBefore,
        after: financialAfter,
        unchanged: JSON.stringify(financialBefore) === JSON.stringify(financialAfter),
      },
      production_contexts: availabilityRows[0],
      candidate: safeCandidate,
      api: {
        saldo: summarizeApi(saldo, "saldo"),
        mutasi: summarizeApi(mutasi, "mutasi"),
        features: summarizeApi(features, "features"),
        admin_lookup: summarizeApi(adminLookup, "admin"),
        foreign_family: summarizeApi(foreignFamily, "access"),
        foreign_unit: summarizeApi(foreignUnit, "access"),
        cross_tenant: summarizeApi(crossTenant, "access"),
        invalid_session: summarizeApi(invalidSession, "access"),
      },
    }, null, 2));
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch { /* best effort */ }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error(`[wali-wallet-production-audit-error] ${error.message}`);
  process.exitCode = 1;
});
