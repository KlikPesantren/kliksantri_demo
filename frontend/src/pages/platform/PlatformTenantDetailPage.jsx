import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import platformApi from "../../services/platformApi";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import KpiCard from "../../components/ui/KpiCard";
import KpiGrid from "../../components/ui/KpiGrid";
import SectionHeading from "../../components/ui/SectionHeading";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDateShort } from "../../utils/formatDate";

function tenantDisplayName(row) {
  return row?.nama || row?.name || "-";
}

function statusBadgeVariant(status) {
  if (status === "active") return "success";
  if (status === "suspended") return "danger";
  if (status === "trial") return "info";
  return "neutral";
}

function PlatformTenantDetailPage() {
  const { id } = useParams();
  const [tenant, setTenant] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [detailRes, dashRes] = await Promise.all([
        platformApi.get(`/platform/tenants/${id}`),
        platformApi.get(`/platform/tenants/${id}/dashboard`),
      ]);
      setTenant(detailRes.data?.data || null);
      setDashboard(dashRes.data || null);
    } catch (err) {
      setError(err.response?.data?.error || "Gagal memuat detail tenant");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSuspend = async () => {
    const reason = window.prompt(
      "Alasan suspend tenant (wajib):",
      "Penangguhan layanan sementara"
    );
    if (reason === null) return;
    if (!reason.trim()) {
      window.alert("Alasan suspend wajib diisi.");
      return;
    }

    const confirmed = window.confirm(
      `Suspend tenant "${tenantDisplayName(tenant)}"?\n\nTenant tidak bisa login hingga diaktifkan kembali.`
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await platformApi.patch(`/platform/tenants/${id}/status`, {
        status: "suspended",
        reason: reason.trim(),
      });
      await loadData();
    } catch (err) {
      window.alert(err.response?.data?.error || "Gagal suspend tenant");
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    const confirmed = window.confirm(
      `Aktifkan kembali tenant "${tenantDisplayName(tenant)}"?`
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await platformApi.patch(`/platform/tenants/${id}/status`, {
        status: "active",
      });
      await loadData();
    } catch (err) {
      window.alert(err.response?.data?.error || "Gagal mengaktifkan tenant");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div style={centerStyle}>Memuat detail tenant...</div>;
  }

  if (error || !tenant) {
    return (
      <div>
        <Link to="/platform/tenants" style={backLinkStyle}>
          ← Kembali ke daftar
        </Link>
        <div style={errorBoxStyle}>{error || "Tenant tidak ditemukan"}</div>
      </div>
    );
  }

  const info = dashboard?.tenant || tenant;
  const op = dashboard?.operasional || {};
  const keu = dashboard?.keuangan || {};
  const pend = dashboard?.pendidikan || {};
  const keam = dashboard?.keamanan || {};
  const rfid = dashboard?.rfid || {};
  const isActive = info.status === "active";

  return (
    <>
      <div style={headerRowStyle}>
        <div>
          <Link to="/platform/tenants" style={backLinkStyle}>
            ← Kembali ke daftar
          </Link>
          <h1 style={pageTitleStyle}>{tenantDisplayName(info)}</h1>
          <div style={{ marginTop: 8 }}>
            <Badge variant={statusBadgeVariant(info.status)}>{info.status}</Badge>
            <code style={slugCodeStyle}>{info.slug}</code>
          </div>
        </div>

        <div style={actionsStyle}>
          {isActive ? (
            <Button
              variant="danger"
              onClick={handleSuspend}
              loading={actionLoading}
            >
              Suspend Tenant
            </Button>
          ) : (
            <Button
              variant="success"
              onClick={handleActivate}
              loading={actionLoading}
            >
              Activate Tenant
            </Button>
          )}
          <Button variant="secondary" onClick={loadData}>
            Refresh
          </Button>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Card padding="md" shadow="card" radius="xl">
        <SectionHeading spacing="first" variant="divider">
          Tenant Info
        </SectionHeading>
        <div style={infoGridStyle}>
          <InfoItem label="Nama" value={tenantDisplayName(info)} />
          <InfoItem label="Slug" value={info.slug} />
          <InfoItem label="Status" value={info.status} />
          <InfoItem label="Onboarded" value={formatDateShort(info.onboarded_at)} />
          <InfoItem label="Created" value={formatDateShort(info.created_at)} />
          <InfoItem label="Users" value={tenant.user_count ?? "-"} />
          <InfoItem label="Units" value={tenant.unit_count ?? "-"} />
        </div>
        {tenant.suspended_reason && (
          <p style={suspendReasonStyle}>
            Alasan suspend: {tenant.suspended_reason}
          </p>
        )}
        </Card>
      </div>

      <SectionHeading spacing="first">Operasional</SectionHeading>
      <KpiGrid>
        <KpiCard label="Total Santri" value={op.total_santri ?? 0} accent="primary" />
        <KpiCard label="Total Guru" value={op.total_guru ?? 0} accent="info" />
        <KpiCard label="Total Wali" value={op.total_wali ?? 0} accent="neutral" />
        <KpiCard label="Total Kelas" value={op.total_kelas ?? 0} accent="success" />
      </KpiGrid>

      <SectionHeading>Keuangan</SectionHeading>
      <KpiGrid>
        <KpiCard
          label="Tagihan Aktif"
          value={keu.tagihan_aktif_count ?? 0}
          trend={formatCurrency(keu.tagihan_aktif_nominal ?? 0)}
        />
        <KpiCard
          label="Pembayaran Bulan Ini"
          value={keu.pembayaran_bulan_ini_count ?? 0}
          trend={formatCurrency(keu.pembayaran_bulan_ini_nominal ?? 0)}
        />
        <KpiCard
          label="Saldo Buku Kas"
          value={formatCurrency(keu.saldo_buku_kas ?? 0)}
          accent="success"
        />
        <KpiCard
          label="Saldo Kas Instansi"
          value={formatCurrency(keu.saldo_kas_instansi ?? 0)}
          accent="teal"
        />
      </KpiGrid>

      <SectionHeading>Pendidikan</SectionHeading>
      <KpiGrid>
        <KpiCard
          label="Kehadiran Santri"
          value={`${pend.kehadiran_santri_pct ?? 0}%`}
          accent="primary"
        />
        <KpiCard
          label="Kehadiran Guru"
          value={`${pend.kehadiran_guru_pct ?? 0}%`}
          accent="info"
        />
        <KpiCard label="Total Hafalan" value={pend.total_hafalan ?? 0} />
        <KpiCard label="Rata-rata Nilai" value={pend.rata_nilai ?? 0} />
      </KpiGrid>

      <SectionHeading>Keamanan</SectionHeading>
      <KpiGrid>
        <KpiCard label="Santri Izin Aktif" value={keam.santri_izin_aktif ?? 0} accent="warning" />
        <KpiCard label="Pelanggaran Bulan Ini" value={keam.pelanggaran_bulan_ini ?? 0} accent="danger" />
      </KpiGrid>

      <SectionHeading>RFID</SectionHeading>
      <KpiGrid>
        <KpiCard
          label="Topup Hari Ini"
          value={formatCurrency(rfid.topup_hari_ini ?? 0)}
          accent="success"
        />
        <KpiCard label="Transaksi Hari Ini" value={rfid.transaksi_hari_ini ?? 0} />
        <KpiCard label="Device Online" value={rfid.device_online ?? 0} accent="info" />
        <KpiCard label="Merchant Aktif" value={rfid.merchant_aktif ?? 0} />
      </KpiGrid>

      {dashboard?.generated_at && (
        <p style={generatedStyle}>
          Data dashboard: {formatDateShort(dashboard.generated_at)}{" "}
          {new Date(dashboard.generated_at).toLocaleTimeString("id-ID")}
        </p>
      )}
    </>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div style={infoLabelStyle}>{label}</div>
      <div style={infoValueStyle}>{value ?? "-"}</div>
    </div>
  );
}

const centerStyle = {
  padding: 40,
  textAlign: "center",
  color: "var(--text-secondary)",
};

const headerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 20,
  flexWrap: "wrap",
};

const pageTitleStyle = {
  margin: "8px 0 0",
  fontSize: "26px",
  fontWeight: 800,
  color: "var(--text-primary)",
};

const backLinkStyle = {
  fontSize: "13px",
  color: "var(--text-secondary)",
  textDecoration: "none",
  fontWeight: 600,
};

const slugCodeStyle = {
  marginLeft: 10,
  fontSize: "13px",
  background: "var(--neutral-subtle)",
  padding: "2px 8px",
  borderRadius: "4px",
};

const actionsStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const infoGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 16,
  marginTop: 8,
};

const infoLabelStyle = {
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--text-secondary)",
  marginBottom: 4,
};

const infoValueStyle = {
  fontSize: "15px",
  fontWeight: 600,
  color: "var(--text-primary)",
};

const suspendReasonStyle = {
  marginTop: 16,
  marginBottom: 0,
  padding: "10px 12px",
  borderRadius: "var(--radius-sm)",
  background: "var(--warning-subtle)",
  color: "var(--warning)",
  fontSize: "13px",
  fontWeight: 600,
};

const errorBoxStyle = {
  marginTop: 16,
  padding: "12px 14px",
  borderRadius: "var(--radius-sm)",
  background: "var(--danger-subtle)",
  color: "var(--danger)",
  fontWeight: 600,
};

const generatedStyle = {
  marginTop: 24,
  fontSize: "12px",
  color: "var(--text-muted)",
};

export default PlatformTenantDetailPage;
