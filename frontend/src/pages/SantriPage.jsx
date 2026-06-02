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

import {
  exportExcel
}
from "../utils/exportExcel";

function SantriPage() {

  // ======================
  // STATE
  // ======================

  const [

    santri,
    setSantri

  ] = useState([]);

  const [

    kelas,
    setKelas

  ] = useState([]);

  const [

    editId,
    setEditId

  ] = useState(null);

  const [

    form,
    setForm

  ] = useState({

    nis: "",

    nama: "",

    uid_rfid: "",

    alamat: "",

    orang_tua: "",

    nomor_hp_ortu: "",

    kelas_id: "",

    foto: ""

  });

  // ======================
  // GET SANTRI
  // ======================

  const getSantri =
  async () => {

    try {

      const response =

        await api.get(
          "/santri"
        );

      setSantri(

        response.data.data || []

      );

    }

    catch (err) {

      console.log(err);

    }

  };

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

    getSantri();

    getKelas();

  }, []);

  // ======================
  // HANDLE INPUT
  // ======================

  const handleChange =
  (e) => {

    setForm({

      ...form,

      [e.target.name]:
      e.target.value

    });

  };

  // ======================
  // ADD SANTRI
  // ======================

  const addSantri =
  async () => {

    try {

      await api.post(

        "/santri",

        form

      );

      resetForm();

      getSantri();

    }

    catch (err) {

      console.log(err);

    }

  };

  // ======================
  // EDIT SANTRI
  // ======================

  const editSantri =
  (item) => {

    setEditId(item.id);

    setForm({

      nis:
      item.nis || "",

      nama:
      item.nama || "",

      uid_rfid:
      item.uid_rfid || "",

      alamat:
      item.alamat || "",

      orang_tua:
      item.nama_wali || "",

      nomor_hp_ortu:
      item.nomor_hp || "",

      kelas_id:
      item.kelas_id || "",

      foto:
      item.foto || ""

    });

  };

  // ======================
  // UPDATE SANTRI
  // ======================

  const updateSantri =
  async () => {

    try {

      await api.put(

        `/santri/${editId}`,

        form

      );

      alert(
        "Santri updated"
      );

      resetForm();

      getSantri();

      setEditId(null);

    }

    catch (err) {

      console.log(err);

    }

  };

  // ======================
  // DELETE SANTRI
  // ======================

  const deleteSantri =
  async (id) => {

    try {

      await api.delete(

        `/santri/${id}`

      );

      getSantri();

    }

    catch (err) {

      console.log(err);

    }

  };

  // ======================
  // RESET FORM
  // ======================

  const resetForm = () => {

    setForm({

      nis: "",

      nama: "",

      uid_rfid: "",

      alamat: "",

      orang_tua: "",

      nomor_hp_ortu: "",

      kelas_id: "",

      foto: ""

    });

  };

const handleExport =
() => {

  const rows =

    santri.map((item) => ({

      NIS:
        item.nis,

      Nama:
        item.nama,

      Kelas:
        item.nama_kelas,

      Wali:
        item.nama_wali,

      NomorHP:
        item.nomor_hp,

      RFID:
        item.uid_rfid,

      Saldo:
        item.saldo

    }));

  exportExcel(
    rows,
    "Santri"
  );

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

          Data Santri

        </h1>

        <br />

        {/* FORM */}

        <div

          style={{

            display: "flex",

            gap: "10px",

            flexWrap: "wrap"

          }}

        >

          <input

            type="text"

            name="nis"

            placeholder="NIS"

            value={form.nis}

            onChange={handleChange}

          />

          <input

            type="text"

            name="nama"

            placeholder="Nama"

            value={form.nama}

            onChange={handleChange}

          />

          <input

            type="text"

            name="uid_rfid"

            placeholder="UID RFID"

            value={form.uid_rfid}

            onChange={handleChange}

          />

          <input

            type="text"

            name="alamat"

            placeholder="Alamat"

            value={form.alamat}

            onChange={handleChange}

          />

          <input

            type="text"

            name="orang_tua"

            placeholder="Orang Tua"

            value={form.orang_tua}

            onChange={handleChange}

          />

          <input

            type="text"

            name="nomor_hp_ortu"

            placeholder="No HP Ortu"

            value={form.nomor_hp_ortu}

            onChange={handleChange}

          />

          <input

            type="text"

            name="foto"

            placeholder="URL Foto"

            value={form.foto}

            onChange={handleChange}

          />

          <select

            name="kelas_id"

            value={form.kelas_id}

            onChange={handleChange}

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

          <button

            onClick={

              editId

              ?

              updateSantri

              :

              addSantri

            }

          >

            {

              editId

              ?

              "Update"

              :

              "Tambah"

            }

          </button>

        <button
  onClick={handleExport}
>
  Export Excel
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

              <th>Foto</th>

              <th>NIS</th>

              <th>Nama</th>

              <th>Kelas</th>

              <th>Wali</th>

              <th>No Telepon</th>

              <th>RFID</th>

              <th>Saldo</th>

              <th>Aksi</th>

            </tr>

          </thead>

          <tbody>

            {

              santri.map((item) => (

                <tr key={item.id}>

                  <td>

                    {

                      item.foto

                      ?

                      (

                        <img

                          src={item.foto}

                          alt="foto"

                          width="50"

                          height="50"

                          style={{

                            borderRadius: "10px",

                            objectFit: "cover"

                          }}

                        />

                      )

                      :

                      "-"

                    }

                  </td>

                  <td>{item.nis}</td>

                  <td>{item.nama}</td>

                  <td>{item.nama_kelas}</td>

                  <td>{item.nama_wali}</td>

                  <td>{item.nomor_hp}</td>

                  <td>{item.uid_rfid}</td>

                  <td>

                    Rp {

                      Number(

                        item.saldo || 0

                      ).toLocaleString()

                    }

                  </td>

                  <td>

                    <button

                      onClick={() =>

                        editSantri(item)

                      }

                    >

                      Edit

                    </button>

                    {" "}

                    <button

                      onClick={() =>

                        deleteSantri(
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

export default SantriPage;