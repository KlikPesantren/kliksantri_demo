# White-Label Assets — Wali App

Panduan mengganti branding visual pesantren tanpa mengubah mekanisme build Expo.

## App Icon (launcher)

| File | Purpose |
|------|---------|
| `assets/icon.png` | iOS / fallback icon (1024×1024 recommended) |
| `assets/android-icon-foreground.png` | Android adaptive icon foreground |
| `assets/android-icon-background.png` | Android adaptive icon background |
| `assets/android-icon-monochrome.png` | Android 13+ monochrome icon |

**Langkah:** Ganti file di atas dengan logo pesantren (PNG, transparan untuk foreground).

Konfigurasi: `app.json` → `expo.icon` dan `expo.android.adaptiveIcon`.

## Splash (native boot)

| File | Purpose |
|------|---------|
| `assets/splash-icon.png` | Gambar splash native Expo |

Konfigurasi: `app.json` → `plugins.expo-splash-screen`.

- `backgroundColor`: `#16A34A` (hijau pesantren)
- Runtime splash in-app: `src/screens/auth/SplashScreen.jsx` (membaca cache branding)

## Favicon (web)

| File | Purpose |
|------|---------|
| `assets/favicon.png` | Web preview |

## Display name (store)

`app.json` → `expo.name` — ubah ke nama pesantren saat publish (contoh: `"Wali Santri Al-Hikmah"`).

Bundle ID (`com.kliksantri.wali`) tetap untuk pipeline build; ubah hanya jika diperlukan di Play Console terpisah.

## Runtime branding (tanpa rebuild)

Logo, splash, tagline, banner & tentang pesantren diatur admin via **Profil Pesantren → Branding Aplikasi**, disimpan ke cache `pesantren_branding` setelah login Wali.

Urutan logo:
1. `splash_logo_url` (splash & login)
2. `logo_url` (fallback)
3. Inisial pesantren (fallback UI)

Field `app_icon_url` disiapkan untuk pipeline build white-label berikutnya (lihat `app.json` untuk icon native saat ini).
