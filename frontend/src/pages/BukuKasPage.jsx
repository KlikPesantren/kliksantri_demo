import {
  useEffect,
  useState
} from "react";

import api
from "../services/api";

import Sidebar
from "../components/Sidebar";

function BukuKasPage() {

  const [

    data,
    setData

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

  const [

    form,
    setForm

  ] = useState({

    tanggal: "",

    jenis: "Masuk",

    kategori: "",

    keterangan: "",

    nominal: "",

    petugas: ""

  });

  const getData =
  async () => {

    const response =

      await api.get(
        "/buku-kas"
      );

    setData(
      response.data.data
    );

  };

const simpan =
async () => {

  try {

    if (editId) {

      await api.put(

        `/buku-kas/${editId}`,

        {

          ...form,

          nominal:
            Number(

              form.nominal

            )

        }

      );

    }

    else {

      await api.post(

        "/buku-kas",

        {

          ...form,

          nominal:
            Number(

              form.nominal

            )

        }

      );

    }

setEditId(null);

setForm({

  tanggal: "",

  jenis: "Masuk",

  kategori: "",

  keterangan: "",

  nominal: "",

  petugas: ""

});
console.log("UPDATE SELESAI");

await getData();

  alert(

  editId

    ? "Data berhasil diupdate"

    : "Data berhasil disimpan"

);

  }

  catch (err) {

    console.log(err);

  }

};

  const hapus =
  async (id) => {

  if (

    !window.confirm(

      "Hapus transaksi?"

    )

  )

    return;

  try {

await api.delete(
  `/buku-kas/${id}`
);

await getData();

  }

  catch (err) {

    console.log(err);

  }

};

const editData =

  (d) => {

    setForm({

      tanggal:
        d.tanggal
        ?.split("T")[0] ||

        d.tanggal,

      jenis:
        d.jenis,

      kategori:
        d.kategori,

      keterangan:
        d.keterangan ||

        "",

      nominal:
        d.nominal,

      petugas:
        d.petugas ||

        ""

    });

    setEditId(

      d.id

    );

  };

  useEffect(() => {

    getData();

  }, []);

const dataTahunan =

  data.filter(

    (d) =>

      new Date(

        d.tanggal

      ).getFullYear()

      === tahun

  );

const dataBulanan =

  dataTahunan.filter(

    (d) =>

      new Date(

        d.tanggal

      ).getMonth() + 1

      === bulan

  );

  const totalMasuk =
  dataBulanan

  .filter(

    (d) =>

      d.jenis ===

      "Masuk"

  )

  .reduce(

    (sum,d)=>

      sum +

      Number(

        d.nominal

      ),

    0

  );

  const totalKeluar =
  dataBulanan

  .filter(

    (d) =>

      d.jenis ===

      "Keluar"

  )

  .reduce(

    (sum,d)=>

      sum +

      Number(

        d.nominal

      ),

    0

  );

  const filtered =

  dataBulanan.filter(

    (d) =>

      d.kategori

      ?.toLowerCase()

      .includes(

        search.toLowerCase()

      )

      ||

      d.keterangan

      ?.toLowerCase()

      .includes(

        search.toLowerCase()

      )

      ||

      d.petugas

      ?.toLowerCase()

      .includes(

        search.toLowerCase()

      )

  );

const saldoKas =

  totalMasuk -

  totalKeluar;

const jumlahTransaksi =

  filtered.length;

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

          Buku Kas

        </h1>

        <div>

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

</div>

<br />

        <div

  style={{

    display:"flex",

    gap:"20px",

    marginBottom:"20px"

  }}

>

<div>

  <b>

    Transaksi

  </b>

  <br />

  {jumlahTransaksi}

</div>

  <div>

    <b>

      Kas Masuk

    </b>

    <br />

    Rp {

      totalMasuk

      .toLocaleString()

    }

  </div>

  <div>

    <b>

      Kas Keluar

    </b>

    <br />

    Rp {

      totalKeluar

      .toLocaleString()

    }

  </div>

  <div>

    <b>

      Saldo Kas

    </b>

    <br />

    Rp {

      saldoKas

      .toLocaleString()

    }

  </div>

</div>

        <br />

        <input

  type="date"

  value={form.tanggal}

  onChange={(e)=>

    setForm({

      ...form,

      tanggal:
      e.target.value

    })

  }

/>

        <br /><br />

       <select

  value={form.jenis}

  onChange={(e)=>

    setForm({

      ...form,

      jenis:
      e.target.value

    })

  }

>

          <option>

            Masuk

          </option>

          <option>

            Keluar

          </option>

        </select>

        <br /><br />

      <select

  value={form.kategori}

  onChange={(e)=>

    setForm({

      ...form,

      kategori:
      e.target.value

    })

  }

>

  <option value="">

    Pilih Kategori

  </option>

  <option value="Sahriyah">

    Sahriyah

  </option>

  <option value="Daftar Ulang">

    Daftar Ulang

  </option>

  <option value="Donasi">

    Donasi

  </option>

  <option value="Topup RFID">

    Topup RFID

  </option>

  <option value="Operasional">

    Operasional

  </option>

  <option value="Listrik">

    Listrik

  </option>

  <option value="Air">

    Air

  </option>

  <option value="Insentif Guru">

    Insentif Guru

  </option>

  <option value="Lainnya">

    Lainnya

  </option>

</select>

        <br /><br />

<input

  value={form.nominal}

  placeholder="Nominal"

  onChange={(e)=>

    setForm({

      ...form,

      nominal:
      e.target.value

    })

  }

/>

        <br /><br />

 <input

  value={form.petugas}

  placeholder="Petugas"

  onChange={(e)=>

    setForm({

      ...form,

      petugas:
      e.target.value

    })

  }

/>

        <br /><br />

<textarea

  value={form.keterangan}

  placeholder="Keterangan"

  onChange={(e)=>

    setForm({

      ...form,

      keterangan:
      e.target.value

    })

  }

/>

        <br /><br />

        <button

  onClick={simpan}

>

  {

    editId

      ? "Update"

      : "Simpan"

  }

</button>

        <input

  type="text"

  placeholder="Cari transaksi..."

  value={search}

  onChange={(e)=>

    setSearch(

      e.target.value

    )

  }

/>

<br />
<br />

        <hr />

        {

          filtered.map((d)=>(

            <div
  key={d.id}
  style={{
    border:"1px solid #ddd",
    padding:"10px",
    marginBottom:"8px"
  }}
>

  {d.tanggal}

  {" | "}

  {d.jenis}

  {" | "}

  {d.kategori}

{" | "}

{d.keterangan}

{" | "}

Rp {

    Number(

      d.nominal

    ).toLocaleString()

  }

  {" "}

  <button

  onClick={()=>

    editData(

      d

    )

  }

>

  Edit

</button>

{" "}

<button

  onClick={()=>

    hapus(

      d.id

    )

  }

>

  Hapus

</button>

</div>

          ))

        }

      </div>

    </div>

  );

}

export default BukuKasPage;