import { useEffect, useMemo, useState } from "react";
import AppShell from "../layouts/AppShell";
import api, { API_BASE_URL } from "../services/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import DataTableCard from "../components/ui/DataTableCard";
import TableToolbar from "../components/ui/TableToolbar";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import { Table, TableScroll } from "../components/ui/table";
import { FormField, Input, Select, FormGrid, FormActionBar } from "../components/ui/form";
import { getUser } from "../utils/storage";

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
      console.error(err);
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
    const user = getUser() || {};

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
      console.error(err);
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
        <FormGrid>
          <FormField label="Santri" htmlFor="topup-santri" required>
            <Select id="topup-santri" value={santriId} onChange={(e) => setSantriId(e.target.value)}>
              <option value="">Pilih Santri</option>
              {santri.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Nominal" htmlFor="topup-nominal" required>
            <Input
              id="topup-nominal"
              type="number"
              value={nominal}
              onChange={(e) => setNominal(e.target.value)}
            />
          </FormField>
        </FormGrid>
        <FormActionBar className="form-action-bar-v3--compact">
          <Button type="button" variant="primary" onClick={submitTopup}>
            Topup Saldo
          </Button>
        </FormActionBar>
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
            <TableScroll>
              <Table>
                <thead>
                  <tr>
                    <th>NIS</th>
                    <th>Nama</th>
                    <th>Kelas</th>
                    <th>UID RFID</th>
                    <th>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSantri.map((s) => (
                    <tr key={s.id}>
                      <td>{s.nis}</td>
                      <td className="table-v3__cell--strong">{s.nama}</td>
                      <td>{s.nama_kelas || "—"}</td>
                      <td className="table-v3__cell--mono">{s.uid_rfid || "—"}</td>
                      <td className="table-v3__cell--strong">
                        Rp {Number(s.saldo || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableScroll>
          )}
        </DataTableCard>
      </div>
    </AppShell>
  );
}

export default RFIDTopupPage;
