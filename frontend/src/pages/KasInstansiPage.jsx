import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import Modal from "../components/Modal";
import KasInstansiErrorBoundary from "../components/KasInstansiErrorBoundary";
import Card from "../components/ui/Card";
import KpiCard from "../components/ui/KpiCard";
import KpiGrid from "../components/ui/KpiGrid";
import SectionHeading from "../components/ui/SectionHeading";
import Button from "../components/ui/Button";
import DataTableCard from "../components/ui/DataTableCard";
import TableToolbar from "../components/ui/TableToolbar";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import StatusBadge from "../components/ui/StatusBadge";
import { Table, TableScroll, TableActions, TablePagination } from "../components/ui/table";
import { KeuanganPageStyles } from "../components/shared/PageResponsiveStyles";
import {
  FormField,
  Input,
  Select,
  Textarea,
  FormGrid,
  FormActionBar,
  FilterBar,
} from "../components/ui/form";
import { formatCurrency, formatNumber } from "../utils/formatCurrency";
import { hasPermission } from "../utils/hasPermission";
import "../styles/kas-instansi.css";

const FORM_INIT = {
  tanggal: "",
  jenis: "Masuk",
  kategori: "",
  keterangan: "",
  nominal: "",
  petugas: "",
};

const BULAN_OPTIONS = [
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
];

const TAHUN_OPTIONS = [2025, 2026, 2027, 2028];

const KATEGORI_OPTIONS = [
  "Donasi",
  "SPP",
  "Operasional",
  "Gaji",
  "Listrik",
  "Air",
  "ATK",
  "Perbaikan",
  "Lainnya",
];

const TABLE_COL_COUNT = 8;

function KasInstansiKpiSkeletonOverlay() {
  return (
    <div className="kas-instansi-skeleton-overlay kas-instansi-skeleton-overlay--kpi" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={`kpi-sk-${index}`} className="kas-instansi-skeleton kas-instansi-skeleton-kpi" />
      ))}
    </div>
  );
}

function KasInstansiTableSkeletonOverlay() {
  return (
    <div className="kas-instansi-skeleton-overlay kas-instansi-skeleton-overlay--table" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={`row-sk-${index}`} className="kas-instansi-skeleton kas-instansi-skeleton-row" />
      ))}
    </div>
  );
}

