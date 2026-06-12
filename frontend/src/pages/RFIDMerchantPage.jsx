import { useEffect, useMemo, useState } from "react";
import AppShell from "../layouts/AppShell";
import api from "../services/api";
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

function MerchantStatusBadge({ active }) {
  return (
    <Badge variant={active ? "success" : "neutral"} size="md">
      {active ? "Aktif" : "Nonaktif"}
    </Badge>
  );
}

function RFIDMerchantPage() {
  const [merchants, setMerchants] = useState([]);
  const [nama, setNama] = useState("");
  const [tableSearch, setTableSearch] = useState("");

  const loadData = async () => {
    try {
      const res = await api.get("/rfid/merchant");
      setMerchants(res.data.data || []);
    } catch (err) {
      console.log(err);
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

  const tambahMerchant = async () => {
    if (!nama.trim()) return;

    try {
      await api.post("/rfid/merchant", {
        nama_merchant: nama,
      });

      setNama("");
      loadData();
    } catch (err) {
      console.log(err);
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
      console.log(err);
    }
  };

  return (
    <AppShell
      title="RFID Merchant"
      description="Kelola merchant RFID pesantren"
      breadcrumb="Keamanan / RFID Merchant"
    >
      <Card padding="md" shadow="card" border={false} radius="xl">
        <div style={actionBarStyle}>
          <input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Nama Merchant"
            style={{
              padding: "12px",
              width: "300px",
              border: "1px solid #E5E7EB",
              borderRadius: "10px",
            }}
          />
          <Button type="button" variant="primary" onClick={tambahMerchant}>
            Tambah Merchant
          </Button>
        </div>
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
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Merchant</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMerchants.map((item) => (
                    <tr key={item.id}>
                      <td style={tdStyle}>{item.id}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{item.nama_merchant}</td>
                      <td style={tdStyle}>
                        <MerchantStatusBadge active={item.status} />
                      </td>
                      <td style={tdStyle}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => toggleStatus(item)}
                        >
                          {item.status ? "Nonaktifkan" : "Aktifkan"}
                        </Button>
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

export default RFIDMerchantPage;
