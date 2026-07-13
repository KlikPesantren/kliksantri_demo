# Akses Peninjau Google Play — Wali Santri

Dokumen ini adalah templat. Jangan mengunggah kredensial pelanggan atau kredensial produksi ke Play Console.

## Kredensial demo yang wajib disiapkan owner

- Kode pesantren: `DEMO`
- Nomor HP wali: `[DIISI SAAT TENANT DEMO DIBUAT]`
- PIN: `[DIISI SAAT AKUN DEMO DIBUAT]`
- Masa berlaku akun: `[TANGGAL]`
- Kontak jika reviewer terkunci: `[EMAIL/TELEPON SUPPORT]`

## Checklist operasional sebelum submit

- [ ] Tenant `DEMO` aktif dan fitur Wali App tidak disuspend.
- [ ] Akun wali demo berstatus aktif.
- [ ] PIN demo sudah diuji dan tidak meminta perubahan wajib pada login pertama.
- [ ] Akun tidak terkunci oleh rate-limit/failed attempts.
- [ ] Tenant berisi minimal satu santri sintetis; dua santri disarankan untuk menguji pergantian anak.
- [ ] Pembayaran demo tersedia dan dapat dibuka tanpa transaksi uang nyata.
- [ ] Sahriyah demo tersedia dan detail tagihan dapat dibuka.
- [ ] Pengumuman demo tersedia.
- [ ] Notifikasi dapat diuji pada perangkat fisik; penolakan permission tidak memblokir fitur utama.
- [ ] Kebijakan Privasi dapat dibuka dari Profil.
- [ ] Permintaan Penghapusan Akun dapat dibuka dan URL/email production sudah dikonfigurasi.
- [ ] Login telah diuji dari fresh install dengan API production.
- [ ] Dashboard, perizinan, dan riwayat memiliki data sintetis yang dapat dibuka.
- [ ] Tidak ada nama, foto, nomor HP, NIS, transaksi, atau catatan kesehatan pelanggan nyata.
- [ ] Push notification sudah diuji pada perangkat fisik; review utama tetap dapat dilakukan bila izin notifikasi ditolak.
- [ ] Kontak support dipantau selama masa review dan kredensial tidak kedaluwarsa.
- [ ] App Access Play Console ditandai bahwa seluruh/sebagian fungsi dibatasi login, lalu instruksi di bawah ditempelkan.

Tenant harus berisi data sintetis: satu wali, minimal dua santri untuk menguji pergantian anak, pengumuman, perizinan, sahriyah/tagihan, pembayaran/riwayat yang aman untuk ditampilkan, dan satu notifikasi uji. Jangan menyalin data santri nyata.

## Langkah peninjauan

1. Buka aplikasi **Wali Santri**.
2. Masukkan kode pesantren `DEMO`, nomor HP, dan PIN demo, lalu pilih **Masuk**.
3. Dashboard terbuka dengan anak aktif. Bila tersedia lebih dari satu anak, gunakan pemilih anak dan pilih anak kedua.
4. Buka **Keuangan** untuk melihat ringkasan pembayaran/dompet dan riwayat transaksi yang tersedia.
5. Buka menu **Sahriyah**, pilih tagihan, lalu lihat detailnya. Tidak diperlukan transaksi uang nyata.
6. Buka **Monitoring > Perizinan** untuk melihat data izin.
7. Buka pengumuman dari beranda atau notifikasi.
8. Untuk notifikasi, buka layar **Notifikasi** dan izinkan notifikasi ketika diminta. Penolakan izin tidak menghalangi fitur lain.
9. Buka **Profil > Kebijakan Privasi** untuk membaca kebijakan di dalam aplikasi.
10. Buka **Profil > Keluar**, konfirmasi, dan pastikan kembali ke layar login.

## Catatan untuk reviewer

- Aplikasi tidak menyediakan pendaftaran akun mandiri. Akun wali dikelola oleh pesantren berlangganan.
- Tidak ada pembelian dalam aplikasi pada alur peninjauan ini.
- Data anak pada tenant demo harus sepenuhnya sintetis.
- Bila fitur tertentu dinonaktifkan oleh konfigurasi tenant, aktifkan fitur tersebut untuk tenant demo sebelum submit.
- Owner wajib menguji kredensial dari instalasi bersih tepat sebelum pengiriman review.

## Teks App Access Play Console

```text
Kode pesantren: DEMO
Nomor HP: [DIISI SAAT TENANT DEMO DIBUAT]
PIN: [DIISI SAAT AKUN DEMO DIBUAT]

Masukkan ketiga nilai pada layar login. Aplikasi otomatis memilih santri pertama. Untuk menguji lebih dari satu santri, gunakan pemilih anak pada dashboard. Buka layar Notifikasi jika ingin menguji permission notifikasi; permission tersebut tidak diperlukan untuk login atau membuka fitur utama. Tidak ada pembayaran nyata yang diperlukan. Jika akses bermasalah, hubungi [KONTAK SUPPORT REVIEW].
```

## Blocker

Tenant dan akun demo belum dibuat karena memerlukan tindakan backend/database yang dilarang dalam audit ini. App Access Play Console belum dapat dianggap siap sampai placeholder di atas diganti dan diuji.
