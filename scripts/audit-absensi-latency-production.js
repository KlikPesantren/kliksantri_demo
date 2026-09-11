/* eslint-disable no-console */
require("dotenv").config();

if (process.env.NODE_ENV !== "production") {
  throw new Error("NODE_ENV=production is required for the read-only production audit");
}

const { performance } = require("node:perf_hooks");
const pool = require("../db");

async function timed(client, text, params = []) {
  const started = performance.now();
  const result = await client.query(text, params);
  return { result, durationMs: Number((performance.now() - started).toFixed(2)) };
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN READ ONLY");

    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'absensi'
      ORDER BY ordinal_position
    `);
    const indexes = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'absensi'
      ORDER BY indexname
    `);
    const constraints = await client.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE conrelid = 'absensi'::regclass
      ORDER BY conname
    `);

    const periods = await client.query(`
      SELECT a.tenant_id, a.unit_id,
             EXTRACT(YEAR FROM a.tanggal::date)::int AS tahun,
             EXTRACT(MONTH FROM a.tanggal::date)::int AS bulan,
             COUNT(*)::int AS saved_rows,
             COUNT(*) FILTER (WHERE s.active = true)::int AS active_session_rows,
             COUNT(DISTINCT a.santri_id)::int AS students,
             COUNT(DISTINCT a.session_id)::int AS sessions
      FROM absensi a
      LEFT JOIN attendance_sessions s
        ON s.tenant_id = a.tenant_id AND s.unit_id = a.unit_id AND s.id = a.session_id
      WHERE a.unit_id IS NOT NULL
      GROUP BY a.tenant_id, a.unit_id,
               EXTRACT(YEAR FROM a.tanggal::date), EXTRACT(MONTH FROM a.tanggal::date)
      ORDER BY tahun DESC, bulan DESC, active_session_rows DESC
      LIMIT 12
    `);

    const target = periods.rows.find((row) => row.active_session_rows > 0);
    if (!target) throw new Error("No canonical attendance period with an active session found");

    const params = [target.tenant_id, target.unit_id, target.bulan, target.tahun];
    const currentPlan = await client.query(`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT a.id
      FROM absensi a
      WHERE a.tenant_id = $1 AND a.unit_id = $2
        AND EXTRACT(MONTH FROM a.tanggal::date) = $3
        AND EXTRACT(YEAR FROM a.tanggal::date) = $4
      ORDER BY a.tanggal ASC, a.id ASC
    `, params);

    const rangeStart = `${target.tahun}-${String(target.bulan).padStart(2, "0")}-01`;
    const next = new Date(Date.UTC(target.tahun, target.bulan, 1));
    const rangeEnd = next.toISOString().slice(0, 10);
    const rangePlan = await client.query(`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT a.id
      FROM absensi a
      WHERE a.tenant_id = $1 AND a.unit_id = $2
        AND a.tanggal >= $3::date AND a.tanggal < $4::date
      ORDER BY a.tanggal ASC, a.id ASC
    `, [target.tenant_id, target.unit_id, rangeStart, rangeEnd]);

    const candidates = await client.query(`
      SELECT a.santri_id, a.session_id
      FROM absensi a
      JOIN attendance_sessions ats
        ON ats.tenant_id = a.tenant_id AND ats.unit_id = a.unit_id
       AND ats.id = a.session_id AND ats.active = true
      JOIN santri_units su
        ON su.tenant_id = a.tenant_id AND su.unit_id = a.unit_id
       AND su.santri_id = a.santri_id AND su.status = 'active' AND su.left_at IS NULL
      JOIN LATERAL (
        SELECT ske.id, ske.kelas_id
        FROM santri_kelas_enrollments ske
        WHERE ske.tenant_id = su.tenant_id AND ske.santri_unit_id = su.id
          AND ske.status = 'active' AND ske.end_date IS NULL
        ORDER BY ske.id DESC LIMIT 1
      ) e ON TRUE
      WHERE a.tenant_id = $1 AND a.unit_id = $2
        AND a.tanggal >= $3::date AND a.tanggal < $4::date
      ORDER BY a.id DESC
      LIMIT 40
    `, [target.tenant_id, target.unit_id, rangeStart, rangeEnd]);

    const sample = candidates.rows.slice(0, 30);
    const sequentialStarted = performance.now();
    for (const row of sample) {
      await client.query(`
        SELECT id FROM attendance_sessions
        WHERE tenant_id = $1 AND unit_id = $2 AND id = $3 AND active = true LIMIT 1
      `, [target.tenant_id, target.unit_id, row.session_id]);
      await client.query(`
        SELECT su.id, e.id AS enrollment_id, e.kelas_id
        FROM santri_units su
        LEFT JOIN LATERAL (
          SELECT ske.id, ske.kelas_id
          FROM santri_kelas_enrollments ske
          WHERE ske.tenant_id = su.tenant_id AND ske.santri_unit_id = su.id
            AND ske.status = 'active' AND ske.end_date IS NULL
          ORDER BY ske.id DESC LIMIT 1
        ) e ON TRUE
        WHERE su.tenant_id = $1 AND su.unit_id = $2 AND su.santri_id = $3
          AND su.status = 'active' AND su.left_at IS NULL LIMIT 1
      `, [target.tenant_id, target.unit_id, row.santri_id]);
    }
    const sequentialValidationMs = Number((performance.now() - sequentialStarted).toFixed(2));

    const santriIds = [...new Set(sample.map((row) => Number(row.santri_id)))];
    const sessionIds = [...new Set(sample.map((row) => Number(row.session_id)))];
    const batchSessions = await timed(client, `
      SELECT id FROM attendance_sessions
      WHERE tenant_id = $1 AND unit_id = $2 AND active = true AND id = ANY($3::bigint[])
    `, [target.tenant_id, target.unit_id, sessionIds]);
    const batchStudents = await timed(client, `
      SELECT su.santri_id, su.id, e.id AS enrollment_id, e.kelas_id
      FROM santri_units su
      JOIN LATERAL (
        SELECT ske.id, ske.kelas_id
        FROM santri_kelas_enrollments ske
        WHERE ske.tenant_id = su.tenant_id AND ske.santri_unit_id = su.id
          AND ske.status = 'active' AND ske.end_date IS NULL
        ORDER BY ske.id DESC LIMIT 1
      ) e ON TRUE
      WHERE su.tenant_id = $1 AND su.unit_id = $2
        AND su.status = 'active' AND su.left_at IS NULL
        AND su.santri_id = ANY($3::bigint[])
    `, [target.tenant_id, target.unit_id, santriIds]);

    const classSizes = await client.query(`
      SELECT e.kelas_id, COUNT(*)::int AS active_students
      FROM santri_units su
      JOIN LATERAL (
        SELECT ske.kelas_id
        FROM santri_kelas_enrollments ske
        WHERE ske.tenant_id = su.tenant_id AND ske.santri_unit_id = su.id
          AND ske.status = 'active' AND ske.end_date IS NULL
        ORDER BY ske.id DESC LIMIT 1
      ) e ON TRUE
      WHERE su.tenant_id = $1 AND su.unit_id = $2
        AND su.status = 'active' AND su.left_at IS NULL
      GROUP BY e.kelas_id ORDER BY active_students DESC
    `, [target.tenant_id, target.unit_id]);

    const planSummary = (raw) => {
      const root = raw.rows[0]["QUERY PLAN"][0];
      return {
        planning_ms: root["Planning Time"],
        execution_ms: root["Execution Time"],
        node: root.Plan["Node Type"],
        rows: root.Plan["Actual Rows"],
        shared_hit_blocks: root.Plan["Shared Hit Blocks"],
      };
    };

    console.log(JSON.stringify({
      mode: "READ_ONLY",
      schema: { columns: columns.rows, indexes: indexes.rows, constraints: constraints.rows },
      recentPeriods: periods.rows,
      target,
      typicalClassSizes: classSizes.rows,
      plans: { currentExtract: planSummary(currentPlan), dateRange: planSummary(rangePlan) },
      validationSample: {
        rows: sample.length,
        sequentialQueries: sample.length * 2,
        sequentialMs: sequentialValidationMs,
        batchQueries: 2,
        batchMs: Number((batchSessions.durationMs + batchStudents.durationMs).toFixed(2)),
        sessionsMatched: batchSessions.result.rowCount,
        studentsMatched: batchStudents.result.rowCount,
      },
    }, null, 2));

    await client.query("ROLLBACK");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
