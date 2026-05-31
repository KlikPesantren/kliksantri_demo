import {

  useEffect,
  useState

} from "react";

import api
from "../services/api";

import Sidebar
from "../components/Sidebar";

function PembayaranPage() {

  // ======================
  // STATES
  // ======================

  const [

    pembayaran,
    setPembayaran

  ] = useState([]);

  const [

    santri,
    setSantri

  ] = useState([]);

  const [

    form,
    setForm

  ] = useState({

    santri_id: "",

    nama_tagihan: "",

    bulan: "",

    tahun: 2026,

    nominal_tagihan: "",

    nominal_bayar: ""

  });

   const [

  modeGenerate,

  setModeGenerate

] = useState(

  "semua"

);

const [

  selectedSantri,

  setSelectedSantri

] = useState([]);


  // ======================
  // GET PEMBAYARAN
  // ======================

  const getPembayaran =
  async () => {

    try {

      const response =

        await api.get(
          "/pembayaran"
        );

      setPembayaran(

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
  // CREATE PEMBAYARAN
  // ======================

  const createPembayaran =
async () => {

  try {

    let targetSantri = [];

    if (

      modeGenerate ===
      "semua"

    ) {

      targetSantri =

        santri.map(

          (s) => s.id

        );

    }

    else {

      targetSantri =
        selectedSantri;

    }

    for (

      const santriId

      of

      targetSantri

    ) {

      await api.post(

        "/pembayaran",

        {

          santri_id:
          santriId,

          nama_tagihan:
          form.nama_tagihan,

          bulan:
          form.bulan,

          tahun:
          form.tahun,

          nominal_tagihan:
          Number(

            form.nominal_tagihan

          ),

          nominal_bayar: 0

        }

      );

    }

    alert(

      "Tagihan berhasil dibuat"

    );

    getPembayaran();

  }

  catch(err){

    console.log(err);

    alert(

      "Gagal membuat tagihan"

    );

  }

};

  // ======================
  // LOAD
  // ======================

  useEffect(() => {

    getPembayaran();

    getSantri();

  }, []);

  return (

    <div
      style={{
        display: "flex"
      }}
    >

      <Sidebar />

      <div

         style={{

    marginLeft: "280px",

    padding: "20px",

    minHeight: "100vh",

    background: "#f5f7fb"

  }}

      >

        <h1>

          Pembayaran

        </h1>

        {/* FORM */}

        <div

          style={{

            background: "#fff",

            padding: "20px",

            borderRadius: "10px",

            marginBottom: "20px",

            border:
              "1px solid #ddd"

          }}

        >

          <h3>

            Tambah Pembayaran

          </h3>

          <br />

          <label>

  <input

    type="radio"

    checked={
      modeGenerate ===
      "semua"
    }

    onChange={()=>

      setModeGenerate(
        "semua"
      )

    }

  />

  Semua Santri

</label>

<br />

<label>

  <input

    type="radio"

    checked={
      modeGenerate ===
      "pilih"
    }

    onChange={()=>

      setModeGenerate(
        "pilih"
      )

    }

  />

  Pilih Santri

</label>

<br />
<br />

{

  modeGenerate ===
  "pilih"

  &&

  santri.map((s)=>(

    <div key={s.id}>

      <label>

        <input

          type="checkbox"

          checked={

            selectedSantri.includes(
              s.id
            )

          }

          onChange={(e)=>{

            if(

              e.target.checked

            ){

              setSelectedSantri(

                [

                  ...selectedSantri,

                  s.id

                ]

              );

            }

            else{

              setSelectedSantri(

                selectedSantri.filter(

                  (id)=>

                  id !== s.id

                )

              );

            }

          }}

        />

        {s.nama}

      </label>

    </div>

  ))

}

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

          {/* TAGIHAN */}

        <input

  type="text"

  placeholder="Nama Tagihan"

  value={form.nama_tagihan}

  onChange={(e)=>

    setForm({

      ...form,

      nama_tagihan:
      e.target.value

    })

  }

/>

          <br />
          <br />

          {/* BULAN */}

          <input

            type="text"

            placeholder="Bulan"

            value={form.bulan}

            onChange={(e) =>

              setForm({

                ...form,

                bulan:
                e.target.value

              })

            }

          />

          <br />
          <br />

          {/* TAHUN */}

          <input

            type="number"

            placeholder="Tahun"

            value={form.tahun}

            onChange={(e) =>

              setForm({

                ...form,

                tahun:
                e.target.value

              })

            }

          />

          <br />
          <br />

          {/* NOMINAL */}

          <input

            type="number"

            placeholder="Nominal Tagihan"

            value={
              form.nominal_tagihan
            }

            onChange={(e) =>

              setForm({

                ...form,

                nominal_tagihan:
                e.target.value

              })

            }

          />

          <br />
          <br />

          <input

            type="number"

            placeholder="Nominal Bayar"

            value={
              form.nominal_bayar
            }

            onChange={(e) =>

              setForm({

                ...form,

                nominal_bayar:
                e.target.value

              })

            }

          />

          <br />
          <br />

          <button
            onClick={
              createPembayaran
            }
          >

            Simpan

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

              <th>

                Santri

              </th>

              <th>

                Tagihan

              </th>

              <th>

                Tagihan

              </th>

              <th>

                Bayar

              </th>

              <th>

                Sisa

              </th>

              <th>

                Status

              </th>

            </tr>

          </thead>

          <tbody>

            {

              pembayaran.map((p) => (

                <tr key={p.id}>

                  <td>

                    {p.nama}

                  </td>

                  <td>

                    {p.nama_tagihan}

                  </td>

                  <td>

                    Rp {

                      p.nominal_tagihan

                    }

                  </td>

                  <td>

                    Rp {

                      p.nominal_bayar

                    }

                  </td>

                  <td>

                    Rp {

                      p.sisa_tunggakan

                    }

                  </td>

                  <td>

                    {p.status}

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

export default PembayaranPage;