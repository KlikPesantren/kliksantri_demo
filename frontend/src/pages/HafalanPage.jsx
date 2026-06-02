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

function HafalanPage() {

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

    hafalan,
    setHafalan

  ] = useState({});

  // ======================
// GET HAFALAN
// ======================

const getHafalan =
async () => {

  try {

    const response =

      await api.get(
        "/hafalan"
      );

    const data = {};

    response.data.data.forEach(

  (h) => {

    if (
      !h.pekan ||
      !h.santri_id
    ) return;

    const key =

      `${h.pekan}-${h.santri_id}`;

    data[key] = {

      kitab:
        h.kitab || "",

      awal:
        h.awal || "",

      akhir:
        h.akhir || "",

      catatan:
        h.catatan || ""

    };

  }

);

    setHafalan(data);

  }

  catch (err) {

    console.log(err);

  }

};

  // ======================
  // PEKAN
  // ======================

  const pekanList = [

    1, 2, 3, 4, 5

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

  getHafalan();

}, []);

  // ======================
  // HANDLE INPUT
  // ======================

  const handleHafalan =
  (

    pekan,
    santriId,
    field,
    value

  ) => {

    const key =

      `${pekan}-${santriId}`;

    setHafalan({

      ...hafalan,

      [key]: {

        ...hafalan[key],

        [field]:
        value

      }

    });

  };

  // ======================
  // SIMPAN
  // ======================

  const simpanHafalan =
  async () => {

    try {

      for (

        const key
        in hafalan

      ) {

        const [

          pekan,
          santriId

        ] = key.split("-");

        const data =
        hafalan[key];

        console.log(key);
        console.log(data);

        await api.post(

          "/hafalan",

          {

            santri_id:
              santriId,

            tanggal:
              new Date()

              .toISOString()

              .split("T")[0],

            kitab:
              data.kitab,

            awal:
              data.awal,

            akhir:
              data.akhir,

            catatan:
              data.catatan,

            bulan,

            tahun,

            pekan

          }

        );

      }

      alert(
        "Hafalan berhasil disimpan"
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

    pekanList.forEach((p) => {

      const data =

        hafalan[
          `${p}-${s.id}`
        ] || {};

      rows.push({

        Nama:
          s.nama,

        Pekan:
          p,

        Kitab:
          data.kitab || "",

        Awal:
          data.awal || "",

        Akhir:
          data.akhir || "",

        Catatan:
          data.catatan || ""

      });

    });

  });

  exportExcel(
    rows,
    "Hafalan"
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

          Hafalan Mingguan

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

        {/* MULTI TABLE */}

        {

          pekanList.map((pekan) => (

            <div

              key={pekan}

              style={{

                marginBottom: "50px"

              }}

            >

              <h2>

                Pekan {pekan}

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

                    <th style={thStyle}>

                      Nama

                    </th>

                    <th style={thStyle}>

                      Kitab

                    </th>

                    <th style={thStyle}>

                      Awal

                    </th>

                    <th style={thStyle}>

                      Akhir

                    </th>

                    <th style={thStyle}>

                      Catatan

                    </th>

                  </tr>

                </thead>

                <tbody>

                  {

                    santri.map((s) => {

                      const key =

                        `${pekan}-${s.id}`;

                      return (

                        <tr key={key}>

                          <td style={tdStyle}>

                            {s.nama}

                          </td>

                          <td style={tdStyle}>

  <input

    type="text"

    value={

      hafalan[
        `${pekan}-${s.id}`
      ]?.kitab || ""

    }

    onChange={(e) =>

      handleHafalan(

        pekan,

        s.id,

        "kitab",

        e.target.value

      )

    }

  />

</td>

<td style={tdStyle}>

  <input

    type="text"

    value={

      hafalan[
        `${pekan}-${s.id}`
      ]?.awal || ""

    }

    onChange={(e) =>

      handleHafalan(

        pekan,

        s.id,

        "awal",

        e.target.value

      )

    }

  />

</td>

<td style={tdStyle}>

  <input

    type="text"

    value={

      hafalan[
        `${pekan}-${s.id}`
      ]?.akhir || ""

    }

    onChange={(e) =>

      handleHafalan(

        pekan,

        s.id,

        "akhir",

        e.target.value

      )

    }

  />

</td>

<td style={tdStyle}>

  <input

    type="text"

    value={

      hafalan[
        `${pekan}-${s.id}`
      ]?.catatan || ""

    }

    onChange={(e) =>

      handleHafalan(

        pekan,

        s.id,

        "catatan",

        e.target.value

      )

    }

  />

</td>

                        </tr>

                      );

                    })

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
            simpanHafalan
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

          Simpan Hafalan

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

export default HafalanPage;