import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

function RFIDRefundPage() {

  const [santri, setSantri] =
    useState([]);

  const [transaksi, setTransaksi] =
    useState([]);

  const [selectedSantri,
    setSelectedSantri] =
    useState("");

  const loadData =
    async () => {

      try {

        const santriRes =
          await api.get(
            "/santri"
          );

        const trxRes =
          await api.get(
            "/rfid/transactions"
          );

        setSantri(
          santriRes.data.data || []
        );

        setTransaksi(
          trxRes.data.data || []
        );

      }

      catch (err) {

        console.log(err);

      }

    };

  useEffect(() => {

    loadData();

  }, []);

  const refund =
    async (id) => {

      try {

        await api.post(
          "/rfid/refund",
          {
            transaksi_id: id
          }
        );

        alert(
          "Refund berhasil"
        );

        loadData();

      }

      catch (err) {

        console.log(err);

      }

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

        <h1>
          Refund RFID
        </h1>

        <select
          value={
            selectedSantri
          }
          onChange={(e) =>
            setSelectedSantri(
              e.target.value
            )
          }
        >

          <option value="">
            Pilih Santri
          </option>

          {

            santri.map(
              (s) => (

                <option
                  key={s.id}
                  value={s.id}
                >

                  {s.nama}

                </option>

              )
            )

          }

        </select>

        <table
          style={{
            width: "100%",
            marginTop: "20px"
          }}
        >

          <thead>

            <tr>

              <th>
                Tanggal
              </th>

              <th>
                Merchant
              </th>

              <th>
                Nominal
              </th>

              <th>
                Jenis
              </th>

              <th>
                Aksi
              </th>

            </tr>

          </thead>

          <tbody>

            {

              transaksi

                .filter(

                  (item) =>

                    String(
                      item.santri_id
                    )

                    ===

                    String(
                      selectedSantri
                    )

                )

                .map(

                  (item) => (

                    <tr
                      key={item.id}
                    >

                      <td>

                        {
                          new Date(
                            item.created_at
                          )
                            .toLocaleString()
                        }

                      </td>

                      <td>

                        {
                          item.nama_merchant
                          || "-"
                        }

                      </td>

                      <td>

                        Rp {

                          Number(
                            item.nominal
                          )
                            .toLocaleString()

                        }

                      </td>

                      <td>

                        {
                          item.trx_type
                        }

                      </td>

                      <td>

                        {

                          item.trx_type ===
                          "payment"

                          &&

                          (

                            <button

                              onClick={() =>
                                refund(
                                  item.id
                                )
                              }

                            >

                              Refund

                            </button>

                          )

                        }

                      </td>

                    </tr>

                  )

                )

            }

          </tbody>

        </table>

      </div>

    </div>

  );

}

export default RFIDRefundPage;