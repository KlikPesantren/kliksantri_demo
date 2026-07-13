# Draft Listing Google Play — Wali Santri

## Metadata

- Judul: **Wali Santri**
- Kategori yang disarankan: **Pendidikan**
- Tag yang disarankan: pendidikan, orang tua, sekolah/pesantren
- Iklan: **Tidak**, berdasarkan source saat audit; konfirmasi ulang di Play Console.

### Deskripsi singkat

Pantau kegiatan, informasi, dan administrasi santri dalam satu aplikasi.

### Deskripsi lengkap

Wali Santri adalah aplikasi pendamping layanan KlikPesantren untuk orang tua dan wali santri. Aplikasi membantu wali mengakses informasi santri yang terhubung dengan pesantren secara praktis dan aman.

Fitur yang tersedia bergantung pada layanan yang diaktifkan oleh masing-masing pesantren, antara lain:

- ringkasan aktivitas dan informasi santri;
- pemantauan absensi, perizinan, pelanggaran, nilai, hafalan, dan kesehatan;
- pengumuman dari pesantren;
- informasi sahriyah, tagihan, pembayaran, saldo, dan riwayat transaksi;
- pergantian profil anak untuk wali dengan lebih dari satu santri;
- notifikasi informasi penting dari pesantren.

Akun dibuat dan dikelola oleh pesantren. Hubungi pihak pesantren apabila Anda belum memiliki akses atau perlu memperbarui data akun.

## Kontak wajib diisi

- Website: `[URL HTTPS RESMI KLIKPESANTREN]`
- Email dukungan: `[EMAIL SUPPORT AKTIF]`
- URL kebijakan privasi: `[URL HTTPS PUBLIK KE docs/privacy-policy-id.md]`

## Rencana screenshot

Gunakan data demo sintetis dan samarkan semua identitas nyata. Siapkan sedikitnya: login, dashboard, pemilih anak, pengumuman, monitoring, sahriyah/pembayaran, notifikasi, dan profil. Ambil dari phone form factor yang disetujui Play; tablet tidak diklaim karena dukungan tablet belum divalidasi.

## Brief feature graphic

Ukuran 1024×500 px. Tampilkan logo final KlikPesantren/Wali Santri, ilustrasi komunikasi wali–pesantren, warna brand aktual, dan satu pesan singkat. Hindari screenshot data, klaim “paling aman”, badge Play, harga, atau promosi yang cepat kedaluwarsa.

## Catatan rilis 1.0.0

Rilis perdana Wali Santri menghadirkan akses terpusat ke informasi santri, pengumuman, monitoring, administrasi, dan notifikasi pesantren.

## Asset yang belum siap

- Ikon listing Play 512×512 yang diekspor dan diperiksa manual.
- Feature graphic 1024×500.
- Screenshot phone dari build final.
- Verifikasi visual adaptive icon, monochrome icon, dan notification icon pada perangkat nyata.
- Website, email dukungan, serta URL kebijakan privasi publik.
- Form content rating, Data Safety, App Access, dan deklarasi final di Play Console.

## Inventaris source asset aktual (13 Juli 2026)

| Asset | File/dimensi/ukuran | Status | Catatan |
|---|---|---|---|
| App icon source | `icon.png`, 1024×1024, 77.302 byte | NEEDS MANUAL CREATION | Source persegi tersedia, tetapi Play memerlukan ekspor 512×512 dan review visual final. |
| Adaptive foreground | `android-icon-foreground.png`, 1024×1024, 99.826 byte | PASS CONFIG | Transparan; perlu safe-zone/device visual test. |
| Adaptive background | `android-icon-background.png`, 1024×1024, 6.403 byte | PASS CONFIG | Satu warna penuh. |
| Adaptive monochrome | `android-icon-monochrome.png`, 1024×1024, 9.024 byte | PASS CONFIG | Satu warna + alpha, cocok sebagai mask adaptive; perlu Android themed-icon test. |
| Notification icon | memakai `android-icon-monochrome.png`, 1024×1024, piksel isi hitam | INVALID / TEST BLOCKED | File final wajib 96×96 PNG, ikon putih, background transparan, dan bukan app icon penuh warna. Static test sengaja gagal sampai path diarahkan ke asset valid. |
| Splash source | `splash-icon.png`, 1024×1024, 77.302 byte | PASS CONFIG | Terpasang melalui plugin, tetapi visual startup belum diuji pada perangkat. |
| Feature graphic | tidak ditemukan | MISSING | Harus dibuat manual 1024×500. |
| Phone screenshot | tidak ditemukan | MISSING | Ambil dari build final dengan data demo sintetis. |
| Tablet screenshot | tidak ditemukan | NOT REQUIRED YET | `supportsTablet=false`; jangan klaim dukungan tablet sebelum QA. |
| Hero non-store | `pesantren-hero.jpeg`, 4080×1836, 2.178.298 byte | P2 OPTIMIZATION | Resize/compress sesuai ukuran render. |
