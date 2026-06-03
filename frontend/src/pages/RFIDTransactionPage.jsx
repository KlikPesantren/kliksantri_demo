import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

function RFIDTransactionPage() {

  const [transactions, setTransactions] =
    useState([]);

  const loadData =
    async () => {

      try {

        const res =
          await api.get(
            "/rfid/transactions"
          );

        setTransactions(
          res.data.data || []
        );

      }

      catch (err) {

        console.log(err);

      }

    };

  useEffect(() => {

    loadData();

  }, []);

  const cardStyle = {

    background: "#fff",

    borderRadius: "20px",

    padding: "24px",

    boxShadow:
      "0 4px 20px rgba(0,0,0,.05)",

    borderTop:
      "5px solid #14B8A6"

  };

  return (

    <div>

      <Sidebar />

      <div
        style={{
          marginLeft: "280px",
          padding: "20px"
        }}
      >

        <div
          style={{
            background:
              "linear-gradient(135deg,#0F766E,#14B8A6)",
            borderRadius: "20px",
            padding: "30px",
            marginBottom: "24px",
            color: "white"
          }}
        >

          <h1>
            RFID Transactions
          </h1>

          <p>
            Riwayat transaksi RFID pesantren
          </p>

        </div>

        <div style={cardStyle}>

          <table
            style={{
              width: "100%",
              borderCollapse:
                "collapse"
            }}
          >

            <thead
              style={{
                background:
                  "#F8FAFC"
              }}
            >

              <tr>

                <th style={th}>
                  Waktu
                </th>

                <th style={th}>
                  Santri
                </th>

                <th style={th}>
                  Merchant
                </th>

                <th style={th}>
                  Device
                </th>

                <th style={th}>
                  Nominal
                </th>

                <th style={th}>
                  Saldo Awal
                </th>

                <th style={th}>
                  Saldo Akhir
                </th>

                <th style={th}>
                  Sync
                </th>

              </tr>

            </thead>

            <tbody>

              {

                transactions.map(
                  (trx)=>(
                  <tr
                    key={trx.id}
                  >

                    <td style={td}>
                      {
                        new Date(
                          trx.created_at
                        )
                        .toLocaleString()
                      }
                    </td>

                    <td style={td}>
                      {trx.nama_santri}
                    </td>

                    <td style={td}>
                      {trx.nama_merchant}
                    </td>

                    <td style={td}>
                      {trx.device_id}
                    </td>

                    <td style={td}>
                      Rp {
                        Number(
                          trx.nominal
                        )
                        .toLocaleString()
                      }
                    </td>

                    <td style={td}>
                      Rp {
                        Number(
                          trx.saldo_awal
                        )
                        .toLocaleString()
                      }
                    </td>

                    <td style={td}>
                      Rp {
                        Number(
                          trx.saldo_akhir
                        )
                        .toLocaleString()
                      }
                    </td>

                    <td style={td}>

                      <span
                        style={{

                          padding:
                            "6px 12px",

                          borderRadius:
                            "999px",

                          color:
                            "white",

                          background:

                            trx.sync_status ===
                            "synced"

                            ? "#16A34A"

                            : "#DC2626"

                        }}
                      >

                        {
                          trx.sync_status
                        }

                      </span>

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

const th = {

  padding: "14px",

  textAlign: "left"

};

const td = {

  padding: "14px",

  borderTop:
    "1px solid #E2E8F0"

};

export default RFIDTransactionPage;