import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import platformApi from "../../services/platformApi";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import DataTableCard from "../../components/ui/DataTableCard";
import KpiCard from "../../components/ui/KpiCard";
import KpiGrid from "../../components/ui/KpiGrid";
import SectionHeading from "../../components/ui/SectionHeading";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDateShort } from "../../utils/formatDate";

function statusBadgeVariant(status) {
  if (status === "active") return "success";
  if (status === "suspended") return "danger";
  if (status === "trial") return "info";
  return "neutral";
}

function PlatformDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await platformApi.get("/platform/stats/summary");
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Gagal memuat statistik platform");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div style={centerStyle}>Memuat statistik platform...</div>;
  }

  if (error || !data?.summary) {
    return (
      <div>
        <div style={errorBoxStyle}>{error || "Data tidak tersedia"}</div>
        <Button variant="secondary" onClick={load}>
          Coba lagi
        </Button>
      </div>
    );
  }

  const { summary, activity, tenant_status_breakdown, recent_tenants, top_tenants } =
    data;

  return (
    <>
      <div style={headerRowStyle}>
        <div>
          <h1 style={pageTitleStyle}>Platform Dashboard</h1>
          <p style={pageSubtitleStyle}>
            Kesehatan seluruh tenant KlikSantri
          </p>
        </div>
        <Button variant="secondary" onClick={load}>
          Refresh
        </Button>
      </div>

      <SectionHeading spacing="first">Ringkasan</SectionHeading>
      <KpiGrid>
        <KpiCard label="Total Tenant" value={summary.total_tenants} accent="primary" />
        <KpiCard label="Active" value={summary.active_tenants} accent="success" />
        <KpiCard label="Suspended" value={summary.suspended_tenants} accent="danger" />
        <KpiCard label="Trial" value={summary.trial_tenants} accent="info" />
        <KpiCard label="Total Santri" value={summary.total_santri} />
        <KpiCard label="Total User" value={summary.total_users} accent="neutral" />
        <KpiCard label="Online Device" value={summary.online_devices} accent="teal" />
        <KpiCard label="Total Device" value={summary.total_devices} />
      </KpiGrid>

      <SectionHeading>Aktivitas</SectionHeading>
      <KpiGrid>
        <KpiCard
          label="Tenant Baru Bulan Ini"
          value={activity.new_tenants_this_month}
          accent="primary"
        />
        <KpiCard
          label="Pembayaran Bulan Ini"
          value={activity.payments_this_month_count}
          trend={formatCurrency(activity.payments_this_month_nominal)}
        />
        <KpiCard
          label="Nominal Pembayaran Bulan Ini"
          value={formatCurrency(activity.payments_this_month_nominal)}
          accent="success"
        />
        <KpiCard
          label="RFID Transaksi Hari Ini"
          value={activity.rfid_transactions_today}
        />
        <KpiCard
          label="Nominal RFID Hari Ini"
          value={formatCurrency(activity.rfid_nominal_today)}
          accent="teal"
        />
      </KpiGrid>

      <div style={twoColStyle}>
        <DataTableCard title="Status Tenant" padding="none">
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {tenant_status_breakdown.map((row) => (
                <tr key={row.status}>
                  <td style={tdStyle}>
                    <Badge variant={statusBadgeVariant(row.status)} size="sm">
                      {row.status}
                    </Badge>
                  </td>
                  <td style={tdStyle}>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableCard>

        <DataTableCard title="Tenant Terbaru" padding="none">
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Nama</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Onboarded</th>
              </tr>
            </thead>
            <tbody>
              {recent_tenants.length === 0 ? (
                <tr>
                  <td colSpan={3} style={emptyStyle}>
                    Belum ada tenant
                  </td>
                </tr>
              ) : (
                recent_tenants.map((t) => (
                  <tr key={t.id}>
                    <td style={tdStyle}>
                      <Link to={`/platform/tenants/${t.id}`} style={linkStyle}>
                        {t.name}
                      </Link>
                      <div style={slugStyle}>{t.slug}</div>
                    </td>
                    <td style={tdStyle}>
                      <Badge variant={statusBadgeVariant(t.status)} size="sm">
                        {t.status}
                      </Badge>
                    </td>
                    <td style={tdStyle}>{formatDateShort(t.onboarded_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTableCard>
      </div>

      <SectionHeading>Top Tenant</SectionHeading>
      <div style={threeColStyle}>
        <TopTenantCard
          title="Terbanyak Santri"
          rows={top_tenants.by_santri}
          valueLabel={(r) => `${r.count} santri`}
        />
        <TopTenantCard
          title="Pembayaran Bulan Ini"
          rows={top_tenants.by_payments_this_month}
          valueLabel={(r) =>
            `${r.count} trx · ${formatCurrency(r.nominal || 0)}`
          }
        />
        <TopTenantCard
          title="RFID Hari Ini"
          rows={top_tenants.by_rfid_today}
          valueLabel={(r) =>
            `${r.count} trx · ${formatCurrency(r.nominal || 0)}`
          }
        />
      </div>

      {data.generated_at && (
        <p style={generatedStyle}>
          Diperbarui: {formatDateShort(data.generated_at)}{" "}
          {new Date(data.generated_at).toLocaleTimeString("id-ID")}
        </p>
      )}
    </>
  );
}

function TopTenantCard({ title, rows, valueLabel }) {
  return (
    <DataTableCard title={title} padding="sm">
      {rows.length === 0 ? (
        <p style={emptyStyle}>Belum ada data</p>
      ) : (
        <ul style={topListStyle}>
          {rows.map((r) => (
            <li key={r.id} style={topListItemStyle}>
              <Link to={`/platform/tenants/${r.id}`} style={linkStyle}>
                {r.name}
              </Link>
              <span style={topValueStyle}>{valueLabel(r)}</span>
            </li>
          ))}
        </ul>
      )}
    </DataTableCard>
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
  marginBottom: 8,
  flexWrap: "wrap",
};

const pageTitleStyle = {
  margin: 0,
  fontSize: "24px",
  fontWeight: 800,
  color: "var(--text-primary)",
};

const pageSubtitleStyle = {
  margin: "6px 0 0",
  fontSize: "14px",
  color: "var(--text-secondary)",
};

const errorBoxStyle = {
  marginBottom: 16,
  padding: "12px 14px",
  borderRadius: "var(--radius-sm)",
  background: "var(--danger-subtle)",
  color: "var(--danger)",
  fontWeight: 600,
};

const twoColStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 16,
  marginBottom: 8,
};

const threeColStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 16,
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "14px",
};

const thStyle = {
  textAlign: "left",
  padding: "12px 16px",
  borderBottom: "1px solid var(--border)",
  color: "var(--text-secondary)",
  fontSize: "12px",
  fontWeight: 700,
  textTransform: "uppercase",
};

const tdStyle = {
  padding: "12px 16px",
  borderBottom: "1px solid var(--border)",
  verticalAlign: "middle",
};

const emptyStyle = {
  padding: "16px",
  color: "var(--text-secondary)",
  fontSize: "14px",
  margin: 0,
};

const linkStyle = {
  color: "var(--primary)",
  fontWeight: 600,
  textDecoration: "none",
};

const slugStyle = {
  fontSize: "12px",
  color: "var(--text-muted)",
  marginTop: 2,
};

const topListStyle = {
  listStyle: "none",
  margin: 0,
  padding: 0,
};

const topListItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "10px 0",
  borderBottom: "1px solid var(--border)",
};

const topValueStyle = {
  fontSize: "12px",
  color: "var(--text-secondary)",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const generatedStyle = {
  marginTop: 24,
  fontSize: "12px",
  color: "var(--text-muted)",
};

export default PlatformDashboardPage;
