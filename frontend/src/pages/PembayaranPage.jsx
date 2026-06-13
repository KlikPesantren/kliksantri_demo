import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import { exportExcel } from "../utils/exportExcel";
import { getUser } from "../utils/storage";
import GenerateTagihanForm from "../components/pembayaran/GenerateTagihanForm";
import TagihanTable from "../components/pembayaran/TagihanTable";
import BayarModal from "../components/pembayaran/BayarModal";
import HistoriModal from "../components/pembayaran/HistoriModal";
import { KeuanganResponsiveStyles } from "../components/pembayaran/pembayaranShared";

function PembayaranPage() {
  const [pembayaran, setPembayaran] = useState([]);
  const [santri, setSantri] = useState([]);
  const [kelas, setKelas] = useState([]);
  const [tableSearch, setTableSearch] = useState("");
  const [form, setForm] = useState({
    santri_id: "",
    nama_tagihan: "",
    bulan: "",
    tahun: 2026,
    nominal_tagihan: "",
    nominal_bayar: "",
  });
  const [modeGenerate, setModeGenerate] = useState("semua");
  const [selectedSantri, setSelectedSantri] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState("");
  const [showRiwayat, setShowRiwayat] = useState(false);
  const [riwayat, setRiwayat] = useState([]);
  const [showBayar, setShowBayar] = useState(false);
  const [selectedTagihan, setSelectedTagihan] = useState(null);
  const [nominalBayar, setNominalBayar] = useState("");

  const getPembayaran = async () => {
    try {
      const response = await api.get("/pembayaran");
      setPembayaran([...response.data.data]);
    } catch (err) {
      console.error(err);
    }
  };

  const getSantri = async () => {
    try {
      const response = await api.get("/santri");
      setSantri(response.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getKelas = async () => {
    try {
      const response = await api.get("/kelas");
      setKelas(response.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const createPembayaran = async () => {
    try {
      let targetSantri = [];

      if (modeGenerate === "semua") {
        targetSantri = santri.map((s) => s.id);
      } else if (modeGenerate === "kelas") {
        targetSantri = santri
          .filter((s) => Number(s.kelas_id) === Number(selectedKelas))
          .map((s) => s.id);
      } else {
        targetSantri = selectedSantri;
      }

      for (const santriId of targetSantri) {
        await api.post("/pembayaran", {
          santri_id: santriId,
          nama_tagihan: form.nama_tagihan,
          bulan: form.bulan,
          tahun: form.tahun,
          nominal_tagihan: Number(form.nominal_tagihan),
          nominal_bayar: 0,
        });
      }

      alert("Tagihan berhasil dibuat");

      setForm({
        santri_id: "",
        nama_tagihan: "",
        bulan: "",
        tahun: 2026,
        nominal_tagihan: "",
        nominal_bayar: "",
      });

      setSelectedSantri([]);
      getPembayaran();
    } catch (err) {
      console.error(err);
      alert("Gagal membuat tagihan");
    }
  };

  const bukaBayar = (tagihan) => {
    setSelectedTagihan(tagihan);
    setShowBayar(true);
  };

  const tutupBayar = () => {
    setShowBayar(false);
    setSelectedTagihan(null);
    setNominalBayar("");
  };

  const simpanPembayaran = async () => {
    const user = getUser() || {};

    try {
      await api.put(`/pembayaran/bayar/${selectedTagihan.id}`, {
        nominal: Number(nominalBayar),
        petugas: user?.nama || user?.username || "Admin",
      });

      alert("Pembayaran berhasil");
      await getPembayaran();
      setShowBayar(false);
      setSelectedTagihan(null);
      setNominalBayar("");
    } catch (err) {
      console.error(err);
      alert("Gagal bayar");
    }
  };

  const hapusTagihan = async (id) => {
    const yakin = window.confirm("Hapus tagihan?");
    if (!yakin) return;

    try {
      await api.delete(`/pembayaran/${id}`);
      await getPembayaran();
    } catch (err) {
      console.error(err);
      alert("Gagal hapus");
    }
  };

  const lihatRiwayat = async (tagihan) => {
    try {
      const response = await api.get(`/pembayaran/riwayat/${tagihan.id}`);
      setRiwayat(response.data.data);
      setShowRiwayat(true);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getPembayaran();
    getSantri();
    getKelas();
  }, []);

  const filteredPembayaran = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return pembayaran;
    return pembayaran.filter((p) =>
      [p.nama, p.nama_tagihan, p.status, p.bulan, p.tahun]
        .some((field) => String(field || "").toLowerCase().includes(q)),
    );
  }, [pembayaran, tableSearch]);

  const handleExport = () => {
    const rows = pembayaran.map((p) => ({
      Santri: p.nama,
      Tagihan: p.nama_tagihan,
      Nominal: Number(p.nominal_tagihan),
      Dibayar: Number(p.nominal_bayar),
      Sisa: Number(p.sisa_tunggakan),
      Status: p.status,
    }));

    exportExcel(rows, "Pembayaran");
  };

  return (
    <AppShell title="Pembayaran" breadcrumb="Keuangan / Pembayaran">
      <KeuanganResponsiveStyles />
      <div className="keuangan-page">
        <GenerateTagihanForm
          modeGenerate={modeGenerate}
          setModeGenerate={setModeGenerate}
          santri={santri}
          kelas={kelas}
          selectedSantri={selectedSantri}
          setSelectedSantri={setSelectedSantri}
          selectedKelas={selectedKelas}
          setSelectedKelas={setSelectedKelas}
          form={form}
          setForm={setForm}
          onSubmit={createPembayaran}
        />

        <div style={{ marginTop: "var(--space-6)" }}>
          <TagihanTable
            pembayaran={pembayaran}
            filteredPembayaran={filteredPembayaran}
            tableSearch={tableSearch}
            onSearchChange={(e) => setTableSearch(e.target.value)}
            onExport={handleExport}
            onBayar={bukaBayar}
            onHistori={lihatRiwayat}
            onHapus={hapusTagihan}
          />
        </div>

        {showBayar && (
          <BayarModal
            tagihan={selectedTagihan}
            nominalBayar={nominalBayar}
            onNominalChange={setNominalBayar}
            onSave={simpanPembayaran}
            onClose={tutupBayar}
          />
        )}

        <HistoriModal
          open={showRiwayat}
          riwayat={riwayat}
          onClose={() => setShowRiwayat(false)}
        />
      </div>
    </AppShell>
  );
}

export default PembayaranPage;
