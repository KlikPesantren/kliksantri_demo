import ProtectedRoute
from "./components/ProtectedRoute";

import {

  BrowserRouter,
  Routes,
  Route

} from "react-router-dom";

// ======================
// PAGES
// ======================

import LoginPage
from "./pages/LoginPage";

import DashboardPage
from "./pages/DashboardPage";

import SantriPage
from "./pages/SantriPage";

import AuditPage
from "./pages/AuditPage";

import DevicePage
from "./pages/DevicePage";

import KelasPage
from "./pages/KelasPage";

import PembayaranPage
from "./pages/PembayaranPage";

import AbsensiPage
from "./pages/AbsensiPage";

import PerizinanPage
from "./pages/PerizinanPage";

import PelanggaranPage
from "./pages/PelanggaranPage";

import HafalanPage
from "./pages/HafalanPage";

import NilaiPage
from "./pages/NilaiPage";

import WaliPage
from "./pages/WaliPage";

import AbsensiGuruPage
from "./pages/AbsensiGuruPage";

import GuruPage
from "./pages/GuruPage";

import BukuKasPage
from "./pages/BukuKasPage";

import SahriyahPage
from "./pages/SahriyahPage";

import SahriyahSettingPage
from "./pages/SahriyahSettingPage";

import TamuPage
from "./pages/TamuPage";

import RFIDMonitorPage
from "./pages/RFIDMonitorPage";

import RFIDDashboardPage
from "./pages/RFIDDashboardPage";

import RFIDTransactionPage
from "./pages/RFIDTransactionPage";

import RFIDTopupPage
from "./pages/RFIDTopupPage";

import RFIDMerchantPage
from "./pages/RFIDMerchantPage";

import RFIDDevicePage
from "./pages/RFIDDevicePage";

import RFIDMutasiPage
from "./pages/RFIDMutasiPage";

import RFIDRefundPage
from "./pages/RFIDRefundPage";

import PengumumanPage
from "./pages/PengumumanPage";

import ProfilPesantrenPage
from "./pages/ProfilPesantrenPage";

import UsersPage
from "./pages/UsersPage";

import RolesPage
from "./pages/RolesPage";

