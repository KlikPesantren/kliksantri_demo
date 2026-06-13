import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import Card from "../components/ui/Card";
import SectionHeading from "../components/ui/SectionHeading";
import KpiCard from "../components/ui/KpiCard";
import KpiGrid from "../components/ui/KpiGrid";
import Button from "../components/ui/Button";
import DataTableCard from "../components/ui/DataTableCard";
import TableToolbar from "../components/ui/TableToolbar";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import StatusBadge from "../components/ui/StatusBadge";
import { Table, TableScroll, TableActions, TablePagination, useClientPagination } from "../components/ui/table";
import { LegacyPageStyles } from "../components/shared/PageResponsiveStyles";
import { FaSignOutAlt } from "react-icons/fa";
import {
  FormField,
  Input,
  Textarea,
  FormGrid,
  FormActionBar,
  FilterBar,
} from "../components/ui/form";
import { exportExcel } from "../utils/exportExcel";
import { formatNumber } from "../utils/formatCurrency";

function TamuPage() {
  const [tamu, setTamu] = useState([]);
  const [editId, setEditId] = useState(null);
  const [searchNama, setSearchNama] = useState("");
  const [searchTujuan, setSearchTujuan] = useState("");
  const [searchInstansi, setSearchInstansi] = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [form, setForm] = useState({
    nama_tamu: "",
    no_hp: "",
    alamat: "",
    instansi: "",
    tujuan: "",
    bertemu_dengan: "",
    keperluan: "",
    jumlah_orang: 1,
    petugas: "",
  });

  const getTamu = async () => {
    try {
      const response = await api.get("/tamu");
      setTamu(response.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getTamu();
  }, []);

  const simpanTamu = async () => {
    try {
      if (editId) {
        await api.put(`/tamu/${editId}`, form);
      } else {
        await api.post("/tamu", form);
      }

      alert("Data berhasil disimpan");

      setEditId(null);
      setForm({
        nama_tamu: "",
        no_hp: "",
        alamat: "",
        instansi: "",
        tujuan: "",
        bertemu_dengan: "",
        keperluan: "",
        jumlah_orang: 1,
        petugas: "",
      });

      getTamu();
    } catch (err) {
      console.error(err);
      alert("Gagal");
    }
  };

  const editTamu = (item) => {
    setEditId(item.id);
    setForm({
      nama_tamu: item.nama_tamu || "",
      no_hp: item.no_hp || "",
      alamat: item.alamat || "",
      instansi: item.instansi || "",
      tujuan: item.tujuan || "",
      bertemu_dengan: item.bertemu_dengan || "",
      keperluan: item.keperluan || "",
      jumlah_orang: item.jumlah_orang || 1,
      petugas: item.petugas || "",
    });
  };

  const hapusTamu = async (id) => {
    if (!window.confirm("Hapus data?")) return;

    try {
      await api.delete(`/tamu/${id}`);
      getTamu();
    } catch (err) {
      console.error(err);
    }
  };

  const keluarTamu = async (id) => {
    if (!window.confirm("Tamu sudah pulang?")) return;

    try {
      await api.patch(`/tamu/${id}/keluar`);
      await getTamu();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = useMemo(() => tamu.filter((item) => {
    
    const nama = (item.nama_tamu || "")
      .toLowerCase()
      .includes(searchNama.toLowerCase());

    const tujuan = (item.tujuan || "")
      .toLowerCase()
      .includes(searchTujuan.toLowerCase());

    const instansi = (item.instansi || "")
      .toLowerCase()
      .includes(searchInstansi.toLowerCase());

    const tanggal =
      !filterTanggal
        ? true
        : item.tanggal?.split("T")[0] === filterTanggal;

    return nama && tujuan && instansi && tanggal;
  }), [tamu, searchNama, searchTujuan, searchInstansi, filterTanggal]);

  const { page, setPage, paginatedItems, totalItems, pageSize } = useClientPagination(filtered);

  useEffect(() => {
    setPage(1);
  }, [searchNama, searchTujuan, searchInstansi, filterTanggal, setPage]);

  const today = new Date().toLocaleDateString("sv-SE");

  const totalHariIni = tamu.filter(
    (t) =>
      new Date(t.tanggal).toLocaleDateString("sv-SE") === today,
  ).length;

  const masihDidalam = tamu.filter((t) => t.status === "Masuk").length;
  const sudahKeluar = tamu.filter((t) => t.status === "Keluar").length;

  const bulanIni = new Date().getMonth() + 1;
  const tahunIni = new Date().getFullYear();

  const totalBulanIni = tamu.filter((t) => {
    const d = new Date(t.tanggal);
    return d.getMonth() + 1 === bulanIni && d.getFullYear() === tahunIni;
  }).length;

  const exportData = () => {
    exportExcel(
      filtered.map((item) => ({
        Tanggal: new Date(item.tanggal).toLocaleDateString("id-ID"),
        "Jam Masuk": item.jam_masuk,
        "Jam Keluar": item.jam_keluar || "-",
        "Nama Tamu": item.nama_tamu,
        Instansi: item.instansi,
        Tujuan: item.tujuan,
        "Bertemu Dengan": item.bertemu_dengan,
        "Jumlah Orang": item.jumlah_orang,
        Status: item.status,
        Petugas: item.petugas,
      })),
      "DaftarTamu",
    );
  };

  return (
    <AppShell title="Daftar Hadir Tamu" breadcrumb="Keamanan / Daftar Hadir Tamu">
      <LegacyPageStyles />
      <div className="legacy-page">
        <KpiGrid>
          <KpiCard label="Tamu Hari Ini" value={formatNumber(totalHariIni)} accent="primary" />
          <KpiCard label="Masih Di Dalam" value={formatNumber(masihDidalam)} accent="success" />
          <KpiCard label="Sudah Keluar" value={formatNumber(sudahKeluar)} accent="danger" />
          <KpiCard label="Bulan Ini" value={formatNumber(totalBulanIni)} accent="neutral" />
        </KpiGrid>

        <div style={{ marginTop: "var(--space-6)" }}>
          <Card padding="md" shadow="card" border={false} radius="xl">
            <SectionHeading variant="eyebrow" spacing="first">
              Input Tamu
            </SectionHeading>

            <FormGrid style={{ marginTop: "var(--space-4)" }}>
              <FormField label="Nama Tamu" htmlFor="tamu-nama" required>
                <Input
                  id="tamu-nama"
                  value={form.nama_tamu}
                  onChange={(e) => setForm({ ...form, nama_tamu: e.target.value })}
                />
              </FormField>
              <FormField label="Nomor HP" htmlFor="tamu-hp">
                <Input
                  id="tamu-hp"
                  value={form.no_hp}
                  onChange={(e) => setForm({ ...form, no_hp: e.target.value })}
                />
              </FormField>
              <FormField label="Instansi" htmlFor="tamu-instansi">
                <Input
                  id="tamu-instansi"
                  value={form.instansi}
                  onChange={(e) => setForm({ ...form, instansi: e.target.value })}
                />
              </FormField>
              <FormField label="Tujuan" htmlFor="tamu-tujuan">
                <Input
                  id="tamu-tujuan"
                  value={form.tujuan}
                  onChange={(e) => setForm({ ...form, tujuan: e.target.value })}
                />
              </FormField>
              <FormField label="Bertemu Dengan" htmlFor="tamu-bertemu">
                <Input
                  id="tamu-bertemu"
                  value={form.bertemu_dengan}
                  onChange={(e) => setForm({ ...form, bertemu_dengan: e.target.value })}
                />
              </FormField>
              <FormField label="Jumlah Orang" htmlFor="tamu-jumlah">
                <Input
                  id="tamu-jumlah"
                  type="number"
                  value={form.jumlah_orang}
                  onChange={(e) => setForm({ ...form, jumlah_orang: e.target.value })}
                />
              </FormField>
              <FormField label="Petugas" htmlFor="tamu-petugas">
                <Input
                  id="tamu-petugas"
                  value={form.petugas}
                  onChange={(e) => setForm({ ...form, petugas: e.target.value })}
                />
              </FormField>
              <FormField label="Alamat" htmlFor="tamu-alamat" fullWidth>
                <Textarea
                  id="tamu-alamat"
                  value={form.alamat}
                  onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                  rows={2}
                />
              </FormField>
              <FormField label="Keperluan" htmlFor="tamu-keperluan" fullWidth>
                <Textarea
                  id="tamu-keperluan"
                  value={form.keperluan}
                  onChange={(e) => setForm({ ...form, keperluan: e.target.value })}
                  rows={2}
                />
              </FormField>
            </FormGrid>

            <FormActionBar className="form-action-bar-v3--compact">
              <Button variant="primary" onClick={simpanTamu}>
                Simpan
              </Button>
            </FormActionBar>
          </Card>
        </div>

        <div style={{ marginTop: "var(--space-6)" }}>
          <DataTableCard
            title="Daftar Tamu"
            subtitle="Rekap kunjungan tamu pesantren"
            actions={
              <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
                {tamu.length} tamu
              </span>
            }
          >
            <FilterBar label="Filter" className="filter-bar-v3--table">
              <SearchInput
                value={searchNama}
                onChange={(e) => setSearchNama(e.target.value)}
                placeholder="Cari nama..."
              />
              <SearchInput
                value={searchTujuan}
                onChange={(e) => setSearchTujuan(e.target.value)}
                placeholder="Cari tujuan..."
              />
              <SearchInput
                value={searchInstansi}
                onChange={(e) => setSearchInstansi(e.target.value)}
                placeholder="Cari instansi..."
              />
              <Input
                type="date"
                value={filterTanggal}
                onChange={(e) => setFilterTanggal(e.target.value)}
                aria-label="Filter tanggal"
              />
            </FilterBar>

            <TableToolbar
              actions={
                <Button variant="success" onClick={exportData}>
                  Export Excel
                </Button>
              }
            />

            {tamu.length === 0 ? (
              <EmptyState
                title="Belum ada tamu"
                description="Input tamu pertama untuk memulai."
              />
            ) : (
              <>
              <TableScroll>
                <Table>
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Jam Masuk</th>
                      <th>Jam Keluar</th>
                      <th>Nama</th>
                      <th>Instansi</th>
                      <th>Tujuan</th>
                      <th>Bertemu</th>
                      <th>Jumlah</th>
                      <th>Status</th>
                      <th>Petugas</th>
                      <th className="table-v3__cell--actions">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((item) => (
                      <tr key={item.id}>
                        <td>{new Date(item.tanggal).toLocaleDateString("id-ID")}</td>
                        <td>{item.jam_masuk}</td>
                        <td>{item.jam_keluar || "—"}</td>
                        <td className="table-v3__cell--strong">{item.nama_tamu}</td>
                        <td>{item.instansi}</td>
                        <td>{item.tujuan}</td>
                        <td>{item.bertemu_dengan}</td>
                        <td>{item.jumlah_orang}</td>
                        <td>
                          <StatusBadge status={item.status === "Masuk" ? "aktif" : "ditolak"}>
                            {item.status}
                          </StatusBadge>
                        </td>
                        <td>{item.petugas}</td>
                        <td className="table-v3__cell--actions">
                          <TableActions
                            items={[
                              { type: "edit", onClick: () => editTamu(item) },
                              { type: "delete", onClick: () => hapusTamu(item.id) },
                              {
                                type: "custom",
                                icon: FaSignOutAlt,
                                title: "Keluar",
                                variant: "success",
                                hidden: item.status !== "Masuk",
                                onClick: () => keluarTamu(item.id),
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
      </div>
    </AppShell>
  );
}

export default TamuPage;
