const express = require("express");
const router = express.Router();
const pool = require("../db");
const { assertTagihanInTenant } = require("../services/tenantScope");
const notificationService = require("../services/notificationService");

function formatNominalRp(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return `Rp${amount.toLocaleString("id-ID")}`;
}

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, s.nama
       FROM tagihan_sahriyah t
       LEFT JOIN santri s
         ON t.santri_id = s.id
        AND s.tenant_id = t.tenant_id
       WHERE t.tenant_id = $1
       ORDER BY t.tahun DESC, t.bulan DESC`,
      [req.tenantId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/generate", async (req, res) => {
  try {
    const { bulan, tahun } = req.body;

    const santri = await pool.query(
      `SELECT s.id, ss.nominal_uang, ss.nominal_beras, ss.keterangan
       FROM santri s
       LEFT JOIN sahriyah_setting ss
         ON s.id = ss.santri_id
        AND ss.tenant_id = s.tenant_id
       WHERE s.tenant_id = $1
       ORDER BY s.id`,
      [req.tenantId]
    );

    for (const s of santri.rows) {
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
        await pool.query(
          `INSERT INTO tagihan_sahriyah (
             santri_id, bulan, tahun, nominal, nominal_beras, keterangan, tenant_id
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
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
      }
    }

    res.json({ success: true, message: "Tagihan berhasil dibuat" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/bayar/:id", async (req, res) => {
  try {
    const { nominal, beras, petugas } = req.body;

    const tagihan = await pool.query(
      `SELECT t.*, s.nama
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

    await pool.query(
      `INSERT INTO pembayaran_sahriyah (
         tagihan_id, nominal, nominal_beras, petugas, tenant_id
       )
       VALUES ($1, $2, $3, $4, $5)`,
      [req.params.id, nominal, beras, petugas, req.tenantId]
    );

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

      await notificationService.sendPushToWaliBySantriId({
        tenantId: req.tenantId,
        santriId,
        title: "Pembayaran Sahriyah Diterima",
        body,
        type: "sahriyah",
        data: {
          type: "sahriyah",
          santri_id: santriId,
          tagihan_id: tagihanId,
        },
      });
    } catch (pushErr) {
      console.log("SAHRIYAH PUSH ERROR:", pushErr.message);
    }

    res.json({
      success: true,
      total_bayar: totalBayarBaru,
      sisa_tagihan: Math.max(0, sisaTagihanBaru),
      beras_terbayar: berasTerbayarBaru,
      sisa_beras: Math.max(0, sisaBerasBaru),
      status,
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
