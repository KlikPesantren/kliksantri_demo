# Release Readiness — Wali Santri

## Keputusan

**BELUM SIAP GOOGLE PLAY.** Seluruh P0/P1 yang aman diselesaikan di repository telah ditangani, tetapi masih ada blocker eksternal yang tidak boleh diasumsikan selesai.

Identitas source Android dan iOS telah dimigrasikan ke **`com.klikpesantren.wali`** setelah owner mengonfirmasi Google Play belum pernah dipakai dan menyediakan Firebase Android app baru. Scheme tetap `klikpesantren-wali`. Slug lama `kliksantri-wali` sengaja belum diubah karena repository sudah tertaut ke EAS Project ID dan `expo.owner` belum ditetapkan eksplisit.

## P0 eksternal

1. Rotasi/cabut Firebase Admin service-account key yang sempat berada di workspace dan audit penggunaannya. File lokal sudah dihapus serta pola ignore sudah ditambahkan, tetapi rotasi remote tidak dapat dilakukan dari repository.
2. Publikasikan kebijakan privasi pada URL HTTPS publik dan isi URL tersebut di aplikasi/listing sebelum submit.

## P1 eksternal

1. Periksa Play Console untuk memastikan riwayat publikasi package lama; keputusan package tidak dapat dibuktikan dari URL publik saja.
2. Package/bundle identifier dan Firebase client final sudah dikonfigurasi. Owner masih harus memverifikasi bahwa EAS Project ID, organisasi/owner, Android signing credential, OAuth, dan FCM V1 memang ditujukan untuk package final sebelum build internal.
3. Verifikasi Android signing key, EAS credentials, dan aktifkan Play App Signing.
4. Buat tenant dan akun reviewer dengan data sintetis, kemudian uji dari instalasi bersih.
5. Publikasikan proses permintaan penonaktifan/penghapusan akun wali dan data kontak. Jelaskan bahwa penghapusan akses wali tidak otomatis menghapus arsip santri milik pesantren; verifikasi retensi dan enkripsi at rest backend.
6. Deploy hardening JWT yang sudah diterapkan, pertahankan kompatibilitas token lama maksimal satu masa expiry, lalu set `WALI_JWT_ALLOW_LEGACY_NO_AUD=false`.
7. Siapkan store assets, website, email dukungan, listing, Data Safety, content rating, dan App Access final. Notification icon saat ini invalid untuk spesifikasi Expo dan harus dibuat terpisah.
8. Validasi push/FCM, upgrade SecureStore, dan seluruh flow kritis pada perangkat fisik/build internal.
9. Terapkan migration 056 lalu aktifkan `WALI_TOKEN_VERSION_ENABLED=true` sesuai urutan deployment. Sebelum flag aktif, revocation lintas perangkat belum berlaku.
10. Selesaikan baseline lint frontend atau tetapkan gate CI yang terukur sebelum privacy website dideploy. File privacy yang diubah lulus ESLint terarah, tetapi lint seluruh frontend masih gagal pada 115 error/6 warning yang sudah ada di area lain.

## Token version deployment order

Migration `migrations/056_wali_token_version.sql` telah dibuat tetapi **belum dijalankan**. Kode menggunakan `WALI_TOKEN_VERSION_ENABLED=false` sebagai default sehingga deployment kode tidak membaca kolom yang belum ada.

Urutan aman:

1. Deploy backend baru dengan `WALI_TOKEN_VERSION_ENABLED=false`. Pastikan login, `/me`, dan ganti PIN tetap bekerja dengan schema lama.
2. Jalankan migration 056 melalui prosedur change management terpisah, lalu verifikasi kolom `wali_akun.token_version` bernilai `0` dan constraint nonnegative tersedia.
3. Set `WALI_TOKEN_VERSION_ENABLED=true`, restart backend terkontrol, kemudian lakukan smoke test login dan ganti PIN.
4. Token lama tanpa claim `token_version` diperlakukan sebagai versi `0`, sehingga tetap valid selama database masih `0`.
5. Saat PIN berubah, database menaikkan versi dan backend mengembalikan JWT baru; mobile menyimpannya ke SecureStore. Semua token lama versi 0 langsung ditolak.
6. Suspend/delete akun tetap diperiksa sebelum akses, dan tenant serta ownership santri tetap dimuat dari database.
7. Jangan rollback migration setelah flag aktif dan PIN telah berubah. Rollback aplikasi harus tetap mempertahankan kolom atau terlebih dahulu menonaktifkan flag dengan analisis risiko revocation.

