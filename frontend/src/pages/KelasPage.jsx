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

function KelasPage() {

  // ======================
  // STATE
  // ======================

  const [

    kelas,
    setKelas

  ] = useState([]);

  const [

    namaKelas,
    setNamaKelas

  ] = useState("");

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
  // LOAD
  // ======================

  useEffect(() => {

    getKelas();

  }, []);

  // ======================
  // ADD KELAS
  // ======================

  const addKelas =
    async () => {

      try {

        await api.post(

          "/kelas",

          {

            nama_kelas:
              namaKelas

          }

        );

        setNamaKelas("");

        getKelas();

      }

      catch (err) {

        console.log(err);

      }

    };

  // ======================
  // DELETE KELAS
  // ======================

  const deleteKelas =
    async (id) => {

      try {

        await api.delete(

          `/kelas/${id}`
        );

        getKelas();

      }

      catch (err) {

        console.log(err);

      }

    };

  return (

    <div>

      <Sidebar />

      <div

          style={{

    marginLeft: "280px",

    padding: "20px",

    minHeight: "100vh",

    background: "#f5f7fb"

  }}

      >

        <Topbar />

        <h1>

          Data Kelas

        </h1>

        <br />

        {/* INPUT */}

        <div
          style={{
            display: "flex",
            gap: "10px"
          }}
        >

          <input

            type="text"

            placeholder="Nama Kelas"

            value={namaKelas}

            onChange={(e) =>

              setNamaKelas(
                e.target.value
              )

            }

          />

          <button
            onClick={addKelas}
          >

            Tambah

          </button>

        </div>

        <br />

        {/* TABLE */}

        <table

          border="1"

          cellPadding="10"

          width="100%"

        >

          <thead>

            <tr>

              <th>ID</th>

              <th>Nama Kelas</th>

              <th>Aksi</th>

            </tr>

          </thead>

          <tbody>

            {

              Array.isArray(kelas)

              &&

              kelas.map((item) => (

                <tr key={item.id}>

                  <td>

                    {item.id}

                  </td>

                  <td>

                    {item.nama_kelas}

                  </td>

                  <td>

                    <button

                      onClick={() =>

                        deleteKelas(
                          item.id
                        )

                      }

                    >

                      Hapus

                    </button>

                  </td>

                </tr>

              ))

            }

          </tbody>

        </table>

      </div>

    </div>

  );

}

export default KelasPage;