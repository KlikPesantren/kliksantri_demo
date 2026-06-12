// ORPHAN PAGE
// Tidak memiliki route aktif
// Tidak ada menu Sidebar
// Preserve until deletion decision

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

import TransactionTable
from "../components/TransactionTable";

import socket
from "../services/socket";

function TransaksiPage() {

  const [

    transactions,
    setTransactions

  ] = useState([]);

  const [

    santriId,
    setSantriId

  ] = useState("");

  const [

    nominal,
    setNominal

  ] = useState("");

  const [

  search,
  setSearch

] = useState("");

  useEffect(() => {

    getTransactions();

    socket.on(

      "new_transaksi",

      () => {

        getTransactions();

      }

    );

    return () => {

      socket.off(
        "new_transaksi"
      );

    };

  }, []);

  const getTransactions =
    async () => {

      try {

        const token =
          localStorage.getItem(
            "token"
          );

        const response =
          await api.get(

            "/transaksi",

            {

              headers: {

                Authorization:
                  `Bearer ${token}`

              }

            }

          );

        setTransactions(
  response.data.data || response.data
);

      } catch (err) {

        console.log(err);

      }

    };

  const topup =
    async () => {

      try {

        const token =
          localStorage.getItem(
            "token"
          );

        await api.post(

          "/transaksi",

          {

            santri_id:
              santriId,

            jenis:
              "topup",

            nominal:
              parseInt(
                nominal
              ),

            keterangan:
              "Topup Dashboard"

          },

          {

            headers: {

              Authorization:
                `Bearer ${token}`

            }

          }

        );

        alert(
          "Topup berhasil"
        );

        setSantriId("");

        setNominal("");

      } catch (err) {

        console.log(err);

        alert(
          "Topup gagal"
        );

      }

    };

    const exportExcel =
  async () => {

    try {

      const token =
        localStorage.getItem(
          "token"
        );

      const response =
        await fetch(

          "http://localhost:3000/transaksi/export/excel",

          {

            headers: {

              Authorization:
                `Bearer ${token}`

            }

          }

        );

      const blob =
        await response.blob();

      const url =
        window.URL.createObjectURL(
          blob
        );

      const a =
        document.createElement("a");

      a.href = url;

      a.download =
        "laporan_transaksi.xlsx";

      a.click();

    } catch (err) {

      console.log(err);

      alert(
        "Export gagal"
      );

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

            Data Transaksi

          </h1>

          <input

  type="text"

  placeholder=
    "Cari santri..."

  value={search}

  onChange={(e) =>

    setSearch(
      e.target.value
    )

  }

  style={{

    padding: "10px",

    width: "300px",

    marginBottom: "20px"

  }}

/>

           <button

  onClick={exportExcel}

  className="

    bg-green-600
    hover:bg-green-700
    text-white
    px-5
    py-2
    rounded-xl
    transition

  "

>

  Export Excel

</button>

          <br />

          <div

            style={{

              background: "white",

              padding: "20px",

              marginBottom: "20px"

            }}

          >

            <h3>

              Topup Saldo

            </h3>

            <input

              type="number"

              placeholder="ID Santri"

              value={santriId}

              onChange={(e) =>
                setSantriId(
                  e.target.value
                )
              }

            />

            <br />
            <br />

            <input

              type="number"

              placeholder="Nominal"

              value={nominal}

              onChange={(e) =>
                setNominal(
                  e.target.value
                )
              }

            />

            <br />
            <br />

            <button

  onClick={topup}

  className="

    bg-blue-600
    hover:bg-blue-700
    text-white
    px-5
    py-2
    rounded-xl
    transition

  "

>

  Topup

</button>

          </div>

          <TransactionTable

  transactions={

    transactions.filter(

      (trx) =>

        trx.nama_santri
        ?.toLowerCase()

        .includes(

          search.toLowerCase()

        )

    )

  }

/>

        </div>

      </div>

    </div>

  );

}

export default TransaksiPage;