function App() {

  return (

    <BrowserRouter>

      <Routes>

        {/* ====================== */}
        {/* LOGIN */}
        {/* ====================== */}

        <Route

          path="/"

          element={
            <LoginPage />
          }

        />

        {/* ====================== */}
        {/* DASHBOARD */}
        {/* ====================== */}

        <Route

          path="/dashboard"

          element={

            <ProtectedRoute>

              <DashboardPage />

            </ProtectedRoute>

          }

        />

        {/* ====================== */}
        {/* SANTRI */}
        {/* ====================== */}

        <Route

          path="/santri"

          element={

            <ProtectedRoute>

              <SantriPage />

            </ProtectedRoute>

          }

        />

        {/* ====================== */}
        {/* KELAS */}
        {/* ====================== */}

        <Route

          path="/kelas"

          element={

            <ProtectedRoute>

              <KelasPage />

            </ProtectedRoute>

          }

        />

        {/* ====================== */}
        {/* WALI */}
        {/* ====================== */}
        
        <Route

  path="/wali"

  element={

    <ProtectedRoute>

      <WaliPage />

    </ProtectedRoute>

  }

/>

        {/* ====================== */}
        {/* PEMBAYARAN */}
        {/* ====================== */}

        <Route

          path="/pembayaran"

          element={

            <ProtectedRoute>

              <PembayaranPage />

            </ProtectedRoute>

          }

        />

        {/* ====================== */}
        {/* BUKU KAS */}
        {/* ====================== */}

        <Route

        path="/buku-kas"

        element={

            <ProtectedRoute>

              <BukuKasPage />

            </ProtectedRoute>

     }

/>

        {/* ====================== */}
        {/* SAHRIYAH */}
        {/* ====================== */}

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

        {/* ====================== */}
        {/* RFID MONITOR */}
        {/* ====================== */}


<Route
  path="/rfid-monitor"
  element={

    <ProtectedRoute>

      <RFIDMonitorPage />

    </ProtectedRoute>

  }
/>

        {/* ====================== */}
        {/* RFID MONITOR */}
        {/* ====================== */}

<Route
  path="/rfid-dashboard"
  element={

    <ProtectedRoute>

      <RFIDDashboardPage />

    </ProtectedRoute>

  }
/>

        {/* ====================== */}
        {/* RFID TRANSACTION */}
        {/* ====================== */}

<Route
  path="/rfid-transactions"
  element={

    <ProtectedRoute>

      <RFIDTransactionPage />

    </ProtectedRoute>

  }
/>

        {/* ====================== */}
        {/* TOPUP RFID */}
        {/* ====================== */}

<Route
  path="/rfid-topup"
  element={

    <ProtectedRoute>

      <RFIDTopupPage />

    </ProtectedRoute>

  }
/>


        {/* ====================== */}
        {/* RFID MERCHANT */}
        {/* ====================== */}

<Route
  path="/rfid-merchant"
  element={

    <ProtectedRoute>

      <RFIDMerchantPage />

    </ProtectedRoute>

  }
/>

<Route
  path="/rfid-devices"
  element={

    <ProtectedRoute>

      <RFIDDevicePage />

    </ProtectedRoute>

  }
/>

<Route
  path="/rfid-mutasi"
  element={

    <ProtectedRoute>

      <RFIDMutasiPage />

    </ProtectedRoute>

  }
/>

<Route
  path="/rfid-refund"
  element={

    <ProtectedRoute>

      <RFIDRefundPage />

    </ProtectedRoute>

  }
/>

        {/* ====================== */}
        {/* ABSENSI */}
        {/* ====================== */}

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

        {/* ====================== */}
        {/* HAFALAN */}
        {/* ====================== */}

        <Route

  path="/hafalan"

  element={

    <ProtectedRoute>

      <HafalanPage />

    </ProtectedRoute>

  }

/>

        {/* ====================== */}
        {/* NILAI */}
        {/* ====================== */}

<Route

  path="/nilai"

  element={

    <ProtectedRoute>

      <NilaiPage />

    </ProtectedRoute>

  }

/>

        {/* ====================== */}
        {/* PERIZINAN */}
        {/* ====================== */}

        <Route

          path="/perizinan"

          element={

            <ProtectedRoute>

              <PerizinanPage />

            </ProtectedRoute>

          }

        />

       {/* ====================== */}
        {/* PELANGGARAN */}
        {/* ====================== */}

        <Route

  path="/pelanggaran"

  element={

    <ProtectedRoute>

      <PelanggaranPage />

    </ProtectedRoute>

  }

/>

        {/* ====================== */}
        {/* TAMU */}
        {/* ====================== */}

<Route
  path="/tamu"
  element={
    <ProtectedRoute>
      <TamuPage />
    </ProtectedRoute>
  }
/>

        {/* ====================== */}
        {/* PENGUMUMAN */}
        {/* ====================== */}

        <Route
          path="/pengumuman"
          element={
            <ProtectedRoute>
              <PengumumanPage />
            </ProtectedRoute>
          }
        />

        {/* ====================== */}
        {/* PROFIL PESANTREN */}
        {/* ====================== */}

        <Route
          path="/profil-pesantren"
          element={
            <ProtectedRoute>
              <ProfilPesantrenPage />
            </ProtectedRoute>
          }
        />

        {/* ====================== */}
        {/* MANAJEMEN USER & ROLE */}
        {/* ====================== */}

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

        {/* ====================== */}
        {/* AUDIT */}
        {/* ====================== */}

        <Route

          path="/audit"

          element={

            <ProtectedRoute>

              <AuditPage />

            </ProtectedRoute>

          }

        />

        {/* ====================== */}
        {/* DEVICES */}
        {/* ====================== */}

        <Route

          path="/devices"

          element={

            <ProtectedRoute>

              <DevicePage />

            </ProtectedRoute>

          }

        />

      </Routes>

    </BrowserRouter>

  );

}

export default App;