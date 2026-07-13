# Matriks QA Rilis Mobile

Status ini konservatif. **PASS** hanya digunakan bila perilaku dapat dibuktikan oleh static test/source. **NOT TESTED** berarti implementasi tersedia tetapi belum diuji pada binary/perangkat. **BLOCKED** berarti membutuhkan akun, backend, Play/Firebase, atau binary yang tidak tersedia. Tidak ada APK/AAB yang dibuat dalam audit ini.

| # | Skenario | Expected behavior | Status | Evidence / file terkait | Perbaikan bila gagal |
|---:|---|---|---|---|---|
| 1 | Install baru | Login tampil tanpa crash atau data lama | NOT TESTED | Config valid; perlu binary/perangkat | Uji clean install pada matriks perangkat |
| 2 | Upgrade versi lama | Token AsyncStorage dimigrasi sekali ke SecureStore | NOT TESTED | `src/utils/storage.js` | Uji upgrade dari versi Play terakhir |
| 3 | Login valid | Session valid dan dashboard anak terbuka | BLOCKED | `AuthContext.jsx`, perlu tenant demo | Siapkan dan uji akun demo |
| 4 | Login salah | PIN dibersihkan; pesan aman tampil | NOT TESTED | `LoginScreen.jsx`, `apiError.js` | Uji respons 401 aktual |
| 5 | Login double tap | Hanya satu request berjalan | PASS | Guard sinkron `submittingRef` di `LoginScreen.jsx` | Pertahankan regression test UI |
| 6 | Logout | Token, push token, tenant, cache PII, dan anak aktif bersih | PASS | `storage.js`, `AuthContext.jsx`, `ActiveChildContext.jsx` | Tambah test integrasi perangkat |
| 7 | Auto login | Session dipulihkan tanpa meminta login ulang | NOT TESTED | `AuthContext.jsx`, `AppNavigator.jsx` | Uji cold start dengan token valid |
| 8 | Session expired | 401 menghapus session dan kembali ke login | NOT TESTED | Interceptor `api/client.js` | Uji token kedaluwarsa aktual |
| 9 | Token invalid | Session dibersihkan tanpa menampilkan detail token | NOT TESTED | `api/client.js`, `apiError.js` | Uji JWT rusak |
| 10 | Account suspended | Login/session ditolak dengan pesan aman | BLOCKED | Bergantung respons backend | Sediakan fixture akun suspended |
| 11 | Tenant tidak ditemukan | Pesan login aman dan tetap di layar login | BLOCKED | Bergantung respons backend | Uji kode tenant invalid |
| 12 | Tenant suspended | Akses ditolak dan data tidak ditampilkan | BLOCKED | Middleware backend ditemukan saat audit | Sediakan fixture tenant suspended |
| 13 | Satu wali satu santri | Anak pertama otomatis aktif | NOT TESTED | `ActiveChildContext.jsx` | Uji dengan tenant demo |
| 14 | Satu wali banyak santri | Semua anak tersedia, pilihan tersimpan | NOT TESTED | `ActiveChildContext.jsx` | Uji minimal dua anak sintetis |
| 15 | Ganti santri | Data lama tidak menimpa anak baru | NOT TESTED | Guard stale response pada hooks utama | Uji pergantian cepat saat jaringan lambat |
| 16 | Tidak ada santri | Login gagal aman, bukan layar kosong/crash | PASS | `NO_CHILDREN` di `AuthContext.jsx`/`LoginScreen.jsx` | Pertahankan static test/error mapping |
| 17 | Dashboard | Loading/error/retry/data tampil sesuai state | BLOCKED | `useDashboard.js`, perlu API demo | Uji payload lengkap/kosong |
| 18 | Pembayaran | Ringkasan aman dan tidak bocor antar anak | BLOCKED | Perlu API demo | Uji seluruh state tagihan |
| 19 | Sahriyah | Daftar/detail dan error aman | BLOCKED | `useSahriyah*.js`, perlu API demo | Uji empty/error/pagination |
| 20 | Perizinan | Daftar/refresh dan error aman | BLOCKED | `usePerizinan.js`, perlu API demo | Uji status izin berbeda |
| 21 | Pengumuman | Daftar/detail menangani data kosong/rusak | BLOCKED | `usePengumuman.js`, perlu API demo | Uji payload media dan tanpa media |
| 22 | Dompet | Saldo tidak crash pada nilai null/invalid | BLOCKED | Perlu API demo | Tambah fixture variasi saldo |
| 23 | Riwayat transaksi | Daftar panjang/pagination stabil | BLOCKED | Perlu API demo | Uji data banyak dan kosong |
| 24 | Push notification | Token terdaftar dan navigasi payload valid bekerja | BLOCKED | `pushNotificationService.js`; perlu build/Firebase | Uji perangkat fisik dan FCM produksi |
| 25 | Izin notifikasi ditolak | Aplikasi tetap usable dan status aman tersimpan | NOT TESTED | Prompt kontekstual `NotificationsScreen.jsx` | Uji denial dan settings |
| 26 | Offline sebelum login | Pesan jaringan tampil, session tidak dibuat | NOT TESTED | `apiError.js`, timeout client | Uji airplane mode |
| 27 | Offline setelah login | Error/retry tampil, token tidak dihapus | PASS | Restore membedakan network vs 401 di `AuthContext.jsx` | Tambah test integrasi |
| 28 | Kembali online | Retry/refresh memuat ulang data | NOT TESTED | Retry tersedia pada state utama | Uji reconnect perangkat |
| 29 | Server mati | Tidak ada raw Axios/server detail di UI | PASS | Mapper terpusat `apiError.js` | Pertahankan pencarian regresi |
| 30 | API timeout | Pesan aman dan retry tersedia | NOT TESTED | Timeout client dan mapper | Uji latency proxy/mock |
| 31 | API 401 | Logout/invalidation hanya sekali | PASS | Guard `sessionInvalidationInFlight` di `api/client.js` | Tambah test interceptor |
| 32 | API 403 | Akses ditolak dengan pesan aman | NOT TESTED | `apiError.js` | Uji backend fixture |
| 33 | API 404 | Pesan data tidak ditemukan | NOT TESTED | `apiError.js` | Uji endpoint fixture |
| 34 | API 429 | Pesan coba lagi, tidak retry storm | NOT TESTED | Tidak ada auto-retry tak terbatas | Uji rate limit backend |
| 35 | API 500 | Pesan umum aman dan UI tidak crash | PASS | `apiError.js`; raw response tidak dirender | Tambah fixture komponen |
| 36 | Android back | Navigasi kembali sesuai stack/predictive back | NOT TESTED | `predictiveBackGestureEnabled` di config | Uji Android 7, 13, 15/16 |
| 37 | Keyboard terbuka | Form login/PIN tetap dapat digunakan | NOT TESTED | Form memiliki keyboard handling | Uji layar kecil dan IME berbeda |
| 38 | Masuk background | Tidak bocor screenshot di login/ganti PIN | NOT TESTED | `usePreventScreenCapture` pada layar sensitif | Verifikasi recent-app thumbnail perangkat |
| 39 | Kembali foreground | Listener tidak ganda; state tetap konsisten | NOT TESTED | Cleanup listener notifikasi | Uji siklus background berulang |
| 40 | Cold start dari notifikasi | Payload valid memilih anak dan membuka tujuan | BLOCKED | `notificationNavigationService.js`; perlu build/push | Uji terminated-state di perangkat |
| 41 | Deep link invalid | Payload/route invalid diabaikan aman | NOT TESTED | Validasi route/payload service | Fuzz payload dan URI |
| 42 | Font besar | Konten utama tetap terbaca/tidak terpotong | NOT TESTED | Belum ada device visual test | Uji font scale 1.3–2.0 |
| 43 | Layar kecil | Login, tab, dan modal tidak terpotong | NOT TESTED | Belum ada device visual test | Uji lebar 320–360 dp |
| 44 | Dark mode | UI konsisten | NOT TESTED | App saat ini dikunci light mode | Putuskan dukungan dark mode atau dokumentasikan light-only |
| 45 | Rotasi perangkat | Portrait tetap stabil | NOT TESTED | Orientation dikunci portrait | Uji bahwa aktivitas tidak restart bermasalah |