Status repository: **IMPLEMENTED, NOT ACTIVATED**. Aktivasi memerlukan migration dan deployment yang dilarang dalam audit ini.

## Repository release gates

- Notification icon gate sengaja gagal karena config masih menunjuk asset 1024×1024 hitam. Jangan build production sampai tersedia PNG 96×96 putih dengan background transparan dan `app.json` diperbarui.
- Deletion request screen tersedia, tetapi salah satu `EXPO_PUBLIC_ACCOUNT_DELETION_URL` (HTTPS) atau `EXPO_PUBLIC_SUPPORT_EMAIL` harus diisi sebelum production.
- Route production `https://klikpesantren.com/privacy-policy` publik, redirect ke HTTPS `www`, dan merespons 200/HSTS. Source sudah diperluas, tetapi perubahan ini belum dideploy dan identitas/alamat/kontak final masih perlu dikonfirmasi.

## P2

1. Optimalkan hero JPEG besar dan ukur dampaknya pada startup/memori.
2. Lengkapi visual QA untuk font besar, layar kecil, kontras, TalkBack, dan touch target.
3. Putuskan apakah dark mode akan didukung; konfigurasi saat ini light-only.
4. Perluas matriks tablet/rotasi bila kelak ingin mendukung form factor tersebut.
5. Pantau advisori `uuid` transitif pada tool konfigurasi Expo dan upgrade saat Expo/xcode mendukung versi patched.

## Dependency audit

| Package | Jalur | Advisory | Versi awal | Tindakan/reachability |
|---|---|---|---|---|
| `form-data` | `axios@1.17.0` → `form-data` | GHSA-hmw2-7cc7-3qxx / CVE-2026-12143 | 4.0.5 | Di-upgrade aman ke 4.0.6 melalui override. Source mobile tidak membuat multipart/FormData; adapter React Native memakai implementasi platform, tetapi package transitif tetap dipatch. |
| `uuid` | `expo-splash-screen` → `@expo/config-plugins` → `xcode@3.0.1` → `uuid` | GHSA-w5hq-g745-h8pq / CVE-2026-41907 | 7.0.3 | Node/config-plugin toolchain iOS; tidak diimpor source dan tidak dibundel ke APK Android. Patch resmi mulai 11.1.1 dan tidak kompatibel dengan rentang `xcode@3.0.1` (`^7.0.3`) tanpa upgrade major/upstream. |

Setelah patch, `npm audit` dan `npm audit --omit=dev` sama-sama melaporkan 29 moderate. Angka 29 adalah propagasi satu advisory `uuid` melalui banyak node dependency Expo, bukan 29 CVE yang berbeda. Tidak ada high/critical. `npm audit fix --force` tidak dijalankan.

## JWT backend

- Token baru: HS256, issuer `kliksantri-wali`, audience `klikpesantren-wali-app`, expiry terverifikasi, dan `typ=wali` wajib.
- Token dengan algoritma, issuer, audience, atau type salah ditolak oleh static test.
- Token lama yang memiliki issuer/type tetapi belum memiliki audience diterima sementara untuk backward compatibility apabila `WALI_JWT_ALLOW_LEGACY_NO_AUD=true`.
- Setelah maksimum masa token lama (`WALI_JWT_EXPIRES`, default 30 hari) sejak deployment hardening, owner wajib mengubah flag menjadi `false`. Selama flag masih true, audience enforcement belum dianggap selesai penuh.

