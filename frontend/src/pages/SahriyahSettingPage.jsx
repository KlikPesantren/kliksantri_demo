import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import Button from "../components/ui/Button";
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

function KeuanganResponsiveStyles() {
  return (
    <style>{`
      .keuangan-page {
        min-width: 0;
        max-width: 100%;
      }

      .table-scroll-x {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        max-width: 100%;
        min-width: 0;
      }

      .table-scroll-x > table {
        width: max-content;
        min-width: 100%;
      }
    `}</style>
  );
}

function SahriyahSettingPage() {
  const [data, setData] = useState([]);
  const [tableSearch, setTableSearch] = useState("");

  const getData = async () => {
    try {
      const response = await api.get(`/sahriyah-setting?t=${Date.now()}`);
      setData(response.data.data);
    } catch (err) {
      console.log(err);
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

  const editSetting = async (row) => {
    const nominalUang = prompt("Nominal Uang", row.nominal_uang || 0);
    if (nominalUang === null) return;

    const nominalBeras = prompt("Nominal Beras", row.nominal_beras || 0);
    if (nominalBeras === null) return;

    const keterangan = prompt("Keterangan", row.keterangan || "");
    if (keterangan === null) return;

    try {
      await api.put(`/sahriyah-setting/${row.id}`, {
        nominal_uang: Number(nominalUang),
        nominal_beras: Number(nominalBeras),
        keterangan,
      });

      await getData();
      alert("Berhasil disimpan");
    } catch (err) {
      console.log(err);
      alert("Gagal menyimpan");
    }
  };

  return (
    <AppShell title="Setting Sahriyah" breadcrumb="Keuangan / Setting Sahriyah">
      <KeuanganResponsiveStyles />
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
          <div className="table-scroll-x">
            <table style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Nama</th>
                  <th style={thStyle}>Nominal Uang</th>
                  <th style={thStyle}>Nominal Beras</th>
                  <th style={thStyle}>Keterangan</th>
                  <th style={thStyle}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((d) => (
                  <tr key={d.id}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{d.nama}</td>
                    <td style={tdStyle}>Rp {Number(d.nominal_uang || 0).toLocaleString()}</td>
                    <td style={tdStyle}>{d.nominal_beras || 0} Kg</td>
                    <td style={tdStyle}>{d.keterangan || "—"}</td>
                    <td style={tdStyle}>
                      <Button variant="outline" size="sm" onClick={() => editSetting(d)}>
                        Edit
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

export default SahriyahSettingPage;
