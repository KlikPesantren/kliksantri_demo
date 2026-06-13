// LEGACY / ORPHAN — Not registered in App.jsx routes. See pages/legacy/README.md

import { useEffect, useState } from "react";
import AppShell from "../../layouts/AppShell";
import api from "../../services/api";
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

      console.error(err);

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

    <AppShell
      title="RFID Audit Logs"
      description="Seluruh aktivitas RFID"
      breadcrumb="Keamanan / RFID Audit Logs"
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

    </AppShell>

  );

}

export default RFIDAuditPage;