import { useEffect, useState } from "react";

import api from "../services/api";

import AppShell from "../layouts/AppShell";

import Card from "../components/ui/Card";

import SectionHeading from "../components/ui/SectionHeading";

import Badge from "../components/ui/Badge";

import Button, { actionBarStyle } from "../components/ui/Button";



const filterPanelStyle = {
  display: "flex",
  gap: "var(--space-3)",
  flexWrap: "wrap",
  alignItems: "center",
};

function AkademikResponsiveStyles() {
  return (
    <style>{`
      .akademik-page {
        min-width: 0;
        max-width: 100%;
      }

      .table-scroll-x {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        max-width: 100%;
        min-width: 0;
      }

      .table-scroll-x > table {
        width: max-content;
        min-width: 100%;
      }

      .akademik-filter-panel select,
      .akademik-filter-panel input[type="number"] {
        min-width: 0;
        flex: 1 1 140px;
        max-width: 100%;
      }

      .table-scroll-x .akademik-name-col {
        position: sticky;
        left: 0;
        z-index: 1;
        box-shadow: 2px 0 4px rgba(0, 0, 0, 0.06);
      }

      .table-scroll-x thead .akademik-name-col {
        z-index: 2;
      }

      @media (max-width: 767px) {
        .akademik-filter-panel select,
        .akademik-filter-panel input[type="number"] {
          flex: 1 1 100%;
        }
      }
    `}</style>
  );
}



const STATUS_COLUMNS = [

  { key: "total_hadir", label: "Hadir", variant: "success" },

  { key: "total_izin", label: "Izin", variant: "info" },

  { key: "total_sakit", label: "Sakit", variant: "warning" },

  { key: "total_alfa", label: "Alfa", variant: "danger" },

];



function AbsensiGuruPage() {

  const [guru, setGuru] = useState([]);

  const [data, setData] = useState({});

  const [bulan, setBulan] = useState(new Date().getMonth() + 1);

  const [tahun, setTahun] = useState(new Date().getFullYear());



  const getGuru = async () => {

    try {

      const response = await api.get("/guru");

      setGuru(response.data.data || []);

    } catch (err) {

      console.log(err);

    }

  };



  useEffect(() => {

    getGuru();

    getAbsensiGuru();

  }, [bulan, tahun]);



  const handleInput = (guruId, field, value) => {

    setData({

      ...data,

      [guruId]: {

        ...data[guruId],

        [field]: value,

      },

    });

  };



  const simpan = async () => {

    try {

      for (const guruId in data) {

        const d = data[guruId];



        await api.post("/absensi-guru", {

          guru_id: guruId,

          bulan,

          tahun,

          total_hadir: d.total_hadir || 0,

          total_izin: d.total_izin || 0,

          total_sakit: d.total_sakit || 0,

          total_alfa: d.total_alfa || 0,

        });

      }



      alert("Absensi guru berhasil disimpan");

    } catch (err) {

      console.log(err);

      alert("Gagal simpan");

    }

  };



  const getAbsensiGuru = async () => {

    try {

      const response = await api.get("/absensi-guru");



      const obj = {};



      response.data.data.forEach((row) => {

        if (

          Number(row.bulan) === Number(bulan) &&

          Number(row.tahun) === Number(tahun)

        ) {

          obj[row.guru_id] = {

            total_hadir: row.total_hadir,

            total_izin: row.total_izin,

            total_sakit: row.total_sakit,

            total_alfa: row.total_alfa,

          };

        }

      });



      setData(obj);

    } catch (err) {

      console.log(err);

    }

  };



  return (

    <AppShell title="Absensi Guru" breadcrumb="Akademik / Absensi Guru">

      <AkademikResponsiveStyles />

      <div className="akademik-page">

      <Card padding="md" shadow="card" border={false} radius="xl">

        <div className="akademik-filter-panel" style={filterPanelStyle}>

          <select value={bulan} onChange={(e) => setBulan(e.target.value)}>

            {Array.from({ length: 12 }).map((_, i) => (

              <option key={i + 1} value={i + 1}>

                Bulan {i + 1}

              </option>

            ))}

          </select>



          <input

            type="number"

            value={tahun}

            onChange={(e) => setTahun(e.target.value)}

          />

        </div>

      </Card>



      <div style={{ marginTop: "var(--space-6)" }}>

        <Card padding="md" shadow="card" border={false} radius="xl">

          <SectionHeading variant="eyebrow" spacing="first">

            Rekap Absensi Guru

          </SectionHeading>



          <div className="table-scroll-x" style={{ marginTop: "var(--space-4)" }}>

          <table

            style={{

              borderCollapse: "collapse",

              background: "white",

            }}

          >

            <thead>

              <tr>

                <th className="akademik-name-col" style={thStyle}>Nama Guru</th>

                <th style={thStyle}>Jabatan</th>

                {STATUS_COLUMNS.map((col) => (

                  <th key={col.key} style={thStyle}>

                    <Badge variant={col.variant}>{col.label}</Badge>

                  </th>

                ))}

              </tr>

            </thead>

            <tbody>

              {guru.map((g) => (

                <tr key={g.id}>

                  <td className="akademik-name-col" style={tdNameStyle}>{g.nama}</td>

                  <td style={tdStyle}>{g.jabatan}</td>

                  {STATUS_COLUMNS.map((col) => (

                    <td key={col.key} style={tdStyle}>

                      <input

                        type="number"

                        value={data[g.id]?.[col.key] || ""}

                        onChange={(e) =>

                          handleInput(g.id, col.key, e.target.value)

                        }

                      />

                    </td>

                  ))}

                </tr>

              ))}

            </tbody>

          </table>

          </div>



          <div style={{ ...actionBarStyle, marginTop: "var(--space-4)" }}>

            <Button variant="primary" onClick={simpan}>Simpan Absensi Guru</Button>

          </div>

        </Card>

      </div>

      </div>

    </AppShell>

  );

}



const thStyle = {

  border: "1px solid #dcdcdc",

  padding: "10px",

  background: "#f0f0f0",

  minWidth: "100px",

};



const tdStyle = {

  border: "1px solid #e5e5e5",

  padding: "8px",

  minWidth: "80px",

};

const tdNameStyle = {

  border: "1px solid #e5e5e5",

  padding: "8px",

  background: "#fafafa",

  fontWeight: 500,

  minWidth: "160px",

};



export default AbsensiGuruPage;

