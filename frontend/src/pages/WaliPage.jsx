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

function WaliPage() {

  // ======================
  // STATES
  // ======================

  const [

    wali,
    setWali

  ] = useState([]);

  const [

    santri,
    setSantri

  ] = useState([]);

  const [

    editId,
    setEditId

  ] = useState(null);

  const [

    form,
    setForm

  ] = useState({

    nama: "",

    nomor_hp: "",

    alamat: "",

    santri_id: ""

  });

  // ======================
  // GET WALI
  // ======================

  const DEFAULT_PIN_DISPLAY = "456789";

  const getWali =
  async () => {

    try {

      const response =

        await api.get(
          "/wali"
        );

      setWali(

        response.data.data || []

      );

    }

    catch (err) {

      console.log(err);

    }

  };

  const resetPin =
  async (id, nama) => {

    if (
      !window.confirm(
        `Reset PIN ${nama} ke ${DEFAULT_PIN_DISPLAY}?`
      )
    ) return;

    try {

      await api.put(`/wali/${id}/reset-pin`);

      alert(
        `PIN ${nama} berhasil direset ke ${DEFAULT_PIN_DISPLAY}.\nWali wajib ganti PIN saat login berikutnya.`
      );

    }

    catch (err) {

      console.log(err);

      alert(
        err.response?.data?.error || "Gagal reset PIN"
      );

    }

  };

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
  // LOAD
  // ======================

  useEffect(() => {

    getWali();

    getSantri();

  }, []);

  // ======================
  // HANDLE CHANGE
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
  // RESET FORM
  // ======================

  const resetForm =
  () => {

    setForm({

      nama: "",

      nomor_hp: "",

      alamat: "",

      santri_id: ""

    });

  };

  // ======================
  // CREATE
  // ======================

  const createWali =
  async () => {

    try {

      await api.post(

        "/wali",

        form

      );

      alert(
        "Wali berhasil"
      );

      resetForm();

      getWali();

    }

    catch (err) {

      console.log(err);

      alert(
        "Gagal input"
      );

    }

  };

  // ======================
  // EDIT
  // ======================

  const editWali =
  (item) => {

    setEditId(item.id);

    setForm({

      nama:
      item.nama || "",

      nomor_hp:
      item.nomor_hp || "",

      alamat:
      item.alamat || "",

      santri_id:
      item.santri_id || ""

    });

  };

  // ======================
  // UPDATE
  // ======================

  const updateWali =
  async () => {

    try {

      await api.put(

        `/wali/${editId}`,

        form

      );

      alert(
        "Wali updated"
      );

      resetForm();

      getWali();

      setEditId(null);

    }

    catch (err) {

      console.log(err);

    }

  };

  // ======================
  // DELETE
  // ======================

  const deleteWali =
  async (id) => {

    try {

      await api.delete(

        `/wali/${id}`

      );

      getWali();

    }

    catch (err) {

      console.log(err);

    }

  };


const handleExport =
() => {

  const rows =

    wali.map((item) => ({

      Nama:
        item.nama,

      NomorHP:
        item.nomor_hp,

      Alamat:
        item.alamat,

      Santri:
        item.nama_santri

    }));

  exportExcel(
    rows,
    "WaliSantri"
  );

};

  return (

    <div

      style={{

        display: "flex",

        minHeight: "100vh",

        background: "#f5f7fb"

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

        <h1>

          Wali Santri

        </h1>

        <br />

        {/* FORM */}

        <div

          style={{

            background: "white",

            padding: "20px",

            borderRadius: "16px",

            marginBottom: "20px",

            display: "flex",

            gap: "10px",

            flexWrap: "wrap"

          }}

        >

          <input

            type="text"

            name="nama"

            placeholder="Nama Wali"

            value={form.nama}

            onChange={handleChange}

          />

          <input

            type="text"

            name="nomor_hp"

            placeholder="Nomor HP"

            value={form.nomor_hp}

            onChange={handleChange}

          />

          <input

            type="text"

            name="alamat"

            placeholder="Alamat"

            value={form.alamat}

            onChange={handleChange}

          />

          <select

            name="santri_id"

            value={form.santri_id}

            onChange={handleChange}

          >

            <option value="">

              Pilih Santri

            </option>

            {

              santri.map((s) => (

                <option

                  key={s.id}

                  value={s.id}

                >

                  {s.nama}

                </option>

              ))

            }

          </select>

          <button

            onClick={

              editId

              ?

              updateWali

              :

              createWali

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

        {/* TABLE */}

        <table

          border="1"

          cellPadding="10"

          width="100%"

        >

          <thead>

            <tr>

              <th>Nama</th>

              <th>Nomor HP</th>

              <th>PIN Awal</th>

              <th>Santri</th>

              <th>Aksi</th>

            </tr>

          </thead>

          <tbody>

            {

              wali.map((item) => (

                <tr key={item.id}>

                  <td>

                    {item.nama}

                  </td>

                  <td>

                    {item.nomor_hp || "-"}

                  </td>

                  <td

                    style={{
                      fontFamily: "monospace",
                      letterSpacing: "2px",
                      color: "#555"
                    }}

                  >

                    {DEFAULT_PIN_DISPLAY}

                  </td>

                  <td>

                    {item.nama_santri || "-"}

                  </td>

                  <td>

                    <button

                      onClick={() =>

                        editWali(item)

                      }

                    >

                      Edit

                    </button>

                    {" "}

                    <button

                      onClick={() =>

                        deleteWali(
                          item.id
                        )

                      }

                    >

                      Hapus

                    </button>

                    {" "}

                    <button

                      onClick={() =>
                        resetPin(item.id, item.nama)
                      }

                      style={{
                        backgroundColor: "#e67e22",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "4px 10px",
                        cursor: "pointer"
                      }}

                    >

                      Reset PIN

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

export default WaliPage;