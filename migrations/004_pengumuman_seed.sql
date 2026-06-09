-- ============================================================
-- KlikSantri — Seed Data Pengumuman (Demo)
-- Run: psql -U postgres -d "Administrasi Santri Digital" -f migrations/004_pengumuman_seed.sql
-- ============================================================

INSERT INTO pengumuman (judul, isi, prioritas, published_at, expires_at, is_active)
VALUES

(
  'Libur Hari Raya Idul Adha 1446 H',
  'Diberitahukan kepada seluruh wali santri bahwa pesantren akan libur dalam rangka peringatan Hari Raya Idul Adha 1446 H mulai tanggal 5 Juni 2026 hingga 10 Juni 2026. Santri diperbolehkan pulang ke rumah dan wajib kembali ke pesantren pada tanggal 11 Juni 2026 paling lambat pukul 17.00 WIB. Mohon diperhatikan dengan seksama.',
  'urgent',
  NOW() - INTERVAL '2 days',
  NOW() + INTERVAL '5 days',
  true
),

(
  'Pembayaran Sahriyah Bulan Juni 2026',
  'Kami mengingatkan kepada seluruh wali santri bahwa batas akhir pembayaran sahriyah bulan Juni 2026 adalah tanggal 15 Juni 2026. Pembayaran dapat dilakukan melalui transfer ke rekening pesantren atau langsung di kantor sekretariat pada hari kerja pukul 08.00 – 15.00 WIB. Untuk informasi lebih lanjut hubungi bagian keuangan pesantren.',
  'penting',
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '10 days',
  true
),

(
  'Jadwal Ujian Tengah Semester Genap 2025/2026',
  'Ujian Tengah Semester (UTS) Genap Tahun Pelajaran 2025/2026 akan dilaksanakan mulai tanggal 16 Juni 2026 sampai dengan 21 Juni 2026. Santri diwajibkan hadir tepat waktu dan membawa kartu ujian yang sudah diterima. Jadwal lengkap per mata pelajaran dapat dilihat di papan pengumuman pesantren atau menghubungi wali kelas masing-masing.',
  'penting',
  NOW() - INTERVAL '3 days',
  NOW() + INTERVAL '15 days',
  true
),

(
  'Kegiatan Porseni Santri 2026',
  'Dalam rangka memperingati Hari Jadi Pesantren ke-20, panitia akan menyelenggarakan Pekan Olahraga dan Seni (Porseni) Santri 2026 pada tanggal 25–27 Juni 2026. Berbagai perlombaan akan diadakan antara lain futsal, voli, tilawah, seni kaligrafi, dan pidato. Pendaftaran peserta dibuka hingga tanggal 18 Juni 2026 melalui wali kelas atau OSIS.',
  'normal',
  NOW() - INTERVAL '5 days',
  NOW() + INTERVAL '20 days',
  true
),

(
  'Pengambilan Rapor Semester Genap',
  'Pengambilan rapor semester genap tahun pelajaran 2025/2026 akan dilaksanakan pada hari Sabtu, 27 Juni 2026, pukul 08.00 – 12.00 WIB. Rapor wajib diambil langsung oleh orang tua/wali santri. Santri yang tidak diambil rapornya pada tanggal tersebut dapat mengambil di sekretariat pada hari kerja berikutnya. Harap membawa bukti pembayaran lunas sahriyah.',
  'normal',
  NOW() - INTERVAL '7 days',
  NOW() + INTERVAL '25 days',
  true
)

ON CONFLICT DO NOTHING;
