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

function NilaiPage() {

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

    nilai,
    setNilai

  ] = useState({});

  // ======================
// GET NILAI
// ======================

const getNilai =
async () => {

  try {

    const response =

      await api.get(
        "/nilai"
      );

    const data = {};

    response.data.data.forEach(

      (n) => {

const key =
`${n.santri_id}-${n.mapel}`;

        data[key] =
          n.nilai;

      }

    );

    setNilai(data);

  }

  catch (err) {

    console.log(err);

  }

};

  // ======================
  // MAPEL
  // ======================

  const mapelList = [

    "Nahwu",

    "Fiqih",

    "Tajwid",

    "Akhlak",

    "Tauhid"

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

  getNilai();

}, []);

  // ======================
  // HANDLE NILAI
  // ======================

  const handleNilai =
  (

    santriId,
    mapel,
    value

  ) => {

    const key =

      `${santriId}-${mapel}`;

    setNilai({

      ...nilai,

      [key]:
      value

    });

  };

  // ======================
  // SIMPAN
  // ======================

  const simpanNilai =
  async () => {

    try {

      for (

        const key
        in nilai

      ) {

        const [

          santriId,
          mapel

        ] = key.split("-");

        await api.post(

          "/nilai",

          {

            santri_id:
              santriId,

            tanggal:
             new Date()

             .toISOString()

             .split("T")[0],

            mapel,

            nilai:
              nilai[key],

            bulan,

            tahun

          }

        );

      }

      alert(
        "Nilai berhasil disimpan"
      );

    }

    catch (err) {

      console.log(err);

      alert(
        "Gagal simpan"
      );

    }

  };

const handleExport =
() => {

  const rows = [];

  santri.forEach((s) => {

    mapelList.forEach((m) => {

      rows.push({

        Nama:
          s.nama,

        MataPelajaran:
          m,

        Nilai:

          nilai[
            `${s.id}-${m}`
          ] || 0,

        Bulan:
          bulan,

        Tahun:
          tahun

      });

    });

  });

  exportExcel(
    rows,
    "Nilai"
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

          Nilai Santri

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

        {/* TABLE */}

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

                mapelList.map((m) => (

                  <th

                    key={m}

                    style={{

                      border:
                        "1px solid #dcdcdc",

                      padding: "10px",

                      background:
                        "#f0f0f0"

                    }}

                  >

                    {m}

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

                    mapelList.map((m) => (

                      <td

                        key={m}

                        style={{

                          border:
                            "1px solid #e5e5e5",

                          padding: "6px",

                          textAlign:
                            "center"

                        }}

                      >

                        <input

                          type="number"

                          min="0"

                          max="100"

                          value={

                            nilai[
                              `${s.id}-${m}`
                            ] || ""

                          }

                          onChange={(e) =>

                            handleNilai(

                              s.id,

                              m,

                              e.target.value

                            )

                          }

                          style={{

                            width: "70px",

                            border:
                              "none",

                            textAlign:
                              "center",

                            background:
                              "transparent"

                          }}

                        />

                      </td>

                    ))

                  }

                </tr>

              ))

            }

          </tbody>

        </table>

        <br />

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
            simpanNilai
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

          Simpan Nilai

        </button>

      </div>

    </div>

  );

}

export default NilaiPage;