## Package migration map (belum diterapkan)

| Area/file | Perubahan setelah konfirmasi Play Console |
|---|---|
| `app.json` | Android package dan iOS bundle identifier sudah `com.klikpesantren.wali`. Slug `kliksantri-wali` dipertahankan sampai owner memverifikasi project EAS; scheme `klikpesantren-wali` tetap final. |
| `google-services.json` | Ganti dengan Firebase client config yang memuat package final. Project Firebase lama boleh dipakai hanya jika owner membuat Android app baru di project tersebut dan memverifikasi FCM/OAuth. |
| `app.json > extra.eas.projectId` | Verifikasi apakah EAS project lama akan dipertahankan. Jika membuat EAS project final baru, update project ID dan lakukan relink. |
| `eas.json` | Tidak memiliki literal package lama; profile tetap, tetapi credential/signing/FCM production harus diverifikasi terhadap project/package final. |
| `services/waliAppService.js` | Issuer JWT lama bukan applicationId. Perubahan issuer tidak wajib untuk package migration dan akan memerlukan transisi token terpisah; jangan ubah bersamaan tanpa rencana kompatibilitas. |
| `assets/WHITE_LABEL.md` dan dokumen audit | Perbarui referensi bundle/package lama setelah migrasi selesai. |
| Generated export folders | Tidak ada native `android/`. Export lama di `dist`/`.expo-*` harus dianggap artefak stale dan dibuat ulang oleh pipeline nanti; tidak dipakai sebagai source migrasi. |
| Deep link/notification/tests/env | Tidak ada literal package lama pada source, test, env, atau notification channel. Deep-link scheme sudah final. Push tetap harus diregistrasi ulang melalui Firebase/EAS build final. |

Referensi branding `KlikSantri` di frontend admin, migrasi SQL, backup, dan perangkat RFID adalah scope produk lama/historis terpisah; tidak semuanya harus diganti untuk applicationId Wali Santri. Package migration tidak boleh dilakukan sampai owner mengonfirmasi riwayat Play Console.

## Build readiness tanpa membuat binary

- Profile production: AAB, channel/environment `production`, `autoIncrement: true`.
- API production: HTTPS `https://api.klikpesantren.com`.
- Expo Updates OTA: dinonaktifkan sehingga preview channel tidak masuk production.
- Target/compile SDK: 36 melalui `expo-build-properties`.
- Package Android/iOS saat ini: `com.klikpesantren.wali`; `google-services.json` memiliki tepat satu client yang cocok, sekaligus masih memuat client Firebase lama.
- EAS Project ID lokal: `3ee670bd-7850-40eb-9799-1609db9a3341`; kepemilikan dan kecocokan project remote belum terverifikasi.
- `expo.owner` tidak ditetapkan eksplisit; owner harus dikonfirmasi di dashboard/CLI EAS sebelum build internal.
- Version name/code: `1.0.0` / `3` sebelum auto-increment.
- Signing/Play App Signing: belum dapat diverifikasi dari repository.

## Command setelah seluruh blocker ditutup

Jalankan hanya setelah package/Firebase/signing/reviewer/privacy siap:

```powershell
cd "C:\Users\hi\Documents\0Aiki\Administrasi Santri Digital\wali-app"
npx expo-doctor
npx eas-cli build --platform android --profile production
```

Command build di atas sengaja tidak dijalankan dalam audit ini.

## Final classification

- Repository-level P0 yang dapat ditangani: **0 tersisa**.
- P0 manual/external: **2** (rotation credential dan privacy URL final sebelum submit).
- P1 manual/external/integration/repository gate: **10** sesuai daftar di atas, termasuk package/Firebase/signing, reviewer demo, deletion process, JWT legacy rollout, token revocation, store assets, device QA, dan baseline lint frontend.
- P2: **5**.

Status tetap **BELUM SIAP GOOGLE PLAY** dan belum boleh diklaim ready for production build.
