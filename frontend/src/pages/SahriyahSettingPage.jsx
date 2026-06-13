import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import Modal from "../components/Modal";
import Button from "../components/ui/Button";
import DataTableCard from "../components/ui/DataTableCard";
import TableToolbar from "../components/ui/TableToolbar";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import { Table, TableScroll, TableActions } from "../components/ui/table";
import {
  FormField,
  Input,
  Textarea,
  FormGrid,
  FormActionBar,
} from "../components/ui/form";
import { KeuanganPageStyles } from "../components/shared/PageResponsiveStyles";

function SahriyahSettingPage() {
  const [data, setData] = useState([]);
  const [tableSearch, setTableSearch] = useState("");
  const [editModal, setEditModal] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState({ nominal_uang: "", nominal_beras: "", keterangan: "" });

  const getData = async () => {
    try {
      const response = await api.get(`/sahriyah-setting?t=${Date.now()}`);
      setData(response.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const filteredData = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return data;
    return data.filter((d) =>
      [d.nama, d.keterangan, d.nominal_uang, d.nominal_beras]
        .some((field) => String(field || "").toLowerCase().includes(q)),
    );
  }, [data, tableSearch]);

  const openEdit = (row) => {
    setEditRow(row);
    setForm({
      nominal_uang: String(row.nominal_uang ?? ""),
      nominal_beras: String(row.nominal_beras ?? ""),
      keterangan: row.keterangan || "",
    });
    setEditModal(true);
  };

  const saveSetting = async () => {
    if (!editRow) return;
    try {
      await api.put(`/sahriyah-setting/${editRow.id}`, {
        nominal_uang: Number(form.nominal_uang),
        nominal_beras: Number(form.nominal_beras),
        keterangan: form.keterangan,
      });
      setEditModal(false);
      setEditRow(null);
      await getData();
      alert("Berhasil disimpan");
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan");
    }
  };

  return (
    <AppShell title="Setting Sahriyah" breadcrumb="Keuangan / Setting Sahriyah">
      <KeuanganPageStyles />
      <div className="keuangan-page">
      <DataTableCard
        title="Pengaturan Nominal Sahriyah"
        subtitle="Kelola tarif uang dan beras per kategori"
        actions={
          <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
            {filteredData.length} setting
          </span>
        }
      >
        <TableToolbar
          search={
            <SearchInput
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Cari nama, keterangan..."
            />
          }
        />

        {filteredData.length === 0 ? (
          <EmptyState
            title={data.length === 0 ? "Belum ada setting" : "Tidak ada hasil pencarian"}
            description={
              data.length === 0
                ? "Data pengaturan belum tersedia."
                : "Coba kata kunci lain atau hapus filter pencarian."
            }
          />
        ) : (
          <TableScroll>
            <Table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Nominal Uang</th>
                  <th>Nominal Beras</th>
                  <th>Keterangan</th>
                  <th className="table-v3__cell--actions">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((d) => (
                  <tr key={d.id}>
                    <td className="table-v3__cell--strong">{d.nama}</td>
                    <td>Rp {Number(d.nominal_uang || 0).toLocaleString()}</td>
                    <td>{d.nominal_beras || 0} Kg</td>
                    <td>{d.keterangan || "—"}</td>
                    <td className="table-v3__cell--actions">
                      <TableActions items={[{ type: "edit", onClick: () => openEdit(d) }]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableScroll>
        )}
      </DataTableCard>

      <Modal
        open={editModal}
        title={`Edit Setting — ${editRow?.nama || ""}`}
        onClose={() => setEditModal(false)}
        width={440}
      >
        <FormGrid columns="modal">
          <FormField label="Nominal Uang" htmlFor="setting-uang" required>
            <Input
              id="setting-uang"
              type="number"
              value={form.nominal_uang}
              onChange={(e) => setForm({ ...form, nominal_uang: e.target.value })}
            />
          </FormField>
          <FormField label="Nominal Beras (Kg)" htmlFor="setting-beras" required>
            <Input
              id="setting-beras"
              type="number"
              value={form.nominal_beras}
              onChange={(e) => setForm({ ...form, nominal_beras: e.target.value })}
            />
          </FormField>
          <FormField label="Keterangan" htmlFor="setting-ket" fullWidth>
            <Textarea
              id="setting-ket"
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
              rows={3}
            />
          </FormField>
        </FormGrid>
        <FormActionBar className="form-action-bar-v3--compact">
          <Button variant="primary" onClick={saveSetting}>
            Simpan
          </Button>
          <Button variant="outline" onClick={() => setEditModal(false)}>
            Batal
          </Button>
        </FormActionBar>
      </Modal>
      </div>
    </AppShell>
  );
}

export default SahriyahSettingPage;
