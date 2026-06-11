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

 const [summary, setSummary] = useState({
  total_santri: 0,
  santri_aktif: 0,
  santri_non_aktif: 0,
  total_kelas: 0,
  total_wali: 0,
  total_saldo: 0,
  persentase_kehadiran_santri: 0,
  persentase_kehadiran_guru: 0,
  total_hafalan: 0,
  rata_nilai: 0,
  absensi_hari_ini: 0,
  nilai_terisi: 0,
  total_wali_akun: 0,
  wali_belum_ganti_pin: 0,
  santri_poin_tertinggi: [],
  kas_masuk: 0,
  kas_keluar: 0,
  saldo_kas: 0,
  total_pembayaran: 0,
  total_tunggakan: 0,
  total_pelanggaran: 0,
  total_perizinan: 0,
  belum_kembali: 0,
  tamu_hari_ini: 0,
  tamu_bulan_ini: 0,
  tamu_masih_didalam: 0,
  grafik_kas: [],
  transaksi_terbaru: [],
  pembayaran_terbaru: [],
  top_tunggakan: [],
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

        console.log("SUMMARY:", response.data);

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

  <div
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
  </div>

</div>

        {/* ====================== */}
        {/* SUPERADMIN */}
        {/* ====================== */}

        {user?.role === "superadmin" && (() => {

          const fmtRp = (n) => Number(n || 0).toLocaleString("id-ID");

          const sectionLabel = {
            fontSize: "13px",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#64748B",
            marginTop: "28px",
            marginBottom: "12px",
          };

          const kpiGrid = {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "16px",
            marginBottom: "8px",
          };

          const kpiCard = (icon, label, value, accent) => (
            <div style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "20px 24px",
              boxShadow: "0 2px 12px rgba(0,0,0,.06)",
              borderLeft: `5px solid ${accent}`,
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}>
              <span style={{ fontSize: "22px" }}>{icon}</span>
              <span style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", lineHeight: 1 }}>{value}</span>
              <span style={{ fontSize: "13px", color: "#64748B" }}>{label}</span>
            </div>
          );

          const cardBox = {
            background: "#fff",
            borderRadius: "16px",
            padding: "20px 24px",
            boxShadow: "0 2px 12px rgba(0,0,0,.06)",
          };

          const maxBar = Math.max(...(grafikKas.map(i => Math.max(i.masuk, i.keluar))), 1);

          const shortcuts = [
            { icon: "👥", label: "Tambah Santri",      href: "/santri" },
            { icon: "💰", label: "Pembayaran",         href: "/pembayaran" },
            { icon: "📋", label: "Absensi",            href: "/absensi" },
            { icon: "🕌", label: "Hafalan",            href: "/hafalan" },
            { icon: "⚠️", label: "Pelanggaran",        href: "/pelanggaran" },
            { icon: "📢", label: "Pengumuman",         href: "/pengumuman" },
            { icon: "🔑", label: "Perizinan",          href: "/perizinan" },
            { icon: "🏫", label: "Profil Pesantren",   href: "/profil-pesantren" },
          ];

          return (
            <div>

              {/* SECTION 1 — SANTRI */}
              <p style={sectionLabel}>📚 Statistik Santri</p>
              <div style={kpiGrid}>
                {kpiCard("👥", "Total Santri",  summary.total_santri,  "#14B8A6")}
                {kpiCard("✅", "Santri Aktif",   summary.santri_aktif || summary.total_santri, "#22C55E")}
                {kpiCard("❌", "Non Aktif",       summary.santri_non_aktif || 0,               "#EF4444")}
                {kpiCard("🏫", "Total Kelas",    summary.total_kelas,   "#8B5CF6")}
              </div>

              {/* SECTION 1B — KEUANGAN */}
              <p style={sectionLabel}>💰 Statistik Keuangan</p>
              <div style={kpiGrid}>
                {kpiCard("🏦", "Saldo Buku Kas",          `Rp ${fmtRp(summary.saldo_kas)}`,        "#F59E0B")}
                {kpiCard("📥", "Kas Masuk Bulan Ini",     `Rp ${fmtRp(summary.kas_masuk)}`,        "#22C55E")}
                {kpiCard("📤", "Kas Keluar Bulan Ini",    `Rp ${fmtRp(summary.kas_keluar)}`,       "#EF4444")}
                {kpiCard("⚠️", "Tunggakan Sahriyah",       `Rp ${fmtRp(summary.total_tunggakan)}`, "#DC2626")}
              </div>

              {/* SECTION 1C — AKADEMIK */}
              <p style={sectionLabel}>📖 Statistik Akademik</p>
              <div style={kpiGrid}>
                {kpiCard("📝", "Nilai Terisi Bulan Ini",   summary.nilai_terisi || 0,                    "#3B82F6")}
                {kpiCard("🕌", "Hafalan Terisi Bulan Ini", summary.total_hafalan,                         "#8B5CF6")}
                {kpiCard("📋", "Absensi Hari Ini",         summary.absensi_hari_ini || 0,                 "#14B8A6")}
                {kpiCard("👨‍🏫", "Kehadiran Guru",           `${summary.persentase_kehadiran_guru}%`,      "#0EA5E9")}
              </div>

              {/* SECTION 1D — KEAMANAN */}
              <p style={sectionLabel}>🛡️ Keamanan &amp; Ketertiban</p>
              <div style={kpiGrid}>
                {kpiCard("⚠️", "Pelanggaran Bulan Ini", summary.total_pelanggaran || 0, "#F97316")}
                {kpiCard("🚪", "Perizinan Bulan Ini",   summary.total_perizinan   || 0, "#EAB308")}
                {kpiCard("🔙", "Belum Kembali",          summary.belum_kembali     || 0, "#EF4444")}
                {kpiCard("👤", "Tamu Hari Ini",          summary.tamu_hari_ini     || 0, "#6366F1")}
              </div>

              {/* SECTION 1E — WALI */}
              <p style={sectionLabel}>👪 Statistik Wali</p>
              <div style={kpiGrid}>
                {kpiCard("👪", "Total Akun Wali",     summary.total_wali_akun      || 0, "#14B8A6")}
                {kpiCard("🔐", "Belum Ganti PIN",      summary.wali_belum_ganti_pin || 0, "#F59E0B")}
                {kpiCard("👥", "Wali Terdaftar",       summary.total_wali           || 0, "#8B5CF6")}
              </div>

              {/* SECTION 2 — GRAFIK KEUANGAN */}
              {grafikKas.length > 0 && (
                <div>
                  <p style={sectionLabel}>📊 Grafik Keuangan {new Date().getFullYear()}</p>
                  <div style={{ ...cardBox, marginBottom: "8px" }}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "flex-end", height: "180px" }}>
                      {grafikKas.map((item) => (
                        <div key={item.bulan} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: "150px" }}>
                            <div
                              title={`Masuk: Rp ${fmtRp(item.masuk)}`}
                              style={{ width: "12px", background: "#22C55E", height: `${Math.max((item.masuk / maxBar) * 150, 2)}px`, borderRadius: "3px 3px 0 0" }}
                            />
                            <div
                              title={`Keluar: Rp ${fmtRp(item.keluar)}`}
                              style={{ width: "12px", background: "#EF4444", height: `${Math.max((item.keluar / maxBar) * 150, 2)}px`, borderRadius: "3px 3px 0 0" }}
                            />
                          </div>
                          <span style={{ fontSize: "10px", color: "#94A3B8", marginTop: "4px" }}>{item.bulan}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
                      <span style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ width: "12px", height: "12px", background: "#22C55E", display: "inline-block", borderRadius: "2px" }} /> Masuk
                      </span>
                      <span style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ width: "12px", height: "12px", background: "#EF4444", display: "inline-block", borderRadius: "2px" }} /> Keluar
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3 — SANTRI POIN TERTINGGI */}
              {(summary.santri_poin_tertinggi || []).length > 0 && (
                <div>
                  <p style={sectionLabel}>⚠️ Santri Pelanggaran Tertinggi Bulan Ini</p>
                  <div style={cardBox}>
                    {(summary.santri_poin_tertinggi || []).map((s, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < (summary.santri_poin_tertinggi.length - 1) ? "1px solid #F1F5F9" : "none" }}>
                        <span style={{ fontWeight: "500" }}>{i + 1}. {s.nama}</span>
                        <span style={{ background: "#FEE2E2", color: "#DC2626", padding: "2px 10px", borderRadius: "20px", fontSize: "13px", fontWeight: "700" }}>
                          {s.jumlah_pelanggaran}x
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 4 — AKTIVITAS TERBARU */}
              <p style={sectionLabel}>🕐 Aktivitas Terbaru</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

                <div style={cardBox}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "700" }}>💳 Pembayaran Terbaru</h3>
                  {pembayaranTerbaru.slice(0, 6).length === 0
                    ? <p style={{ color: "#94A3B8", fontSize: "14px" }}>Belum ada pembayaran.</p>
                    : pembayaranTerbaru.slice(0, 6).map((item) => (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #F8FAFC" }}>
                        <div>
                          <div style={{ fontWeight: "600", fontSize: "13px" }}>{item.nama}</div>
                          <div style={{ fontSize: "12px", color: "#64748B" }}>{item.nama_tagihan}</div>
                        </div>
                        <span style={{ color: "#22C55E", fontWeight: "700", fontSize: "13px" }}>
                          Rp {Number(item.nominal_bayar || 0).toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))
                  }
                </div>

                <div style={cardBox}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "700" }}>💰 Transaksi Kas Terbaru</h3>
                  {transaksiTerbaru.slice(0, 6).length === 0
                    ? <p style={{ color: "#94A3B8", fontSize: "14px" }}>Belum ada transaksi.</p>
                    : transaksiTerbaru.slice(0, 6).map((item) => (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #F8FAFC" }}>
                        <div>
                          <div style={{ fontWeight: "600", fontSize: "13px" }}>{item.keterangan || item.kategori || "-"}</div>
                          <div style={{ fontSize: "12px", color: "#64748B" }}>{item.jenis} · {new Date(item.tanggal).toLocaleDateString("id-ID")}</div>
                        </div>
                        <span style={{ color: item.jenis === "Masuk" ? "#22C55E" : "#EF4444", fontWeight: "700", fontSize: "13px" }}>
                          {item.jenis === "Masuk" ? "+" : "−"}Rp {Number(item.nominal || 0).toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))
                  }
                </div>

              </div>

              {/* SECTION 5 — SHORTCUT MODUL */}
              <p style={sectionLabel}>⚡ Shortcut Modul</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "32px" }}>
                {shortcuts.map((s) => (
                  <a
                    key={s.href}
                    href={s.href}
                    style={{
                      background: "#fff",
                      borderRadius: "14px",
                      padding: "18px 14px",
                      boxShadow: "0 2px 12px rgba(0,0,0,.06)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                      textDecoration: "none",
                      color: "#0F172A",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "box-shadow .2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 24px rgba(20,184,166,.25)"}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,.06)"}
                  >
                    <span style={{ fontSize: "28px" }}>{s.icon}</span>
                    {s.label}
                  </a>
                ))}
              </div>

            </div>
          );

        })()}

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