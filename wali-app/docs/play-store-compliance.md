# Checklist Google Play — Wali Santri

| Area | Status | Bukti/catatan |
|---|---|---|
| Target/compile SDK | PASS config | Expo SDK 56 + build-properties menetapkan API 36. Belum dibuktikan lewat binary. |
| Android 15/16 compatibility | NOT TESTED | Static config sesuai; wajib device/emulator test. |
| 64-bit native libraries | PASS config | ABI default Expo/RN mencakup arm64-v8a; belum diperiksa dari AAB. |
| AAB readiness | PASS config | `eas.json` production `app-bundle`. |
| Play App Signing | BLOCKED | Status Play Console/signing credential tidak tersedia di repo. |
| Package identity | BLOCKED | Package lama cocok Firebase, tetapi branding final mengarah ke migrasi package sebelum rilis pertama. |
| Ads | PASS static | Tidak ada SDK iklan atau tampilan iklan. |
| Account creation | PASS static | Aplikasi hanya login; akun dibuat/dikelola pesantren. |
| Account deletion/data deletion | BLOCKED external | Menu permintaan tersedia dan aman bila config kosong, tetapi URL HTTPS/email production belum diisi. Route admin yang ada hanya menghapus relasi wali–santri, bukan akun/arsip secara end-to-end. |
| Login requirement/app access | BLOCKED | Akun/tenant demo reviewer belum tersedia. |
| Child-directed/Families | REVIEW REQUIRED | Memproses data santri/anak tetapi pengguna utama adalah wali; deklarasi audience harus ditentukan owner. |
| Financial functionality | REVIEW REQUIRED | Menampilkan tagihan, pembayaran, saldo, dan mutasi; tidak ditemukan payment processing di aplikasi. |
| User-generated content | PASS static | Tidak ada upload/post/chat pengguna. |
| Push notification | PASS static | Prompt kontekstual saat membuka Notifikasi; penolakan tidak memblokir aplikasi. |
| Background/foreground service | PASS static | Tidak ada foreground service/background task aplikasi. |
| Exact alarm/full-screen intent | PASS static | Tidak diminta. |
| Package visibility/QUERY_ALL_PACKAGES | PASS static | Tidak diminta. |
| WebView/dynamic executable code | PASS static | Tidak ada WebView atau downloaded executable code. OTA dinonaktifkan. |
| Accessibility | NOT TESTED | Beberapa label ada; TalkBack, contrast, font scaling, target sentuh perlu device QA. |
| Demo account | BLOCKED | Wajib dibuat owner tanpa memakai data customer. |
| Privacy policy URL | BLOCKED deploy | `https://klikpesantren.com/privacy-policy` mengarah ke HTTPS `www` dan merespons 200 dengan HSTS. Source baru mencakup Wali Santri, tetapi perubahan belum dideploy dan kontak/legal identity final belum dikonfirmasi. |

## Permission hasil config

Dipakai: `INTERNET`, `ACCESS_NETWORK_STATE`, `POST_NOTIFICATIONS`, `VIBRATE`, dan receiver boot dari Expo Notifications.
Diblokir: `SYSTEM_ALERT_WINDOW`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`.
Tidak diminta: kamera, lokasi, mikrofon, Bluetooth, exact alarm, install packages, query all packages, phone state, accounts, biometric.

## Deklarasi owner yang masih wajib

- Target audience/Families dan perlakuan data anak.
- Financial features: pilih deklarasi yang menjelaskan aplikasi hanya menampilkan informasi internal pesantren bila sesuai kenyataan.
- Content rating, kategori, ads, app access, Data Safety, dan account deletion URL/process.
- Support email, website, privacy URL, serta bukti kewenangan penggunaan merek.
- Proses operasional untuk memverifikasi permintaan, menonaktifkan/menghapus akun login wali, menghapus token push, serta menjelaskan arsip pesantren yang dipertahankan.
- Isi `EXPO_PUBLIC_ACCOUNT_DELETION_URL` atau `EXPO_PUBLIC_SUPPORT_EMAIL` sebelum build production; gate saat ini sengaja tetap blocked bila keduanya kosong.
