# Package Migration Checklist — Wali Santri

Target yang direkomendasikan apabila package lama belum pernah dipublikasikan:
`com.klikpesantren.wali`.

Checklist ini tidak mengotorisasi perubahan package. Jangan mulai sebelum owner memberi keputusan berdasarkan Play Console.

## 1. Preconditions

- [x] Owner mengonfirmasi Google Play belum pernah dipakai, sehingga package lama tidak perlu dipertahankan sebagai identitas listing.
- [ ] Owner menyetujui bahwa migrasi menghasilkan identitas aplikasi baru; instalasi package lama tidak dapat di-upgrade in-place oleh package baru.
- [ ] Backup konfigurasi non-secret dan daftar integrasi telah dibuat tanpa menyalin signing private key ke repository.
- [ ] Privacy URL, reviewer demo, store assets, dan QA plan sudah tersedia untuk identitas final.

## 2. Google Play dan versioning

- [ ] Pastikan application ID target tersedia di Play Console.
- [ ] Tentukan listing baru atau existing draft yang benar.
- [ ] Aktifkan Play App Signing dan dokumentasikan pemilik upload key.
- [ ] Tentukan `versionCode` awal. Jangan mengandalkan versionCode package lama untuk update lintas package.
- [ ] Catat bahwa pengguna harus uninstall package lama atau memasang package baru sebagai aplikasi terpisah; data local/session tidak bermigrasi otomatis.

## 3. Firebase dan FCM V1

- [x] Firebase Android app `com.klikpesantren.wali` telah dibuat oleh owner.
- [x] `google-services.json` baru memiliki tepat satu client `client_info.android_client_info.package_name` yang cocok dengan package final. File juga memuat client lama; jangan hapus Firebase app lama.
- [ ] Ganti file mobile secara atomik; jangan mengedit nilai Firebase manual.
- [ ] Verifikasi Firebase Cloud Messaging API V1 aktif dan kredensial server disimpan di secret manager/backend, bukan mobile.
- [ ] Verifikasi Expo/EAS push credential terhubung ke Firebase app final.
- [ ] Uji register, foreground, background, killed-state, token rollover, dan unregister notification pada perangkat fisik.

## 4. Expo/EAS dan signing

- [ ] Putuskan reuse atau buat EAS project baru.
- [ ] Jika project baru, update `expo.extra.eas.projectId` dan relink project.
- [ ] Verifikasi `expo.owner` bila organisasi EAS mengharuskannya; config saat ini tidak menetapkan owner eksplisit.
- [ ] Buat/verifikasi Android credentials untuk package final tanpa memasukkannya ke Git.
- [ ] Verifikasi keystore/upload certificate SHA-1/SHA-256 dan ownership pemulihan.
- [ ] Pastikan profile production tetap `app-bundle`, environment/channel production, dan bukan internal distribution.

## 5. Source changes setelah approval

- [x] `wali-app/app.json`: `android.package` menjadi `com.klikpesantren.wali`.
- [x] `wali-app/app.json`: `ios.bundleIdentifier` menjadi `com.klikpesantren.wali`.
- [ ] Slug `kliksantri-wali` sengaja dipertahankan karena `extra.eas.projectId` sudah ada dan owner EAS belum ditetapkan eksplisit. Verifikasi project EAS sebelum rename; slug bukan applicationId.
- [x] Scheme `klikpesantren-wali` dipertahankan.
- [ ] Ganti `wali-app/google-services.json` dengan file resmi untuk package final.
- [ ] Perbarui `assets/WHITE_LABEL.md`, release docs, reviewer docs, dan store listing.
- [ ] Jangan mengubah JWT issuer bersamaan hanya karena package berubah; issuer adalah kontrak backend dan memerlukan transisi token tersendiri.

## 6. OAuth, link, dan integrasi

- [ ] Buat ulang OAuth Android client bila fitur OAuth digunakan; daftarkan package final dan SHA certificate final.
- [ ] Audit intent filter, App Links, custom scheme, dan redirect URI.
- [ ] Verifikasi website/domain association bila App Links ditambahkan.
- [ ] Verifikasi notification channel dan payload navigation tidak menyimpan package lama.
- [ ] Jalankan `node scripts/check-package-consistency.js` sebelum build internal pertama.

## 7. Verification dan rollback

- [ ] Hapus aplikasi package lama dari perangkat QA sebelum clean-install test package final.
- [ ] Uji fresh login, SecureStore, multi-anak, PIN wajib, logout, dan deletion-request link.
- [ ] Uji notifikasi dengan Firebase/EAS credential final.
- [ ] Verifikasi AAB/package/signing nanti melalui internal testing; checklist ini tidak mengizinkan build saat audit.
- [ ] Setelah package final pertama kali dipublikasikan, rollback applicationId tidak dapat dilakukan sebagai update aplikasi yang sama. Rollback hanya dapat berupa rilis baru dengan package/listing berbeda.
- [ ] Simpan keputusan owner, tanggal, Play Console evidence, Firebase app ID, EAS project ID, dan signing owner di sistem rahasia/operasional—bukan dokumen publik repository.
