import {

  useEffect,
  useState

} from "react";

import api
from "../services/api";

import Sidebar
from "../components/Sidebar";

function PelanggaranPage() {

  // ======================
  // STATES
  // ======================

  const [

    pelanggaran,
    setPelanggaran

  ] = useState([]);

  const [

  editId,
  setEditId

  ] = useState(null);

  const [

  search,
  setSearch

  ] = useState("");

  const [

    santri,
    setSantri

  ] = useState([]);

  const FORM_INIT = {
    santri_id: "",
    tanggal: "",
    jenis: "",
    tingkat: "",
    poin: 0,
    catatan: "",
    tindakan: "",
    petugas: "",
  };

  const [

    form,
    setForm

  ] = useState(FORM_INIT);

  // ======================
  // GET PELANGGARAN
  // ======================

  const getPelanggaran =
  async () => {

    try {

      const response =

        await api.get(
          "/pelanggaran"
        );

      setPelanggaran(

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
  // CREATE
  // ======================
  const deletePelanggaran =
  async (id) => {

  if (

    !window.confirm(

      "Hapus data ini?"

    )

  )

    return;

  try {

    await api.delete(

      `/pelanggaran/${id}`

    );

    getPelanggaran();

  }

  catch (err) {

    console.log(err);

    alert(

      "Gagal hapus"

    );

  }

  };

  const editPelanggaran =

  (p) => {

    setForm({

      santri_id:
        p.santri_id,

      tanggal:
        p.tanggal
        ?.split("T")[0],

      jam:
        p.jam || "",

      jenis:
        p.jenis,

      tingkat:
        p.tingkat || "",

      poin:
        p.poin,

      catatan:
        p.catatan || "",

      tindakan:
        p.tindakan || "",

      petugas:
        p.petugas || ""

    });

    setEditId(

      p.id

    );

  };

  const createPelanggaran =
async () => {

  try {

    if (editId) {

      await api.put(

        `/pelanggaran/${editId}`,

        {

          ...form,

          poin:
            Number(form.poin)

        }

      );

    }

    else {

      await api.post(

        "/pelanggaran",

        {

          ...form,

          poin:
            Number(form.poin)

        }

      );

    }

    alert(

      "Data berhasil disimpan"

    );

    setEditId(null);

    setForm(FORM_INIT);

    getPelanggaran();

  }

  catch (err) {

    console.log(err);

    alert(

      "Gagal simpan"

    );

  }

};

  // ======================
  // LOAD
  // ======================

  useEffect(() => {

    getPelanggaran();

    getSantri();

  }, []);

  const filtered =

  pelanggaran.filter(

    (p) =>

      p.nama

      ?.toLowerCase()

      .includes(

        search.toLowerCase()

      )

  );

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

          Pelanggaran Santri

        </h1>

        <br />

        {/* FORM */}

        <div

          style={{

            background: "white",

            padding: "20px",

            borderRadius: "16px",

            marginBottom: "20px"

          }}

        >

          <h3>

            Input Pelanggaran

          </h3>

          <br />

          {/* SANTRI */}

          <select

            value={
              form.santri_id
            }

            onChange={(e) =>

              setForm({

                ...form,

                santri_id:
                e.target.value

              })

            }

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

          <br />
          <br />

          {/* TANGGAL */}

          <input

            type="date"

            value={form.tanggal}

            onChange={(e) =>

              setForm({

                ...form,

                tanggal:
                e.target.value

              })

            }

          />

          {/* JAM */}

          <input

  type="time"

  value={form.jam}

  onChange={(e)=>

    setForm({

      ...form,

      jam:
      e.target.value

    })

  }

/>

          <br />
          <br />

          {/* JENIS */}

          <input

            type="text"

            placeholder="Jenis Pelanggaran"

            value={form.jenis}

            onChange={(e) =>

              setForm({

                ...form,

                jenis:
                e.target.value

              })

            }

          />

          <select

  value={form.tingkat}

  onChange={(e)=>

    setForm({

      ...form,

      tingkat:
      e.target.value

    })

  }

> 

{/* TINGKAT */}

  <option value="">
    Pilih Tingkat
  </option>

  <option value="Ringan">
    Ringan
  </option>

  <option value="Sedang">
    Sedang
  </option>

  <option value="Berat">
    Berat
  </option>

</select>

          <br />
          <br />

          {/* POIN */}

          <input

            type="number"

            placeholder="Poin"

            value={form.poin}

            onChange={(e) =>

              setForm({

                ...form,

                poin:
                e.target.value

              })

            }

          />

          <br />
          <br />

          {/* CATATAN */}

          <textarea

            placeholder="Catatan"

            value={form.catatan}

            onChange={(e) =>

              setForm({

                ...form,

                catatan:
                e.target.value

              })

            }

          />

          <br />
          <br />

          {/* TINDAKAN */}

          <textarea

            placeholder="Tindakan"

            value={form.tindakan}

            onChange={(e) =>

              setForm({

                ...form,

                tindakan:
                e.target.value

              })

            }

          />

          <input
  type="text"
  placeholder="Nama Petugas"
  value={form.petugas}
  onChange={(e)=>

    setForm({

      ...form,

      petugas:
      e.target.value

    })

  }

  />

          <br />
          <br />

          <button

            onClick={
              createPelanggaran
            }

          >

            Simpan

          </button>

        </div>


        {/* TABLE */}

        <input

  type="text"

  placeholder="Cari Nama Santri..."

  value={search}

  onChange={(e)=>

    setSearch(

      e.target.value

    )

  }

  style={{

    padding:"10px",

    width:"300px",

    marginBottom:"15px"

  }}

/>

        <table

          border="1"

          cellPadding="10"

          width="100%"

        >

          <thead>

            <tr>

              <th>Nama</th>

              <th>Tanggal</th>

              <th>Jenis</th>

              <th>Poin</th>

              <th>Tindakan</th>

              <th>Petugas</th>

                <th>Aksi</th>

            </tr>

          </thead>

          <tbody>

            {

              filtered.map((p) => (

                <tr key={p.id}>

                  <td>

                    {p.nama}

                  </td>

                  <td>

                    {p.tanggal}

                  </td>

                  <td>

                    {p.jenis}

                  </td>

                  <td>

                    {p.poin}

                  </td>

                  <td>

                    {p.tindakan}

                  </td>

                  <td>

  {p.petugas || "-"}

</td>

<td>

  <button

  onClick={()=>

    editPelanggaran(p)

  }

>

  Edit

</button>

{" "}

<button

  onClick={()=>

    deletePelanggaran(

      p.id

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

export default PelanggaranPage;