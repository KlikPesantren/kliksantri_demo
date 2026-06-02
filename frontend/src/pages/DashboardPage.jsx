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

const transaksiTerbaru =
summary?.transaksi_terbaru || [];

const pembayaranTerbaru =
summary?.pembayaran_terbaru || [];

const topTunggakan =
summary?.top_tunggakan || [];

const grafikKas =

(summary?.grafik_kas || [])

.map((item) => ({

  bulan: [

    "",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des"

  ][Number(item.bulan)],

  masuk:
    Number(item.masuk),

  keluar:
    Number(item.keluar)

}));
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

  background:"#fff",

  borderRadius:"20px",

  padding:"24px",

  boxShadow:
    "0 4px 20px rgba(0,0,0,.05)",

  minWidth:"220px",

  borderTop:
    "5px solid #14B8A6"

};

  return (

<div>

      <Sidebar />

      <div

        style={{

          marginLeft:"280px",

          width:"calc(100% - 280px)",

          padding: "20px",

          boxSizing: "border-box"

        }}

      >

       <div
  style={{
    background:
      "linear-gradient(135deg,#0F766E,#14B8A6)",
    borderRadius:"20px",
    padding:"30px",
    marginBottom:"24px",
    color:"white"
  }}
>

  <h1
    style={{
      margin:0
    }}
  >
    Assalamu'alaikum 👋
  </h1>

  <p
    style={{
      marginTop:"10px"
    }}
  >
    Selamat datang di KlikSantri

    <div
  style={{
    marginTop:"20px",
    display:"flex",
    gap:"30px"
  }}
>

  <div>

    <h2>

      {summary.total_santri}

    </h2>

    <small>

      Santri Aktif

    </small>

  </div>

  <div>

    <h2>

      {summary.total_kelas}

    </h2>

    <small>

      Kelas Aktif

    </small>

  </div>

</div>
  </p>

</div>

        {/* ====================== */}
        {/* SUPERADMIN */}
        {/* ====================== */}

        {

          user?.role ===
          "superadmin"

          && (

            <div
  style={{
    display:"grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(250px,1fr))",
    gap:"20px"
  }}
>

 <div
  style={{
    background:"#fff",
    borderRadius:"20px",
    padding:"24px",
    boxShadow:"0 4px 20px rgba(0,0,0,.05)",
    borderTop:"5px solid #14B8A6"
  }}
>

 <div style={{fontSize:"32px"}}>

  👥

</div>

<h1
  style={{
    margin:"10px 0",
    fontSize:"42px",
    fontWeight:"700",
    color:"#0F172A"
  }}
>

  {summary.total_santri}

</h1>

<p
  style={{
    margin:0,
    color:"#64748B"
  }}
>

  Total Santri

</p>

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

      <div
  style={{
    display:"grid",
    gridTemplateColumns:"1fr 1fr",
    gap:"20px",
    marginTop:"24px"
  }}
>

  <div
    style={{
      background:"#fff",
      borderRadius:"20px",
      padding:"24px",
      boxShadow:
        "0 4px 20px rgba(0,0,0,.05)"
    }}
  >

    <h3>

      Aktivitas Hari Ini

    </h3>

    <hr />

    <p>

      💰 Pembayaran Sahriyah

    </p>

    <p>

      Ahmad - Rp25.000

    </p>

    <p>

      2 menit lalu

    </p>

  </div>

  <div
    style={{
      background:"#fff",
      borderRadius:"20px",
      padding:"24px",
      boxShadow:
        "0 4px 20px rgba(0,0,0,.05)"
    }}
  >

    <h3>

      Quick Menu

    </h3>

    <hr />

    <p>➕ Tambah Santri</p>

    <p>💰 Pembayaran</p>

    <p>📋 Perizinan</p>

  </div>

</div>

        {/* ====================== */}
        {/* SEKRETARIS */}
        {/* ====================== */}

        {

          user?.role ===
          "sekretaris"

          && (

            <div
  style={{
    display:"grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(250px,1fr))",
    gap:"20px"
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
  user?.role === "keuangan" && (

    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(250px,1fr))",
        gap: "20px"
      }}
    >

      {/* KAS MASUK */}

      <div style={cardStyle}>

        <h3>
          Kas Masuk Bulan Ini
        </h3>

        <h1>
          Rp {
            Number(
              summary.kas_masuk || 0
            ).toLocaleString()
          }
        </h1>

      </div>

      {/* KAS KELUAR */}

      <div style={cardStyle}>

        <h3>
          Kas Keluar Bulan Ini
        </h3>

        <h1>
          Rp {
            Number(
              summary.kas_keluar || 0
            ).toLocaleString()
          }
        </h1>

      </div>

      {/* SALDO KAS */}

      <div style={cardStyle}>

        <h3>
          Saldo Kas
        </h3>

        <h1>
          Rp {
            Number(
              summary.saldo_kas || 0
            ).toLocaleString()
          }
        </h1>

      </div>

      {/* PEMBAYARAN SAHRIYAH */}

      <div style={cardStyle}>

        <h3>
          Pembayaran Sahriyah
        </h3>

        <h1>
          Rp {
            Number(
              summary.total_pembayaran || 0
            ).toLocaleString()
          }
        </h1>

      </div>

      {/* TUNGGAKAN SAHRIYAH */}

      <div style={cardStyle}>

        <h3>
          Tunggakan Sahriyah
        </h3>

        <h1>
          Rp {
            Number(
              summary.total_tunggakan || 0
            ).toLocaleString()
          }
        </h1>

      </div>

    </div>

  )
}



{/* ====================== */}
{/* TRANSAKSI TERBARU */}
{/* ====================== */}

{
  user?.role === "keuangan" && (

    <div
      style={{
        background:"#fff",
        borderRadius:"20px",
        padding:"24px",
        marginTop:"24px",
        boxShadow:
          "0 4px 20px rgba(0,0,0,.05)"
      }}
    >

      <h2>

        Transaksi Terbaru

      </h2>

      <div
        style={{
          overflowX:"auto"
        }}
      >

        <table
          style={{
            width:"100%",
            borderCollapse:
              "collapse"
          }}
        >

          <thead>

            <tr>

              <th>Tanggal</th>

              <th>Jenis</th>

              <th>Kategori</th>

              <th>Keterangan</th>

              <th>Nominal</th>

            </tr>

          </thead>

          <tbody>

            {

              transaksiTerbaru.map(
                (item) => (

                <tr
                  key={item.id}
                >

                  <td>

                    {
                      new Date(
                        item.tanggal
                      )
                      .toLocaleDateString(
                        "id-ID"
                      )
                    }

                  </td>

                  <td>

                    {item.jenis}

                  </td>

                  <td>

                    {item.kategori}

                  </td>

                  <td>

                    {item.keterangan}

                  </td>

                  <td>

                    Rp {

                      Number(
                        item.nominal
                      )
                      .toLocaleString()

                    }

                  </td>

                </tr>

              ))

            }

          </tbody>

        </table>

      </div>

    </div>

  )
}

{
  user?.role === "keuangan" && (

    <div
      style={{
        background:"#fff",
        borderRadius:"20px",
        padding:"24px",
        marginTop:"24px",
        boxShadow:
          "0 4px 20px rgba(0,0,0,.05)"
      }}
    >

      <h2>

        Pembayaran Terbaru

      </h2>

      <div
        style={{
          overflowX:"auto"
        }}
      >

        <table
          style={{
            width:"100%",
            borderCollapse:
              "collapse"
          }}
        >

          <thead>

            <tr>

              <th>Santri</th>

              <th>Tagihan</th>

              <th>Dibayar</th>

              <th>Sisa</th>

              <th>Status</th>

            </tr>

          </thead>

          <tbody>

            {

              pembayaranTerbaru.map(
                (item) => (

                <tr
                  key={item.id}
                >

                  <td>

                    {item.nama}

                  </td>

                  <td>

                    {item.nama_tagihan}

                  </td>

                  <td>

                    Rp {

                      Number(
                        item.nominal_bayar
                      )
                      .toLocaleString()

                    }

                  </td>

                  <td>

                    Rp {

                      Number(
                        item.sisa_tunggakan
                      )
                      .toLocaleString()

                    }

                  </td>

                  <td>

                    {item.status}

                  </td>

                </tr>

              ))

            }

          </tbody>

        </table>

      </div>

    </div>

  )
}

{
  user?.role === "keuangan" && (

    <div
      style={{
        background:"#fff",
        borderRadius:"20px",
        padding:"24px",
        marginTop:"24px",
        boxShadow:
          "0 4px 20px rgba(0,0,0,.05)"
      }}
    >

      <h2>

        Top 10 Tunggakan Terbesar

      </h2>

      <table
        style={{
          width:"100%",
          borderCollapse:"collapse"
        }}
      >

        <thead>

          <tr>

            <th>Nama</th>

            <th>Tunggakan</th>

          </tr>

        </thead>

        <tbody>

          {

            topTunggakan.map(
              (item,index) => (

              <tr
                key={index}
              >

                <td>

                  {item.nama}

                </td>

                <td>

                  Rp {

                    Number(
                      item.sisa_tagihan
                    )
                    .toLocaleString()

                  }

                </td>

              </tr>

            ))

          }

        </tbody>

      </table>

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
    display:"grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(250px,1fr))",
    gap:"20px"
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
    display:"grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(250px,1fr))",
    gap:"20px"
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

<div style={cardStyle}>

  <h3>

    Tamu Hari Ini

  </h3>

  <h1>

    {summary.tamu_hari_ini || 0}

  </h1>

</div>

<div style={cardStyle}>

  <h3>

    Tamu Bulan Ini

  </h3>

  <h1>

    {summary.tamu_bulan_ini || 0}

  </h1>

</div>

<div style={cardStyle}>

  <h3>

    Tamu Masih Di Dalam

  </h3>

  <h1>

    {summary.tamu_masih_didalam || 0}

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