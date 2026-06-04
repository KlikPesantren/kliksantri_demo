import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

function RFIDDevicePage() {

  const [devices,setDevices] =
    useState([]);

  const loadData =
  async()=>{

    try{

      const res =
        await api.get(
          "/devices"
        );

      setDevices(
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
            RFID Devices
          </h1>

          <p>
            Monitoring seluruh RFID EDC
          </p>

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

                <th>Device</th>

                <th>Status</th>

                <th>IP Address</th>

                <th>Last Ping</th>

                <th>Last Sync</th>

                <th>Firmware</th>

              </tr>

            </thead>

            <tbody>

              {

                devices.map(
                  (d)=>(

                  <tr
                    key={d.id}
                    style={{
                      borderBottom:
                        "1px solid #E5E7EB"
                    }}
                  >

                    <td>
                      {d.id}
                    </td>

                    <td>
                      {d.device_id}
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

                            d.status ===
                            "online"

                            ?

                            "#16A34A"

                            :

                            "#DC2626"
                        }}
                      >

                        {
  d.status === "online"
  ?
  "Online"
  :
  "Offline"
}

                      </span>

                    </td>

                    <td>
{
  d.ip_address
  ?
  d.ip_address.replace(
    "::ffff:",
    ""
  )
  :
  "-"
}
</td>

                    <td>

                      {
                        d.last_ping

                        ?

                        new Date(
                          d.last_ping
                        ).toLocaleString()

                        :

                        "-"
                      }

                    </td>

                    <td>

                      {
                        d.last_sync

                        ?

                        new Date(
                          d.last_sync
                        ).toLocaleString()

                        :

                        "-"
                      }

                    </td>

                    <td>

                      {
                        d.firmware_version
                        || "-"
                      }

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

export default RFIDDevicePage;