-- =============================================================
-- PHASE 6: pimpinan_yayasan — read-only lintas unit
-- Additive / idempotent — whitelist view permissions only
-- =============================================================

BEGIN;

-- Hapus permission di luar whitelist (termasuk kas_instansi.export, *.manage, dll)
DELETE FROM role_permissions rp
USING roles r, permissions p
WHERE rp.role_id = r.id
  AND rp.permission_id = p.id
  AND r.name = 'pimpinan_yayasan'
  AND p.key NOT IN (
    'dashboard.view',
    'santri.view',
    'wali.view',
    'guru.view',
    'kelas.view',
    'absensi.view',
    'hafalan.view',
    'nilai.view',
    'pelanggaran.view',
    'perizinan.view',
    'pembayaran.view',
    'bukukas.view',
    'kas_instansi.view',
    'kas_instansi.konsolidasi',
    'program_unit.view'
  );

-- Grant whitelist view permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.key IN (
  'dashboard.view',
  'santri.view',
  'wali.view',
  'guru.view',
  'kelas.view',
  'absensi.view',
  'hafalan.view',
  'nilai.view',
  'pelanggaran.view',
  'perizinan.view',
  'pembayaran.view',
  'bukukas.view',
  'kas_instansi.view',
  'kas_instansi.konsolidasi',
  'program_unit.view'
)
WHERE r.name = 'pimpinan_yayasan'
ON CONFLICT DO NOTHING;

COMMIT;

-- Verifikasi: tidak boleh ada permission manage/create/update/delete
DO $$
DECLARE
  bad_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bad_count
  FROM role_permissions rp
  JOIN roles r ON r.id = rp.role_id
  JOIN permissions p ON p.id = rp.permission_id
  WHERE r.name = 'pimpinan_yayasan'
    AND (
      p.key LIKE '%.manage'
      OR p.key LIKE '%.create'
      OR p.key LIKE '%.update'
      OR p.key LIKE '%.delete'
      OR p.key IN ('role.manage', 'user.manage', 'rfid.manage')
    );

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'pimpinan_yayasan masih memiliki % permission write/manage', bad_count;
  END IF;
END $$;
