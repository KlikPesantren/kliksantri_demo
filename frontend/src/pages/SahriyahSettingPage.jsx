import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";

function SahriyahSettingPage() {

  const [data, setData] = useState([]);

  const getData = async () => {

    try {

      const response =

        await api.get(
  `/sahriyah-setting?t=${Date.now()}`
      );

      setData(
        response.data.data
      );

    }

    catch(err){

      console.log(err);

    }

  };

  useEffect(() => {

    getData();

  }, []);

  const editSetting = async (data) => {

  const nominalUang = prompt(
    "Nominal Uang",
    data.nominal_uang || 0
  );

  if (nominalUang === null) return;

  const nominalBeras = prompt(
    "Nominal Beras",
    data.nominal_beras || 0
  );

  if (nominalBeras === null) return;

  const keterangan = prompt(
    "Keterangan",
    data.keterangan || ""
  );

  if (keterangan === null) return;

  try {

    await api.put(

      `/sahriyah-setting/${data.id}`,

      {

        nominal_uang:
        Number(nominalUang),

        nominal_beras:
        Number(nominalBeras),

        keterangan

      }

    );

    await getData();

    alert(
      "Berhasil disimpan"
    );

  }

  catch(err){

    console.log(err);

    alert(
      "Gagal menyimpan"
    );

  }

};

  return (

    <div
      style={{
        display:"flex"
      }}
    >

      <Sidebar />

      <div
        style={{
          marginLeft:"240px",
          padding:"20px",
          width:"100%"
        }}
      >

        <h1>
          Setting Sahriyah
        </h1>

        <br />

        <table
          border="1"
          cellPadding="8"
        >

          <thead>

            <tr>

              <th>Nama</th>

              <th>Nominal Uang</th>

              <th>Nominal Beras</th>

              <th>Keterangan</th>

              <th>Aksi</th>

            </tr>

          </thead>

          <tbody>

            {

              data.map((d)=>(

                <tr
                  key={d.id}
                >

                  <td>
                    {d.nama}
                  </td>

                  <td>
                    Rp {
                      Number(
                        d.nominal_uang || 0
                      )
                      .toLocaleString()
                    }
                  </td>

                  <td>
                    {
                      d.nominal_beras || 0
                    } Kg
                  </td>

                  <td>
  {d.keterangan}
</td>

<td>

  <button

    onClick={() =>

      editSetting(d)

    }

  >

    Edit

  </button>

</td>

                </tr>

              ))

            }

          </tbody>

        </table>

      </div>

    </div>

  );

}

export default SahriyahSettingPage;