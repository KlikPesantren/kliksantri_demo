import { useEffect, useState } from "react";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import Card from "../components/ui/Card";
import SectionHeading from "../components/ui/SectionHeading";
import Button, { actionBarStyle } from "../components/ui/Button";
import { exportExcel } from "../utils/exportExcel";

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

      .akademik-table-input {
        width: 100%;
        min-width: 80px;
        box-sizing: border-box;
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

function HafalanPage() {
  const [kelas, setKelas] = useState([]);
  const [kelasId, setKelasId] = useState("");
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [santri, setSantri] = useState([]);
  const [hafalan, setHafalan] = useState({});

  const getHafalan = async (b, t) => {
    try {
      const response = await api.get("/hafalan", { params: { bulan: b, tahun: t } });
      const data = {};

      response.data.data.forEach((h) => {
        if (!h.pekan || !h.santri_id) return;

        const recBulan = parseInt(String(h.bulan), 10);
        const recTahun = parseInt(String(h.tahun), 10);

        if (isNaN(recBulan) || isNaN(recTahun)) return;

        const key = `${h.pekan}-${h.santri_id}-${recBulan}-${recTahun}`;

        data[key] = {
          kitab: h.kitab || "",
          awal: h.awal || "",
          akhir: h.akhir || "",
          catatan: h.catatan || "",
        };
      });

      setHafalan(data);
    } catch (err) {
      console.log(err);
    }
  };

  const pekanList = [1, 2, 3, 4, 5];

  const getKelas = async () => {
    try {
      const response = await api.get("/kelas");
      setKelas(response.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  const getSantri = async (id) => {
    try {
      const response = await api.get("/santri");
      const filtered = response.data.data.filter(
        (s) => String(s.kelas_id) === String(id)
      );
      setSantri(filtered);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getKelas();
  }, []);

  useEffect(() => {
    getHafalan(bulan, tahun);
  }, [bulan, tahun]);

  const handleHafalan = (pekan, santriId, field, value) => {
    const key = `${pekan}-${santriId}-${bulan}-${tahun}`;

    setHafalan({
      ...hafalan,
      [key]: {
        ...hafalan[key],
        [field]: value,
      },
    });
  };

  const simpanHafalan = async () => {
    const entries = Object.entries(hafalan).filter(
      ([, val]) => val && (val.kitab || val.awal || val.akhir || val.catatan)
    );

    if (entries.length === 0) {
      alert("Tidak ada hafalan yang diisi.");
      return;
    }

    try {
      for (const [key, data] of entries) {
        const segments = key.split("-");
        const tahunKey = parseInt(segments[segments.length - 1], 10);
        const bulanKey = parseInt(segments[segments.length - 2], 10);
        const santriId = segments[segments.length - 3];
        const pekan = segments[segments.length - 4];

        if (isNaN(tahunKey) || isNaN(bulanKey) || !santriId || !pekan) {
          console.warn("Skip key hafalan invalid:", key);
          continue;
        }

        await api.post("/hafalan", {
          santri_id: santriId,
          tanggal: new Date().toISOString().split("T")[0],
          kitab: data.kitab || "",
          awal: data.awal || "",
          akhir: data.akhir || "",
          catatan: data.catatan || "",
          bulan: bulanKey,
          tahun: tahunKey,
          pekan,
        });
      }

      alert(`Hafalan berhasil disimpan (${entries.length} entri).`);
      getHafalan(bulan, tahun);
    } catch (err) {
      console.log(err);
      alert("Gagal simpan: " + (err.response?.data?.error || err.message));
    }
  };

  const handleExport = () => {
    const rows = [];

    santri.forEach((s) => {
      pekanList.forEach((p) => {
        const data = hafalan[`${p}-${s.id}-${bulan}-${tahun}`] || {};

        rows.push({
          Nama: s.nama,
          Pekan: p,
          Kitab: data.kitab || "",
          Awal: data.awal || "",
          Akhir: data.akhir || "",
          Catatan: data.catatan || "",
        });
      });
    });

    exportExcel(rows, "Hafalan");
  };

  return (
    <AppShell title="Hafalan Mingguan" breadcrumb="Akademik / Hafalan Mingguan">
      <AkademikResponsiveStyles />
      <div className="akademik-page">
      <Card padding="md" shadow="card" border={false} radius="xl">
        <div className="akademik-filter-panel" style={filterPanelStyle}>
          <select
            value={kelasId}
            onChange={(e) => {
              setKelasId(e.target.value);
              getSantri(e.target.value);
            }}
          >
            <option value="">Pilih Kelas</option>
            {kelas.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama_kelas}
              </option>
            ))}
          </select>

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

      {pekanList.map((pekan) => (
        <div key={pekan} style={{ marginTop: "var(--space-6)" }}>
          <Card padding="md" shadow="card" border={false} radius="xl">
            <SectionHeading variant="eyebrow" spacing="first">
              Pekan {pekan}
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
                  <th className="akademik-name-col" style={thStyle}>Nama</th>
                  <th style={thStyle}>Kitab</th>
                  <th style={thStyle}>Awal</th>
                  <th style={thStyle}>Akhir</th>
                  <th style={thStyle}>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {santri.map((s) => {
                  const key = `${pekan}-${s.id}-${bulan}-${tahun}`;

                  return (
                    <tr key={key}>
                      <td className="akademik-name-col" style={tdNameStyle}>{s.nama}</td>
                      <td style={tdStyle}>
                        <input
                          className="akademik-table-input"
                          type="text"
                          value={hafalan[`${pekan}-${s.id}-${bulan}-${tahun}`]?.kitab || ""}
                          onChange={(e) =>
                            handleHafalan(pekan, s.id, "kitab", e.target.value)
                          }
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          className="akademik-table-input"
                          type="text"
                          value={hafalan[`${pekan}-${s.id}-${bulan}-${tahun}`]?.awal || ""}
                          onChange={(e) =>
                            handleHafalan(pekan, s.id, "awal", e.target.value)
                          }
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          className="akademik-table-input"
                          type="text"
                          value={hafalan[`${pekan}-${s.id}-${bulan}-${tahun}`]?.akhir || ""}
                          onChange={(e) =>
                            handleHafalan(pekan, s.id, "akhir", e.target.value)
                          }
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          className="akademik-table-input"
                          type="text"
                          value={hafalan[`${pekan}-${s.id}-${bulan}-${tahun}`]?.catatan || ""}
                          onChange={(e) =>
                            handleHafalan(pekan, s.id, "catatan", e.target.value)
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </Card>
        </div>
      ))}

      <div style={{ ...actionBarStyle, marginTop: "var(--space-4)" }}>
        <Button variant="success" onClick={handleExport}>
          Export Excel
        </Button>
        <Button variant="primary" onClick={simpanHafalan}>
          Simpan Hafalan
        </Button>
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
  minWidth: "100px",
};

const tdNameStyle = {
  border: "1px solid #e5e5e5",
  padding: "8px",
  background: "#fafafa",
  fontWeight: 500,
  minWidth: "160px",
};

export default HafalanPage;
