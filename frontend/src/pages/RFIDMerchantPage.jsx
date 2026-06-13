import { useEffect, useMemo, useState } from "react";
import AppShell from "../layouts/AppShell";
import api from "../services/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import DataTableCard from "../components/ui/DataTableCard";
import TableToolbar from "../components/ui/TableToolbar";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import StatusBadge from "../components/ui/StatusBadge";
import { Table, TableScroll, TableActions, TablePagination, useClientPagination } from "../components/ui/table";
import { FormField, Input, FormGrid, FormActionBar } from "../components/ui/form";

function RFIDMerchantPage() {
  const [merchants, setMerchants] = useState([]);
  const [nama, setNama] = useState("");
  const [tableSearch, setTableSearch] = useState("");

  const loadData = async () => {
    try {
      const res = await api.get("/rfid/merchant");
      setMerchants(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredMerchants = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return merchants;
    return merchants.filter((item) =>
      [item.id, item.nama_merchant, item.status ? "aktif" : "nonaktif"]
        .some((field) => String(field || "").toLowerCase().includes(q)),
    );
  }, [merchants, tableSearch]);

  const { page, setPage, paginatedItems, totalItems, pageSize } = useClientPagination(filteredMerchants);

  useEffect(() => {
    setPage(1);
  }, [tableSearch, setPage]);

  const tambahMerchant = async () => {
    if (!nama.trim()) return;

    try {
      await api.post("/rfid/merchant", {
        nama_merchant: nama,
      });

      setNama("");
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (item) => {
    try {
      await api.put(`/rfid/merchant/${item.id}`, {
        nama_merchant: item.nama_merchant,
        status: !item.status,
      });

      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppShell
      title="RFID Merchant"
      description="Kelola merchant RFID pesantren"
      breadcrumb="Keamanan / RFID Merchant"
    >
      <Card padding="md" shadow="card" border={false} radius="xl">
        <FormGrid columns="single">
          <FormField label="Nama Merchant" htmlFor="merchant-nama" required>
            <Input
              id="merchant-nama"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama merchant RFID"
            />
          </FormField>
        </FormGrid>
        <FormActionBar className="form-action-bar-v3--compact">
          <Button type="button" variant="primary" onClick={tambahMerchant}>
            Tambah Merchant
          </Button>
        </FormActionBar>
      </Card>

      <div style={{ marginTop: "var(--space-6)" }}>
        <DataTableCard
          title="Daftar Merchant"
          subtitle="Kelola merchant dan status operasional"
          actions={
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
              {filteredMerchants.length} merchant
            </span>
          }
        >
          <TableToolbar
            search={
              <SearchInput
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Cari merchant, status..."
              />
            }
          />

          {filteredMerchants.length === 0 ? (
            <EmptyState
              title={merchants.length === 0 ? "Belum ada merchant" : "Tidak ada hasil pencarian"}
              description={
                merchants.length === 0
                  ? "Tambahkan merchant pertama untuk memulai."
                  : "Coba kata kunci lain atau hapus filter pencarian."
              }
            />
          ) : (
            <>
            <TableScroll>
              <Table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Merchant</th>
                    <th>Status</th>
                    <th className="table-v3__cell--actions">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td className="table-v3__cell--strong">{item.nama_merchant}</td>
                      <td>
                        <StatusBadge status={item.status ? "Aktif" : "Nonaktif"} />
                      </td>
                      <td className="table-v3__cell--actions">
                        <TableActions
                          items={[
                            {
                              type: "toggle",
                              active: item.status,
                              onClick: () => toggleStatus(item),
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
          )}
        </DataTableCard>
      </div>
    </AppShell>
  );
}

export default RFIDMerchantPage;
