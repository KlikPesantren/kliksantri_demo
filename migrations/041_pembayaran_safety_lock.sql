-- Migration 041 — P0 safety: unique tagihan pembayaran per santri/jenis/bulan/tahun
BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS pembayaran_tenant_santri_jenis_bulan_tahun_key
  ON pembayaran (tenant_id, santri_id, jenis_tagihan_id, bulan, tahun)
  WHERE jenis_tagihan_id IS NOT NULL;

COMMIT;
