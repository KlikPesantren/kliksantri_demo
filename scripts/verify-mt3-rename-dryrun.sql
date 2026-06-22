-- ============================================================
-- MT-3 — DRY-RUN ONLY: Rename default → anwarul-huda
-- JANGAN JALANKAN UPDATE/DELETE tanpa approval + backup.
-- Jalankan SELECT dulu; UPDATE diblokir di bawah.
-- ============================================================

-- ---------- PRE-CHECK ----------
SELECT 'precheck_current' AS step,
       id, slug, nama, status
FROM tenants
WHERE slug IN ('default', 'anwarul-huda');

SELECT 'precheck_slug_conflict' AS step, COUNT(*)::int AS existing_anwarul_huda
FROM tenants
WHERE slug = 'anwarul-huda';

SELECT 'precheck_data_on_default' AS step,
       (SELECT COUNT(*)::int FROM santri WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'default')) AS santri,
       (SELECT COUNT(*)::int FROM users WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'default')) AS users,
       (SELECT COUNT(*)::int FROM pembayaran WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'default')) AS pembayaran,
       (SELECT COUNT(*)::int FROM devices WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'default')) AS devices;

SELECT 'precheck_profil' AS step,
       pp.nama_pesantren AS profil_nama,
       t.nama AS tenant_nama,
       t.slug
FROM profil_pesantren pp
JOIN tenants t ON t.id = pp.tenant_id
WHERE t.slug = 'default';

-- ---------- SIMULASI (read-only) ----------
SELECT 'simulate_after_rename' AS step,
       id,
       'anwarul-huda' AS new_slug,
       'Pondok Pesantren Anwarul Huda' AS suggested_nama
FROM tenants
WHERE slug = 'default';

-- ---------- UPDATE BLOCKED — uncomment only after approval ----------
-- BEGIN;
-- UPDATE tenants
-- SET slug = 'anwarul-huda',
--     nama = 'Pondok Pesantren Anwarul Huda',
--     updated_at = NOW()
-- WHERE slug = 'default';
--
-- UPDATE profil_pesantren pp
-- SET nama_pesantren = 'Pondok Pesantren Anwarul Huda',
--     updated_at = NOW()
-- FROM tenants t
-- WHERE pp.tenant_id = t.id AND t.slug = 'anwarul-huda';
-- COMMIT;

-- ---------- POST-CHECK (after rename) ----------
-- SELECT id, slug, nama FROM tenants WHERE slug = 'anwarul-huda';
-- GET /public/tenants/anwarul-huda/profile
-- Login admin: tenant_slug = anwarul-huda
-- Wali app: tenant_slug = anwarul-huda (clear wali_tenant_slug cache on devices)
