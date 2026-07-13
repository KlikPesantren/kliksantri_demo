# Inventaris Data Safety — KlikPesantren Wali Santri

`Collected` berarti data dikirim ke backend/penyedia layanan, walaupun tidak disimpan lokal. Status at rest backend tidak diasumsikan.

| Kategori Play | Tipe data | Diproses | Collected | Shared | Ephemeral | Wajib/opsional | Purpose | Transit | At rest | Penghapusan | Bukti source | Tindakan |
|---|---|---:|---:|---|---:|---|---|---|---|---|---|---|
| Personal info | Nama wali | Ya | Ya | Belum terbukti | Tidak | Wajib akun | Account management, app functionality | HTTPS | Belum terbukti backend | Dapat diminta via admin; belum ada self-service/end-to-end | `AuthContext.jsx`, `/wali-app/me` | Publikasikan kanal permintaan |
| Personal info | Nomor HP | Ya | Ya | Belum terbukti | Tidak | Wajib akun | Authentication, security | HTTPS | Belum terbukti backend | Request via admin | `auth.api.js`, backend login/audit | Deklarasikan collected |
| Personal info | Nama/ID/NIS santri | Ya | Ya | Belum terbukti | Tidak | Wajib fitur | App functionality | HTTPS | Belum terbukti backend | Permintaan melalui pesantren; tidak otomatis terhapus bersama akun wali | `santri.api.js`, `ProfilSantriScreen.jsx` | Arsip administrasi pesantren/data anak |
| Personal info | Alamat/profil santri | Ya jika tersedia | Ya | Belum terbukti | Tidak | Wajib bila diisi pesantren | App functionality | HTTPS | Belum terbukti backend | Request via admin | `ProfilSantriScreen.jsx` | Validasi field aktual production |
| Education | Kelas, absensi, nilai, hafalan | Ya | Ya | Belum terbukti | Tidak | Wajib fitur | App functionality | HTTPS | Belum terbukti backend | Request via admin | API `absensi`, `nilai`, `hafalan` | Deklarasikan education info |
| Other | Perizinan | Ya | Ya | Belum terbukti | Tidak | Wajib fitur | App functionality | HTTPS | Belum terbukti backend | Request via admin | `perizinan.api.js` | Dokumentasikan retensi |
| Other | Pelanggaran | Ya | Ya | Belum terbukti | Tidak | Wajib fitur | App functionality | HTTPS | Belum terbukti backend | Request via admin | `pelanggaran.api.js` | Data anak sensitif |
| Health and fitness | Catatan kesehatan | Ya | Ya | Belum terbukti | Tidak | Wajib bila fitur aktif | App functionality | HTTPS | Belum terbukti backend | Request via admin | `kesehatan.api.js`, `KesehatanScreen.jsx` | Deklarasi health info wajib |
| Financial info | Tagihan/sahriyah/pembayaran | Ya | Ya | Belum terbukti | Tidak | Wajib fitur | App functionality | HTTPS | Belum terbukti backend | Request via admin | `sahriyah.api.js` | Bukan payment processing menurut source mobile |
| Financial info | Saldo dompet/mutasi | Ya | Ya | Belum terbukti | Tidak | Wajib bila RFID aktif | App functionality | HTTPS | Belum terbukti backend | Request via admin | `rfid.api.js` | Verifikasi klasifikasi financial features |
| App activity | Pengumuman/notifikasi & read state | Ya | Ya | Belum terbukti | Tidak | Wajib fitur | App functionality, communications | HTTPS | Belum terbukti backend | Request via admin | `notifications.api.js`, `pengumuman.api.js` | Deklarasikan interaction bila diminta |
| Device or other IDs | Expo push token | Ya | Ya | Firebase/Expo sebagai service provider | Tidak | Opsional (notifikasi) | Communications | HTTPS | SecureStore lokal; backend belum terbukti | Logout memanggil unregister dan membersihkan token lokal; retensi backend perlu diverifikasi | `pushNotificationService.js`, `push.api.js` | Verifikasi penghapusan server/provider |
| Device or other IDs | Nama/model perangkat, platform | Ya | Ya | Belum terbukti | Tidak | Opsional (notifikasi) | App functionality, fraud prevention | HTTPS | Belum terbukti backend | Belum terbukti | `pushNotificationService.js` | Pertimbangkan minimisasi device name |
| Security | PIN login/perubahan PIN | Ya | Ya | Tidak ada bukti shared | Ephemeral di client | Wajib akun | Authentication, security | HTTPS | Backend hash terlihat di source; storage infra belum diaudit | Reset via admin | `auth.api.js`, `pin.api.js`, backend bcrypt | Jangan deklarasikan password sebagai disimpan plaintext |
| Diagnostics | IP address & user-agent | Ya oleh backend | Ya | Belum terbukti | Tidak | Wajib keamanan | Security, fraud prevention | HTTPS | Belum terbukti backend | Belum terbukti | backend `writeAudit` | Masukkan pada privacy policy |
| Photos/files | Foto santri/logo/banner | Ya jika tersedia | Ya | Belum terbukti | Tidak | Opsional | App functionality | HTTPS production | Belum terbukti backend | Request via admin | `resolveMediaUrl`, profile/home screens | Aplikasi tidak mengunggah file |
| Diagnostics | Crash logs/analytics | Tidak ditemukan SDK | Tidak terbukti | Tidak terbukti | N/A | N/A | N/A | N/A | N/A | N/A | Dependency/source scan | Perbarui deklarasi jika SDK ditambah |
| Location/audio/contacts | Lokasi, audio, kontak | Tidak | Tidak | Tidak | N/A | N/A | N/A | N/A | N/A | N/A | Permission/dependency scan | Jangan pilih di Play saat ini |

## Catatan deklarasi

- Data health, education, financial, personal, device IDs, dan app interaction harus dinilai sebagai collected saat dikirim ke backend.
- `Shared` tidak boleh dipastikan “No” sampai perjanjian pemrosesan dengan Expo/Firebase/hosting dan alur backend ditinjau owner.
- `Encrypted at rest` backend adalah **unknown**. SecureStore hanya membuktikan token lokal terenkripsi.
- Aplikasi tidak membuat akun secara mandiri. Menu permintaan penghapusan tersedia, tetapi hanya membuka kanal HTTPS/email dari `EXPO_PUBLIC_ACCOUNT_DELETION_URL` atau `EXPO_PUBLIC_SUPPORT_EMAIL`; belum ada endpoint penghapusan otomatis.
- Route admin `DELETE /wali/:id` yang ditemukan hanya menghapus relasi `wali_santri`, bukan record login `wali_akun` atau arsip santri; route ini bukan bukti account-deletion end-to-end.
- Penghapusan akses/account wali harus dibedakan dari arsip santri milik pesantren. Arsip pendidikan, kesehatan, pelanggaran, perizinan, dan keuangan tidak boleh dijanjikan otomatis terhapus.
- Mekanisme permintaan tetap manual dan URL/form/email production belum dikonfigurasi serta diverifikasi.
