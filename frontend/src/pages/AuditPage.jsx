import {

  useEffect,
  useState

} from "react";

import api
from "../services/api";

import Sidebar
from "../components/Sidebar";

import Topbar
from "../components/Topbar";

function AuditPage() {

  const [

    logs,
    setLogs

  ] = useState([]);

  useEffect(() => {

    getLogs();

    const interval =

      setInterval(() => {

        getLogs();

      }, 3000);

    return () =>
      clearInterval(interval);

  }, []);

  const getLogs =
    async () => {

      try {

        const token =
          localStorage.getItem(
            "token"
          );

        const response =
          await api.get(

            "/audit",

            {

              headers: {

                Authorization:
                  `Bearer ${token}`

              }

            }

          );

       setLogs(

  response.data.data || []

);

      } catch (err) {

        console.log(err);

      }

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

            Audit Log

          </h1>

          <br />

          <table

            border="1"

            cellPadding="10"

            width="100%"

            style={{
              background: "white"
            }}

          >

            <thead>

              <tr>

                <th>ID</th>

                <th>Device</th>

                <th>Event</th>

                <th>Detail</th>

                <th>Waktu</th>

              </tr>

            </thead>

            <tbody>

              {

                logs.map((log) => (

                  <tr key={log.id}>

                    <td>{log.id}</td>

                    <td>

                      {log.device_id}

                    </td>

                    <td>

                      {log.event_type}

                    </td>

                    <td>

                      {log.detail}

                    </td>

                    <td>

                      {

                        new Date(
                          log.created_at
                        ).toLocaleString()

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

export default AuditPage;