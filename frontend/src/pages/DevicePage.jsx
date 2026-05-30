import {

  useEffect,
  useState

} from "react";

import Sidebar
from "../components/Sidebar";

import Topbar
from "../components/Topbar";

function DevicePage() {

  const [

    devices,
    setDevices

  ] = useState([]);

  // =====================
  // GET DEVICES
  // =====================

  const getDevices =
    async () => {

      try {

        const res =

          await fetch(

            "http://10.220.216.56:3000/devices"

          );

        const data =
          await res.json();

        console.log(data);

        setDevices(

          data.data || []

        );

      }

      catch (err) {

        console.log(err);

        setDevices([]);

      }

    };

  // =====================
  // AUTO REFRESH
  // =====================

  useEffect(() => {

    getDevices();

    const interval =

      setInterval(() => {

        getDevices();

      }, 3000);

    return () =>
      clearInterval(interval);

  }, []);

  // =====================
  // ONLINE CHECK
  // =====================

  const isOnline =
    (last_ping) => {

      if (!last_ping)
        return false;

      const now =
        new Date();

      const ping =
        new Date(last_ping);

      const diff =
        (now - ping) / 1000;

      return diff < 15;

    };

  return (

    <div>

      <Sidebar />

      <div

        style={{

          marginLeft: "250px"

        }}

      >

        <Topbar />

        <div

          style={{

            padding: "20px"

          }}

        >

          <h1>

            Device Monitoring

          </h1>

          <br />

          <table

            border="1"

            cellPadding="10"

            width="100%"

            style={{

              background: "white",

              boxShadow:
                "0 2px 5px rgba(0,0,0,0.1)"

            }}

          >

            <thead>

              <tr>

                <th>ID</th>

                <th>Nama Device</th>

                <th>Device ID</th>

                <th>Status</th>

                <th>IP</th>

                <th>Last Ping</th>

              </tr>

            </thead>

            <tbody>

              {

                devices.map((d) => (

                  <tr key={d.id}>

                    <td>

                      {d.id}

                    </td>

                    <td>

                      {

                        d.nama_device
                        || "-"

                      }

                    </td>

                    <td>

                      {d.device_id}

                    </td>

                    <td>

                      {

                        isOnline(
                          d.last_ping
                        )

                        ?

                        "🟢 Online"

                        :

                        "🔴 Offline"

                      }

                    </td>

                    <td>

                      {

                        d.ip_address
                        || "-"

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

export default DevicePage;