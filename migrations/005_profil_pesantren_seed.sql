-- ============================================================
-- KlikSantri — Seed Data Profil Pesantren (Demo)
-- Run: psql -U postgres -d "Administrasi Santri Digital" -f migrations/005_profil_pesantren_seed.sql
-- ============================================================

INSERT INTO profil_pesantren (
  id,
  nama_pesantren,
  alamat,
  telepon,
  email,
  website,
  logo_url,
  visi,
  misi,
  updated_at
)
VALUES (
  1,
  'Pondok Pesantren Al-Ikhlas Digital',
  'Jl. Pesantren No. 12, Desa Barokah, Kecamatan Sejahtera, Kabupaten Makmur, Jawa Tengah 50123',
  '0812-3456-7890',
  'info@alikhlas.ac.id',
  'https://alikhlas.ac.id',
  NULL,
  'Menjadi lembaga pendidikan Islam terpadu yang melahirkan generasi berakhlak mulia, berwawasan luas, mandiri, dan siap menghadapi tantangan zaman dengan berlandaskan Al-Qur''an dan As-Sunnah.',
  E'1. Menyelenggarakan pendidikan Islam yang berkualitas dan terintegrasi dengan ilmu pengetahuan umum.\n2. Membentuk karakter santri yang berakhlakul karimah, jujur, disiplin, dan bertanggung jawab.\n3. Mengembangkan potensi akademik dan non-akademik setiap santri secara optimal.\n4. Membangun lingkungan pesantren yang kondusif, bersih, dan Islami.\n5. Menjalin kerjasama dengan berbagai pihak untuk meningkatkan mutu pendidikan dan kesejahteraan santri.',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  nama_pesantren = EXCLUDED.nama_pesantren,
  alamat         = EXCLUDED.alamat,
  telepon        = EXCLUDED.telepon,
  email          = EXCLUDED.email,
  website        = EXCLUDED.website,
  logo_url       = EXCLUDED.logo_url,
  visi           = EXCLUDED.visi,
  misi           = EXCLUDED.misi,
  updated_at     = NOW();
