import {

  useEffect,
  useState

} from "react";

import api
from "../services/api";

import Sidebar
from "../components/Sidebar";

function PerizinanPage() {

  // ======================
  // STATES
  // ======================

  const [

    perizinan,
    setPerizinan

  ] = useState([]);

  const [

  search,
  setSearch

  ] = useState("");

  const [

  editId,
  setEditId

  ] = useState(null);

  const [

    santri,
    setSantri

  ] = useState([]);

  const [

  form,
  setForm

] = useState({

  santri_id: "",

  tanggal: "",

  tujuan: "",

  alasan: "",

  tanggal_kembali: "",

  target_jam_kembali:"",

  jam_keluar: "",

  status: "keluar",

  catatan: ""

});

  // ======================
  // GET PERIZINAN
  // ======================

  const getPerizinan =
  async () => {

    try {

      const response =

        await api.get(
          "/perizinan"
        );

      setPerizinan(

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

const createPerizinan =
async () => {

  try {

    if (editId) {

      await api.put(

        `/perizinan/${editId}`,

        form

      );

    }

    else {

      await api.post(

        "/perizinan",

        form

      );

    }

    alert(

      "Data berhasil disimpan"

    );

    setEditId(null);

    setForm({

  santri_id:"",
  tanggal:"",
  tujuan:"",
  alasan:"",
  tanggal_kembali:"",
  target_jam_kembali:"",
  jam_keluar:"",
  status:"keluar",
  catatan:""

   });

    getPerizinan();

  }

  catch (err) {

    console.log(err);

    alert(

      "Gagal simpan"

    );

  }

};

  // ======================
  // KEMBALI
  // ======================

  const kembali =
  async (id) => {

    try {

      await api.put(

        `/perizinan/kembali/${id}`

      );

      getPerizinan();

    }

    catch (err) {

      console.log(err);

    }

  };

  const editPerizinan =

  (p) => {

    setForm({

      santri_id:
        p.santri_id,

      tanggal:
        p.tanggal
        ?.split("T")[0],

      tujuan:
        p.tujuan || "",

      alasan:
        p.alasan || "",

      tanggal_kembali:
        p.tanggal_kembali
        ?.split("T")[0] || "",

      target_jam_kembali:
      p.target_jam_kembali || "",

      jam_keluar:
        p.jam_keluar || "",

      status:
        p.status || "keluar",

      catatan:
        p.catatan || ""

    });

    setEditId(

      p.id

    );

  };

  const deletePerizinan =
async (id) => {

  if (

    !window.confirm(

      "Hapus data ini?"

    )

  )

    return;

  try {

    await api.delete(

      `/perizinan/${id}`

    );

    getPerizinan();

  }

  catch (err) {

    console.log(err);

  }

};

  // ======================
  // LOAD
  // ======================

  useEffect(() => {

    getPerizinan();

    getSantri();

  }, []);

  const filtered =

  perizinan.filter(

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

          Perizinan Santri

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

            Input Perizinan

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

          <br />
          <br />

          {/* JAM */}

          <input

            type="time"

            value={form.jam_keluar}

            onChange={(e) =>

              setForm({

                ...form,

                jam_keluar:
                e.target.value

              })

            }

          />

        <br />
<br />

<input

  type="text"

  placeholder="Tujuan"

  value={form.tujuan}

  onChange={(e) =>

    setForm({

      ...form,

      tujuan:
      e.target.value

    })

  }

/>

          <br />
          <br />

          {/* ALASAN */}

          <textarea

            placeholder="Alasan"

            value={form.alasan}

            onChange={(e) =>

              setForm({

                ...form,

                alasan:
                e.target.value

              })

            }

          />
         
         <br />
<br />

<input

  type="date"

  value={form.tanggal_kembali}

  onChange={(e) =>

    setForm({

      ...form,

      tanggal_kembali:
      e.target.value

    })

  }

/>

<input
  type="time"
  value={form.target_jam_kembali}
  onChange={(e)=>

    setForm({

      ...form,

      target_jam_kembali:
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

          <button

            onClick={
              createPerizinan
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

<th>Tujuan</th>

<th>Alasan</th>

<th>Keluar</th>

<th>Target Kembali</th>

<th>Jam Kembali</th>

<th>Catatan</th>

<th>Status</th>

<th>Aksi</th>

            </tr>

          </thead>

          <tbody>

            {

              filtered.map((p) => (

                <tr key={p.id}>

<td>{p.nama}</td>

<td>{p.tanggal}</td>

<td>{p.tujuan || "-"}</td>

<td>{p.alasan || "-"}</td>

<td>{p.jam_keluar}</td>

<td>{p.tanggal_kembali || "-"}</td>

<td>{p.jam_kembali || "-"}</td>

<td>{p.catatan || "-"}</td>

<td>{p.status}</td>

                 <td>

  <button

    onClick={()=>

      editPerizinan(p)

    }

  >

    Edit

  </button>

  {" "}

  <button

    onClick={()=>

      deletePerizinan(

        p.id

      )

    }

  >

    Hapus

  </button>

  {" "}

  {

    p.status ===
    "keluar"

    && (

      <button

        onClick={() =>

          kembali(
            p.id
          )

        }

      >

        Kembali

      </button>

    )

  }

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

export default PerizinanPage;