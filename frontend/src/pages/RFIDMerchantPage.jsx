import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

function RFIDMerchantPage() {

  const [merchants,setMerchants] =
    useState([]);

  const [nama,setNama] =
    useState("");

  const loadData =
  async()=>{

    try{

      const res =
        await api.get(
          "/rfid/merchant"
        );

      setMerchants(
        res.data.data || []
      );

    }

    catch(err){

      console.log(err);

    }

  };

  useEffect(()=>{

    loadData();

  },[]);

  const tambahMerchant =
  async()=>{

    if(!nama.trim()) return;

    try{

      await api.post(
        "/rfid/merchant",
        {
          nama_merchant:nama
        }
      );

      setNama("");

      loadData();

    }

    catch(err){

      console.log(err);

    }

  };

  const toggleStatus =
  async(item)=>{

    try{

      await api.put(
        `/rfid/merchant/${item.id}`,
        {
          nama_merchant:
            item.nama_merchant,

          status:
            !item.status
        }
      );

      loadData();

    }

    catch(err){

      console.log(err);

    }

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

          <h1>RFID Merchant</h1>

          <p>
            Kelola merchant RFID pesantren
          </p>

        </div>

        <div
          style={{
            background:"#fff",
            padding:"24px",
            borderRadius:"20px",
            marginBottom:"24px",
            boxShadow:
              "0 4px 20px rgba(0,0,0,.05)"
          }}
        >

          <input
            value={nama}
            onChange={(e)=>
              setNama(
                e.target.value
              )
            }
            placeholder="Nama Merchant"
            style={{
              padding:"12px",
              width:"300px",
              border:
                "1px solid #E5E7EB",
              borderRadius:"10px",
              marginRight:"10px"
            }}
          />

          <button
            onClick={
              tambahMerchant
            }
            style={{
              background:"#14B8A6",
              color:"white",
              border:"none",
              padding:"12px 18px",
              borderRadius:"10px",
              cursor:"pointer",
              height:"48px"
            }}
          >
            Tambah Merchant
          </button>

        </div>

        <div
          style={{
            background:"#fff",
            padding:"24px",
            borderRadius:"20px",
            boxShadow:
              "0 4px 20px rgba(0,0,0,.05)"
          }}
        >

          <table
            style={{
              width:"100%",
              borderCollapse:
                "collapse"
            }}
          >

            <thead>

              <tr>

                <th>ID</th>

                <th>Merchant</th>

                <th>Status</th>

                <th>Aksi</th>

              </tr>

            </thead>

            <tbody>

              {

                merchants.map(
                  (item)=>(

                  <tr
                    key={item.id}
                    style={{
                      borderBottom:
                        "1px solid #E5E7EB"
                    }}
                  >

                    <td>
                      {item.id}
                    </td>

                    <td>
                      {item.nama_merchant}
                    </td>

                    <td>

                      <span
                        style={{
                          background:
                            item.status
                            ? "#16A34A"
                            : "#DC2626",

                          color:"white",

                          padding:
                            "6px 12px",

                          borderRadius:
                            "999px"
                        }}
                      >

                        {
                          item.status
                          ? "Aktif"
                          : "Nonaktif"
                        }

                      </span>

                    </td>

                    <td>

                      <button
                        onClick={()=>
                          toggleStatus(
                            item
                          )
                        }
                        style={{
                          background:
                            item.status
                            ? "#DC2626"
                            : "#16A34A",

                          color:"white",

                          border:"none",

                          padding:
                            "8px 14px",

                          borderRadius:
                            "8px",

                          cursor:
                            "pointer"
                        }}
                      >

                        {
                          item.status
                          ? "Nonaktifkan"
                          : "Aktifkan"
                        }

                      </button>

                    </td>

                  </tr>

                ))

              }

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );

}

export default RFIDMerchantPage;