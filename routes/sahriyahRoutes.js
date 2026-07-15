const express = require("express");
const router = express.Router();
const pool = require("../db");
const { assertTagihanInTenant } = require("../services/tenantScope");
const notificationService = require("../services/notificationService");
const {
  parsePagination,
  buildPaginationResponse,
} = require("../utils/paginationHelpers");
const { SQL_SANTri_AKTIF } = require("../utils/santriStatus");

function buildSahriyahFilters(tenantId, query) {
  const conditions = ["t.tenant_id = $1"];
  const params = [tenantId];
  let index = 2;

  if (query.bulan) {
    conditions.push(`t.bulan = $${index}`);
    params.push(Number(query.bulan));
    index += 1;
  }

  if (query.tahun) {
    conditions.push(`t.tahun = $${index}`);
    params.push(Number(query.tahun));
    index += 1;
  }

  if (query.status) {
    conditions.push(`LOWER(TRIM(t.status)) = LOWER(TRIM($${index}))`);
    params.push(String(query.status));
    index += 1;
  }

  if (query.kelas_id) {
    conditions.push(`s.kelas_id = $${index}`);
    params.push(Number(query.kelas_id));
    index += 1;
  }

  if (query.search && String(query.search).trim()) {
    const pattern = `%${String(query.search).trim()}%`;
    conditions.push(`(s.nama ILIKE $${index} OR s.nis ILIKE $${index})`);
    params.push(pattern);
    index += 1;
  }

  return {
    whereSql: conditions.join(" AND "),
    params,
    nextIndex: index,
    joinSql: `
      FROM tagihan_sahriyah t
      LEFT JOIN santri s
        ON t.santri_id = s.id
       AND s.tenant_id = t.tenant_id
    `,
  };
}

function formatNominalRp(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return `Rp${amount.toLocaleString("id-ID")}`;
}

function isStatusLunas(status) {
  return String(status || "").trim().toLowerCase() === "lunas";
}

async function notifyTagihanSahriyahDibuat({ tenantId, santriId, tagihanId, bulan, tahun, nominal }) {
  const nominalLabel = formatNominalRp(nominal);
  const body = nominalLabel
    ? `Tagihan sahriyah bulan ${bulan}/${tahun} sebesar ${nominalLabel} telah tersedia.`
    : `Tagihan sahriyah bulan ${bulan}/${tahun} telah tersedia.`;

  const result = await notificationService.sendInAppToWaliBySantriId({
    tenantId,
    santriId: Number(santriId),
    title: "Tagihan Sahriyah Baru",
    body,
    type: "sahriyah",
    data: {
      type: "sahriyah",
      santri_id: Number(santriId),
      tagihan_id: Number(tagihanId),
      ref_table: "tagihan_sahriyah",
      ref_id: Number(tagihanId),
    },
  });

  console.log("SAHRIYAH GENERATE NOTIFICATION RESULT:", result);
  return result;
}

