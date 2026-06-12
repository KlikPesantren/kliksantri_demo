import { useEffect, useRef, useState } from "react";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import Card from "../components/ui/Card";
import SectionHeading from "../components/ui/SectionHeading";
import Badge from "../components/ui/Badge";
import Button, { actionBarStyle } from "../components/ui/Button";
import { exportExcel } from "../utils/exportExcel";

const SESI_LIST = [
  "Ngaji Pagi",
  "Sekolah",
  "Ngaji Siang",
  "Ngaji Sore",
  "Ngaji Malam",
];

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

function buildKey(sesi, santriId, bulan, tahun, hari) {
  return `${sesi}|${santriId}|${bulan}|${tahun}|${hari}`;
}

function parseKey(key) {
  const parts = key.split("|");
  if (parts.length !== 5) return null;
  const [sesi, santriId, bulan, tahun, hari] = parts;
  const b = parseInt(bulan, 10);
  const t = parseInt(tahun, 10);
  const h = parseInt(hari, 10);
  if (isNaN(b) || isNaN(t) || isNaN(h) || !santriId) return null;
  return { sesi, santriId, bulan: b, tahun: t, hari: h };
}

function absensiBadgeVariant(status) {
  if (status === "H") return "success";
  if (status === "I") return "info";
  if (status === "S") return "warning";
  if (status === "A") return "danger";
  return "neutral";
}

function absensiStatusLabel(status) {
  if (status === "H") return "Hadir";
  if (status === "I") return "Izin";
  if (status === "S") return "Sakit";
  if (status === "A") return "Alfa";
  return "";
}

function AbsensiPage() {
  const [kelas, setKelas] = useState([]);
  const [kelasId, setKelasId] = useState("");
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [santri, setSantri] = useState([]);
  const [absensi, setAbsensi] = useState({});

  const fetchSeqRef = useRef(0);

  const getAbsensi = async (b, t) => {
    const seq = ++fetchSeqRef.current;
    try {
      const response = await api.get("/absensi", {
        params: { bulan: b, tahun: t },
      });

      if (seq !== fetchSeqRef.current) {
        console.log("STALE FETCH IGNORED seq=" + seq + " current=" + fetchSeqRef.current);
        return;
      }

      const data = {};
      response.data.data.forEach((a) => {
        if (!a.tanggal || !a.sesi) return;

        const dateStr = String(a.tanggal).slice(0, 10);
        const parts = dateStr.split("-");
        if (parts.length !== 3) return;

        const recTahun = parseInt(parts[0], 10);
        const recBulan = parseInt(parts[1], 10);
        const hari = parseInt(parts[2], 10);
        if (isNaN(recTahun) || isNaN(recBulan) || isNaN(hari)) return;
        console.log(
          "BUILD",
          a.tanggal,
          buildKey(a.sesi, a.santri_id, recBulan, recTahun, hari)
        );
        data[buildKey(a.sesi, a.santri_id, recBulan, recTahun, hari)] = a.status;
      });

      console.log("AFTER SET ABSENSI", data);
      setAbsensi(data);
    } catch (err) {
      console.error(err);
    }
  };

  const getKelas = async () => {
    try {
      const response = await api.get("/kelas");
      setKelas(response.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getSantri = async (id) => {
    try {
      const response = await api.get("/santri");
      setSantri(
        response.data.data.filter(
          (s) => String(s.kelas_id) === String(id)
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getKelas();
  }, []);

  useEffect(() => {
    getAbsensi(bulan, tahun);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulan, tahun]);

  const handleAbsensi = (sesi, santriId, hari, value) => {
    const key = buildKey(sesi, santriId, bulan, tahun, hari);
    setAbsensi((prev) => ({ ...prev, [key]: value }));
  };

  const simpanAbsensi = async () => {
    const entries = Object.entries(absensi).filter(
      ([, val]) => val && val !== ""
    );

    if (entries.length === 0) {
      alert("Tidak ada data absensi yang diisi.");
      return;
    }

    try {
      for (const [key, status] of entries) {
        const parsed = parseKey(key);
        if (!parsed) continue;

        const { sesi, santriId, bulan: bKey, tahun: tKey, hari } = parsed;
        const tanggal = `${tKey}-${String(bKey).padStart(2, "0")}-${String(hari).padStart(2, "0")}`;

        await api.post("/absensi", {
          santri_id: santriId,
          tanggal,
          sesi,
          status,
        });
      }

      console.log("BEFORE ALERT", absensi);
      alert(`Absensi berhasil disimpan (${entries.length} entri).`);
      console.log("AFTER ALERT", absensi);
      console.log("BEFORE FETCH", { bulan, tahun });
      await getAbsensi(bulan, tahun);
    } catch (err) {
      alert("Gagal simpan: " + (err.response?.data?.error || err.message));
    }
  };

  const totalHari = new Date(tahun, bulan, 0).getDate();

  const handleExport = () => {
    const rows = [];
    santri.forEach((s) => {
      SESI_LIST.forEach((sesi) => {
        for (let hari = 1; hari <= totalHari; hari++) {
          rows.push({
            Nama: s.nama,
            Sesi: sesi,
            Tanggal: `${hari}/${bulan}/${tahun}`,
            Status: absensi[buildKey(sesi, s.id, bulan, tahun, hari)] || "-",
          });
        }
      });
    });
    exportExcel(rows, "Absensi");
  };

  return (
    <AppShell title="Absensi Bulanan" breadcrumb="Akademik / Absensi Bulanan">
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

          <select
            value={bulan}
            onChange={(e) => setBulan(Number(e.target.value))}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                Bulan {i + 1}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={tahun}
            onChange={(e) => setTahun(Number(e.target.value))}
          />
        </div>
      </Card>

      {SESI_LIST.map((sesi) => (
        <div key={sesi} style={{ marginTop: "var(--space-6)" }}>
          <Card padding="md" shadow="card" border={false} radius="xl">
            <SectionHeading variant="eyebrow" spacing="first">
              {sesi}
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
                  {Array.from({ length: totalHari }).map((_, i) => (
                    <th
                      key={i}
                      style={{
                        border: "1px solid #dcdcdc",
                        padding: "6px",
                        background: "#f0f0f0",
                      }}
                    >
                      {i + 1}
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
                    {Array.from({ length: totalHari }).map((_, i) => {
                      const hari = i + 1;
                      const key = buildKey(sesi, s.id, bulan, tahun, hari);
                      const status = absensi[key] || "";
                      console.log("RENDER CELL", key, absensi[key]);

                      return (
                        <td
                          key={hari}
                          style={{
                            border: "1px solid #e5e5e5",
                            padding: "4px",
                            textAlign: "center",
                          }}
                        >
                          <select
                            value={status}
                            onChange={(e) =>
                              handleAbsensi(sesi, s.id, hari, e.target.value)
                            }
                            style={{ border: "none", background: "transparent" }}
                          >
                            <option value="">-</option>
                            <option value="H">Hadir</option>
                            <option value="I">Izin</option>
                            <option value="S">Sakit</option>
                            <option value="A">Alfa</option>
                          </select>
                          {status && (
                            <div style={{ marginTop: "4px" }}>
                              <Badge variant={absensiBadgeVariant(status)} size="sm">
                                {absensiStatusLabel(status)}
                              </Badge>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
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
        <Button variant="primary" onClick={simpanAbsensi}>
          Simpan Semua Absensi
        </Button>
      </div>
      </div>
    </AppShell>
  );
}

export default AbsensiPage;
