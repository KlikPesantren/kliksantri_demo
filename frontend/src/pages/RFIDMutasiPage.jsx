import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

import * as XLSX from "xlsx";

function RFIDMutasiPage() {

  const [santri,setSantri] =
    useState([]);

  const [infoSantri,
setInfoSantri] =
useState(null);

  const [selectedSantri,
    setSelectedSantri] =
    useState("");

  const [mutasi,setMutasi] =
    useState([]);

  const loadSantri =
  async()=>{

    try{

      const res =
        await api.get(
          "/santri"
        );

      setSantri(
        res.data.data || []
      );

    }

    catch(err){

      console.log(err);

    }

  };

  const loadMutasi =
  async()=>{

    if(!selectedSantri)
      return;

    try{

      const res =
        await api.get(
          `/rfid/mutasi?santri_id=${selectedSantri}`
        );

      const rows =
  res.data.data || [];

  console.log(rows[0]);

setMutasi(rows);

if(rows.length > 0){

  setInfoSantri({
    nama:
      rows[0].nama,
    uid_rfid:
      rows[0].uid_rfid,
    saldo:
      rows[0].saldo
  });

}
    }

    catch(err){

      console.log(err);

    }

  };

  useEffect(()=>{

    loadSantri();

  },[]);

  useEffect(()=>{

    loadMutasi();

  },[selectedSantri]);


const exportExcel =
()=>{

  if(
    mutasi.length === 0
  ){

    alert(
      "Tidak ada data"
    );

    return;

  }

  const worksheet =
    XLSX.utils.json_to_sheet(
      mutasi
    );

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Mutasi RFID"
  );

  XLSX.writeFile(
    workbook,
    "mutasi-rfid.xlsx"
  );

};

  return(

    <div>

      <Sidebar />

      <div
        style={{
          marginLeft:"280px",
          padding:"20px"
        }}
      >

        <div
          style={{
            background:
              "linear-gradient(135deg,#0F766E,#14B8A6)",
            borderRadius:"20px",
            padding:"30px",
            color:"white",
            marginBottom:"24px"
          }}
        >

          <h1>
            Mutasi RFID
          </h1>

          <p>
            Riwayat saldo RFID santri
          </p>

        </div>

        <div
          style={{
            background:"#fff",
            padding:"20px",
            borderRadius:"20px",
            marginBottom:"20px",
            boxShadow:
              "0 4px 20px rgba(0,0,0,.05)"
          }}
        >

          <select

            value={
              selectedSantri
            }

            onChange={(e)=>

              setSelectedSantri(
                e.target.value
              )

            }

            style={{
              padding:"12px",
              minWidth:"350px"
            }}

          >

            <option value="">
              Pilih Santri
            </option>

            {

              santri.map(
                (s)=>(

                  <option
                    key={s.id}
                    value={s.id}
                  >

                    {s.nama}

                  </option>

                )
              )

            }

          </select>

          <button

  onClick={
    exportExcel
  }

  style={{

    marginLeft:"10px",

    padding:
      "12px 18px",

    background:
      "#16A34A",

    color:
      "white",

    border:
      "none",

    borderRadius:
      "10px",

    cursor:
      "pointer"

  }}

>

Export Excel

</button>

        </div>

        <div
          style={{
            background:"#fff",
            padding:"20px",
            borderRadius:"20px",
            boxShadow:
              "0 4px 20px rgba(0,0,0,.05)"
          }}
        >

{
infoSantri && (

<div
style={{
  background:"#fff",
  padding:"20px",
  borderRadius:"20px",
  marginBottom:"20px",
  boxShadow:
    "0 4px 20px rgba(0,0,0,.05)"
}}
>

<h3>
{infoSantri.nama}
</h3>

<p>
UID :
{infoSantri.uid_rfid}
</p>

<p>
Saldo :
Rp {
Number(
infoSantri.saldo
)
.toLocaleString()
}
</p>

</div>

)
}

          <table
            style={{
              width:"100%",
              borderCollapse:
                "collapse"
            }}
          >

            <thead>

              <tr>

                <th>Tanggal</th>

                <th>Jenis</th>

                <th>Nominal</th>

                <th>Saldo Awal</th>

                <th>Saldo Akhir</th>

                <th>TRX ID</th>

              </tr>

            </thead>

            <tbody>

              {

                mutasi.map(
                  (item)=>(

                    <tr
                      key={
                        item.trx_id
                      }
                    >

                      <td>

                        {
                          new Date(
                            item.created_at
                          )
                          .toLocaleString()
                        }

                      </td>

                      <td>

                        <span
                          style={{

                            padding:
                              "6px 12px",

                            borderRadius:
                              "999px",

                            color:
                              "white",

                            background:

                              item.trx_type ===
                              "refund"

                              ?

                              "#F59E0B"

                              :

                              item.trx_type ===
                              "topup"

                              ?

                              "#16A34A"

                              :

                              "#DC2626"

                          }}
                        >

                          {
                            item.trx_type
                          }

                        </span>

                      </td>

                      <td>

                        Rp {

                          Number(
                            item.nominal
                          )
                          .toLocaleString()

                        }

                      </td>

                      <td>

                        Rp {

                          Number(
                            item.saldo_awal
                          )
                          .toLocaleString()

                        }

                      </td>

                      <td>

                        Rp {

                          Number(
                            item.saldo_akhir
                          )
                          .toLocaleString()

                        }

                      </td>

                      <td>

                        {
                          item.trx_id
                        }

                      </td>

                    </tr>

                  )
                )

              }

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );

}

export default RFIDMutasiPage;