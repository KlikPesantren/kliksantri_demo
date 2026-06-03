import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

function RFIDDashboardPage() {

  const [dashboard, setDashboard] =
    useState({});

  const loadData =
    async () => {

      try {

        const res =
          await api.get(
            "/rfid/dashboard"
          );

        setDashboard(
          res.data
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
            RFID Dashboard
          </h1>

          <p>
            Pusat monitoring transaksi RFID pesantren
          </p>

        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4,1fr)",
            gap: "20px"
          }}
        >

          <div style={cardStyle}>
            <h3>Saldo Santri</h3>
            <h1>
              Rp {
                Number(
                  dashboard.total_saldo || 0
                ).toLocaleString()
              }
            </h1>
          </div>

          <div style={cardStyle}>
            <h3>Belanja Hari Ini</h3>
            <h1>
              Rp {
                Number(
                  dashboard.belanja_hari_ini || 0
                ).toLocaleString()
              }
            </h1>
          </div>

          <div style={cardStyle}>
            <h3>Merchant Aktif</h3>
            <h1>
              {
                dashboard.merchant_aktif || 0
              }
            </h1>
          </div>

          <div style={cardStyle}>
            <h3>Device Online</h3>
            <h1>
              {
                dashboard.device_online || 0
              }
            </h1>
          </div>

          <div style={cardStyle}>
            <h3>Device Offline</h3>
            <h1>
              {
                dashboard.device_offline || 0
              }
            </h1>
          </div>

          <div style={cardStyle}>
            <h3>Pending Sync</h3>
            <h1>
              {
                dashboard.pending_sync || 0
              }
            </h1>
          </div>

          <div style={cardStyle}>
            <h3>Failed Sync</h3>
            <h1>
              {
                dashboard.failed_sync || 0
              }
            </h1>
          </div>

          <div style={cardStyle}>
            <h3>Kartu Aktif</h3>
            <h1>
              {
                dashboard.kartu_aktif || 0
              }
            </h1>
          </div>

        </div>

      </div>

    </div>

  );

}

export default RFIDDashboardPage;