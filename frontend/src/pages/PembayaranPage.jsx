import {

  useEffect,
  useState

} from "react";

import api
from "../services/api";

import Sidebar
from "../components/Sidebar";

function PembayaranPage() {

  // ======================
  // STATES
  // ======================

  const [

    pembayaran,
    setPembayaran

  ] = useState([]);

  const [

    santri,
    setSantri

  ] = useState([]);

  const [

    jenisTagihan,
    setJenisTagihan

  ] = useState([]);

  const [

    form,
    setForm

  ] = useState({

    santri_id: "",

    jenis_tagihan_id: "",

    bulan: "",

    tahun: 2026,

    nominal_tagihan: "",

    nominal_bayar: ""

  });

  // ======================
  // GET PEMBAYARAN
  // ======================

  const getPembayaran =
  async () => {

    try {

      const response =

        await api.get(
          "/pembayaran"
        );

      setPembayaran(

        response.data.data || []

      );

    }

    catch (err) {

      console.log(err);

    }

  };

  // ======================
  // GET SANTRI
  // ======================

  const getSantri =
  async () => {

    try {

      const response =

        await api.get(
          "/santri"
        );

      setSantri(

        response.data.data || []

      );

    }

    catch (err) {

      console.log(err);

    }

  };

  // ======================
  // GET JENIS TAGIHAN
  // ======================

  const getJenisTagihan =
  async () => {

    try {

      const response =

        await api.get(
          "/jenis-tagihan"
        );

      setJenisTagihan(

        response.data.data || []

      );

    }

    catch (err) {

      console.log(err);

    }

  };

  // ======================
  // CREATE PEMBAYARAN
  // ======================

  const createPembayaran =
  async () => {

    try {

      await api.post(

        "/pembayaran",

        {

          ...form,

          nominal_tagihan:
          Number(

            form.nominal_tagihan

          ),

          nominal_bayar:
          Number(

            form.nominal_bayar

          )

        }

      );

      alert(
        "Pembayaran berhasil"
      );

      getPembayaran();

    }

    catch (err) {

      console.log(err);

      alert(
        "Gagal tambah pembayaran"
      );

    }

  };

  // ======================
  // LOAD
  // ======================

  useEffect(() => {

    getPembayaran();

    getSantri();

    getJenisTagihan();

  }, []);

  return (

    <div
      style={{
        display: "flex"
      }}
    >

      <Sidebar />

      <div

         style={{

    marginLeft: "280px",

    padding: "20px",

    minHeight: "100vh",

    background: "#f5f7fb"

  }}

      >

        <h1>

          Pembayaran

        </h1>

        {/* FORM */}

        <div

          style={{

            background: "#fff",

            padding: "20px",

            borderRadius: "10px",

            marginBottom: "20px",

            border:
              "1px solid #ddd"

          }}

        >

          <h3>

            Tambah Pembayaran

          </h3>

          <br />

          {/* SANTRI */}

          <select

            value={
              form.santri_id
            }

            onChange={(e) =>

              setForm({

                ...form,

                santri_id:
                e.target.value

              })

            }

          >

            <option value="">

              Pilih Santri

            </option>

            {

              santri.map((s) => (

                <option

                  key={s.id}

                  value={s.id}

                >

                  {s.nama}

                </option>

              ))

            }

          </select>

          <br />
          <br />

          {/* TAGIHAN */}

          <select

            value={
              form.jenis_tagihan_id
            }

            onChange={(e) =>

              setForm({

                ...form,

                jenis_tagihan_id:
                e.target.value

              })

            }

          >

            <option value="">

              Pilih Tagihan

            </option>

            {

              jenisTagihan.map((j) => (

                <option

                  key={j.id}

                  value={j.id}

                >

                  {j.nama_tagihan}

                </option>

              ))

            }

          </select>

          <br />
          <br />

          {/* BULAN */}

          <input

            type="text"

            placeholder="Bulan"

            value={form.bulan}

            onChange={(e) =>

              setForm({

                ...form,

                bulan:
                e.target.value

              })

            }

          />

          <br />
          <br />

          {/* TAHUN */}

          <input

            type="number"

            placeholder="Tahun"

            value={form.tahun}

            onChange={(e) =>

              setForm({

                ...form,

                tahun:
                e.target.value

              })

            }

          />

          <br />
          <br />

          {/* NOMINAL */}

          <input

            type="number"

            placeholder="Nominal Tagihan"

            value={
              form.nominal_tagihan
            }

            onChange={(e) =>

              setForm({

                ...form,

                nominal_tagihan:
                e.target.value

              })

            }

          />

          <br />
          <br />

          <input

            type="number"

            placeholder="Nominal Bayar"

            value={
              form.nominal_bayar
            }

            onChange={(e) =>

              setForm({

                ...form,

                nominal_bayar:
                e.target.value

              })

            }

          />

          <br />
          <br />

          <button
            onClick={
              createPembayaran
            }
          >

            Simpan

          </button>

        </div>

        {/* TABLE */}

        <table
          border="1"
          cellPadding="10"
          width="100%"
        >

          <thead>

            <tr>

              <th>

                Santri

              </th>

              <th>

                Tagihan

              </th>

              <th>

                Tagihan

              </th>

              <th>

                Bayar

              </th>

              <th>

                Sisa

              </th>

              <th>

                Status

              </th>

            </tr>

          </thead>

          <tbody>

            {

              pembayaran.map((p) => (

                <tr key={p.id}>

                  <td>

                    {p.nama}

                  </td>

                  <td>

                    {p.nama_tagihan}

                  </td>

                  <td>

                    Rp {

                      p.nominal_tagihan

                    }

                  </td>

                  <td>

                    Rp {

                      p.nominal_bayar

                    }

                  </td>

                  <td>

                    Rp {

                      p.sisa_tunggakan

                    }

                  </td>

                  <td>

                    {p.status}

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

export default PembayaranPage;