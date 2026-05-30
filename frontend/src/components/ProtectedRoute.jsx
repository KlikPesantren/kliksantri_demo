import {

  Navigate,
  useLocation

} from "react-router-dom";

function ProtectedRoute({

  children

}) {

  const token =
  localStorage.getItem(
    "token"
  );

  const user = JSON.parse(

    localStorage.getItem(
      "user"
    )

  );

  const location =
  useLocation();

  // ======================
  // BELUM LOGIN
  // ======================

  if (!token) {

    return <Navigate to="/" />;

  }

  // ======================
  // ROLE ACCESS
  // ======================

  const roleAccess = {

    superadmin: [

      "/dashboard",

      "/kelas",

      "/santri",

      "/wali",

      "/pembayaran",

      "/absensi",

      "/hafalan",

      "/nilai",

      "/perizinan",

      "/pelanggaran",

      "/devices",

      "/audit"

    ],

    sekretaris: [

      "/dashboard",

      "/kelas",

      "/santri",

      "/wali"

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

      "/hafalan",

      "/nilai"

    ],

    keamanan: [

      "/dashboard",

      "/perizinan",

      "/pelanggaran"

    ]

  };

  // ======================
  // CHECK ACCESS
  // ======================

  const allowedRoutes =

    roleAccess[
      user?.role
    ] || [];

  const isAllowed =

    allowedRoutes.includes(

      location.pathname

    );

  // ======================
  // AKSES DITOLAK
  // ======================

  if (!isAllowed) {

    return (

      <div

        style={{

          height: "100vh",

          display: "flex",

          justifyContent:
            "center",

          alignItems:
            "center",

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