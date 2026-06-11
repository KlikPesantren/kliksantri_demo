import {

  useEffect,
  useState

} from "react";

import api
from "../services/api";

import Sidebar
from "../components/Sidebar";

function AbsensiGuruPage() {

  const [

    guru,
    setGuru

  ] = useState([]);

  const [

    data,
    setData

  ] = useState({});

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

  // ======================
  // GET GURU
  // ======================

  const getGuru =
  async () => {

    try {

      const response =

        await api.get(
          "/guru"
        );

      setGuru(

        response.data.data || []

      );

    }

    catch (err) {

      console.log(err);

    }

  };

useEffect(() => {
  getGuru();
  getAbsensiGuru();
}, [bulan, tahun]);

  // ======================
  // HANDLE
  // ======================

  const handleInput =
  (

    guruId,
    field,
    value

  ) => {

    setData({

      ...data,

      [guruId]: {

        ...data[guruId],

        [field]:
        value

      }

    });

  };

  // ======================
  // SIMPAN
  // ======================

  const simpan =
  async () => {

    try {

      for (

        const guruId
        in data

      ) {

        const d =
        data[guruId];

        await api.post(

          "/absensi-guru",

          {

            guru_id:
              guruId,

            bulan,

            tahun,

            total_hadir:
              d.total_hadir || 0,

            total_izin:
              d.total_izin || 0,

            total_sakit:
              d.total_sakit || 0,

            total_alfa:
              d.total_alfa || 0

          }

        );

      }

      alert(
        "Absensi guru berhasil disimpan"
      );

    }

    catch (err) {

      console.log(err);

      alert(
        "Gagal simpan"
      );

    }

  };

const getAbsensiGuru = async () => {
  try {
    const response = await api.get("/absensi-guru");

    const obj = {};

    response.data.data.forEach((row) => {
      if (
        Number(row.bulan) === Number(bulan) &&
        Number(row.tahun) === Number(tahun)
      ) {
        obj[row.guru_id] = {
          total_hadir: row.total_hadir,
          total_izin: row.total_izin,
          total_sakit: row.total_sakit,
          total_alfa: row.total_alfa,
        };
      }
    });

    setData(obj);
  } catch (err) {
    console.log(err);
  }
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

          padding: "20px"

        }}

      >

        <h1>

          Absensi Guru

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

            width: "100%",

            borderCollapse:
              "collapse",

            background:
              "white"

          }}

        >

          <thead>

            <tr>

              <th style={thStyle}>

                Nama Guru

              </th>

              <th style={thStyle}>

                Jabatan

              </th>

              <th style={thStyle}>

                Hadir

              </th>

              <th style={thStyle}>

                Izin

              </th>

              <th style={thStyle}>

                Sakit

              </th>

              <th style={thStyle}>

                Alfa

              </th>

            </tr>

          </thead>

          <tbody>

            {

              guru.map((g) => (

                <tr key={g.id}>

                  <td style={tdStyle}>

                    {g.nama}

                  </td>

                  <td style={tdStyle}>

                    {g.jabatan}

                  </td>

                  <td style={tdStyle}>

                   <input
  type="number"
  value={data[g.id]?.total_hadir || ""}
  onChange={(e) =>
    handleInput(
      g.id,
      "total_hadir",
      e.target.value
    )
  }
/>

                  </td>

                  <td style={tdStyle}>

                    <input

                      type="number"
                      value={data[g.id]?.total_izin || ""}
                      onChange={(e) =>

                        handleInput(

                          g.id,

                          "total_izin",

                          e.target.value

                        )

                      }

                    />

                  </td>

                  <td style={tdStyle}>

                    <input

                      type="number"
                      value={data[g.id]?.total_sakit || ""}
                      onChange={(e) =>

                        handleInput(

                          g.id,

                          "total_sakit",

                          e.target.value

                        )

                      }

                    />

                  </td>

                  <td style={tdStyle}>

                    <input

                      type="number"
                      value={data[g.id]?.total_alfa || ""}s
                      onChange={(e) =>

                        handleInput(

                          g.id,

                          "total_alfa",

                          e.target.value

                        )

                      }

                    />

                  </td>

                </tr>

              ))

            }

          </tbody>

        </table>

        <br />

        <button onClick={simpan}>

          Simpan Absensi Guru

        </button>

      </div>

    </div>

  );

}

// ======================
// STYLE
// ======================

const thStyle = {

  border:
    "1px solid #dcdcdc",

  padding:
    "10px",

  background:
    "#f0f0f0"

};

const tdStyle = {

  border:
    "1px solid #e5e5e5",

  padding:
    "8px"

};

export default AbsensiGuruPage;