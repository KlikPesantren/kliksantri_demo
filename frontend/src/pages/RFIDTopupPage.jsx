import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

function RFIDTopupPage() {

  const [santri,setSantri] =
    useState([]);

  const [santriId,setSantriId] =
    useState("");

  const [nominal,setNominal] =
    useState("");

  const loadSantri =
  async()=>{

    try{

   const res =
  await api.get("/santri");

setSantri(
  res.data.data || []
);

    }

    catch(err){

      console.log(err);

    }

  };

  useEffect(()=>{

    loadSantri();

  },[]);

  const submitTopup =
  async()=>{

    try{

      const res =
        await api.post(
          "/rfid/topup",
          {
            santri_id:
              Number(santriId),

            nominal:
              Number(nominal),

            user_id:1
          }
        );

      alert(
        `Topup Berhasil

Saldo Awal :
${res.data.saldo_awal}

Saldo Akhir :
${res.data.saldo_akhir}`
      );

      setNominal("");

    }

    catch(err){

      console.log(err);

      alert(
        "Topup Gagal"
      );

    }

  };

  const cardStyle = {

    background:"#fff",

    borderRadius:"20px",

    padding:"24px",

    boxShadow:
      "0 4px 20px rgba(0,0,0,.05)",

    borderTop:
      "5px solid #14B8A6"

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
            RFID Topup
          </h1>

          <p>
            Isi saldo RFID santri
          </p>

        </div>

        <div style={cardStyle}>

          <div
            style={{
              marginBottom:"20px"
            }}
          >

            <label>
              Santri
            </label>

            <select
              value={santriId}
              onChange={(e)=>
                setSantriId(
                  e.target.value
                )
              }
              style={{
                width:"100%",
                padding:"12px"
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

                ))

              }

            </select>

          </div>

          <div
            style={{
              marginBottom:"20px"
            }}
          >

            <label>
              Nominal
            </label>

            <input
              type="number"
              value={nominal}
              onChange={(e)=>
                setNominal(
                  e.target.value
                )
              }
              style={{
                width:"100%",
                padding:"12px"
              }}
            />

          </div>

          <button
            onClick={submitTopup}
            style={{

              padding:
                "12px 24px",

              border:"none",

              borderRadius:
                "10px",

              background:
                "#14B8A6",

              color:
                "white",

              cursor:
                "pointer"
            }}
          >

            Topup Saldo

          </button>

          <button
  onClick={()=>{
    window.open(
      "http://localhost:3000/rfid/topup/export",
      "_blank"
    );
  }}
  style={{
    background:"#16A34A",
    color:"white",
    border:"none",
    padding:"12px 18px",
    borderRadius:"10px",
    cursor:"pointer"
  }}
>
  Export Excel
</button>

        </div>

      </div>

    </div>

  );

}

export default RFIDTopupPage;