function KasInstansiPageContent() {
  const [units, setUnits] = useState([]);
  const [selectedKode, setSelectedKode] = useState("");
  const [ringkasan, setRingkasan] = useState(null);
  const [transaksi, setTransaksi] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });

  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [loadingUnits, setLoadingUnits] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [error, setError] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);

  const fetchGenRef = useRef(0);
  const filterSnapshotRef = useRef({ selectedKode, bulan, tahun, search });

  const [formModal, setFormModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(FORM_INIT);
  const [saving, setSaving] = useState(false);

  const canManage =
    hasPermission("kas_instansi.manage") &&
    units.find((u) => u.kode === selectedKode)?.can_manage;

  const selectedUnit = units.find((u) => u.kode === selectedKode);

  console.log("[KasInstansi] render");
  console.log("[KasInstansi] loading", loadingData);
  console.log("[KasInstansi] filter", selectedKode, bulan, tahun);

  const loadUnits = useCallback(async () => {
    setLoadingUnits(true);
    setError("");
    try {
      const res = await api.get("/kas-instansi/units");
      const list = res.data?.data || [];
      setUnits(list);
      if (list.length > 0) {
        setSelectedKode((prev) =>
          prev && list.some((u) => u.kode === prev) ? prev : list[0].kode
        );
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Gagal memuat daftar unit");
    } finally {
      setLoadingUnits(false);
    }
  }, []);

  const fetchPageData = useCallback(async (kode, pageNum, signal) => {
    if (!kode) {
      return { ringkasan: null, items: [], pagination: { page: 1, limit: 50, total: 0 } };
    }

    try {
      const [ringkasanRes, transaksiRes] = await Promise.all([
        api.get(`/kas-instansi/${kode}/ringkasan`, {
          params: { bulan, tahun },
          signal,
        }),
        api.get(`/kas-instansi/${kode}/transaksi`, {
          params: {
            bulan,
            tahun,
            page: pageNum,
            limit: 50,
            q: search.trim() || undefined,
          },
          signal,
        }),
      ]);

      return {
        ringkasan: ringkasanRes.data?.data ?? null,
        items: transaksiRes.data?.data?.items ?? [],
        pagination: transaksiRes.data?.data?.pagination ?? {
          page: pageNum,
          limit: 50,
          total: 0,
        },
      };
    } catch (err) {
      if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") {
        return null;
      }
      throw err;
    }
  }, [bulan, tahun, search]);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  useEffect(() => {
    const prev = filterSnapshotRef.current;
    const filtersChanged =
      prev.selectedKode !== selectedKode ||
      prev.bulan !== bulan ||
      prev.tahun !== tahun ||
      prev.search !== search;

    if (filtersChanged) {
      filterSnapshotRef.current = { selectedKode, bulan, tahun, search };
      if (page !== 1) {
        setPage(1);
        return undefined;
      }
    }

    if (!selectedKode) {
      return undefined;
    }

    const controller = new AbortController();
    const fetchId = ++fetchGenRef.current;
    const pageNum = page;
    let active = true;

    const run = async () => {
      setLoadingData(true);
      setError("");

      try {
        const result = await fetchPageData(selectedKode, pageNum, controller.signal);

        if (!active || fetchId !== fetchGenRef.current || !result) {
          return;
        }

        setRingkasan(result.ringkasan);
        setTransaksi(Array.isArray(result.items) ? result.items : []);
        setPagination(result.pagination);
        setHasLoadedData(true);
      } catch (err) {
        if (!active || fetchId !== fetchGenRef.current) {
          return;
        }
        console.error(err);
        setError(err.response?.data?.error || "Gagal memuat data kas instansi");
      } finally {
        if (active && fetchId === fetchGenRef.current) {
          setLoadingData(false);
        }
      }
    };

    run();

    return () => {
      active = false;
      controller.abort();
    };
  }, [selectedKode, bulan, tahun, search, page, fetchPageData, refreshTick]);

  const refreshData = useCallback(() => {
    setRefreshTick((tick) => tick + 1);
  }, []);

  const resetForm = () => {
    setForm(FORM_INIT);
    setEditId(null);
  };

  const openAddModal = () => {
    resetForm();
    setForm((f) => ({
      ...f,
      tanggal: new Date().toISOString().split("T")[0],
    }));
    setFormModal(true);
  };

  const openEditModal = (row) => {
    setEditId(row.id);
    setForm({
      tanggal: row.tanggal?.split("T")[0] || row.tanggal,
      jenis: row.jenis,
      kategori: row.kategori,
      keterangan: row.keterangan || "",
      nominal: row.nominal,
      petugas: row.petugas || "",
    });
    setFormModal(true);
  };

  const closeModal = () => {
    setFormModal(false);
    resetForm();
  };

  const simpan = async () => {
    if (!selectedKode) return;
    if (!form.tanggal || !form.jenis || !form.kategori || !form.nominal) {
      alert("Tanggal, jenis, kategori, dan nominal wajib diisi");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        tanggal: form.tanggal,
        jenis: form.jenis,
        kategori: form.kategori,
        keterangan: form.keterangan,
        nominal: Number(form.nominal),
        petugas: form.petugas,
      };

      if (editId) {
        await api.put(`/kas-instansi/${selectedKode}/transaksi/${editId}`, payload);
      } else {
        await api.post(`/kas-instansi/${selectedKode}/transaksi`, payload);
      }

      closeModal();
      refreshData();
      alert(editId ? "Transaksi berhasil diupdate" : "Transaksi berhasil disimpan");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Gagal menyimpan transaksi");
    } finally {
      setSaving(false);
    }
  };

  const hapus = async (id) => {
    if (!selectedKode) return;
    if (!window.confirm("Hapus transaksi ini?")) return;

    try {
      await api.delete(`/kas-instansi/${selectedKode}/transaksi/${id}`);
      refreshData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Gagal menghapus transaksi");
    }
  };

  const handleRefresh = () => {
    refreshData();
  };

  const bulanLabel = BULAN_OPTIONS[bulan - 1] || `Bulan ${bulan}`;
  const pageSize = pagination.limit || 50;
  const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / pageSize));
  const showInitialSkeleton = loadingData && !hasLoadedData;
  const showStaleOverlay = loadingData && hasLoadedData;
  const showEmptyRows = hasLoadedData && !loadingData && transaksi.length === 0;

  if (loadingUnits) {
    return (
      <div className="keuangan-page kas-instansi-loading-units">
        Memuat unit pendidikan...
      </div>
    );
  }

  if (units.length === 0) {
    return (
      <div className="keuangan-page">
        <EmptyState
          title="Tidak ada unit yang dapat diakses"
          description={error || "Hubungi administrator untuk assign unit kas."}
        />
      </div>
    );
  }

  return (
    <>
      <div className="keuangan-page">
        <Card padding="none" shadow="card" border={false} radius="xl">
          <div className="kas-instansi-filter-card">
            <FilterBar
              label="Filter"
              actions={
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={loadingData || !selectedKode}
                  >
                    {loadingData ? "Memuat..." : "Refresh"}
                  </Button>
                  {canManage && (
                    <Button size="sm" onClick={openAddModal}>
                      + Tambah Transaksi
                    </Button>
                  )}
                </>
              }
            >
              <Select
                id="kas-instansi-unit"
                className="kas-instansi-filter-unit"
                value={selectedKode}
                onChange={(e) => setSelectedKode(e.target.value)}
                aria-label="Unit pendidikan"
              >
                {units.map((u) => (
                  <option key={u.kode} value={u.kode}>
                    {u.nama}
                  </option>
                ))}
              </Select>
              <Select
                id="kas-instansi-bulan"
                className="kas-instansi-filter-bulan"
                value={bulan}
                onChange={(e) => setBulan(Number(e.target.value))}
                aria-label="Bulan"
              >
                {BULAN_OPTIONS.map((label, i) => (
                  <option key={label} value={i + 1}>
                    {label}
                  </option>
                ))}
              </Select>
              <Select
                id="kas-instansi-tahun"
                className="kas-instansi-filter-tahun"
                value={tahun}
                onChange={(e) => setTahun(Number(e.target.value))}
                aria-label="Tahun"
              >
                {TAHUN_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </FilterBar>
          </div>
        </Card>

        {error && <div className="kas-instansi-error-banner">{error}</div>}

        <div className="kas-instansi-content-panel">
          <SectionHeading variant="eyebrow" spacing="first">
            Ringkasan — {selectedUnit?.nama || selectedKode || "Unit"} · {bulanLabel} {tahun}
          </SectionHeading>

          <div className="kas-instansi-shell kas-instansi-shell--kpi">
            {showInitialSkeleton && <KasInstansiKpiSkeletonOverlay />}
            {showStaleOverlay && (
              <div className="kas-instansi-loading-overlay">Memperbarui data...</div>
            )}
            <div className={showStaleOverlay ? "kas-instansi-dimmed" : undefined}>
              <KpiGrid>
                <KpiCard
                  label="Pemasukan Bulan"
                  value={formatCurrency(ringkasan?.pemasukan_bulan ?? 0)}
                  accent="success"
                />
                <KpiCard
                  label="Pengeluaran Bulan"
                  value={formatCurrency(ringkasan?.pengeluaran_bulan ?? 0)}
                  accent="danger"
                />
                <KpiCard
                  label="Saldo Bulan"
                  value={formatCurrency(ringkasan?.saldo_bulan ?? 0)}
                  accent="primary"
                />
                <KpiCard
                  label="Saldo Akhir Tahun"
                  value={formatCurrency(ringkasan?.saldo_akhir_tahun ?? 0)}
                  accent="neutral"
                />
                <KpiCard
                  label="Saldo All Time"
                  value={formatCurrency(ringkasan?.saldo_akhir_alltime ?? 0)}
                  accent="neutral"
                />
                <KpiCard
                  label="Jumlah Transaksi"
                  value={formatNumber(ringkasan?.jumlah_transaksi_bulan ?? 0)}
                  accent="neutral"
                />
              </KpiGrid>
            </div>
          </div>
        </div>

        <div className="kas-instansi-table-section">
          <DataTableCard
            title="Daftar Transaksi"
            subtitle={`${selectedUnit?.nama || selectedKode} · ${bulanLabel} ${tahun}`}
            actions={
              !canManage ? (
                <span className="kas-instansi-meta">Mode lihat saja</span>
              ) : (
                <span className="kas-instansi-meta">{pagination.total || 0} transaksi</span>
              )
            }
          >
            <div className="kas-instansi-shell kas-instansi-shell--table">
              {showInitialSkeleton && <KasInstansiTableSkeletonOverlay />}
              {showStaleOverlay && (
                <div className="kas-instansi-loading-overlay">Memperbarui data...</div>
              )}

              <div className={showStaleOverlay ? "kas-instansi-dimmed" : undefined}>
                <TableToolbar
                  search={
                    <SearchInput
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Cari kategori, keterangan, petugas..."
                    />
                  }
                  actions={
                    <span className="kas-instansi-meta">
                      {loadingData ? "Memuat..." : `${pagination.total || 0} transaksi`}
                    </span>
                  }
                />

                <TableScroll>
                  <Table>
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Jenis</th>
                        <th>Kategori</th>
                        <th>Keterangan</th>
                        <th>Nominal</th>
                        <th>Petugas</th>
                        <th>Saldo Berjalan</th>
                        <th className="table-v3__cell--actions">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {showEmptyRows ? (
                        <tr>
                          <td colSpan={TABLE_COL_COUNT} className="kas-instansi-empty-cell">
                            <p className="kas-instansi-empty-title">Belum ada transaksi</p>
                            <p className="kas-instansi-empty-desc">
                              Belum ada transaksi untuk {bulanLabel} {tahun}.
                            </p>
                            {canManage && (
                              <Button onClick={openAddModal}>Tambah Transaksi Pertama</Button>
                            )}
                          </td>
                        </tr>
                      ) : (
                        transaksi.map((d) => (
                          <tr key={d.id}>
                            <td>
                              {d.tanggal
                                ? new Date(d.tanggal).toLocaleDateString("id-ID", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "—"}
                            </td>
                            <td>
                              <StatusBadge status={d.jenis === "Masuk" ? "aktif" : "ditolak"}>
                                {d.jenis || "—"}
                              </StatusBadge>
                            </td>
                            <td className="table-v3__cell--strong">{d.kategori || "—"}</td>
                            <td>{d.keterangan || "—"}</td>
                            <td className="table-v3__cell--strong">
                              {formatCurrency(d.nominal ?? 0)}
                            </td>
                            <td>{d.petugas || "—"}</td>
                            <td>{formatCurrency(d.saldo_berjalan ?? 0)}</td>
                            <td className="table-v3__cell--actions">
                              {canManage ? (
                                <TableActions
                                  items={[
                                    { type: "edit", onClick: () => openEditModal(d) },
                                    { type: "delete", onClick: () => hapus(d.id) },
                                  ]}
                                />
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </TableScroll>

                {totalPages > 1 && (
                  <TablePagination
                    page={page}
                    pageSize={pageSize}
                    totalItems={pagination.total || 0}
                    onPageChange={setPage}
                  />
                )}
              </div>
            </div>
          </DataTableCard>
        </div>
      </div>

      <Modal
        open={formModal}
        title={editId ? "Edit Transaksi" : "Tambah Transaksi"}
        onClose={closeModal}
        width={560}
      >
        <FormGrid columns="modal">
          <FormField label="Tanggal" htmlFor="ki-tgl" required>
            <Input
              id="ki-tgl"
              type="date"
              value={form.tanggal}
              onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
            />
          </FormField>
          <FormField label="Jenis" htmlFor="ki-jenis" required>
            <Select
              id="ki-jenis"
              value={form.jenis}
              onChange={(e) => setForm({ ...form, jenis: e.target.value })}
            >
              <option value="Masuk">Masuk</option>
              <option value="Keluar">Keluar</option>
            </Select>
          </FormField>
          <FormField label="Kategori" htmlFor="ki-kategori" required>
            <Select
              id="ki-kategori"
              value={form.kategori}
              onChange={(e) => setForm({ ...form, kategori: e.target.value })}
            >
              <option value="">Pilih Kategori</option>
              {KATEGORI_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Nominal" htmlFor="ki-nominal" required>
            <Input
              id="ki-nominal"
              type="number"
              min="1"
              value={form.nominal}
              onChange={(e) => setForm({ ...form, nominal: e.target.value })}
            />
          </FormField>
          <FormField label="Petugas" htmlFor="ki-petugas">
            <Input
              id="ki-petugas"
              value={form.petugas}
              onChange={(e) => setForm({ ...form, petugas: e.target.value })}
            />
          </FormField>
          <FormField label="Keterangan" htmlFor="ki-keterangan" fullWidth>
            <Textarea
              id="ki-keterangan"
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
              rows={3}
            />
          </FormField>
        </FormGrid>
        <FormActionBar className="form-action-bar-v3--compact">
          <Button variant="secondary" onClick={closeModal} disabled={saving}>
            Batal
          </Button>
          <Button onClick={simpan} disabled={saving}>
            {saving ? "Menyimpan..." : editId ? "Update" : "Simpan"}
          </Button>
        </FormActionBar>
      </Modal>
    </>
  );
}

function KasInstansiPage() {
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <AppShell title="Kas Instansi" breadcrumb="Keuangan / Kas Instansi">
      <KeuanganPageStyles />
      <KasInstansiErrorBoundary onRetry={() => setReloadKey((k) => k + 1)}>
        <KasInstansiPageContent key={reloadKey} />
      </KasInstansiErrorBoundary>
    </AppShell>
  );
}

export default KasInstansiPage;
