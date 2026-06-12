import { useEffect, useMemo, useState } from "react";
import AppShell from "../layouts/AppShell";
import api, { API_BASE_URL } from "../services/api";
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

function syncBadgeVariant(status) {
  const value = String(status || "").toLowerCase();
  if (value === "synced") return "success";
  if (value === "pending") return "warning";
  if (value === "failed") return "danger";
  return "neutral";
}

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

function RFIDTransactionPage() {
  const [transactions, setTransactions] = useState([]);
  const [tableSearch, setTableSearch] = useState("");

  const loadData = async () => {
    try {
      const res = await api.get("/rfid/transactions");
      setTransactions(res.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTransactions = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter((trx) =>
      [
        trx.nama_santri,
        trx.trx_type,
        trx.nama_merchant,
        trx.device_id,
        trx.sync_status,
        trx.nominal,
      ].some((field) => String(field || "").toLowerCase().includes(q)),
    );
  }, [transactions, tableSearch]);

  return (
    <AppShell
      title="RFID Transactions"
      description="Riwayat transaksi RFID pesantren"
      breadcrumb="Keamanan / RFID Transactions"
    >
      <DataTableCard
        title="Laporan Transaksi"
        subtitle="Riwayat pembayaran, topup, dan refund RFID"
        actions={
          <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
            {filteredTransactions.length} transaksi
          </span>
        }
      >
        <TableToolbar
          search={
            <SearchInput
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Cari santri, merchant, device, tipe..."
            />
          }
          actions={
            <Button
              variant="success"
              onClick={() => {
                window.open(`${API_BASE_URL}/rfid/transactions/export`, "_blank");
              }}
            >
              Export Excel
            </Button>
          }
        />

        {filteredTransactions.length === 0 ? (
          <EmptyState
            title={transactions.length === 0 ? "Belum ada transaksi" : "Tidak ada hasil pencarian"}
            description={
              transactions.length === 0
                ? "Transaksi RFID akan muncul setelah ada aktivitas."
                : "Coba kata kunci lain atau hapus filter pencarian."
            }
          />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Waktu</th>
                  <th style={thStyle}>Santri</th>
                  <th style={thStyle}>Tipe</th>
                  <th style={thStyle}>Merchant</th>
                  <th style={thStyle}>Device</th>
                  <th style={thStyle}>Nominal</th>
                  <th style={thStyle}>Saldo Awal</th>
                  <th style={thStyle}>Saldo Akhir</th>
                  <th style={thStyle}>Sync</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((trx) => (
                  <tr key={trx.id}>
                    <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "13px" }}>
                      {new Date(trx.created_at).toLocaleString()}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{trx.nama_santri}</td>
                    <td style={tdStyle}>
                      <Badge variant={trxTypeBadgeVariant(trx.trx_type)}>
                        {trxTypeLabel(trx.trx_type)}
                      </Badge>
                    </td>
                    <td style={tdStyle}>{trx.nama_merchant}</td>
                    <td style={tdStyle}>{trx.device_id}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>
                      Rp {Number(trx.nominal).toLocaleString()}
                    </td>
                    <td style={tdStyle}>Rp {Number(trx.saldo_awal).toLocaleString()}</td>
                    <td style={tdStyle}>Rp {Number(trx.saldo_akhir).toLocaleString()}</td>
                    <td style={tdStyle}>
                      <Badge variant={syncBadgeVariant(trx.sync_status)}>{trx.sync_status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataTableCard>
    </AppShell>
  );
}

export default RFIDTransactionPage;
