-- Migration 042 — Step 3 scale indexes for Pembayaran, Sahriyah, RFID list queries
BEGIN;

CREATE INDEX IF NOT EXISTS idx_pembayaran_tenant_bulan_tahun_status
  ON pembayaran (tenant_id, tahun, bulan, status);

CREATE INDEX IF NOT EXISTS idx_pembayaran_tenant_jenis_tagihan
  ON pembayaran (tenant_id, jenis_tagihan_id);

CREATE INDEX IF NOT EXISTS idx_pembayaran_tenant_santri
  ON pembayaran (tenant_id, santri_id);

CREATE INDEX IF NOT EXISTS idx_tagihan_sahriyah_tenant_bulan_tahun
  ON tagihan_sahriyah (tenant_id, tahun, bulan);

CREATE INDEX IF NOT EXISTS idx_tagihan_sahriyah_tenant_santri
  ON tagihan_sahriyah (tenant_id, santri_id);

CREATE INDEX IF NOT EXISTS idx_transaksi_rfid_tenant_santri
  ON transaksi_rfid (tenant_id, santri_id);

CREATE INDEX IF NOT EXISTS idx_transaksi_rfid_tenant_merchant
  ON transaksi_rfid (tenant_id, merchant_id);

CREATE INDEX IF NOT EXISTS idx_santri_tenant_nama
  ON santri (tenant_id, nama);

COMMIT;
