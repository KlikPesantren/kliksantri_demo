import { useEffect, useMemo, useState } from "react";
import AppShell from "../layouts/AppShell";
import api, { API_BASE_URL } from "../services/api";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import DataTableCard from "../components/ui/DataTableCard";
import TableToolbar from "../components/ui/TableToolbar";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import StatusBadge from "../components/ui/StatusBadge";
import {
  Table,
  TableScroll,
  TablePagination,
  useClientPagination,
} from "../components/ui/table";

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
      console.error(err);
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

  const { page, setPage, paginatedItems, totalItems, pageSize } =
    useClientPagination(filteredTransactions);

  useEffect(() => {
    setPage(1);
  }, [tableSearch, setPage]);

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
          <>
            <TableScroll>
              <Table>
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Santri</th>
                    <th>Tipe</th>
                    <th>Merchant</th>
                    <th>Device</th>
                    <th>Nominal</th>
                    <th>Saldo Awal</th>
                    <th>Saldo Akhir</th>
                    <th>Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((trx) => (
                    <tr key={trx.id}>
                      <td className="table-v3__cell--mono">
                        {new Date(trx.created_at).toLocaleString()}
                      </td>
                      <td className="table-v3__cell--strong">{trx.nama_santri}</td>
                      <td>
                        <Badge variant={trxTypeBadgeVariant(trx.trx_type)}>
                          {trxTypeLabel(trx.trx_type)}
                        </Badge>
                      </td>
                      <td>{trx.nama_merchant}</td>
                      <td>{trx.device_id}</td>
                      <td className="table-v3__cell--strong">
                        Rp {Number(trx.nominal).toLocaleString()}
                      </td>
                      <td>Rp {Number(trx.saldo_awal).toLocaleString()}</td>
                      <td>Rp {Number(trx.saldo_akhir).toLocaleString()}</td>
                      <td>
                        <StatusBadge status={trx.sync_status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableScroll>
            <TablePagination
              page={page}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
            />
          </>
        )}
      </DataTableCard>
    </AppShell>
  );
}

export default RFIDTransactionPage;
