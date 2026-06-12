import { useEffect, useMemo, useState } from "react";
import AppShell from "../layouts/AppShell";
import api from "../services/api";
import * as XLSX from "xlsx";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
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

function trxTypeBadgeVariant(trxType) {
  if (trxType === "refund") return "warning";
  if (trxType === "topup") return "success";
  return "danger";
}

function trxTypeLabel(trxType) {
  if (trxType === "topup") return "TOPUP";
  if (trxType === "payment") return "PEMBAYARAN";
  if (trxType === "refund") return "REFUND";
  return String(trxType || "").toUpperCase();
}

function RFIDMutasiPage() {
  const [santri, setSantri] = useState([]);
  const [infoSantri, setInfoSantri] = useState(null);
  const [selectedSantri, setSelectedSantri] = useState("");
  const [mutasi, setMutasi] = useState([]);
  const [tableSearch, setTableSearch] = useState("");

  const loadSantri = async () => {
    try {
      const res = await api.get("/santri");
      setSantri(res.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  const loadMutasi = async () => {
    if (!selectedSantri) return;

    try {
      const res = await api.get(`/rfid/mutasi?santri_id=${selectedSantri}`);
      const rows = res.data.data || [];

      console.log(rows[0]);

      setMutasi(rows);

      if (rows.length > 0) {
        setInfoSantri({
          nama: rows[0].nama,
          uid_rfid: rows[0].uid_rfid,
          saldo: rows[0].saldo,
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadSantri();
  }, []);

  useEffect(() => {
    loadMutasi();
  }, [selectedSantri]);

  const filteredMutasi = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return mutasi;
    return mutasi.filter((item) =>
      [item.trx_type, item.nominal, item.saldo_awal, item.saldo_akhir, item.trx_id, item.created_at]
        .some((field) => String(field || "").toLowerCase().includes(q)),
    );
  }, [mutasi, tableSearch]);

  const exportExcel = () => {
    if (mutasi.length === 0) {
      alert("Tidak ada data");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(mutasi);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Mutasi RFID");

    XLSX.writeFile(workbook, "mutasi-rfid.xlsx");
  };

  return (
    <AppShell
      title="Mutasi RFID"
      description="Riwayat saldo RFID santri"
      breadcrumb="Keamanan / RFID Mutasi"
    >
      <Card padding="md" shadow="card" border={false} radius="xl">
        <div style={actionBarStyle}>
          <select
            value={selectedSantri}
            onChange={(e) => setSelectedSantri(e.target.value)}
            style={{ padding: "12px", minWidth: "350px" }}
          >
            <option value="">Pilih Santri</option>
            {santri.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <div style={{ marginTop: "var(--space-6)" }}>
        <DataTableCard
          title="Rekening Koran RFID"
          subtitle={
            infoSantri
              ? `${infoSantri.nama} · UID ${infoSantri.uid_rfid} · Saldo Rp ${Number(infoSantri.saldo).toLocaleString()}`
              : "Pilih santri untuk melihat mutasi saldo"
          }
          actions={
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
              {filteredMutasi.length} mutasi
            </span>
          }
        >
          <TableToolbar
            search={
              <SearchInput
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Cari jenis, nominal, TRX ID..."
                disabled={!selectedSantri}
              />
            }
            actions={
              <Button variant="success" onClick={exportExcel}>
                Export Excel
              </Button>
            }
          />

          {!selectedSantri ? (
            <EmptyState
              title="Pilih santri terlebih dahulu"
              description="Gunakan dropdown di atas untuk menampilkan rekening koran RFID."
            />
          ) : filteredMutasi.length === 0 ? (
            <EmptyState
              title={mutasi.length === 0 ? "Belum ada mutasi" : "Tidak ada hasil pencarian"}
              description={
                mutasi.length === 0
                  ? "Mutasi saldo akan muncul setelah ada transaksi."
                  : "Coba kata kunci lain atau hapus filter pencarian."
              }
            />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Tanggal</th>
                    <th style={thStyle}>Jenis</th>
                    <th style={thStyle}>Nominal</th>
                    <th style={thStyle}>Saldo Awal</th>
                    <th style={thStyle}>Saldo Akhir</th>
                    <th style={thStyle}>TRX ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMutasi.map((item) => (
                    <tr key={item.trx_id}>
                      <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "13px" }}>
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                      <td style={tdStyle}>
                        <Badge variant={trxTypeBadgeVariant(item.trx_type)}>
                          {trxTypeLabel(item.trx_type)}
                        </Badge>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>
                        Rp {Number(item.nominal).toLocaleString()}
                      </td>
                      <td style={tdStyle}>Rp {Number(item.saldo_awal).toLocaleString()}</td>
                      <td style={tdStyle}>Rp {Number(item.saldo_akhir).toLocaleString()}</td>
                      <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "13px" }}>
                        {item.trx_id}
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

export default RFIDMutasiPage;