## Exit criteria sebelum submit

Semua status BLOCKED yang menyentuh login, dashboard, pembayaran, push, dan reviewer access wajib diuji dengan tenant demo serta build internal yang memakai konfigurasi production. Skenario perangkat kritis harus mencakup matrix Android 10, 12, 13, 14, 15, dan Android 16 bila tersedia sebelum promosi ke production.

## Pemisahan lapisan pengujian

### Static PASS

Static PASS hanya membuktikan lint/config/source/test, bukan perilaku binary:

- HTTPS production, AAB profile, cleartext disabled, dan permission block.
- SecureStore untuk token dan cleanup logout.
- Double-submit login guard serta safe error mapper.
- JWT algorithm/issuer/audience/type validation.
- Desain `token_version` berada di balik deployment flag dan migration belum dijalankan.
- Mandatory PIN-change route/UI tersedia.
- Package/Firebase/config aktif konsisten menurut script read-only.

Notification icon **bukan PASS**: static gate harus gagal sampai asset 96×96 putih/transparan tersedia.

### Emulator test

Status saat audit: **NOT TESTED**. Emulator boleh dipakai untuk layout, lifecycle dasar, offline/online, timeout mock, keyboard, back, font scale, TalkBack awal, dan API error fixtures. Emulator tidak cukup untuk membuktikan push vendor/device, OEM background restriction, atau Play signing.

