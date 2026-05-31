import {

  FaHome,
  FaUsers,
  FaMoneyBill,
  FaMicrochip,
  FaClipboardList,
  FaSchool,
  FaSignOutAlt

} from "react-icons/fa";

import {

  Link,
  useLocation

} from "react-router-dom";

function Sidebar() {

  const location =
    useLocation();

  // ======================
  // USER
  // ======================

  const user =

    JSON.parse(

      localStorage.getItem(
        "user"
      )

    );

  // ======================
  // LOGOUT
  // ======================

  const logout = () => {

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    window.location.href = "/";

  };

  // ======================
  // MENUS
  // ======================

let menus = [

  {

    name: "Dashboard",

    icon: <FaHome />,

    path: "/dashboard"

  }

];

// ======================
// SUPERADMIN
// ======================

if (

  user?.role ===
  "superadmin"

) {

  menus = [

    ...menus,

    {

      name: "Kelas",

      icon: <FaSchool />,

      path: "/kelas"

    },

    {

      name: "Santri",

      icon: <FaUsers />,

      path: "/santri"

    },

    {

  name: "Wali Santri",

  icon: <FaUsers />,

  path: "/wali"

    },

    {

      name: "Pembayaran",

      icon: <FaMoneyBill />,

      path: "/pembayaran"

    },

    {

      name: "Absensi",

      icon: <FaClipboardList />,

      path: "/absensi"

    },

    {

      name: "Hafalan",

      icon: <FaClipboardList />,

      path: "/hafalan"

    },

    {

      name: "Nilai",

      icon: <FaClipboardList />,

      path: "/nilai"

    },

    {

      name: "Perizinan",

      icon: <FaClipboardList />,

      path: "/perizinan"

    },

    {

      name: "Pelanggaran",

      icon: <FaClipboardList />,

      path: "/pelanggaran"

    },

    {

      name: "Perangkat",

      icon: <FaMicrochip />,

      path: "/devices"

    },

    {

      name: "Audit",

      icon: <FaClipboardList />,

      path: "/audit"

    }

  ];

}

// ======================
// SEKRETARIS
// ======================

if (

  user?.role ===
  "sekretaris"

) {

  menus = [

    ...menus,

    {

      name: "Kelas",

      icon: <FaSchool />,

      path: "/kelas"

    },

    {

      name: "Santri",

      icon: <FaUsers />,

      path: "/santri"

    },

    {

  name: "Wali Santri",

  icon: <FaUsers />,

  path: "/wali"

    }

  ];

}

// ======================
// KEUANGAN
// ======================

if (

  user?.role ===
  "keuangan"

) {

  menus = [

    ...menus,

    {

      name: "Pembayaran",

      icon: <FaMoneyBill />,

      path: "/pembayaran"

    },

    {
      name: "Buku Kas",

      icon: <FaMoneyBill />,

      path: "/buku-kas"
    },

    {

     name: "Sahriyah",

     icon: <FaMoneyBill />,

     path: "/sahriyah"

    },

    {

     name: "Setting Sahriyah",

     icon: <FaMoneyBill />,

     path: "/sahriyah-setting"

    },

    {

      name: "Audit",

      icon: <FaClipboardList />,

      path: "/audit"

    }

  ];

}

// ======================
// PENDIDIKAN
// ======================

if (

  user?.role ===
  "pendidikan"

) {

  menus = [

    ...menus,

    {

      name: "Absensi",

      icon: <FaClipboardList />,

      path: "/absensi"

    },

    {

     name: "Absensi Guru",

     icon: <FaClipboardList />,

      path: "/absensi-guru"

    },

    {

      name: "Hafalan",

      icon: <FaClipboardList />,

      path: "/hafalan"

    },

    {

      name: "Nilai",

      icon: <FaClipboardList />,

      path: "/nilai"

    }

  ];

}

// ======================
// KEAMANAN
// ======================

if (

  user?.role ===
  "keamanan"

) {

  menus = [

    ...menus,

    {

      name: "Perizinan",

      icon: <FaClipboardList />,

      path: "/perizinan"

    },

    {

      name: "Pelanggaran",

      icon: <FaClipboardList />,

      path: "/pelanggaran"

    }

  ];

}

  return (

    <div

      style={{

        width: "240px",

        height: "100vh",

        overflowY: "auto",

        background: "white",

        borderRight:
          "1px solid #ddd",

        fontSize: "14px",

        position: "fixed",

        padding: "20px",

        display: "flex",

        flexDirection:
          "column",

        justifyContent:
          "space-between"

      }}

    >

      {/* TOP */}

      <div>

        <h1>

          BSI

        </h1>

        <p>

          Bank Syirkah Indonesia

        </p>

        <br />

        {/* MENUS */}

        {

          menus.map((menu) => (

            <Link

              key={menu.path}

              to={menu.path}

              style={{

                display: "flex",

                alignItems:
                  "center",

                gap: "10px",

                padding: "12px",

                marginBottom: "10px",

                borderRadius: "10px",

                background:

                  location.pathname
                  === menu.path

                  ? "#e8f0ff"

                  : "white",

                color:

                  location.pathname
                  === menu.path

                  ? "#2563eb"

                  : "#333",

                textDecoration:
                  "none"

              }}

            >

              {menu.icon}

              {menu.name}

            </Link>

          ))

        }

      </div>

      {/* LOGOUT */}

      <button

        onClick={logout}

        style={{

          background: "red",

          color: "white",

          border: "none",

          padding: "12px",

          borderRadius: "10px",

          cursor: "pointer"

        }}

      >

        <FaSignOutAlt />

        {" "}Logout

      </button>

    </div>

  );

}

export default Sidebar;