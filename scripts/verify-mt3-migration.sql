-- ============================================================
-- KlikSantri MT-3 — Production Migration Verification (READ-ONLY)
-- Jalankan di Neon/psql. JANGAN UPDATE/DELETE/INSERT.
-- ============================================================

-- ---------- 1. TENANTS ----------
SELECT '1_tenants' AS check_id, id, slug, nama, status, onboarded_at, suspended_at
FROM tenants
ORDER BY id;

SELECT '1_tenant_count' AS check_id, COUNT(*)::int AS total FROM tenants;

SELECT '1_default_tenant' AS check_id, id, slug, nama, status
FROM tenants
WHERE slug = 'default';

-- ---------- 2. SCHEMA: tenant_id columns ----------
SELECT '2_tenant_id_columns' AS check_id,
       table_name,
       column_name,
       is_nullable,
       data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'tenant_id'
ORDER BY table_name;

-- ---------- 3. ORPHAN CHECK — business tables (expect 0 NULL) ----------
-- Core master
SELECT '3_orphan_kelas' AS check_id, COUNT(*)::int AS null_count FROM kelas WHERE tenant_id IS NULL;
SELECT '3_orphan_guru' AS check_id, COUNT(*)::int AS null_count FROM guru WHERE tenant_id IS NULL;
SELECT '3_orphan_santri' AS check_id, COUNT(*)::int AS null_count FROM santri WHERE tenant_id IS NULL;
SELECT '3_orphan_wali_santri' AS check_id, COUNT(*)::int AS null_count FROM wali_santri WHERE tenant_id IS NULL;

-- Keuangan
SELECT '3_orphan_pembayaran' AS check_id, COUNT(*)::int AS null_count FROM pembayaran WHERE tenant_id IS NULL;
SELECT '3_orphan_pembayaran_detail' AS check_id, COUNT(*)::int AS null_count FROM pembayaran_detail WHERE tenant_id IS NULL;
SELECT '3_orphan_jenis_tagihan' AS check_id, COUNT(*)::int AS null_count FROM jenis_tagihan WHERE tenant_id IS NULL;
SELECT '3_orphan_tagihan_sahriyah' AS check_id, COUNT(*)::int AS null_count FROM tagihan_sahriyah WHERE tenant_id IS NULL;
SELECT '3_orphan_sahriyah_setting' AS check_id, COUNT(*)::int AS null_count FROM sahriyah_setting WHERE tenant_id IS NULL;
SELECT '3_orphan_buku_kas' AS check_id, COUNT(*)::int AS null_count FROM buku_kas WHERE tenant_id IS NULL;

-- RFID
SELECT '3_orphan_devices' AS check_id, COUNT(*)::int AS null_count FROM devices WHERE tenant_id IS NULL;
SELECT '3_orphan_merchant_rfid' AS check_id, COUNT(*)::int AS null_count FROM merchant_rfid WHERE tenant_id IS NULL;
SELECT '3_orphan_transaksi_rfid' AS check_id, COUNT(*)::int AS null_count FROM transaksi_rfid WHERE tenant_id IS NULL;
SELECT '3_orphan_transaksi' AS check_id, COUNT(*)::int AS null_count FROM transaksi WHERE tenant_id IS NULL;

-- Pendidikan & keamanan
SELECT '3_orphan_pelanggaran' AS check_id, COUNT(*)::int AS null_count FROM pelanggaran WHERE tenant_id IS NULL;
SELECT '3_orphan_perizinan' AS check_id, COUNT(*)::int AS null_count FROM perizinan WHERE tenant_id IS NULL;
SELECT '3_orphan_pengumuman' AS check_id, COUNT(*)::int AS null_count FROM pengumuman WHERE tenant_id IS NULL;

-- audit_logs (043 — nullable OK, but count NULL)
SELECT '3_audit_logs_total' AS check_id, COUNT(*)::int AS total FROM audit_logs;
SELECT '3_audit_logs_with_tenant' AS check_id, COUNT(tenant_id)::int AS with_tenant FROM audit_logs;
SELECT '3_audit_logs_null_tenant' AS check_id, COUNT(*)::int AS null_count FROM audit_logs WHERE tenant_id IS NULL;

