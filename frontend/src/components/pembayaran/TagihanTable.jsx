import { useEffect } from "react";
import { FaMoneyBillWave } from "react-icons/fa";
import Button from "../ui/Button";
import DataTableCard from "../ui/DataTableCard";
import TableToolbar from "../ui/TableToolbar";
import SearchInput from "../ui/SearchInput";
import EmptyState from "../ui/EmptyState";
import StatusBadge from "../ui/StatusBadge";
import {
  Table,
  TableScroll,
  TableActions,
  TablePagination,
  useClientPagination,
} from "../ui/table";
import { formatCurrency } from "../../utils/formatCurrency";

function TagihanTable({
  pembayaran,
  filteredPembayaran,
  tableSearch,
  onSearchChange,
  onExport,
  onBayar,
  onHistori,
  onHapus,
}) {
  const { page, setPage, paginatedItems, totalItems, pageSize } =
    useClientPagination(filteredPembayaran);

  useEffect(() => {
    setPage(1);
  }, [tableSearch, setPage]);

  return (
    <DataTableCard
      title="Daftar Tagihan"
      subtitle="Kelola tagihan dan pembayaran santri"
      actions={
        <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
          {filteredPembayaran.length} tagihan
        </span>
      }
    >
      <TableToolbar
        search={
          <SearchInput
            value={tableSearch}
            onChange={onSearchChange}
            placeholder="Cari santri, tagihan, status..."
          />
        }
        actions={
          <Button variant="success" onClick={onExport}>
            Export Excel
          </Button>
        }
      />

      {filteredPembayaran.length === 0 ? (
        <EmptyState
          title={pembayaran.length === 0 ? "Belum ada tagihan" : "Tidak ada hasil pencarian"}
          description={
            pembayaran.length === 0
              ? "Generate tagihan pertama untuk memulai."
              : "Coba kata kunci lain atau hapus filter pencarian."
          }
        />
      ) : (
        <>
          <TableScroll>
            <Table>
              <thead>
                <tr>
                  <th>Santri</th>
                  <th>Nama Tagihan</th>
                  <th>Nominal</th>
                  <th>Bayar</th>
                  <th>Sisa</th>
                  <th>Status</th>
                  <th className="table-v3__cell--actions">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((p) => (
                  <tr key={p.id}>
                    <td className="table-v3__cell--strong">{p.nama}</td>
                    <td>{p.nama_tagihan}</td>
                    <td>{formatCurrency(p.nominal_tagihan || 0)}</td>
                    <td>{formatCurrency(p.nominal_bayar || 0)}</td>
                    <td>{formatCurrency(p.sisa_tunggakan || 0)}</td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="table-v3__cell--actions">
                      <TableActions
                        items={[
                          {
                            type: "custom",
                            icon: FaMoneyBillWave,
                            title: "Bayar",
                            variant: "success",
                            onClick: () => onBayar(p),
                          },
                          { type: "history", onClick: () => onHistori(p) },
                          { type: "delete", onClick: () => onHapus(p.id) },
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
      )}
    </DataTableCard>
  );
}

export default TagihanTable;
