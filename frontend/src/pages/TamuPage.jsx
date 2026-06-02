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
} from "../utils/exportExcel";


function TamuPage() {

const [tamu,setTamu] =
useState([]);

const [editId,setEditId] =
useState(null);

const [searchNama,setSearchNama] =
useState("");

const [searchTujuan,setSearchTujuan] =
useState("");

const [searchInstansi,setSearchInstansi] =
useState("");

const [filterTanggal,setFilterTanggal] =
useState("");

const [form,setForm] =
useState({

nama_tamu:"",
no_hp:"",
alamat:"",
instansi:"",
tujuan:"",
bertemu_dengan:"",
keperluan:"",
jumlah_orang:1,
petugas:""

});

const getTamu =
async () => {

try {

const response =
await api.get("/tamu");

setTamu(
response.data.data || []
);

}

catch(err){

console.log(err);

}

};

useEffect(()=>{

getTamu();

},[]);

const simpanTamu =
async () => {

try {

if(editId){

await api.put(

`/tamu/${editId}`,

form

);

}
else{

await api.post(

"/tamu",

form

);

}

alert(
"Data berhasil disimpan"
);

setEditId(null);

setForm({

nama_tamu:"",
no_hp:"",
alamat:"",
instansi:"",
tujuan:"",
bertemu_dengan:"",
keperluan:"",
jumlah_orang:1,
petugas:""

});

getTamu();

}
catch(err){

console.log(err);

alert("Gagal");

}

};

const editTamu =
(item)=>{

setEditId(item.id);

setForm({

nama_tamu:
item.nama_tamu || "",

no_hp:
item.no_hp || "",

alamat:
item.alamat || "",

instansi:
item.instansi || "",

tujuan:
item.tujuan || "",

bertemu_dengan:
item.bertemu_dengan || "",

keperluan:
item.keperluan || "",

jumlah_orang:
item.jumlah_orang || 1,

petugas:
item.petugas || ""

});

};

const hapusTamu =
async(id)=>{

if(
!window.confirm(
"Hapus data?"
)
)return;

try{

await api.delete(
`/tamu/${id}`
);

getTamu();

}
catch(err){

console.log(err);

}

};

const keluarTamu =
async(id)=>{

if(
!window.confirm(
"Tamu sudah pulang?"
)
)return;

try{

await api.patch(
`/tamu/${id}/keluar`
);

await getTamu();

}
catch(err){

console.log(err);

}

};

const filtered = tamu.filter((item) => {

  console.log("TAMU", tamu);
  const nama =
    (item.nama_tamu || "")
      .toLowerCase()
      .includes(
        searchNama.toLowerCase()
      );

  const tujuan =
    (item.tujuan || "")
      .toLowerCase()
      .includes(
        searchTujuan.toLowerCase()
      );

  const instansi =
    (item.instansi || "")
      .toLowerCase()
      .includes(
        searchInstansi.toLowerCase()
      );

  const tanggal =

    !filterTanggal

      ? true

      :

      item.tanggal
        ?.split("T")[0]

      ===

      filterTanggal;

  return (
    nama &&
    tujuan &&
    instansi &&
    tanggal
  );

});

const today =

new Date()
.toLocaleDateString(
"sv-SE"
);

const totalHariIni =

tamu.filter(

(t)=>

new Date(
t.tanggal
)
.toLocaleDateString(
"sv-SE"
)

=== today

).length;

const masihDidalam =

tamu.filter(

(t)=>

t.status ===
"Masuk"

).length;

const sudahKeluar =

tamu.filter(

(t)=>

t.status ===
"Keluar"

).length;

const bulanIni =

new Date()
.getMonth()+1;

const tahunIni =

new Date()
.getFullYear();

const totalBulanIni =

tamu.filter((t)=>{

const d =
new Date(t.tanggal);

return (

d.getMonth()+1

===

bulanIni

&&

d.getFullYear()

===

tahunIni

);

}).length;

const exportData = () => {

exportExcel(

filtered.map((item)=>({

Tanggal:

new Date(
item.tanggal
)
.toLocaleDateString(
"id-ID"
),

"Jam Masuk":
item.jam_masuk,

"Jam Keluar":
item.jam_keluar || "-",

"Nama Tamu":
item.nama_tamu,

Instansi:
item.instansi,

Tujuan:
item.tujuan,

"Bertemu Dengan":
item.bertemu_dengan,

"Jumlah Orang":
item.jumlah_orang,

Status:
item.status,

Petugas:
item.petugas

})),

"DaftarTamu"

);

};

return(

<div
style={{
display:"flex",
background:"#f5f7fb",
minHeight:"100vh"
}}
>

<Sidebar/>

<div
style={{
marginLeft:"240px",
width:"calc(100% - 240px)",
padding:"20px"
}}
>

<h1>
Daftar Hadir Tamu
</h1>

<br/>

<div
style={{
display:"grid",
gridTemplateColumns:
"repeat(4,1fr)",
gap:"15px",
marginBottom:"20px"
}}
>

<div className="card">
<h3>Tamu Hari Ini</h3>
<h1>{totalHariIni}</h1>
</div>

<div className="card">
<h3>Masih Di Dalam</h3>
<h1>{masihDidalam}</h1>
</div>

<div className="card">
<h3>Sudah Keluar</h3>
<h1>{sudahKeluar}</h1>
</div>

<div className="card">
<h3>Bulan Ini</h3>
<h1>{totalBulanIni}</h1>
</div>

</div>

<div
style={{
background:"#fff",
padding:"20px",
borderRadius:"12px",
marginBottom:"20px"
}}
>

<input
placeholder="Cari Nama"
value={searchNama}
onChange={(e)=>
setSearchNama(
e.target.value
)}
/>

<input
placeholder="Cari Tujuan"
value={searchTujuan}
onChange={(e)=>
setSearchTujuan(
e.target.value
)}
/>

<input
placeholder="Cari Instansi"
value={searchInstansi}
onChange={(e)=>
setSearchInstansi(
e.target.value
)}
/>

<input
type="date"
value={filterTanggal}
onChange={(e)=>
setFilterTanggal(
e.target.value
)}
/>

<button
onClick={exportData}
>

Export Excel

</button>

</div>

<div
style={{
background:"#fff",
padding:"20px",
borderRadius:"12px",
marginBottom:"20px"
}}
>

<h3>Input Tamu</h3>

<input
placeholder="Nama Tamu"
value={form.nama_tamu}
onChange={(e)=>
setForm({
...form,
nama_tamu:e.target.value
})
}
/>

<input
placeholder="Nomor HP"
value={form.no_hp}
onChange={(e)=>
setForm({
...form,
no_hp:e.target.value
})
}
/>

<textarea
placeholder="Alamat"
value={form.alamat}
onChange={(e)=>
setForm({
...form,
alamat:e.target.value
})
}
/>

<input
placeholder="Instansi"
value={form.instansi}
onChange={(e)=>
setForm({
...form,
instansi:e.target.value
})
}
/>

<input
placeholder="Tujuan"
value={form.tujuan}
onChange={(e)=>
setForm({
...form,
tujuan:e.target.value
})
}
/>

<input
placeholder="Bertemu Dengan"
value={form.bertemu_dengan}
onChange={(e)=>
setForm({
...form,
bertemu_dengan:e.target.value
})
}
/>

<textarea
placeholder="Keperluan"
value={form.keperluan}
onChange={(e)=>
setForm({
...form,
keperluan:e.target.value
})
}
/>

<input
type="number"
placeholder="Jumlah Orang"
value={form.jumlah_orang}
onChange={(e)=>
setForm({
...form,
jumlah_orang:e.target.value
})
}
/>

<input
placeholder="Petugas"
value={form.petugas}
onChange={(e)=>
setForm({
...form,
petugas:e.target.value
})
}
/>

<button
onClick={simpanTamu}
>

Simpan

</button>

</div>

<table
border="1"
cellPadding="10"
width="100%"
>

<thead>

<tr>

<th>Tanggal</th>
<th>Jam Masuk</th>
<th>Jam Keluar</th>
<th>Nama</th>
<th>Instansi</th>
<th>Tujuan</th>
<th>Bertemu</th>
<th>Jumlah</th>
<th>Status</th>
<th>Petugas</th>
<th>Aksi</th>

</tr>

</thead>

<tbody>

{
tamu.map((item)=>(

<tr key={item.id}>

<td>
{
new Date(item.tanggal)
.toLocaleDateString(
"id-ID"
)
}
</td>

<td>{item.jam_masuk}</td>

<td>{item.jam_keluar || "-"}</td>

<td>{item.nama_tamu}</td>

<td>{item.instansi}</td>

<td>{item.tujuan}</td>

<td>{item.bertemu_dengan}</td>

<td>{item.jumlah_orang}</td>

<td>

<span
style={{

padding:"6px 12px",

borderRadius:"20px",

fontWeight:"bold",

color:"white",

background:

item.status === "Masuk"

? "#16A34A"

: "#DC2626"

}}
>

{item.status}

</span>

</td>

<td>{item.petugas}</td>

<td>

<button
onClick={()=>
editTamu(item)
}
>
Edit
</button>

{" "}

{
item.status ===
"Masuk"

&&

<button
onClick={()=>
keluarTamu(item.id)
}
>
Keluar
</button>
}

{" "}

<button
onClick={()=>
hapusTamu(item.id)
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

export default TamuPage;