-- ---------- 4. USERS ----------
SELECT '4_users_by_tenant' AS check_id,
       COALESCE(t.slug, '(platform/null)') AS tenant_slug,
       COUNT(*)::int AS user_count
FROM users u
LEFT JOIN tenants t ON t.id = u.tenant_id
GROUP BY t.slug
ORDER BY tenant_slug;

SELECT '4_platform_users' AS check_id, id, username, role, status, tenant_id
FROM users
WHERE tenant_id IS NULL OR role = 'platform_superadmin';

SELECT '4_tenant_with_platform_role' AS check_id, id, username, role, tenant_id
FROM users
WHERE tenant_id IS NOT NULL AND role = 'platform_superadmin';

SELECT '4_platform_user_with_tenant_id' AS check_id, id, username, role, tenant_id
FROM users
WHERE role = 'platform_superadmin' AND tenant_id IS NOT NULL;

-- ---------- 5. RBAC PLATFORM ----------
SELECT '5_platform_role' AS check_id, id, name, label FROM roles WHERE name = 'platform_superadmin';

SELECT '5_platform_permissions' AS check_id, key, label, grup
FROM permissions
WHERE grup = 'platform'
ORDER BY key;

-- ---------- 6. DATA COUNTS PER TENANT ----------
SELECT '6_santri_per_tenant' AS check_id, t.slug, COUNT(s.id)::int AS santri_count
FROM tenants t
LEFT JOIN santri s ON s.tenant_id = t.id
GROUP BY t.slug
ORDER BY t.slug;

SELECT '6_users_per_tenant' AS check_id, t.slug, COUNT(u.id)::int AS user_count
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id
GROUP BY t.slug
ORDER BY t.slug;

SELECT '6_pembayaran_per_tenant' AS check_id, t.slug, COUNT(p.id)::int AS pembayaran_count
FROM tenants t
LEFT JOIN pembayaran p ON p.tenant_id = t.id
GROUP BY t.slug
ORDER BY t.slug;

-- ---------- 7. PROFIL PESANTREN ----------
SELECT '7_profil_pesantren' AS check_id,
       pp.id,
       pp.tenant_id,
       t.slug AS tenant_slug,
       pp.nama_pesantren,
       pp.alamat,
       pp.telepon,
       pp.logo_url
FROM profil_pesantren pp
LEFT JOIN tenants t ON t.id = pp.tenant_id
ORDER BY pp.id;

-- ---------- 8. INDEX VERIFICATION (multi-tenant) ----------
SELECT '8_username_indexes' AS check_id, indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users'
  AND indexname IN ('users_tenant_username_key', 'users_platform_username_key');

SELECT '8_devices_tenant_unique' AS check_id, indexname
FROM pg_indexes
WHERE tablename = 'devices'
  AND indexname LIKE '%tenant%';

-- ---------- 9. CROSS-TENANT SANITY (expect 0) ----------
SELECT '9_pembayaran_santri_mismatch' AS check_id, COUNT(*)::int AS mismatch_count
FROM pembayaran p
JOIN santri s ON s.id = p.santri_id
WHERE p.tenant_id <> s.tenant_id;

SELECT '9_transaksi_rfid_santri_mismatch' AS check_id, COUNT(*)::int AS mismatch_count
FROM transaksi_rfid tr
JOIN santri s ON s.id = tr.santri_id
WHERE tr.tenant_id <> s.tenant_id;

-- ---------- 10. MIGRATION MARKERS (optional columns) ----------
SELECT '10_tenants_onboarding_cols' AS check_id,
       column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tenants'
  AND column_name IN ('suspended_at', 'suspended_reason', 'onboarded_at', 'created_by');

SELECT '10_audit_logs_tenant_col' AS check_id,
       column_name,
       is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'audit_logs'
  AND column_name = 'tenant_id';

SELECT '10_pembayaran_unique_index' AS check_id, indexname
FROM pg_indexes
WHERE tablename = 'pembayaran'
  AND indexname LIKE '%tenant%';
