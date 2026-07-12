const crypto = require("node:crypto");
const pool = require("../db");

function isSantriAktif(status) {
  const normalized = String(status ?? "aktif").trim().toLowerCase();
  return normalized === "" || normalized === "aktif" || normalized === "active";
}

exports.withdrawSaldo = async (req, res) => {
  const tenantId = Number(req.tenantId);
  const santriId = Number(req.body?.santri_id);
  const nominal = Number(req.body?.nominal);
  const keterangan = String(req.body?.keterangan || "Penarikan manual Dompet Santri").trim();

  if (!Number.isInteger(santriId) || santriId <= 0) {
    return res.status(400).json({ success: false, error: "Santri wajib dipilih" });
  }

  if (!Number.isSafeInteger(nominal) || nominal <= 0) {
    return res.status(400).json({
      success: false,
      error: "Nominal penarikan harus berupa rupiah bulat dan lebih dari 0",
    });
  }

  if (!keterangan || keterangan.length > 250) {
    return res.status(400).json({
      success: false,
      error: "Keterangan wajib diisi dan maksimal 250 karakter",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT id, nama, saldo, status
       FROM santri
       WHERE id = $1 AND tenant_id = $2
       FOR UPDATE`,
      [santriId, tenantId],
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, error: "Santri tidak ditemukan" });
    }

    const santri = rows[0];
    if (!isSantriAktif(santri.status)) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        error: "Santri nonaktif tidak dapat melakukan penarikan",
      });
    }

    const saldoAwal = Number(santri.saldo || 0);
    if (saldoAwal < nominal) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        error: "Saldo tidak cukup",
        saldo_sekarang: saldoAwal,
      });
    }

    const saldoAkhir = saldoAwal - nominal;
    const trxId = `WITHDRAWAL-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    await client.query(
      `UPDATE santri SET saldo = $1 WHERE id = $2 AND tenant_id = $3`,
      [saldoAkhir, santriId, tenantId],
    );

    await client.query(
      `INSERT INTO transaksi_rfid
       (trx_uuid, trx_id, santri_id, nominal, saldo_awal, saldo_akhir,
        trx_type, sync_status, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'withdrawal', 'synced', $7)`,
      [crypto.randomUUID(), trxId, santriId, nominal, saldoAwal, saldoAkhir, tenantId],
    );

    await client.query(
      `INSERT INTO transaksi
       (santri_id, jenis, nominal, keterangan, created_by, trx_id, tenant_id)
       VALUES ($1, 'PENARIKAN DOMPET', $2, $3, $4, $5, $6)`,
      [santriId, nominal, keterangan, req.user.id, trxId, tenantId],
    );

    await client.query(
      `INSERT INTO audit_logs (device_id, event_type, detail, tenant_id)
       VALUES ('BACKEND', 'WALLET_WITHDRAWAL', $1, $2)`,
      [`${santri.nama} | Rp ${nominal} | ${keterangan}`, tenantId],
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      data: {
        trx_id: trxId,
        santri_id: santriId,
        nominal,
        saldo_awal: saldoAwal,
        saldo_akhir: saldoAkhir,
        transaction_method: "manual",
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[wallet.withdrawSaldo]", err);
    return res.status(500).json({ success: false, error: "Penarikan saldo gagal" });
  } finally {
    client.release();
  }
};
