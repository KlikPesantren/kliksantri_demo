import { useEffect, useMemo, useState } from "react";
import AppShell from "../layouts/AppShell";
import api, { API_BASE_URL } from "../services/api";
import Card from "../components/ui/Card";
import Button, { actionBarStyle } from "../components/ui/Button";
import DataTableCard from "../components/ui/DataTableCard";
import TableToolbar from "../components/ui/TableToolbar";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";

const thStyle = {
  padding: "11px 14px",
  textAlign: "left",
  fontSize: "11px",
  fontWeight: 700,
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  borderBottom: "1px solid var(--border)",
  background: "var(--background)",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "12px 14px",
  fontSize: "14px",
  color: "var(--text-primary)",
  verticalAlign: "middle",
  borderBottom: "1px solid #F1F5F9",
};

function RFIDTopupPage() {
  const [santri, setSantri] = useState([]);
  const [santriId, setSantriId] = useState("");
  const [nominal, setNominal] = useState("");
  const [tableSearch, setTableSearch] = useState("");

  const loadSantri = async () => {
    try {
      const res = await api.get("/santri");
      setSantri(res.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadSantri();
  }, []);

  const filteredSantri = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return santri;
    return santri.filter((s) =>
      [s.nis, s.nama, s.nama_kelas, s.uid_rfid, s.saldo]
        .some((field) => String(field || "").toLowerCase().includes(q)),
    );
  }, [santri, tableSearch]);

  const submitTopup = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!user?.id) {
      alert("User tidak ditemukan");
      return;
    }

    try {
      const res = await api.post("/rfid/topup", {
        santri_id: Number(santriId),
        nominal: Number(nominal),
        user_id: user.id,
      });

      alert(
        `Topup Berhasil

Saldo Awal :
${res.data.saldo_awal}

Saldo Akhir :
${res.data.saldo_akhir}`,
      );

      setNominal("");
    } catch (err) {
      console.log(err);
      alert("Topup Gagal");
    }
  };

  return (
    <AppShell
      title="RFID Topup"
      description="Isi saldo RFID santri"
      breadcrumb="Keamanan / RFID Topup"
    >
      <Card padding="md" shadow="card" border={false} radius="xl">
        <div style={{ marginBottom: "20px" }}>
          <label>Santri</label>
          <select
            value={santriId}
            onChange={(e) => setSantriId(e.target.value)}
            style={{ width: "100%", padding: "12px" }}
          >
            <option value="">Pilih Santri</option>
            {santri.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label>Nominal</label>
          <input
            type="number"
            value={nominal}
            onChange={(e) => setNominal(e.target.value)}
            style={{ width: "100%", padding: "12px" }}
          />
        </div>

        <div style={actionBarStyle}>
          <Button type="button" variant="primary" onClick={submitTopup}>
            Topup Saldo
          </Button>
        </div>
      </Card>

      <div style={{ marginTop: "var(--space-6)" }}>
        <DataTableCard
          title="Saldo Santri RFID"
          subtitle="Referensi saldo sebelum melakukan topup"
          actions={
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
              {filteredSantri.length} santri
            </span>
          }
        >
          <TableToolbar
            search={
              <SearchInput
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Cari NIS, nama, kelas, RFID..."
              />
            }
            actions={
              <Button
                type="button"
                variant="success"
                onClick={() => {
                  window.open(`${API_BASE_URL}/rfid/topup/export`, "_blank");
                }}
              >
                Export Excel
              </Button>
            }
          />

          {filteredSantri.length === 0 ? (
            <EmptyState
              title={santri.length === 0 ? "Belum ada data santri" : "Tidak ada hasil pencarian"}
              description={
                santri.length === 0
                  ? "Data santri belum tersedia."
                  : "Coba kata kunci lain atau hapus filter pencarian."
              }
            />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>NIS</th>
                    <th style={thStyle}>Nama</th>
                    <th style={thStyle}>Kelas</th>
                    <th style={thStyle}>UID RFID</th>
                    <th style={thStyle}>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSantri.map((s) => (
                    <tr key={s.id}>
                      <td style={tdStyle}>{s.nis}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{s.nama}</td>
                      <td style={tdStyle}>{s.nama_kelas || "—"}</td>
                      <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "13px" }}>
                        {s.uid_rfid || "—"}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>
                        Rp {Number(s.saldo || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DataTableCard>
      </div>
    </AppShell>
  );
}

export default RFIDTopupPage;
