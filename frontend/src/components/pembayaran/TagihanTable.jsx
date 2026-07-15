import { useEffect, useMemo, useRef, useState } from "react";
import { FaFileInvoice, FaMoneyBillWave } from "react-icons/fa";
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
} from "../ui/table";
import { DEFAULT_PAGE_SIZE } from "../../hooks/useClientPagination";
import { FilterBar, Select } from "../ui/form";
import { formatCurrency } from "../../utils/formatCurrency";
import { BULAN_NAMA, isTagihanLunas, tagihanHasPayment } from "./pembayaranShared";

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "belum", label: "Belum Bayar" },
  { value: "cicil", label: "Cicil" },
  { value: "lunas", label: "Lunas" },
];

function TagihanTable({
  pembayaran,
  pagination,
  page,
  onPageChange,
  isLoading = false,
  tableSearch,
  onSearchChange,
  filterBulan,
  onFilterBulanChange,
  filterTahun,
  onFilterTahunChange,
  filterJenis,
  onFilterJenisChange,
  filterStatus,
  onFilterStatusChange,
  jenisTagihanOptions,
  onExport,
  onBayar,
  onHistori,
  onInvoice,
  onHapus,
}) {
  const pageSize = pagination?.limit || DEFAULT_PAGE_SIZE;
  const totalItems = pagination?.total || 0;

  const tahunOptions = useMemo(() => {
    const years = [Number(filterTahun), new Date().getFullYear(), new Date().getFullYear() - 1];
    return [...new Set(years.filter(Boolean))].sort((a, b) => b - a);
  }, [filterTahun]);

  return (
    <DataTableCard
      title="Daftar Tagihan"
      subtitle="Kelola tagihan dan pembayaran santri"
      actions={
        <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
          {totalItems} tagihan
        </span>
      }
    >
      <FilterBar label="Filter">
        <Select value={filterBulan} onChange={onFilterBulanChange} aria-label="Bulan">
          {BULAN_NAMA.map((nama) => (
            <option key={nama} value={nama}>
              {nama}
            </option>
          ))}
        </Select>
        <Select value={filterTahun} onChange={onFilterTahunChange} aria-label="Tahun">
          {tahunOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <Select value={filterJenis} onChange={onFilterJenisChange} aria-label="Jenis tagihan">
          <option value="">Semua Jenis</option>
          {jenisTagihanOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nama_tagihan}
            </option>
          ))}
        </Select>
        <Select value={filterStatus} onChange={onFilterStatusChange} aria-label="Status">
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </FilterBar>

      <TableToolbar
        search={
          <SearchInput
            value={tableSearch}
            onChange={onSearchChange}
            placeholder="Cari nama santri..."
          />
        }
        actions={
          <Button variant="success" onClick={onExport} disabled={isLoading}>
            Export Excel
          </Button>
        }
      />

      {isLoading ? (
        <EmptyState title="Memuat data..." description="Mohon tunggu sebentar." />
      ) : pembayaran.length === 0 ? (
        <EmptyState
          title="Tidak ada tagihan"
          description="Coba ubah filter atau kata kunci pencarian."
        />
      ) : (
        <>
          <TableScroll>
            <Table>
              <thead>
                <tr>
              <th>Santri</th>
              <th>Kamar / Asrama</th>
                  <th>Nama Tagihan</th>
                  <th>Periode</th>
                  <th>Nominal</th>
                  <th>Bayar</th>
                  <th>Sisa</th>
                  <th>Status</th>
                  <th className="table-v3__cell--actions">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pembayaran.map((p) => (
                  <tr key={p.id}>
                    <td className="table-v3__cell--strong">{p.nama}</td>
                    <td>{p.kamar || "—"}</td>
                    <td>{p.nama_tagihan}</td>
                    <td>
                      {p.bulan} {p.tahun}
                    </td>
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
                            icon: FaFileInvoice,
                            title: "Lihat Invoice",
                            hidden: !p.latest_invoice_id || !onInvoice,
                            onClick: () => onInvoice(p.latest_invoice_id),
                          },
                          {
                            type: "custom",
                            icon: FaMoneyBillWave,
                            title: "Bayar",
                            variant: "success",
                            hidden: isTagihanLunas(p.status),
                            onClick: () => onBayar(p),
                          },
                          { type: "history", onClick: () => onHistori(p) },
                          {
                            type: "delete",
                            title: tagihanHasPayment(p)
                              ? "Tidak dapat dihapus: sudah ada pembayaran"
                              : "Hapus tagihan",
                            disabled: tagihanHasPayment(p),
                            onClick: () => onHapus(p.id),
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
            onPageChange={onPageChange}
          />
        </>
      )}
    </DataTableCard>
  );
}

export default TagihanTable;
