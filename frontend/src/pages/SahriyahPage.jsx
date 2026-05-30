import {

  useEffect,
  useState

} from "react";

import api
from "../services/api";

import Sidebar
from "../components/Sidebar";

function SahriyahPage() {

  const [

    data,
    setData

  ] = useState([]);

  const [

    search,
    setSearch

  ] = useState("");

  const [

    bulan,
    setBulan

  ] = useState(

    new Date()

    .getMonth() + 1

  );

  const [

    tahun,
    setTahun

  ] = useState(

    new Date()

    .getFullYear()

  );
  
  const filtered =

  data.filter(

    (d) =>

      d.nama

      ?.toLowerCase()

      .includes(

        search.toLowerCase()

      )

      &&

      d.bulan === bulan

      &&

      d.tahun === tahun

  );

  const getData =
  async () => {

    try {

      const response =

        await api.get(

          "/sahriyah"

        );

      setData(

        response.data.data

      );

    }

    catch(err){

      console.log(err);

    }

  };

  const generateTagihan =

async () => {

  try {

    await api.post(

      "/sahriyah/generate",

      {

        bulan,

        tahun

      }

    );

    alert(

      "Tagihan berhasil dibuat"

    );

    getData();

  }

  catch(err){

    console.log(err);

  }

};

  useEffect(() => {

    getData();

  }, []);

  return (

    <div style={{

      display:"flex"

    }}>

      <Sidebar />

      <div style={{

        marginLeft:"240px",

        padding:"20px",

        width:"100%"

      }}>

        <h1>

  Sahriyah

</h1>

<br />

<select

  value={bulan}

  onChange={(e)=>

    setBulan(

      Number(

        e.target.value

      )

    )

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

  onChange={(e)=>

    setTahun(

      Number(

        e.target.value

      )

    )

  }

>

  <option value={2025}>2025</option>
  <option value={2026}>2026</option>
  <option value={2027}>2027</option>
  <option value={2028}>2028</option>

</select>

{" "}

<button

  onClick={generateTagihan}

>

  Generate Tagihan

</button>

<br />
<br />

<input

  type="text"

  placeholder="Cari Santri..."

  value={search}

  onChange={(e)=>

    setSearch(

      e.target.value

    )

  }

/>

      </div>

    <hr />

<h3>

  Statistik

</h3>

<div>

  Total Tagihan :

  {

    filtered.length

  }

</div>

<div>

  Total Lunas :

  {

    filtered.filter(

      (d)=>

      d.status ===

      "Lunas"

    ).length

  }

</div>

<div>

  Total Belum Lunas :

  {

    filtered.filter(

      (d)=>

      d.status !==

      "Lunas"

    ).length

  }

</div>

<div>

  Total Nominal :

  Rp {

    filtered

    .reduce(

      (a,b)=>

      a +

      Number(

        b.nominal || 0

      ),

      0

    )

    .toLocaleString()

  }

</div>

<br />

<hr />

<h3>

  Data Tagihan

</h3>

<table

  border="1"

  cellPadding="8"

>

  <thead>

    <tr>

      <th>Nama</th>

      <th>Uang</th>

      <th>Beras</th>

      <th>Status</th>

      <th>Tgl Bayar</th>

      <th>Petugas</th>

    </tr>

  </thead>

  <tbody>

    {

      filtered.map(

        (d)=>(

          <tr

            key={d.id}

          >

            <td>

              {d.nama}

            </td>

            <td>

              Rp {

                Number(

                  d.nominal || 0

                )

                .toLocaleString()

              }

            </td>

            <td>

              {

                d.nominal_beras

              } Kg

            </td>

            <td>

              {

                d.status

              }

            </td>

            <td>

              {

                d.tanggal_bayar

                || "-"

              }

            </td>

            <td>

              {

                d.petugas

                || "-"

              }

            </td>

          </tr>

        )

      )

    }

  </tbody>

</table>

    </div>

  );

}

export default
SahriyahPage;