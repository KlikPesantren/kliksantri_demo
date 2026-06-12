import { useEffect, useState } from "react";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import Card from "../components/ui/Card";
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

      @media (max-width: 767px) {
        .akademik-filter-panel select,
        .akademik-filter-panel input[type="number"] {
          flex: 1 1 100%;
        }
      }
    `}</style>
  );
}

function NilaiPage() {
  const [kelas, setKelas] = useState([]);
  const [kelasId, setKelasId] = useState("");
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [santri, setSantri] = useState([]);
  const [nilai, setNilai] = useState({});

  const getNilai = async (b, t) => {
    try {
      const response = await api.get("/nilai", { params: { bulan: b, tahun: t } });
      const data = {};

      response.data.data.forEach((n) => {
        const key = `${n.santri_id}-${n.mapel}-${n.bulan}-${n.tahun}`;
        data[key] = n.nilai;
      });

      setNilai(data);
    } catch (err) {
      console.log(err);
    }
  };

  const mapelList = ["Nahwu", "Fiqih", "Tajwid", "Akhlak", "Tauhid"];

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
    getNilai(bulan, tahun);
  }, [bulan, tahun]);

  const handleNilai = (santriId, mapel, value) => {
    const key = `${santriId}-${mapel}-${bulan}-${tahun}`;
    setNilai({
      ...nilai,
      [key]: value,
    });
  };

  const simpanNilai = async () => {
    const entries = Object.entries(nilai).filter(
      ([, val]) => val !== "" && val !== null && val !== undefined
    );

    if (entries.length === 0) {
      alert("Tidak ada nilai yang diisi.");
      return;
    }

    try {
      for (const [key, nilaiVal] of entries) {
        const segments = key.split("-");
        const tahunKey = parseInt(segments[segments.length - 1], 10);
        const bulanKey = parseInt(segments[segments.length - 2], 10);
        const mapel = segments[segments.length - 3];
        const santriId = segments.slice(0, segments.length - 3).join("-");

        if (isNaN(tahunKey) || isNaN(bulanKey) || !mapel || !santriId) {
          console.warn("Skip key invalid:", key);
          continue;
        }

        await api.post("/nilai", {
          santri_id: santriId,
          tanggal: new Date().toISOString().split("T")[0],
          mapel,
          nilai: nilaiVal,
          bulan: bulanKey,
          tahun: tahunKey,
        });
      }

      alert(`Nilai berhasil disimpan (${entries.length} entri).`);
      getNilai(bulan, tahun);
    } catch (err) {
      console.log(err);
      alert("Gagal simpan: " + (err.response?.data?.error || err.message));
    }
  };

  const handleExport = () => {
    const rows = [];

    santri.forEach((s) => {
      mapelList.forEach((m) => {
        rows.push({
          Nama: s.nama,
          MataPelajaran: m,
          Nilai: nilai[`${s.id}-${m}-${bulan}-${tahun}`] || 0,
          Bulan: bulan,
          Tahun: tahun,
        });
      });
    });

    exportExcel(rows, "Nilai");
  };

  return (
    <AppShell title="Nilai Santri" breadcrumb="Akademik / Nilai Santri">
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

      <div style={{ marginTop: "var(--space-6)" }}>
        <Card padding="md" shadow="card" border={false} radius="xl">
          <div className="table-scroll-x">
          <table
            style={{
              borderCollapse: "collapse",
              background: "white",
            }}
          >
            <thead>
              <tr>
                <th
                  className="akademik-name-col"
                  style={{
                    border: "1px solid #dcdcdc",
                    padding: "10px",
                    background: "#f0f0f0",
                    minWidth: "180px",
                  }}
                >
                  Nama
                </th>
                {mapelList.map((m) => (
                  <th
                    key={m}
                    style={{
                      border: "1px solid #dcdcdc",
                      padding: "10px",
                      background: "#f0f0f0",
                    }}
                  >
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {santri.map((s) => (
                <tr key={s.id}>
                  <td
                    className="akademik-name-col"
                    style={{
                      border: "1px solid #dcdcdc",
                      padding: "8px",
                      background: "#fafafa",
                      fontWeight: "500",
                    }}
                  >
                    {s.nama}
                  </td>
                  {mapelList.map((m) => (
                    <td
                      key={m}
                      style={{
                        border: "1px solid #e5e5e5",
                        padding: "6px",
                        textAlign: "center",
                      }}
                    >
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={nilai[`${s.id}-${m}-${bulan}-${tahun}`] || ""}
                        onChange={(e) => handleNilai(s.id, m, e.target.value)}
                        style={{
                          width: "70px",
                          border: "none",
                          textAlign: "center",
                          background: "transparent",
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          <div style={{ ...actionBarStyle, marginTop: "var(--space-4)" }}>
            <Button variant="success" onClick={handleExport}>
              Export Excel
            </Button>
            <Button variant="primary" onClick={simpanNilai}>
              Simpan Nilai
            </Button>
          </div>
        </Card>
      </div>
      </div>
    </AppShell>
  );
}

export default NilaiPage;