### Physical device test

Status saat audit: **NOT TESTED**. Wajib untuk notification permission, push foreground/background/killed, recent-app/screen-capture behavior, low-memory restart, biometrik/keystore behavior perangkat, gesture navigation, dan variasi OEM.

### Play internal testing

Status saat audit: **BLOCKED** oleh package/Firebase/signing/privacy/reviewer/assets dan larangan build. Wajib membuktikan install dari Play, Play App Signing, AAB delivery, upgrade path untuk package yang sama, FCM credential final, serta App Access reviewer.

## Minimum Android device matrix

| Versi | Emulator | Perangkat fisik | Fokus minimum | Status |
|---|---|---|---|---|
| Android 10 | Disarankan | Minimal satu perangkat bila user base masih signifikan | fresh install, splash, keyboard, back, offline/online | NOT TESTED |
| Android 12 | Disarankan | Disarankan | splash API baru, background/foreground, killed restart | NOT TESTED |
| Android 13 | Wajib | Wajib | POST_NOTIFICATIONS grant/deny, foreground/background push | NOT TESTED |
| Android 14 | Wajib | Wajib | gesture navigation, background restrictions, low-memory restart | NOT TESTED |
| Android 15 | Wajib | Wajib | target SDK behavior, edge/system navigation, notification | NOT TESTED |
| Android 16 jika tersedia | Wajib | Disarankan sebelum rollout luas | compatibility regression dan predictive back | NOT TESTED |

## Physical QA execution checklist

| Area | Skenario | Lapisan minimum | Status |
|---|---|---|---|
| Instalasi | Fresh install tanpa storage lama | Emulator + physical + Play internal | NOT TESTED |
| Upgrade | Upgrade dari versionCode yang benar pada package sama | Play internal | BLOCKED |
| Startup | Splash, cold start, warm start, low-memory process recreation | Emulator + physical | NOT TESTED |
| Input | Keyboard terbuka, layar kecil, PIN tersembunyi, double tap | Emulator + physical | NOT TESTED |
| Navigasi | Hardware/predictive back dan gesture navigation | Physical | NOT TESTED |
| Notifikasi | Permission grant/deny pada Android 13+ | Physical | NOT TESTED |
| Push | Foreground, background, killed, payload invalid, token rollover | Physical + Play internal | BLOCKED |
| Jaringan | Offline sebelum/sesudah login, reconnect, timeout, server 500 | Emulator + physical | NOT TESTED |
| Auth | Expired JWT, invalid JWT, token_version lama, replacement token setelah ganti PIN | Integration + physical | BLOCKED |
| Status | Account suspended dan tenant suspended | Integration + physical | BLOCKED |
| Multi-anak | Ganti anak cepat saat request lama masih berjalan | Emulator + physical | NOT TESTED |
| Aksesibilitas | Font scale 1.3× dan 2.0×, TalkBack, touch target, contrast | Physical | NOT TESTED |
| Lifecycle | Background/foreground berulang dan low-memory restart | Physical | NOT TESTED |
