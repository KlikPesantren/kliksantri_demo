import {

  useEffect,
  useState

} from "react";

import api
from "../services/api";

import Sidebar
from "../components/Sidebar";

import { exportExcel }
from "../utils/exportExcel";

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

  kelas,
  setKelas

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

const [

  selectedKelas,

  setSelectedKelas

] = useState("");

const [

  showRiwayat,

  setShowRiwayat

] = useState(false);

const [

  riwayat,

  setRiwayat

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

    console.log(
      "DATA BARU",
      response.data.data
    );

    setPembayaran(
      [...response.data.data]
    );

    console.log(
  "RENDER",
  response.data.data[0]
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
      response.data.data
    );

  }

  catch(err){

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

else if (

  modeGenerate ===
  "kelas"

) {

  targetSantri =

    santri

      .filter(

        (s)=>

          Number(
            s.kelas_id
          )

          ===

          Number(
            selectedKelas
          )

      )

      .map(

        (s)=>

        s.id

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

    // Reset form dan pilihan santri setelah simpan berhasil
    setForm({
      santri_id: "",
      nama_tagihan: "",
      bulan: "",
      tahun: 2026,
      nominal_tagihan: "",
      nominal_bayar: ""
    });

    setSelectedSantri([]);

    getPembayaran();

  }

  catch(err){

    console.log(err);

    alert(

      "Gagal membuat tagihan"

    );

  }

};

const bukaBayar =
(tagihan) => {

  setSelectedTagihan(
    tagihan
  );

  setShowBayar(
    true
  );

};

const tutupBayar =
() => {

  setShowBayar(
    false
  );

  setSelectedTagihan(
    null
  );

  setNominalBayar(
    ""
  );

};

const simpanPembayaran =
async () => {

  try {

    await api.put(

      `/pembayaran/bayar/${selectedTagihan.id}`,

      {

        nominal:
        Number(
          nominalBayar
        ),

        petugas:
        "Aiky"

      }

    );

    alert(
      "Pembayaran berhasil"
    );

   await getPembayaran();

setShowBayar(false);

setSelectedTagihan(null);

setNominalBayar("");

  }

  catch(err){

    console.log(err);

    alert(
      "Gagal bayar"
    );

  }

};

const hapusTagihan =
async (id) => {

  const yakin =

    window.confirm(

      "Hapus tagihan?"

    );

  if (!yakin) return;

  try {

    await api.delete(

      `/pembayaran/${id}`

    );

    await getPembayaran();

  }

  catch(err){

    console.log(err);

    alert(

      "Gagal hapus"

    );

  }

};

const lihatRiwayat =
async (tagihan) => {

  try {

    const response =

      await api.get(

        `/pembayaran/riwayat/${tagihan.id}`

      );

    setRiwayat(

      response.data.data

    );

    setShowRiwayat(
      true
    );

  }

  catch(err){

    console.log(err);

  }

};
  // ======================
  // LOAD
  // ======================

useEffect(() => {

  getPembayaran();

  getSantri();

  getKelas();

}, []);

const [

  showBayar,

  setShowBayar

] = useState(false);

const [

  selectedTagihan,

  setSelectedTagihan

] = useState(null);

const [

  nominalBayar,

  setNominalBayar

] = useState("");


const handleExport = () => {

  const rows =
    pembayaran.map((p) => ({

      Santri:
        p.nama,

      Tagihan:
        p.nama_tagihan,

      Nominal:
        Number(
          p.nominal_tagihan
        ),

      Dibayar:
        Number(
          p.nominal_bayar
        ),

      Sisa:
        Number(
          p.sisa_tunggakan
        ),

      Status:
        p.status

    }));

  exportExcel(
    rows,
    "Pembayaran"
  );

};

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


<label>

  <input

    type="radio"

    checked={
      modeGenerate ===
      "kelas"
    }

    onChange={()=>

      setModeGenerate(
        "kelas"
      )

    }

  />

  Berdasarkan Kelas

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
{

  modeGenerate ===
  "kelas"

  &&

  <select

    value={
      selectedKelas
    }

    onChange={(e)=>

      setSelectedKelas(
        e.target.value
      )

    }

  >

    <option value="">

      Pilih Kelas

    </option>

    {

      kelas.map((k)=>(

        <option

          key={k.id}

          value={k.id}

        >

          {k.nama_kelas}

        </option>

      ))

    }

  </select>

}

          {/* SANTRI */}

          {

  modeGenerate ===
  "pilih"

  &&

  <select

    value={
      form.santri_id
    }

    onChange={(e)=>

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

      santri.map((s)=>(

        <option

          key={s.id}

          value={s.id}

        >

          {s.nama}

        </option>

      ))

    }

  </select>

}
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


        <button
  onClick={handleExport}
>
 Export Excel
</button>

<br />
<br />

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

              <th>Nama Tagihan</th>
<th>Nominal</th>

              <th>

                Bayar

              </th>

              <th>

                Sisa

              </th>

              <th>

                Status

              </th>

              <th>

  Aksi

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
    
    Rp {Number(p.nominal_tagihan || 0).toLocaleString()}

  </td>

  <td>

    Rp {Number(p.nominal_bayar || 0).toLocaleString()}

  </td>

  <td>

    Rp {Number(p.sisa_tunggakan || 0).toLocaleString()}

  </td>

  <td>

    {p.status}

  </td>

  <td>

<button

  onClick={()=>

    bukaBayar(p)

  }

>

  Bayar

</button>

{" "}

<button

  onClick={()=>

    lihatRiwayat(p)

  }

>

  Histori

</button>

{" "}

<button

  onClick={()=>

    hapusTagihan(p.id)

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
{

  showBayar &&

  selectedTagihan && (

    <div

      style={{

        position:"fixed",

        top:0,

        left:0,

        right:0,

        bottom:0,

        background:
        "rgba(0,0,0,.5)",

        display:"flex",

        alignItems:
        "center",

        justifyContent:
        "center"

      }}

    >

      <div

        style={{

          background:"#fff",

          padding:"20px",

          width:"400px",

          borderRadius:"10px"

        }}

      >

        <h3>

          Pembayaran Tagihan

        </h3>

        <hr />

        <p>

          <b>Santri:</b>

          {" "}

          {

            selectedTagihan.nama

          }

        </p>

        <p>

          <b>Tagihan:</b>

          {" "}

          {

            selectedTagihan.nama_tagihan

          }

        </p>

        <p>

          <b>Sisa:</b>

          Rp {

            Number(

              selectedTagihan
              .sisa_tunggakan || 0

            )

            .toLocaleString()

          }

        </p>

        <input

          type="number"

          placeholder=
          "Nominal Bayar"

          value={
            nominalBayar
          }

          onChange={(e)=>

            setNominalBayar(
              e.target.value
            )

          }

        />

        <br />
        <br />

        <button

  onClick={

    simpanPembayaran

  }

>

  Simpan

</button>

        {" "}

        <button

          onClick={
            tutupBayar
          }

        >

          Tutup

        </button>

      </div>

    </div>

  )

}

{

  showRiwayat && (

    <div

      style={{

        position:"fixed",

        top:0,

        left:0,

        right:0,

        bottom:0,

        background:
        "rgba(0,0,0,.5)",

        display:"flex",

        alignItems:
        "center",

        justifyContent:
        "center"

      }}

    >

      <div

        style={{

          background:"#fff",

          padding:"20px",

          width:"500px",

          borderRadius:"10px"

        }}

      >

        <h3>

          Histori Pembayaran

        </h3>

        <hr />

        <table

          width="100%"

          border="1"

        >

          <thead>

            <tr>

              <th>

                Tanggal

              </th>

              <th>

                Nominal

              </th>

              <th>

                Petugas

              </th>

            </tr>

          </thead>

          <tbody>

            {

              riwayat.map((r)=>(

                <tr
                  key={r.id}
                >

                  <td>

                    {

                      r.tanggal

                    }

                  </td>

                  <td>

                    Rp {

                      Number(
                        r.nominal
                      )

                      .toLocaleString()

                    }

                  </td>

                  <td>

                    {r.petugas}

                  </td>

                </tr>

              ))

            }

          </tbody>

        </table>

        <br />

        <button

          onClick={()=>

            setShowRiwayat(
              false
            )

          }

        >

          Tutup

        </button>

      </div>

    </div>

  )

}
    </div>

  );

}

export default PembayaranPage;