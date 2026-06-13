# Legacy / Orphan Inventory — Wali App V2

Dokumentasi file yang **tidak terhubung** ke navigasi aktif (MainTabs V2).
File **tidak dihapus** — hanya diisolasi untuk referensi dan audit APK freeze.

## Navigasi Aktif (USED)

```
AppNavigator
├── AuthStack → LoginScreen, SplashScreen
└── MainTabs
    ├── Beranda → DashboardScreen
    ├── Pengumuman → PengumumanStack → PengumumanScreen
    ├── Monitoring → MonitoringStack → MonitoringScreen + detail screens
    ├── Keuangan → KeuanganStack → KeuanganScreen + RFID/Sahriyah/DetailTagihan
    └── Profil → ProfilStack → ProfilHub + ProfilSantri + ProfilPesantren + GantiPin + TentangAplikasi
MainStack overlay: AnakPilihScreen
```

## Orphan Report

| File | Status | Catatan |
|------|--------|---------|
| `navigation/AkademikStack.jsx` | ORPHAN | Tidak di-import MainTabs/AppNavigator |
| `navigation/KeamananStack.jsx` | ORPHAN | Tidak di-import MainTabs/AppNavigator |
| `screens/akademik/AkademikHubScreen.jsx` | ORPHAN | Hanya direferensi AkademikStack |
| `screens/keamanan/KeamananHubScreen.jsx` | ORPHAN | Hanya direferensi KeamananStack |
| `screens/keuangan/KeuanganHubScreen.jsx` | ORPHAN | Diganti KeuanganScreen (tab) |
| `screens/pengumuman/DetailPengumumanScreen.jsx` | ORPHAN | Diganti PengumumanDetailModal |
| `screens/PlaceholderScreen.jsx` | ORPHAN | Tidak direferensi navigasi |
| `components/dashboard/SaldoCard.jsx` | ORPHAN | Dashboard V2 tidak mengimport |
| `components/dashboard/SahriyahCard.jsx` | ORPHAN | Dashboard V2 tidak mengimport |
| `components/dashboard/KehadiranCard.jsx` | ORPHAN | Dashboard V2 tidak mengimport |
| `components/dashboard/StatGrid.jsx` | ORPHAN | Dashboard V2 tidak mengimport |

## Used (Referensi Utama)

| Area | Files |
|------|-------|
| Auth | `LoginScreen`, `SplashScreen`, `AnakPilihScreen` |
| Beranda | `DashboardScreen`, `QuickAccessGrid`, `HeroPengumumanCard`, `ChildSwitcherBar` |
| Pengumuman | `PengumumanScreen`, `PengumumanCover`, `PengumumanDetailModal` |
| Monitoring | `MonitoringScreen` + Absensi/Nilai/Hafalan/Perizinan/Pelanggaran |
| Keuangan | `KeuanganScreen` + Sahriyah/RFID/DetailTagihan |
| Profil | `ProfilHubScreen`, `ProfilSantriScreen`, `ProfilPesantrenScreen`, `GantiPinScreen`, `TentangAplikasiScreen` |
| Design System | `components/ui/*` |

*Generated: Sprint W4 — APK Freeze Audit*
