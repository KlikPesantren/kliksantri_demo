import {

  useEffect,
  useState

} from "react";

import api
from "../services/api";

import Sidebar
from "../components/Sidebar";

import Topbar
from "../components/Topbar";

function DashboardPage() {

  // ======================
  // USER
  // ======================

  const user = JSON.parse(

    localStorage.getItem(
      "user"
    )

  );

  // ======================
  // STATE
  // ======================

 const [

  summary,
  setSummary

] = useState({

  total_santri: 0,

  total_kelas: 0,

  total_wali: 0,

  total_saldo: 0,

  persentase_kehadiran_santri: 0,

  persentase_kehadiran_guru: 0,

  total_hafalan: 0,

  rata_nilai: 0

});

  // ======================
  // GET SUMMARY
  // ======================

  const getSummary =
  async () => {

    try {

      const response =

        await api.get(

          "/dashboard/summary"

        );

      setSummary(

        response.data.data

      );

    }

    catch (err) {

      console.log(err);

    }

  };

  // ======================
  // LOAD
  // ======================

  useEffect(() => {

    getSummary();

  }, []);

  // ======================
  // CARD STYLE
  // ======================

  const cardStyle = {

    background: "white",

    borderRadius: "16px",

    padding: "20px",

    boxShadow:
      "0 2px 10px rgba(0,0,0,0.08)",

    flex: 1,

    minWidth: "220px"

  };

  return (

    <div

      style={{

        display: "flex",

        background: "#f5f7fb",

        minHeight: "100vh"

      }}

    >

      <Sidebar />

      <div

        style={{

          marginLeft: "240px",

          width: "calc(100% - 240px)",

          padding: "20px",

          boxSizing: "border-box"

        }}

      >

        <Topbar />

        <h1>

          Dashboard

        </h1>

        <br />

        {/* ====================== */}
        {/* SUPERADMIN */}
        {/* ====================== */}

        {

          user?.role ===
          "superadmin"

          && (

            <div

              style={{

                display: "flex",

                gap: "20px",

                flexWrap: "wrap"

              }}

            >

              <div style={cardStyle}>

                <h3>

                  Total Santri

                </h3>

                <h1>

                  {

                    summary.total_santri

                  }

                </h1>

              </div>

              <div style={cardStyle}>

                <h3>

                  Total Kelas

                </h3>

                <h1>

                  {

                    summary.total_kelas

                  }

                </h1>

              </div>

              <div style={cardStyle}>

                <h3>

                  Total Saldo

                </h3>

                <h1>

                  Rp {

                    Number(

                      summary.total_saldo

                    ).toLocaleString()

                  }

                </h1>

              </div>

              {/* KEHADIRAN SANTRI */}

<div style={cardStyle}>

  <h3>

    Kehadiran Santri

  </h3>

  <h1>

    {

      summary
      .persentase_kehadiran_santri

    }%

  </h1>

</div>

{/* KEHADIRAN GURU */}

<div style={cardStyle}>

  <h3>

    Kehadiran Guru

  </h3>

  <h1>

    {

      summary
      .persentase_kehadiran_guru

    }%

  </h1>

</div>

{/* TOTAL HAFALAN */}

<div style={cardStyle}>

  <h3>

    Total Hafalan

  </h3>

  <h1>

    {

      summary
      .total_hafalan

    }

  </h1>

</div>

{/* RATA NILAI */}

<div style={cardStyle}>

  <h3>

    Rata-rata Nilai

  </h3>

  <h1>

    {

      summary
      .rata_nilai

    }

  </h1>

</div>

              <div style={cardStyle}>

                <h3>

                  Total Pelanggaran

                </h3>

                <h1>

                  {

                    summary.total_pelanggaran || 0

                  }

                </h1>

              </div>

            </div>

          )

        }

        {/* ====================== */}
        {/* SEKRETARIS */}
        {/* ====================== */}

        {

          user?.role ===
          "sekretaris"

          && (

            <div

              style={{

                display: "flex",

                gap: "20px",

                flexWrap: "wrap"

              }}

            >

              <div style={cardStyle}>

                <h3>

                  Total Santri

                </h3>

                <h1>

                  {

                    summary.total_santri

                  }

                </h1>

              </div>

              <div style={cardStyle}>

                <h3>

                  Total Kelas

                </h3>

                <h1>

                  {

                    summary.total_kelas

                  }

                </h1>

              </div>

              <div style={cardStyle}>

                <h3>

                  Total Wali

                </h3>

                <h1>

                  {

                    summary.total_wali || 0

                  }

                </h1>

              </div>

            </div>

          )

        }

        {/* ====================== */}
        {/* KEUANGAN */}
        {/* ====================== */}

        {

          user?.role ===
          "keuangan"

          && (

            <div

              style={{

                display: "flex",

                gap: "20px",

                flexWrap: "wrap"

              }}

            >

              <div style={cardStyle}>

                <h3>

                  Total Saldo

                </h3>

                <h1>

                  Rp {

                    Number(

                      summary.total_saldo

                    ).toLocaleString()

                  }

                </h1>

              </div>

              <div style={cardStyle}>

                <h3>

                  Total Pembayaran

                </h3>

                <h1>

                  {

                    summary.total_pembayaran || 0

                  }

                </h1>

              </div>

              <div style={cardStyle}>

                <h3>

                  Tunggakan

                </h3>

                <h1>

                  {

                    summary.total_tunggakan || 0

                  }

                </h1>

              </div>

            </div>

          )

        }

        {/* ====================== */}
        {/* PENDIDIKAN */}
        {/* ====================== */}

        {

          user?.role ===
          "pendidikan"

          && (

            <div

              style={{

                display: "flex",

                gap: "20px",

                flexWrap: "wrap"

              }}

            >

              <div style={cardStyle}>

  <h3>

    Kehadiran Santri

  </h3>

  <h1>

    {

      summary
      .persentase_kehadiran_santri

    }%

  </h1>

</div>

<div style={cardStyle}>

  <h3>

    Kehadiran Guru

  </h3>

  <h1>

    {

      summary
      .persentase_kehadiran_guru

    }%

  </h1>

</div>

<div style={cardStyle}>

  <h3>

    Total Hafalan

  </h3>

  <h1>

    {

      summary
      .total_hafalan

    }

  </h1>

</div>

<div style={cardStyle}>

  <h3>

    Rata-rata Nilai

  </h3>

  <h1>

    {

      summary
      .rata_nilai

    }

  </h1>

</div>

            </div>

          )

        }

        {/* ====================== */}
        {/* KEAMANAN */}
        {/* ====================== */}

        {

          user?.role ===
          "keamanan"

          && (

            <div

              style={{

                display: "flex",

                gap: "20px",

                flexWrap: "wrap"

              }}

            >

          <div style={cardStyle}>

  <h3>

    Belum Kembali

  </h3>

  <h1>

    {summary.belum_kembali}

  </h1>

</div>

<div style={cardStyle}>

  <h3>

    Perizinan Bulan Ini

  </h3>

  <h1>

    {summary.total_perizinan}

  </h1>

</div>

<div style={cardStyle}>

  <h3>

    Pelanggaran Bulan Ini

  </h3>

  <h1>

    {summary.total_pelanggaran}

  </h1>

</div>

<div style={cardStyle}>

  <h3>

    Santri Melanggar

  </h3>

  <h1>

    {summary.persentase_melanggar}%

  </h1>

</div>

            </div>

          )

        }

      </div>

    </div>

  );

}

export default DashboardPage;