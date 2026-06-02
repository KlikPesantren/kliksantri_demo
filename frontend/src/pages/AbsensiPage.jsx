import {

  useEffect,
  useState

} from "react";

import api
from "../services/api";

import Sidebar
from "../components/Sidebar";

import {
 exportExcel
}
from "../utils/exportExcel";

function AbsensiPage() {

  // ======================
  // STATES
  // ======================

  const [

    kelas,
    setKelas

  ] = useState([]);

  const [

    kelasId,
    setKelasId

  ] = useState("");

  const [

    bulan,
    setBulan

  ] = useState(

    new Date().getMonth() + 1

  );

  const [

    tahun,
    setTahun

  ] = useState(

    new Date().getFullYear()

  );

  const [

    santri,
    setSantri

  ] = useState([]);

  const [

    absensi,
    setAbsensi

  ] = useState({});

  // ======================
  // GET ABSENSI
  // ======================

  const getAbsensi =
  async () => {

    try {

      const response =

        await api.get(
          "/absensi"
        );

      const data = {};

      response.data.data.forEach(

        (a) => {

          if (
            !a.tanggal ||
            !a.sesi
          ) return;

          const date =

            new Date(
              a.tanggal
            );

          const hari =

            date.getDate();

          const key =

            `${a.sesi}-${a.santri_id}-${hari}`;

          data[key] =
            a.status;

        }

      );

      setAbsensi(data);

    }

    catch (err) {

      console.log(err);

    }

  };

  // ======================
  // SESI
  // ======================

  const sesiList = [

    "Ngaji Pagi",

    "Sekolah",

    "Ngaji Siang",

    "Ngaji Sore",

    "Ngaji Malam"

  ];

  // ======================
  // GET KELAS
  // ======================

  const getKelas =
  async () => {

    try {

      const response =

        await api.get(
          "/kelas"
        );

      setKelas(

        response.data.data || []

      );

    }

    catch (err) {

      console.log(err);

    }

  };

  // ======================
  // GET SANTRI
  // ======================

  const getSantri =
  async (id) => {

    try {

      const response =

        await api.get(
          "/santri"
        );

      const filtered =

        response.data.data.filter(

          (s) =>

            String(
              s.kelas_id
            ) === String(id)

        );

      setSantri(filtered);

    }

    catch (err) {

      console.log(err);

    }

  };

  // ======================
  // LOAD
  // ======================

  useEffect(() => {

    getKelas();

    getAbsensi();

  }, []);

  // ======================
  // HANDLE ABSENSI
  // ======================

  const handleAbsensi =
  (

    sesi,
    santriId,
    hari,
    value

  ) => {

    const key =

      `${sesi}-${santriId}-${hari}`;

    setAbsensi({

      ...absensi,

      [key]:
      value

    });

  };

  // ======================
  // SIMPAN
  // ======================

  const simpanAbsensi =
  async () => {

    try {

      for (

        const key
        in absensi

      ) {

        const [

          sesi,
          santriId,
          hari

        ] = key.split("-");

        const tanggal =

          `${tahun}-${String(
            bulan
          ).padStart(2, "0")}-${String(
            hari
          ).padStart(2, "0")}`;

        await api.post(

          "/absensi",

          {

            santri_id:
              santriId,

            tanggal,

            sesi,

            status:
              absensi[key]

          }

        );

      }

      alert(
        "Absensi berhasil disimpan"
      );

    }

    catch (err) {

      console.log(err);

      alert(
        "Gagal simpan"
      );

    }

  };

  // ======================
  // TOTAL HARI
  // ======================

  const totalHari =

    new Date(

      tahun,
      bulan,
      0

    ).getDate();

  const handleExport =
() => {

  const rows = [];

  santri.forEach((s) => {

    sesiList.forEach((sesi) => {

      for (
        let hari = 1;
        hari <= totalHari;
        hari++
      ) {

        rows.push({

          Nama:
            s.nama,

          Sesi:
            sesi,

          Tanggal:
            `${hari}/${bulan}/${tahun}`,

          Status:

            absensi[
              `${sesi}-${s.id}-${hari}`
            ] || "-"

        });

      }

    });

  });

  exportExcel(
    rows,
    "Absensi"
  );

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

          overflowX: "auto"

        }}

      >

        <h1>

          Absensi Bulanan

        </h1>

        <br />

        {/* FILTER */}

        <div

          style={{

            display: "flex",

            gap: "10px",

            marginBottom: "20px"

          }}

        >

          {/* KELAS */}

          <select

            value={kelasId}

            onChange={(e) => {

              setKelasId(
                e.target.value
              );

              getSantri(
                e.target.value
              );

            }}

          >

            <option value="">

              Pilih Kelas

            </option>

            {

              kelas.map((k) => (

                <option

                  key={k.id}

                  value={k.id}

                >

                  {k.nama_kelas}

                </option>

              ))

            }

          </select>

          {/* BULAN */}

          <select

            value={bulan}

            onChange={(e) =>

              setBulan(
                e.target.value
              )

            }

          >

            {

              Array.from({

                length: 12

              }).map((_, i) => (

                <option

                  key={i + 1}

                  value={i + 1}

                >

                  Bulan {i + 1}

                </option>

              ))

            }

          </select>

          {/* TAHUN */}

          <input

            type="number"

            value={tahun}

            onChange={(e) =>

              setTahun(
                e.target.value
              )

            }

          />

        </div>

        {/* MULTI TABEL */}

        {

          sesiList.map((sesi) => (

            <div

              key={sesi}

              style={{

                marginBottom: "50px"

              }}

            >

              <h2>

                {sesi}

              </h2>

              <br />

              <table

                style={{

                  borderCollapse:
                    "collapse",

                  background:
                    "white",

                  width: "100%"

                }}

              >

                <thead>

                  <tr>

                    <th

                      style={{

                        border:
                          "1px solid #dcdcdc",

                        padding: "10px",

                        background:
                          "#f0f0f0",

                        minWidth:
                          "180px"

                      }}

                    >

                      Nama

                    </th>

                    {

                      Array.from({

                        length:
                        totalHari

                      }).map((_, i) => (

                        <th

                          key={i}

                          style={{

                            border:
                              "1px solid #dcdcdc",

                            padding: "6px",

                            background:
                              "#f0f0f0"

                          }}

                        >

                          {i + 1}

                        </th>

                      ))

                    }

                  </tr>

                </thead>

                <tbody>

                  {

                    santri.map((s) => (

                      <tr key={s.id}>

                        <td

                          style={{

                            border:
                              "1px solid #dcdcdc",

                            padding: "8px",

                            background:
                              "#fafafa",

                            fontWeight:
                              "500"

                          }}

                        >

                          {s.nama}

                        </td>

                        {

                          Array.from({

                            length:
                            totalHari

                          }).map((_, i) => {

                            const hari =
                            i + 1;

                            return (

                              <td

                                key={hari}

                                style={{

                                  border:
                                    "1px solid #e5e5e5",

                                  padding: "4px",

                                  textAlign:
                                    "center"

                                }}

                              >

                                <select

                                  value={

                                    absensi[
                                      `${sesi}-${s.id}-${hari}`
                                    ] || ""

                                  }

                                  onChange={(e) =>

                                    handleAbsensi(

                                      sesi,

                                      s.id,

                                      hari,

                                      e.target.value

                                    )

                                  }

                                  style={{

                                    border:
                                      "none",

                                    background:
                                      "transparent"

                                  }}

                                >

                                  <option value="">

                                    -

                                  </option>

                                  <option value="H">

                                    Hadir

                                  </option>

                                  <option value="I">

                                    Izin

                                  </option>

                                  <option value="S">

                                    Sakit

                                  </option>

                                  <option value="A">

                                    Alfa

                                  </option>

                                </select>

                              </td>

                            );

                          })

                        }

                      </tr>

                    ))

                  }

                </tbody>

              </table>

            </div>

          ))

        }

        <button

  onClick={
    handleExport
  }

  style={{
    padding:"10px 20px",
    marginRight:"10px"
  }}

>

  Export Excel

</button>

        <button

          onClick={
            simpanAbsensi
          }

          style={{

            padding:
              "10px 20px",

            border:
              "none",

            borderRadius:
              "10px",

            cursor:
              "pointer"

          }}

        >

          Simpan Semua Absensi

        </button>

      </div>

    </div>

  );

}

export default AbsensiPage;