router.get("/", async (req, res) => {
  try {
    const paging = parsePagination(req.query, { defaultLimit: 20, maxLimit: 200 });
    const { whereSql, params, nextIndex, joinSql } = buildSahriyahFilters(
      req.tenantId,
      req.query,
    );

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total ${joinSql} WHERE ${whereSql}`,
      params,
    );

    const total = countResult.rows[0]?.total || 0;

    const summaryResult = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE LOWER(TRIM(t.status)) = 'lunas')::int AS lunas,
         COUNT(*) FILTER (WHERE LOWER(TRIM(t.status)) != 'lunas')::int AS belum_lunas,
         COALESCE(SUM(t.nominal), 0)::numeric AS total_nominal
       ${joinSql}
       WHERE ${whereSql}`,
      params,
    );

    let listSql = `
      SELECT t.*, s.nama, s.nis, s.kelas_id, s.kamar, lp.latest_invoice_id
      ${joinSql}
      LEFT JOIN LATERAL (
        SELECT ps.id AS latest_invoice_id
        FROM pembayaran_sahriyah ps
        WHERE ps.tagihan_id = t.id
          AND ps.tenant_id = t.tenant_id
        ORDER BY ps.tanggal DESC, ps.id DESC
        LIMIT 1
      ) lp ON true
      WHERE ${whereSql}
      ORDER BY t.tahun DESC, t.bulan DESC, t.id DESC
    `;

    const listParams = [...params];

    if (paging.hasPagingParams) {
      listSql += ` LIMIT $${nextIndex} OFFSET $${nextIndex + 1}`;
      listParams.push(paging.limit, paging.offset);
    }

    const result = await pool.query(listSql, listParams);

    res.json({
      success: true,
      data: result.rows,
      pagination: buildPaginationResponse({
        hasPagingParams: paging.hasPagingParams,
        limit: paging.limit,
        offset: paging.offset,
        total,
        rowCount: result.rows.length,
      }),
      summary: summaryResult.rows[0] || {
        total: 0,
        lunas: 0,
        belum_lunas: 0,
        total_nominal: 0,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/generate", async (req, res) => {
  try {
    const { bulan, tahun } = req.body;

    const santri = await pool.query(
      `SELECT s.id, ss.id AS setting_id, ss.nominal_uang, ss.nominal_beras, ss.keterangan
       FROM santri s
       LEFT JOIN sahriyah_setting ss
         ON s.id = ss.santri_id
        AND ss.tenant_id = s.tenant_id
       WHERE s.tenant_id = $1
         AND ${SQL_SANTri_AKTIF}
       ORDER BY s.id`,
      [req.tenantId]
    );

    let created_count = 0;
    let skipped_existing_count = 0;
    let skipped_no_setting_count = 0;
    const total_target = santri.rows.length;
    const createdRows = [];

    for (const s of santri.rows) {
      if (!s.setting_id) {
        skipped_no_setting_count += 1;
        continue;
      }

      const cek = await pool.query(
        `SELECT id
         FROM tagihan_sahriyah
         WHERE tenant_id = $1
           AND santri_id = $2
           AND bulan = $3
           AND tahun = $4`,
        [req.tenantId, s.id, bulan, tahun]
      );

      if (cek.rows.length === 0) {
        const created = await pool.query(
          `INSERT INTO tagihan_sahriyah (
             santri_id, bulan, tahun, nominal, nominal_beras, keterangan, tenant_id
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [
            s.id,
            bulan,
            tahun,
            s.nominal_uang || 0,
            s.nominal_beras || 0,
            s.keterangan || "",
            req.tenantId,
          ]
        );
        createdRows.push({
          id: created.rows[0]?.id,
          santri_id: s.id,
          bulan,
          tahun,
          nominal: s.nominal_uang || 0,
        });
        created_count += 1;
      } else {
        skipped_existing_count += 1;
      }
    }

    const notificationResults = await Promise.allSettled(
      createdRows.map((row) =>
        notifyTagihanSahriyahDibuat({
          tenantId: req.tenantId,
          santriId: row.santri_id,
          tagihanId: row.id,
          bulan: row.bulan,
          tahun: row.tahun,
          nominal: row.nominal,
        })
      )
    );
    const notification_count = notificationResults.filter(
      (item) => item.status === "fulfilled" && item.value?.success
    ).length;

    res.json({
      success: true,
      message: "Tagihan berhasil dibuat",
      created_count,
      skipped_count: skipped_existing_count,
      skipped_existing_count,
      skipped_no_setting_count,
      total_target,
      notification_count,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/bayar/:id", async (req, res) => {
  try {
    const { nominal, beras, petugas } = req.body;

    const tagihan = await pool.query(
      `SELECT t.*, s.nama, s.kamar
       FROM tagihan_sahriyah t
       LEFT JOIN santri s
         ON t.santri_id = s.id
        AND s.tenant_id = t.tenant_id
       WHERE t.id = $1 AND t.tenant_id = $2`,
      [req.params.id, req.tenantId]
    );

    if (tagihan.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Tagihan tidak ditemukan" });
    }

    const data = tagihan.rows[0];

    if (isStatusLunas(data.status)) {
      return res.status(409).json({
        success: false,
        error: "Tagihan sahriyah sudah lunas dan tidak dapat dibayar lagi",
      });
    }

    const totalBayarBaru = Number(data.total_bayar || 0) + Number(nominal);
    const sisaTagihanBaru = Number(data.nominal) - totalBayarBaru;
    const berasTerbayarBaru = Number(data.beras_terbayar || 0) + Number(beras || 0);
    const sisaBerasBaru = Number(data.nominal_beras || 0) - berasTerbayarBaru;

    let status = "Belum Lunas";
    if (totalBayarBaru > 0 || berasTerbayarBaru > 0) status = "Cicilan";
    if (sisaTagihanBaru <= 0 && sisaBerasBaru <= 0) status = "Lunas";

    const tanggalBayar = status === "Lunas" ? new Date() : data.tanggal_bayar;

    await pool.query(
      `UPDATE tagihan_sahriyah
       SET total_bayar = $1,
           sisa_tagihan = $2,
           beras_terbayar = $3,
           sisa_beras = $4,
           status = $5,
           petugas = $6,
           tanggal_bayar = $7
       WHERE id = $8 AND tenant_id = $9`,
      [
        totalBayarBaru,
        Math.max(0, sisaTagihanBaru),
        berasTerbayarBaru,
        Math.max(0, sisaBerasBaru),
        status,
        petugas,
        tanggalBayar,
        req.params.id,
        req.tenantId,
      ]
    );

    const pembayaranResult = await pool.query(
      `INSERT INTO pembayaran_sahriyah (
         tagihan_id, nominal, nominal_beras, petugas, tenant_id
       )
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [req.params.id, nominal, beras, petugas, req.tenantId]
    );
    const invoiceId = pembayaranResult.rows[0]?.id;

    if (Number(nominal) > 0) {
      await pool.query(
        `INSERT INTO buku_kas (
           tanggal, jenis, kategori, keterangan, nominal, petugas, tenant_id
         )
         VALUES (
           CURRENT_TIMESTAMP, 'Masuk', 'Sahriyah', $3, $1, $2, $4
         )`,
        [nominal, petugas, `Pembayaran Sahriyah - ${data.nama}`, req.tenantId]
      );
    }

    const tagihanId = Number(req.params.id);
    const santriId = Number(data.santri_id);
    const santriNama = data.nama || "Anak";
    const nominalBayar = Number(nominal || 0);
    const nominalLabel = formatNominalRp(nominalBayar);

    try {
      const body = nominalLabel
        ? `Pembayaran sahriyah ${santriNama} sebesar ${nominalLabel} telah diterima.`
        : `Pembayaran sahriyah ${santriNama} telah diterima.`;

      const notifResult = await notificationService.sendInAppToWaliBySantriId({
        tenantId: req.tenantId,
        santriId,
        title: "Pembayaran Sahriyah Diterima",
        body,
        type: "sahriyah",
        data: {
          type: "sahriyah",
          santri_id: santriId,
          tagihan_id: tagihanId,
          invoice_id: invoiceId ? Number(invoiceId) : null,
          ref_table: invoiceId ? "pembayaran_sahriyah" : "tagihan_sahriyah",
          ref_id: invoiceId ? Number(invoiceId) : tagihanId,
        },
      });
      console.log("SAHRIYAH IN-APP NOTIFICATION RESULT:", notifResult);
    } catch (notifErr) {
      console.log("SAHRIYAH IN-APP NOTIFICATION ERROR:", notifErr.message);
    }

    res.json({
      success: true,
      total_bayar: totalBayarBaru,
      sisa_tagihan: Math.max(0, sisaTagihanBaru),
      beras_terbayar: berasTerbayarBaru,
      sisa_beras: Math.max(0, sisaBerasBaru),
      status,
      invoice_id: invoiceId,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/riwayat/:id", async (req, res) => {
  try {
    const owned = await assertTagihanInTenant(req.tenantId, req.params.id);
    if (!owned.ok) {
      return res.status(404).json({ success: false, error: owned.error });
    }

    const result = await pool.query(
      `SELECT *
       FROM pembayaran_sahriyah
       WHERE tagihan_id = $1 AND tenant_id = $2
       ORDER BY tanggal DESC`,
      [req.params.id, req.tenantId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const owned = await assertTagihanInTenant(req.tenantId, req.params.id);
    if (!owned.ok) {
      return res.status(404).json({ success: false, error: owned.error });
    }

    await pool.query(
      `DELETE FROM pembayaran_sahriyah
       WHERE tagihan_id = $1 AND tenant_id = $2`,
      [req.params.id, req.tenantId]
    );

    await pool.query(
      `DELETE FROM tagihan_sahriyah
       WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, req.tenantId]
    );

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
