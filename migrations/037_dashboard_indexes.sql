-- ============================================================
-- KlikSantri — Step 3.3 Dashboard index optimization
-- Run: node scripts/run-migration-037.js
-- Idempotent (IF NOT EXISTS).
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_buku_kas_tenant_tanggal
ON buku_kas (tenant_id, tanggal);

CREATE INDEX IF NOT EXISTS idx_tagihan_sahriyah_tenant_status
ON tagihan_sahriyah (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_transaksi_rfid_tenant_created
ON transaksi_rfid (tenant_id, created_at);

CREATE INDEX IF NOT EXISTS idx_absensi_tenant_tanggal
ON absensi (tenant_id, tanggal);

CREATE INDEX IF NOT EXISTS idx_pelanggaran_tenant_tanggal
ON pelanggaran (tenant_id, tanggal);

-- absensi_guru is monthly aggregate (bulan/tahun), not daily tanggal
CREATE INDEX IF NOT EXISTS idx_absensi_guru_tenant_bulan_tahun
ON absensi_guru (tenant_id, tahun, bulan);
