import { useEffect, useMemo, useState } from "react";
import { FaUndo } from "react-icons/fa";
import AppShell from "../layouts/AppShell";
import api from "../services/api";
import Card from "../components/ui/Card";
import StatusBadge from "../components/ui/StatusBadge";
import DataTableCard from "../components/ui/DataTableCard";
import TableToolbar from "../components/ui/TableToolbar";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import { Table, TableScroll, TableActions, TablePagination, useClientPagination } from "../components/ui/table";
import { FilterBar, FormField, Select } from "../components/ui/form";
function trxTypeLabel(trxType) {
  if (trxType === "payment") return "PEMBAYARAN";
  if (trxType === "topup") return "TOPUP";
  if (trxType === "refund") return "REFUND";
  return String(trxType || "").toUpperCase();
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
      console.error(err);
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

  const { page, setPage, paginatedItems, totalItems, pageSize } = useClientPagination(filteredTransaksi);

  useEffect(() => {
    setPage(1);
  }, [tableSearch, selectedSantri, setPage]);

  const refund = async (id) => {
    try {
      await api.post("/rfid/refund", {
        transaksi_id: id,
      });

      alert("Refund berhasil");
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppShell title="Refund RFID" breadcrumb="Keamanan / RFID Refund">
      <Card padding="md" shadow="card" border={false} radius="xl">
        <FilterBar label="Filter">
          <FormField label="Santri" htmlFor="refund-santri">
            <Select
              id="refund-santri"
              value={selectedSantri}
              onChange={(e) => setSelectedSantri(e.target.value)}
            >
              <option value="">Pilih Santri</option>
              {santri.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
            </Select>
          </FormField>
        </FilterBar>
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
            <>
            <TableScroll>
              <Table>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Merchant</th>
                    <th>Nominal</th>
                    <th>Jenis</th>
                    <th className="table-v3__cell--actions">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((item) => (
                    <tr key={item.id}>
                      <td className="table-v3__cell--mono">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                      <td>{item.nama_merchant || "—"}</td>
                      <td className="table-v3__cell--strong">
                        Rp {Number(item.nominal).toLocaleString()}
                      </td>
                      <td>
                        <StatusBadge status={item.trx_type}>
                          {trxTypeLabel(item.trx_type)}
                        </StatusBadge>
                      </td>
                      <td className="table-v3__cell--actions">
                        <TableActions
                          items={[
                            {
                              type: "custom",
                              icon: FaUndo,
                              title: "Refund",
                              variant: "success",
                              hidden: item.trx_type !== "payment",
                              onClick: () => refund(item.id),
                            },
                          ]}
                        />
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
          )}        </DataTableCard>
      </div>
    </AppShell>
  );
}

export default RFIDRefundPage;
