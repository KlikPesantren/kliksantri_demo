import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";

function SahriyahPage() {
  const [data, setData] = useState([]);
  const [showBayar, setShowBayar] = useState(false);

const [selectedTagihan, setSelectedTagihan] =
useState(null);

const [formBayar, setFormBayar] =
useState({

  nominal: "",

  beras: "",

  petugas: ""

});
  const [search, setSearch] = useState("");
  const [

  showRiwayat,

  setShowRiwayat

] = useState(false);
  const [riwayat, setRiwayat] = useState([]);
  const [bulan, setBulan] = useState(
    new Date().getMonth() + 1
  );

  const [tahun, setTahun] = useState(
    new Date().getFullYear()
  );

  const getData = async () => {
    try {
      const response = await api.get(
  `/sahriyah?t=${Date.now()}`
);
      setData(response.data.data);
      console.log(
  "DATA BARU",
  response.data.data
);
    } catch (err) {
      console.log(err);
    }
  };

  const generateTagihan = async () => {
    try {
      await api.post("/sahriyah/generate", {
        bulan,
        tahun,
      });

      alert("Tagihan berhasil dibuat");
      getData();
    } catch (err) {
      console.log(err);
      alert("Generate gagal");
    }
  };

 const bayarTagihan = (tagihan) => {

  setSelectedTagihan(
    tagihan
  );

  setFormBayar({

    nominal: "",

    beras: "",

    petugas: ""

  });

  setShowBayar(true);

};

const lihatRiwayat =
async (id) => {

  try {

    const response =

      await api.get(
        `/sahriyah/riwayat/${id}`
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

  useEffect(() => {
    getData();
  }, []);

  const filtered = data.filter(
    (d) =>
      d.nama
        ?.toLowerCase()
        .includes(search.toLowerCase()) &&
      d.bulan === bulan &&
      d.tahun === tahun
  );

  const simpanPembayaran = async () => {

  try {

    await api.put(

      `/sahriyah/bayar/${selectedTagihan.id}`,

      {

        nominal:
        Number(
          formBayar.nominal || 0
        ),

        beras:
        Number(
          formBayar.beras || 0
        ),

        petugas:
        formBayar.petugas

      }

    );

const freshData = await api.get(
  `/sahriyah?t=${Date.now()}`
);

console.log(
  "SET DATA BARU",
  freshData.data.data
);

setData([
  ...freshData.data.data
]);

setShowBayar(false);

setSelectedTagihan(null);

setFormBayar({

  nominal:"",

  beras:"",

  petugas:""

});

console.log(
  "PEMBAYARAN BERHASIL"
);

  }

  catch(err){

    console.log(err);

    alert(
      "Pembayaran gagal"
    );

  }

};

 console.log(
  "FILTERED",
  filtered.length
);
console.log(
  "RENDER SAHRIYAH"
);

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <div
        style={{
          marginLeft: "240px",
          padding: "20px",
          width: "100%",
        }}
      >
        <h1>Sahriyah</h1>

        <br />

        <select
          value={bulan}
          onChange={(e) =>
            setBulan(Number(e.target.value))
          }
        >
          <option value={1}>Januari</option>
          <option value={2}>Februari</option>
          <option value={3}>Maret</option>
          <option value={4}>April</option>
          <option value={5}>Mei</option>
          <option value={6}>Juni</option>
          <option value={7}>Juli</option>
          <option value={8}>Agustus</option>
          <option value={9}>September</option>
          <option value={10}>Oktober</option>
          <option value={11}>November</option>
          <option value={12}>Desember</option>
        </select>

        {" "}

        <select
          value={tahun}
          onChange={(e) =>
            setTahun(Number(e.target.value))
          }
        >
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
          <option value={2027}>2027</option>
          <option value={2028}>2028</option>
        </select>

        {" "}

        <button onClick={generateTagihan}>
          Generate Tagihan
        </button>

        <br />
        <br />

        <input
          type="text"
          placeholder="Cari Santri..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <br />
        <br />

        <hr />

        <h3>Statistik</h3>

        <div>Total Tagihan : {filtered.length}</div>

        <div>
          Total Lunas :
          {
            filtered.filter(
              (d) => d.status === "Lunas"
            ).length
          }
        </div>

        <div>
          Total Belum Lunas :
          {
            filtered.filter(
              (d) => d.status !== "Lunas"
            ).length
          }
        </div>

        <div>
          Total Nominal : Rp{" "}
          {filtered
            .reduce(
              (a, b) =>
                a +
                Number(
                  b.nominal || 0
                ),
              0
            )
            .toLocaleString()}
        </div>

        <br />

        <hr />

        <h3>Data Tagihan</h3>

        <table
          border="1"
          cellPadding="8"
          style={{
            width: "100%",
            marginTop: "10px",
          }}
        >
<thead>
  <tr>
    <th>Nama</th>
    <th>Tagihan Uang</th>
    <th>Sudah Bayar</th>
    <th>Sisa Uang</th>
    <th>Tagihan Beras</th>
    <th>Beras Masuk</th>
    <th>Sisa Beras</th>
    <th>Status</th>
    <th>Tgl Bayar</th>
    <th>Petugas</th>
    <th>Aksi</th>
    <th>Riwayat</th>
  </tr>
</thead>

          <tbody>
            {filtered.map((d) => (
  <tr key={d.id}>

  <td>{d.nama}</td>

  <td>
    Rp {Number(d.nominal || 0).toLocaleString()}
  </td>

  <td>
    Rp {Number(d.total_bayar || 0).toLocaleString()}
  </td>

  <td>
    Rp {Number(d.sisa_tagihan || 0).toLocaleString()}
  </td>

  <td>
    {Number(d.nominal_beras || 0)} Kg
  </td>

  <td>
    {Number(d.beras_terbayar || 0)} Kg
  </td>

  <td>
    {Number(d.sisa_beras || 0)} Kg
  </td>

  <td>

    {d.status === "Lunas" &&
      "✅ Lunas"}

    {d.status === "Cicilan" &&
      "🟡 Cicilan"}

    {d.status === "Belum Lunas" &&
      "🔴 Belum Lunas"}

  </td>

  <td>
  {d.tanggal_bayar || "-"}
</td>

<td>
  {d.petugas || "-"}
</td>

<td>

  {d.status === "Lunas"

    ? "✓"

    : (

      <button
        onClick={() =>
  bayarTagihan(d)
}
      >
        Bayar
      </button>

    )}

</td>

<td>

  <button
    onClick={() =>
      lihatRiwayat(d.id)
    }
  >
    Riwayat
  </button>

</td>

</tr>
            ))}
          </tbody>
        </table>
        <br />


      </div>

{

showBayar && (

<div

  style={{

    position:"fixed",

    top:0,

    left:0,

    width:"100%",

    height:"100%",

    background:
    "rgba(0,0,0,0.5)",

    display:"flex",

    justifyContent:"center",

    alignItems:"center"

  }}

>

<div

  style={{

    background:"#fff",

    padding:"20px",

    width:"400px"

  }}

>

<h3>

Bayar Sahriyah

</h3>

<p>

{selectedTagihan?.nama}

</p>

<input

  placeholder="Nominal Uang"

  value={formBayar.nominal}

  onChange={(e)=>

    setFormBayar({

      ...formBayar,

      nominal:
      e.target.value

    })

  }

/>

<br />
<br />

<input

  placeholder="Beras (Kg)"

  value={formBayar.beras}

  onChange={(e)=>

    setFormBayar({

      ...formBayar,

      beras:
      e.target.value

    })

  }

/>

<br />
<br />

<input

  placeholder="Petugas"

  value={formBayar.petugas}

  onChange={(e)=>

    setFormBayar({

      ...formBayar,

      petugas:
      e.target.value

    })

  }

/>

<br />
<br />

<button

  onClick={simpanPembayaran}

>

Simpan

</button>

{" "}

<button

onClick={() => {

  setShowBayar(false);

  setSelectedTagihan(null);

  setFormBayar({

    nominal:"",

    beras:"",

    petugas:""

  });

}}

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

    width:"100%",

    height:"100%",

    background:
    "rgba(0,0,0,.5)",

    display:"flex",

    justifyContent:"center",

    alignItems:"center"

  }}

>

<div

  style={{

    background:"#fff",

    padding:"20px",

    width:"600px",

    borderRadius:"10px"

  }}

>

<h3>

Histori Pembayaran Sahriyah

</h3>

<hr />

<table

  border="1"

  width="100%"

  cellPadding="8"

>

<thead>

<tr>

<th>Tanggal</th>

<th>Nominal</th>

<th>Beras</th>

<th>Petugas</th>

</tr>

</thead>

<tbody>

{

riwayat.map((r)=>(

<tr key={r.id}>

<td>

{r.tanggal}

</td>

<td>

Rp {

Number(
r.nominal || 0
)

.toLocaleString()

}

</td>

<td>

{

Number(
r.nominal_beras || 0
)

} Kg

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

export default SahriyahPage;