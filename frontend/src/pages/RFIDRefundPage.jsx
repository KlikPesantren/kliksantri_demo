import { useEffect, useMemo, useState } from "react";
import AppShell from "../layouts/AppShell";
import api from "../services/api";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
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

function trxTypeLabel(trxType) {
  if (trxType === "payment") return "PEMBAYARAN";
  if (trxType === "topup") return "TOPUP";
  if (trxType === "refund") return "REFUND";
  return String(trxType || "").toUpperCase();
}

function trxTypeBadgeVariant(trxType) {
  if (trxType === "refund") return "warning";
  if (trxType === "topup") return "success";
  return "danger";
}

function RFIDRefundPage() {
  const [santri, setSantri] = useState([]);
  const [transaksi, setTransaksi] = useState([]);
  const [selectedSantri, setSelectedSantri] = useState("");
  const [tableSearch, setTableSearch] = useState("");

  const loadData = async () => {
    try {
      const santriRes = await api.get("/santri");
      const trxRes = await api.get("/rfid/transactions");

      setSantri(santriRes.data.data || []);
      setTransaksi(trxRes.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTransaksi = useMemo(() => {
    const bySantri = transaksi.filter(
      (item) => String(item.santri_id) === String(selectedSantri),
    );
    const q = tableSearch.trim().toLowerCase();
    if (!q) return bySantri;
    return bySantri.filter((item) =>
      [item.nama_merchant, item.trx_type, item.nominal, item.created_at]
        .some((field) => String(field || "").toLowerCase().includes(q)),
    );
  }, [transaksi, selectedSantri, tableSearch]);

  const refund = async (id) => {
    try {
      await api.post("/rfid/refund", {
        transaksi_id: id,
      });

      alert("Refund berhasil");
      loadData();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <AppShell title="Refund RFID" breadcrumb="Keamanan / RFID Refund">
      <Card padding="md" shadow="card" border={false} radius="xl">
        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>
          Pilih Santri
        </label>
        <select
          value={selectedSantri}
          onChange={(e) => setSelectedSantri(e.target.value)}
          style={{ padding: "12px", minWidth: "350px", width: "100%", maxWidth: "400px" }}
        >
          <option value="">Pilih Santri</option>
          {santri.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nama}
            </option>
          ))}
        </select>
      </Card>

      <div style={{ marginTop: "var(--space-6)" }}>
        <DataTableCard
          title="Transaksi Refund"
          subtitle="Proses refund transaksi pembayaran RFID"
          actions={
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
              {filteredTransaksi.length} transaksi
            </span>
          }
        >
          <TableToolbar
            search={
              <SearchInput
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Cari merchant, jenis, nominal..."
                disabled={!selectedSantri}
              />
            }
          />

          {!selectedSantri ? (
            <EmptyState
              title="Pilih santri terlebih dahulu"
              description="Gunakan dropdown di atas untuk menampilkan transaksi yang dapat direfund."
            />
          ) : filteredTransaksi.length === 0 ? (
            <EmptyState
              title={
                transaksi.filter((item) => String(item.santri_id) === String(selectedSantri)).length === 0
                  ? "Belum ada transaksi"
                  : "Tidak ada hasil pencarian"
              }
              description={
                transaksi.filter((item) => String(item.santri_id) === String(selectedSantri)).length === 0
                  ? "Transaksi santri ini belum tersedia."
                  : "Coba kata kunci lain atau hapus filter pencarian."
              }
            />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Tanggal</th>
                    <th style={thStyle}>Merchant</th>
                    <th style={thStyle}>Nominal</th>
                    <th style={thStyle}>Jenis</th>
                    <th style={thStyle}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransaksi.map((item) => (
                    <tr key={item.id}>
                      <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "13px" }}>
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                      <td style={tdStyle}>{item.nama_merchant || "—"}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>
                        Rp {Number(item.nominal).toLocaleString()}
                      </td>
                      <td style={tdStyle}>
                        <Badge variant={trxTypeBadgeVariant(item.trx_type)}>
                          {trxTypeLabel(item.trx_type)}
                        </Badge>
                      </td>
                      <td style={tdStyle}>
                        {item.trx_type === "payment" && (
                          <Button variant="primary" size="sm" onClick={() => refund(item.id)}>
                            Refund
                          </Button>
                        )}
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

export default RFIDRefundPage;
