import { useEffect, useMemo, useState } from "react";
import { FaMoneyBillWave } from "react-icons/fa";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import Card from "../components/ui/Card";
import KpiCard from "../components/ui/KpiCard";
import KpiGrid from "../components/ui/KpiGrid";
import Modal from "../components/Modal";
import Button from "../components/ui/Button";
import SahriyahHistoriModal from "../components/sahriyah/SahriyahHistoriModal";
import DataTableCard from "../components/ui/DataTableCard";
import TableToolbar from "../components/ui/TableToolbar";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import StatusBadge from "../components/ui/StatusBadge";
import {
  Table,
  TableScroll,
  TableActions,
  TablePagination,
  useClientPagination,
} from "../components/ui/table";
import {
  FormField,
  Input,
  Select,
  FormGrid,
  FormActionBar,
  FilterBar,
} from "../components/ui/form";
import { exportExcel } from "../utils/exportExcel";
import { formatCurrency, formatNumber } from "../utils/formatCurrency";
import { KeuanganPageStyles } from "../components/shared/PageResponsiveStyles";

function SahriyahPage() {
  const [data, setData] = useState([]);
  const [showBayar, setShowBayar] = useState(false);
  const [selectedTagihan, setSelectedTagihan] = useState(null);
  const [formBayar, setFormBayar] = useState({
    nominal: "",
    beras: "",
    petugas: "",
  });
  const [search, setSearch] = useState("");
  const [showRiwayat, setShowRiwayat] = useState(false);
  const [riwayat, setRiwayat] = useState([]);
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());

  const getData = async () => {
    try {
      const response = await api.get(`/sahriyah?t=${Date.now()}`);
      setData([...response.data.data]);
    } catch (err) {
      console.error(err);
    }
  };

  const generateTagihan = async () => {
    try {
      await api.post("/sahriyah/generate", { bulan, tahun });
      alert("Tagihan berhasil dibuat");
      getData();
    } catch (err) {
      console.error(err);
      alert("Generate gagal");
    }
  };

  const bayarTagihan = (tagihan) => {
    setSelectedTagihan(tagihan);
    setFormBayar({ nominal: "", beras: "", petugas: "" });
    setShowBayar(true);
  };

  const lihatRiwayat = async (id) => {
    try {
      const response = await api.get(`/sahriyah/riwayat/${id}`);
      setRiwayat(response.data.data);
      setShowRiwayat(true);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const filtered = useMemo(
    () =>
      data.filter(
        (d) =>
          d.nama?.toLowerCase().includes(search.toLowerCase()) &&
          d.bulan === bulan &&
          d.tahun === tahun,
      ),
    [data, search, bulan, tahun],
  );

  const { page, setPage, paginatedItems, totalItems, pageSize } = useClientPagination(filtered);

  useEffect(() => {
    setPage(1);
  }, [search, bulan, tahun, setPage]);

  useEffect(() => {}, [data]);

  const simpanPembayaran = async () => {
    try {
      await api.put(`/sahriyah/bayar/${selectedTagihan.id}`, {
        nominal: Number(formBayar.nominal || 0),
        beras: Number(formBayar.beras || 0),
        petugas: formBayar.petugas,
      });

      const response = await api.get(`/sahriyah?t=${Date.now()}`);

      

      setData([]);

      setTimeout(() => {
        setData([...response.data.data]);
      }, 10);

      setShowBayar(false);
      setSelectedTagihan(null);
      setFormBayar({ nominal: "", beras: "", petugas: "" });

      setSelectedTagihan(null);
      setFormBayar({ nominal: "", beras: "", petugas: "" });
    } catch (err) {
      console.error(err);
      alert("Pembayaran gagal");
    }
  };

  const hapusTagihan = async (id) => {
    const yakin = window.confirm("Yakin hapus tagihan sahriyah ini?");
    if (!yakin) return;

    try {
      await api.delete(`/sahriyah/${id}`);
      await getData();
      alert("Tagihan berhasil dihapus");
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus tagihan");
    }
  };

  const handleExport = () => {
    const rows = filtered.map((d) => ({
      Nama: d.nama,
      Tagihan: Number(d.nominal),
      SudahBayar: Number(d.total_bayar),
      Sisa: Number(d.sisa_tagihan),
      Beras: Number(d.nominal_beras),
      BerasMasuk: Number(d.beras_terbayar),
      SisaBeras: Number(d.sisa_beras),
      Status: d.status,
    }));

    exportExcel(rows, "Sahriyah");
  };

  const totalNominal = filtered.reduce((a, b) => a + Number(b.nominal || 0), 0);
  const periodData = data.filter((d) => d.bulan === bulan && d.tahun === tahun);

  const bulanLabel = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ][bulan - 1];

  return (
    <AppShell title="Sahriyah" breadcrumb="Keuangan / Sahriyah">
      <KeuanganPageStyles />
      <div className="keuangan-page">
      <Card padding="md" shadow="card" border={false} radius="xl">
        <FilterBar label="Periode" actions={<Button onClick={generateTagihan}>Generate Tagihan</Button>}>
          <Select value={bulan} onChange={(e) => setBulan(Number(e.target.value))} aria-label="Bulan">
            <option value={1}>Januari</option>
            <option value={2}>Februari</option>
            <option value={3}>Maret</option>
            <option value={4}>April</option>
            <option value={5}>Mei</option>
            <option value={6}>Juni</option>
            <option value={7}>Juli</option>
            <option value={8}>Agustus</option>
            <option value={9}>September</option>
            <option value={10}>Oktober</option>
            <option value={11}>November</option>
            <option value={12}>Desember</option>
          </Select>
          <Select value={tahun} onChange={(e) => setTahun(Number(e.target.value))} aria-label="Tahun">
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
            <option value={2028}>2028</option>
          </Select>
        </FilterBar>
      </Card>

      <div style={{ marginTop: "var(--space-6)" }}>
        <KpiGrid>
          <KpiCard label="Total Tagihan" value={formatNumber(filtered.length)} accent="primary" />
          <KpiCard
            label="Lunas"
            value={formatNumber(filtered.filter((d) => d.status === "Lunas").length)}
            accent="success"
          />
          <KpiCard
            label="Belum Lunas"
            value={formatNumber(filtered.filter((d) => d.status !== "Lunas").length)}
            accent="danger"
          />
          <KpiCard label="Total Nominal" value={formatCurrency(totalNominal)} accent="primary" />
        </KpiGrid>
      </div>

      <div style={{ marginTop: "var(--space-6)" }}>
        <DataTableCard
          title="Data Tagihan Sahriyah"
          subtitle={`Tagihan ${bulanLabel} ${tahun}`}
          actions={
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
              {filtered.length} tagihan
            </span>
          }
        >
          <TableToolbar
            search={
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama santri..."
              />
            }
            actions={
              <Button variant="success" onClick={handleExport}>
                Export Excel
              </Button>
            }
          />

          {filtered.length === 0 ? (
            <EmptyState
              title={periodData.length === 0 ? "Belum ada tagihan" : "Tidak ada hasil pencarian"}
              description={
                periodData.length === 0
                  ? "Generate tagihan untuk periode ini terlebih dahulu."
                  : "Coba kata kunci lain atau hapus filter pencarian."
              }
            />
          ) : (
            <>
              <TableScroll>
                <Table>
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>Tagihan Uang</th>
                      <th>Sudah Bayar</th>
                      <th>Sisa Uang</th>
                      <th>Tagihan Beras</th>
                      <th>Beras Masuk</th>
                      <th>Sisa Beras</th>
                      <th>Status</th>
                      <th>Tgl Bayar</th>
                      <th>Petugas</th>
                      <th className="table-v3__cell--actions">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((d) => (
                      <tr key={d.id}>
                        <td className="table-v3__cell--strong">
                          {d.nama}
                          <br />
                          <span className="table-v3__cell--muted">
                            ID:{d.id} · Bayar:{d.total_bayar}
                          </span>
                        </td>
                        <td>Rp {Number(d.nominal || 0).toLocaleString()}</td>
                        <td>Rp {Number(d.total_bayar || 0).toLocaleString()}</td>
                        <td>Rp {Number(d.sisa_tagihan || 0).toLocaleString()}</td>
                        <td>{Number(d.nominal_beras || 0)} Kg</td>
                        <td>{Number(d.beras_terbayar || 0)} Kg</td>
                        <td>{Number(d.sisa_beras || 0)} Kg</td>
                        <td>
                          <StatusBadge status={d.status} />
                        </td>
                        <td>{d.tanggal_bayar || "—"}</td>
                        <td>{d.petugas || "—"}</td>
                        <td className="table-v3__cell--actions">
                          <TableActions
                            items={[
                              {
                                type: "custom",
                                icon: FaMoneyBillWave,
                                title: "Bayar",
                                variant: "success",
                                hidden: d.status === "Lunas",
                                onClick: () => bayarTagihan(d),
                              },
                              { type: "history", onClick: () => lihatRiwayat(d.id) },
                              { type: "delete", onClick: () => hapusTagihan(d.id) },
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

      <Modal
        open={showBayar}
        title="Bayar Sahriyah"
        onClose={() => setShowBayar(false)}
        width={440}
      >
        <p style={{ margin: "0 0 var(--space-4)", color: "var(--text-secondary)" }}>
          {selectedTagihan?.nama}
        </p>
        <FormGrid columns="modal">
          <FormField label="Nominal Uang" htmlFor="sahriyah-nominal">
            <Input
              id="sahriyah-nominal"
              type="number"
              value={formBayar.nominal}
              onChange={(e) => setFormBayar({ ...formBayar, nominal: e.target.value })}
            />
          </FormField>
          <FormField label="Beras (Kg)" htmlFor="sahriyah-beras">
            <Input
              id="sahriyah-beras"
              type="number"
              value={formBayar.beras}
              onChange={(e) => setFormBayar({ ...formBayar, beras: e.target.value })}
            />
          </FormField>
          <FormField label="Petugas" htmlFor="sahriyah-petugas">
            <Input
              id="sahriyah-petugas"
              value={formBayar.petugas}
              onChange={(e) => setFormBayar({ ...formBayar, petugas: e.target.value })}
            />
          </FormField>
        </FormGrid>
        <FormActionBar className="form-action-bar-v3--compact">
          <Button onClick={simpanPembayaran}>Bayar</Button>
          <Button variant="outline" onClick={() => setShowBayar(false)}>
            Batal
          </Button>
        </FormActionBar>
      </Modal>

      <SahriyahHistoriModal
        open={showRiwayat}
        riwayat={riwayat}
        onClose={() => setShowRiwayat(false)}
      />
      </div>
    </AppShell>
  );
}

export default SahriyahPage;
