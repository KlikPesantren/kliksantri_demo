import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const user  = JSON.parse(localStorage.getItem("user"));
  const location = useLocation();

  if (!token) {
    return <Navigate to="/" />;
  }

  const roleAccess = {

    superadmin: [
      "/dashboard",
      "/kelas",
      "/santri",
      "/wali",
      "/pembayaran",
      "/buku-kas",
      "/sahriyah",
      "/sahriyah-setting",
      "/absensi",
      "/absensi-guru",
      "/guru",
      "/hafalan",
      "/nilai",
      "/perizinan",
      "/pelanggaran",
      "/tamu",
      "/pengumuman",
      "/profil-pesantren",
      "/devices",
      "/audit",
      "/rfid-monitor",
      "/rfid-dashboard",
      "/rfid-transactions",
      "/rfid-topup",
      "/rfid-merchant",
      "/rfid-devices",
      "/rfid-mutasi",
      "/rfid-refund"
    ],

    sekretaris: [
      "/dashboard",
      "/kelas",
      "/santri",
      "/wali",
      "/pengumuman",
      "/profil-pesantren"
    ],

    keuangan: [
      "/dashboard",
      "/pembayaran",
      "/audit"
    ],

    pendidikan: [
      "/dashboard",
      "/absensi",
      "/absensi-guru",
      "/guru",
      "/hafalan",
      "/nilai"
    ],

    keamanan: [
      "/dashboard",
      "/perizinan",
      "/pelanggaran",
      "/tamu"
    ]

  };

  const allowedRoutes = roleAccess[user?.role] || [];
  const isAllowed = allowedRoutes.includes(location.pathname);

  if (!isAllowed) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "30px",
          fontWeight: "bold"
        }}
      >
        AKSES DITOLAK
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
