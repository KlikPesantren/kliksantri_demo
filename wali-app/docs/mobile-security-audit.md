# Audit Keamanan Mobile Wali Santri

Tanggal audit: 13 Juli 2026
Scope: `wali-app`, konfigurasi Expo/EAS/Firebase client, serta endpoint backend `wali-app` yang diperlukan untuk membuktikan autentikasi dan isolasi tenant.

## Ringkasan

- P0 repository-level setelah perbaikan: 0.
- Token sesi dan push dipindahkan ke Expo SecureStore dengan migrasi token lama.
- Production hanya menerima API HTTPS dan Android cleartext dinonaktifkan.
- Backend memuat ulang tenant dan kepemilikan santri pada setiap request; `X-Santri-Id` bukan sumber kebenaran tunggal.
- Status release tetap **BELUM SIAP GOOGLE PLAY** karena blocker eksternal di bagian akhir.

## Temuan dan status

| Severity | File/area | Risiko dan dampak | Solusi | Status |
|---|---|---|---|---|
| P0 | `kliksantri-*-firebase-adminsdk-*.json` | Private key Firebase Admin berada di folder mobile dan dapat memberi akses administratif jika tersebar. | File dihapus, pola service account ditambahkan ke `.gitignore`; key wajib dirotasi manual. | Repo FIXED; rotasi BLOCKED eksternal |
| P1 | `src/utils/storage.js` | Token dan data wali/santri berada di AsyncStorage plaintext. | Token dimigrasikan ke SecureStore; cache session PII lama dihapus. | FIXED |
| P1 | `src/api/auth.api.js`, `src/api/client.js` | Payload login (nomor HP/PIN), respons, URL, dan error mentah dicatat. | Log sensitif dihapus; log dev tersisa hanya code/status. | FIXED |
| P1 | `src/screens/auth/LoginScreen.jsx` | Error membeberkan URL/IP dan pesan backend; double tap dan akun tanpa santri tidak aman. | Pesan aman, guard sinkron, PIN dibersihkan setelah gagal, respons divalidasi sebelum session disimpan. | FIXED |
| P1 | `app.json` | Cleartext berada pada field schema tidak valid dan permission overlay/storage ikut tergabung. | `expo-build-properties` menetapkan cleartext false; permission diblokir. | FIXED |
| P1 | `eas.json` | Profile production menghasilkan APK internal. | Production menghasilkan `app-bundle`, store distribution, environment/channel production, auto increment. | FIXED |
| P1 | `src/services/pushNotificationService.js` | Token push disimpan plaintext, dicatat, dan permission diminta saat startup. | Token ke SecureStore, log dihapus, prompt dipindah ke layar Notifikasi, channel diberi nama produk. | FIXED |
| P1 | `src/screens/profil/ProfilHubScreen.jsx` | Kode diagnostik/test push berada di source aktif. | UI dan API test/status dihapus dari aplikasi. | FIXED |
| P1 | `src/context/ActiveChildContext.jsx`, hook data | Request dapat memakai ID anak lama atau respons lama menimpa data anak baru. | Storage diubah sebelum state; request sequence guard ditambahkan. | FIXED |
| P1 | `src/context/AuthContext.jsx` | Gangguan jaringan saat restore menghapus session dan memaksa login ulang. | Token dipertahankan dan pengguna mendapat layar retry. | FIXED |
| P1 | backend `middleware/waliAppAuthMiddleware.js`, `waliSantriGuard.js` | Potensi data lintas tenant/santri. | Audit membuktikan tenant ID dan ownership divalidasi ulang dari DB. | VERIFIED STATIC |
| P1 | backend `services/waliAppService.js` | JWT sebelumnya tidak membatasi algoritma, issuer, atau audience pada verifier. | Token baru memakai HS256/issuer/audience eksplisit; verifier menolak nilai salah. Legacy tanpa audience diterima sementara melalui flag migrasi. | FIXED code; rollout/disable legacy BLOCKED eksternal |
| P1 | backend/mobile PIN flow | Akun provisioning memakai PIN awal dan `must_change_pin`, tetapi akses fitur sebelumnya tidak dipaksa mengganti PIN. | Middleware membatasi akun tersebut ke `/me` dan `/pin`; mobile menampilkan stack ganti PIN wajib sebelum dashboard. | FIXED static; integration test required |
| P1 | token revocation | Mengganti PIN sebelumnya tidak mencabut JWT lain yang sudah diterbitkan. | Migration 056 menambah `token_version`; kode gated membandingkan versi dan mengeluarkan token baru setelah PIN berubah. | IMPLEMENTED, NOT ACTIVATED; migration/deploy manual |
| P2 | `assets/pesantren-hero.jpeg` | Aset fallback 2,18 MB menambah ukuran dan memory decode. | Kompres/resize sesuai ukuran render. | OPEN |
| P2 | seluruh UI | Label aksesibilitas dan target sentuh belum diaudit pada perangkat dengan TalkBack/font maksimum. | Uji manual dan perbaiki komponen yang gagal. | OPEN |

## Secret inventory

- `.env`/`.env.development`: hanya URL API publik; diabaikan Git.
- `google-services.json`: Firebase client config, tracked, memiliki client Android final `com.klikpesantren.wali`; bukan Firebase Admin secret. File juga masih memuat client Firebase lama dan tidak boleh dianggap sebagai credential admin.
- Firebase Admin service-account: ditemukan untracked, memiliki private key, sudah dihapus tanpa menampilkan nilainya.
- Keystore/JKS/signing credential: tidak ditemukan di repository.
- Scan working tree, tracked filenames, dan histori nama/pencarian `private_key_id` tidak menemukan Firebase Admin/service-account/keystore yang ter-commit. `google-services.json` hanya konfigurasi Firebase client.

## Blocker eksternal

1. Rotasi/revoke private key Firebase Admin yang pernah berada di workspace.
2. Owner telah mengonfirmasi Play Console belum pernah dipakai; package Android/iOS dikonfigurasi ke `com.klikpesantren.wali`.
3. Firebase Android app final dan `google-services.json` baru sudah tersedia. Berikutnya verifikasi project/owner EAS, OAuth/FCM, signing, lalu QA push pada build internal yang dibuat melalui proses owner.
4. Verifikasi enkripsi at rest, retensi, penghapusan akun/data, dan kebijakan backup di backend/infrastruktur.
5. Deploy hardening JWT, tunggu maksimum expiry token lama, lalu set `WALI_JWT_ALLOW_LEGACY_NO_AUD=false` agar semua token wajib memiliki audience.
