import { lazy, Suspense } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TenantProfileProvider } from "./context/TenantProfileContext";

import LoginPage from "./pages/LoginPage";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const PembayaranPage = lazy(() => import("./pages/PembayaranPage"));
const PengumumanPage = lazy(() => import("./pages/PengumumanPage"));

const RFIDMonitorPage = lazy(() => import("./pages/RFIDMonitorPage"));
const RFIDDashboardPage = lazy(() => import("./pages/RFIDDashboardPage"));
const RFIDTransactionPage = lazy(() => import("./pages/RFIDTransactionPage"));
const RFIDTopupPage = lazy(() => import("./pages/RFIDTopupPage"));
const RFIDMerchantPage = lazy(() => import("./pages/RFIDMerchantPage"));
const RFIDDevicePage = lazy(() => import("./pages/RFIDDevicePage"));
const RFIDMutasiPage = lazy(() => import("./pages/RFIDMutasiPage"));
const RFIDRefundPage = lazy(() => import("./pages/RFIDRefundPage"));

import SantriPage from "./pages/SantriPage";
import AuditPage from "./pages/AuditPage";
import DevicePage from "./pages/DevicePage";
import KelasPage from "./pages/KelasPage";
import AbsensiPage from "./pages/AbsensiPage";
import PerizinanPage from "./pages/PerizinanPage";
import PelanggaranPage from "./pages/PelanggaranPage";
import KesehatanPage from "./pages/KesehatanPage";
import HafalanPage from "./pages/HafalanPage";
import NilaiPage from "./pages/NilaiPage";
import WaliPage from "./pages/WaliPage";
import AbsensiGuruPage from "./pages/AbsensiGuruPage";
import GuruPage from "./pages/GuruPage";
import BukuKasPage from "./pages/BukuKasPage";
import KasInstansiPage from "./pages/KasInstansiPage";
import KasInstansiKonsolidasiPage from "./pages/KasInstansiKonsolidasiPage";
import ProgramUnitPage from "./pages/ProgramUnitPage";
import SahriyahPage from "./pages/SahriyahPage";
import SahriyahSettingPage from "./pages/SahriyahSettingPage";
import TamuPage from "./pages/TamuPage";
import ProfilPesantrenPage from "./pages/ProfilPesantrenPage";
import UsersPage from "./pages/UsersPage";
import RolesPage from "./pages/RolesPage";

import PlatformLoginPage from "./pages/platform/PlatformLoginPage";
import PlatformProtectedRoute from "./components/platform/PlatformProtectedRoute";
import PlatformLayout from "./components/platform/PlatformLayout";
import PlatformTenantsPage from "./pages/platform/PlatformTenantsPage";
import PlatformTenantDetailPage from "./pages/platform/PlatformTenantDetailPage";
import PlatformDashboardPage from "./pages/platform/PlatformDashboardPage";

function RouteFallback() {
  return null;
}

function LazyPage({ children }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

function App() {
  return (
    <BrowserRouter>
      <TenantProfileProvider>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        {/* Platform Console — auth terpisah dari tenant admin */}
        <Route path="/platform/login" element={<PlatformLoginPage />} />
        <Route
          path="/platform"
          element={
            <PlatformProtectedRoute>
              <PlatformLayout />
            </PlatformProtectedRoute>
          }
        >
          <Route index element={<PlatformDashboardPage />} />
          <Route path="dashboard" element={<PlatformDashboardPage />} />
          <Route path="tenants" element={<PlatformTenantsPage />} />
          <Route path="tenants/:id" element={<PlatformTenantDetailPage />} />
        </Route>

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <LazyPage>
                <DashboardPage />
              </LazyPage>
            </ProtectedRoute>
          }
        />

        <Route
          path="/santri"
          element={
            <ProtectedRoute>
              <SantriPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kelas"
          element={
            <ProtectedRoute>
              <KelasPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/wali"
          element={
            <ProtectedRoute>
              <WaliPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pembayaran"
          element={
            <ProtectedRoute>
              <LazyPage>
                <PembayaranPage />
              </LazyPage>
            </ProtectedRoute>
          }
        />

        <Route
          path="/buku-kas"
          element={
            <ProtectedRoute>
              <BukuKasPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kas-instansi/konsolidasi"
          element={
            <ProtectedRoute>
              <KasInstansiKonsolidasiPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kas-instansi"
          element={
            <ProtectedRoute>
              <KasInstansiPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/program-unit"
          element={
            <ProtectedRoute>
              <ProgramUnitPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sahriyah"
          element={
            <ProtectedRoute>
              <SahriyahPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sahriyah-setting"
          element={
            <ProtectedRoute>
              <SahriyahSettingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rfid-monitor"
          element={
            <ProtectedRoute>
              <LazyPage>
                <RFIDMonitorPage />
              </LazyPage>
            </ProtectedRoute>
          }
        />

        <Route
          path="/rfid-dashboard"
          element={
            <ProtectedRoute>
              <LazyPage>
                <RFIDDashboardPage />
              </LazyPage>
            </ProtectedRoute>
          }
        />

        <Route
          path="/rfid-transactions"
          element={
            <ProtectedRoute>
              <LazyPage>
                <RFIDTransactionPage />
              </LazyPage>
            </ProtectedRoute>
          }
        />

        <Route
          path="/rfid-topup"
          element={
            <ProtectedRoute>
              <LazyPage>
                <RFIDTopupPage />
              </LazyPage>
            </ProtectedRoute>
          }
        />

        <Route
          path="/rfid-merchant"
          element={
            <ProtectedRoute>
              <LazyPage>
                <RFIDMerchantPage />
              </LazyPage>
            </ProtectedRoute>
          }
        />

        <Route
          path="/rfid-devices"
          element={
            <ProtectedRoute>
              <LazyPage>
                <RFIDDevicePage />
              </LazyPage>
            </ProtectedRoute>
          }
        />

        <Route
          path="/rfid-mutasi"
          element={
            <ProtectedRoute>
              <LazyPage>
                <RFIDMutasiPage />
              </LazyPage>
            </ProtectedRoute>
          }
        />

        <Route
          path="/rfid-refund"
          element={
            <ProtectedRoute>
              <LazyPage>
                <RFIDRefundPage />
              </LazyPage>
            </ProtectedRoute>
          }
        />

        <Route
          path="/absensi"
          element={
            <ProtectedRoute>
              <AbsensiPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/absensi-guru"
          element={
            <ProtectedRoute>
              <AbsensiGuruPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/guru"
          element={
            <ProtectedRoute>
              <GuruPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hafalan"
          element={
            <ProtectedRoute>
              <HafalanPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/nilai"
          element={
            <ProtectedRoute>
              <NilaiPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/perizinan"
          element={
            <ProtectedRoute>
              <PerizinanPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kesehatan"
          element={
            <ProtectedRoute>
              <KesehatanPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pelanggaran"
          element={
            <ProtectedRoute>
              <PelanggaranPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tamu"
          element={
            <ProtectedRoute>
              <TamuPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pengumuman"
          element={
            <ProtectedRoute>
              <LazyPage>
                <PengumumanPage />
              </LazyPage>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profil-pesantren"
          element={
            <ProtectedRoute>
              <ProfilPesantrenPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/roles"
          element={
            <ProtectedRoute>
              <RolesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit"
          element={
            <ProtectedRoute>
              <AuditPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/devices"
          element={
            <ProtectedRoute>
              <DevicePage />
            </ProtectedRoute>
          }
        />
      </Routes>
      </TenantProfileProvider>
      </BrowserRouter>
  );
}

export default App;
