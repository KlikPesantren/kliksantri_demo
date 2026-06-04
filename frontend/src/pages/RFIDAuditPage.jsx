import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

function RFIDAuditPage() {

  const [logs,setLogs] =
    useState([]);

  const loadData =
  async()=>{

    try{

      const res =
        await api.get(
          "/rfid/audit"
        );

      setLogs(
        res.data.data || []
      );

    }

    catch(err){

      console.log(err);

    }

  };

  useEffect(()=>{

    loadData();

    const interval =
      setInterval(
        loadData,
        10000
      );

    return ()=>clearInterval(
      interval
    );

  },[]);

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
            RFID Audit Logs
          </h1>

          <p>
            Seluruh aktivitas RFID
          </p>

        </div>

        <div className="card">

          <table
            style={{
              width:"100%",
              borderCollapse:"collapse"
            }}
          >

            <thead>

              <tr>

                <th>ID</th>

                <th>Waktu</th>

                <th>Device</th>

                <th>Event</th>

                <th>Detail</th>

              </tr>

            </thead>

            <tbody>

              {

                logs.map(
                  (log)=>(

                  <tr
                    key={log.id}
                  >

                    <td>
                      {log.id}
                    </td>

                    <td>
                      {
                        new Date(
                          log.created_at
                        )
                        .toLocaleString()
                      }
                    </td>

                    <td>
                      {log.device_id}
                    </td>

                    <td>
                      {log.event_type}
                    </td>

                    <td>
                      {log.detail}
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

export default RFIDAuditPage;