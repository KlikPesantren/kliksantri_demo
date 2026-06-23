import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import platformApi from "../../services/platformApi";
import Badge from "../../components/ui/Badge";
import PlatformButton from "../../components/platform/PlatformButton";
import { formatDateShort } from "../../utils/formatDate";

const WATCH_FEATURES = [
  { key: "rfid", label: "RFID" },
  { key: "wali_app", label: "Wali App" },
  { key: "sahriyah", label: "Sahriyah" },
  { key: "kas_instansi", label: "Kas Instansi" },
];

function statusBadgeVariant(status) {
  if (status === "active") return "success";
  if (status === "suspended" || status === "cancelled") return "danger";
  if (status === "trial") return "info";
  if (status === "inactive") return "warning";
  return "neutral";
}

function billingBadgeVariant(status) {
  if (status === "active") return "success";
  if (status === "trial") return "info";
  if (status === "overdue") return "warning";
  if (status === "suspended" || status === "cancelled") return "danger";
  return "neutral";
}

function packageBadgeVariant(pkg) {
  if (pkg === "premium") return "success";
  if (pkg === "standard") return "info";
  if (pkg === "basic") return "neutral";
  return "warning";
}

function numberValue(value) {
  if (typeof value === "string") return value;
  return Number(value || 0).toLocaleString("id-ID");
}

function safeDate(value) {
  return value ? formatDateShort(value) : "-";
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

  const healthState = useMemo(() => {
    const billing = data?.billing || {};
    const suspended = Number(data?.summary?.suspended_tenants || 0);
    const overdue = Number(billing.overdue_tenants || 0);
    const expiring = Number(billing.expiring_soon_7_days || 0);
    const needsAttention = suspended > 0 || overdue > 0 || expiring > 0;
    return {
      label: needsAttention ? "Needs Attention" : "System Healthy",
      tone: needsAttention ? "attention" : "healthy",
    };
  }, [data]);

  if (loading) {
    return (
      <>
        <DashboardStyles />
        <div className="platform-dashboard-v2">
          <div className="pd-loading">Memuat platform console...</div>
        </div>
      </>
    );
  }

  if (error || !data?.summary) {
    return (
      <>
        <DashboardStyles />
        <div className="platform-dashboard-v2">
          <div className="pd-error">{error || "Data tidak tersedia"}</div>
          <PlatformButton variant="secondary" onClick={load}>
            Coba lagi
          </PlatformButton>
        </div>
      </>
    );
  }

  const summary = data.summary || {};
  const billing = data.billing || {};
  const tenantHealth = data.tenant_health || data.recent_tenants || [];
  const billingWatch = data.billing_watch || {};
  const featureUsage = data.feature_usage || {};
  const recentActivity = data.recent_activity || [];

  const overdueTenants = billingWatch.overdue || [];
  const expiringSoonTenants = billingWatch.expiring_soon || [];
  const suspendedBillingTenants = billingWatch.suspended || [];

  const kpis = [
    ["Tenant Aktif", summary.active_tenants],
    ["Tenant Suspend", summary.suspended_tenants],
    ["Tenant Overdue", billing.overdue_tenants],
    ["Paket/Fitur Aktif", billing.active_subscriptions],
  ];

  return (
    <>
      <DashboardStyles />
      <div className="platform-dashboard-v2">
        <section className="pd-header">
          <div>
            <h1>KlikSantri Platform</h1>
            <p>Kelola tenant dan layanan dari satu tempat.</p>
          </div>
          <div className="pd-header__actions">
            <span className="pd-header__updated">
              {data.generated_at
                ? `Updated ${safeDate(data.generated_at)} ${new Date(
                    data.generated_at
                  ).toLocaleTimeString("id-ID")}`
                : ""}
            </span>
            <span className={`pd-health pd-health--${healthState.tone}`}>
              {healthState.label}
            </span>
            <PlatformButton variant="secondary" size="sm" onClick={load}>
              Refresh
            </PlatformButton>
          </div>
        </section>

        <section className="pd-kpi-grid" aria-label="Platform KPI">
          {kpis.map(([label, value]) => (
            <article className="pd-kpi-card" key={label}>
              <p>{label}</p>
              <strong>{numberValue(value)}</strong>
            </article>
          ))}
        </section>

        <section className="pd-main-grid">
          <Panel title="Tenant Overview" className="pd-panel--full">
            {tenantHealth.length === 0 ? (
              <EmptyState text="Belum ada tenant untuk ditampilkan" />
            ) : (
              <div className="pd-tenant-table">
                <div className="pd-tenant-table__head">
                  <span>Tenant</span>
                  <span>Metrik</span>
                  <span>Status</span>
                  <span aria-hidden="true" />
                </div>
                {tenantHealth.slice(0, 6).map((tenant) => (
                  <TenantHealthRow key={tenant.id} tenant={tenant} />
                ))}
              </div>
            )}
          </Panel>

          <div className="pd-secondary-grid">
            <Panel title="Billing Watch">
              <WatchGroup title="Overdue" rows={overdueTenants} />
              <WatchGroup title="Expiring Soon" rows={expiringSoonTenants} />
              <WatchGroup title="Suspended Billing" rows={suspendedBillingTenants} />
            </Panel>

            <Panel title="Feature Usage">
              <div className="pd-feature-grid">
                {WATCH_FEATURES.map((feature) => (
                  <div className="pd-feature-stat" key={feature.key}>
                    <span>{feature.label}</span>
                    <strong>{numberValue(featureUsage[feature.key])}</strong>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Recent Activity">
              <div className="pd-activity-list">
                {recentActivity.length === 0 ? (
                  <EmptyState text="Belum ada aktivitas terbaru" />
                ) : (
                  recentActivity.slice(0, 4).map((item, index) => (
                    <ActivityItem
                      item={item}
                      key={`${item.type}-${item.tenant_id}-${index}`}
                    />
                  ))
                )}
              </div>
            </Panel>

            <Panel title="System Readiness">
              <div className="pd-readiness-list">
                <ReadinessItem status="ok" title="JWT secret configured" />
                <ReadinessItem
                  status="warn"
                  title="Upload storage warning"
                  text="Railway Volume sebelum production."
                />
                <ReadinessItem
                  status="warn"
                  title="Backup reminder"
                  text="Backup sebelum migration/deploy."
                />
                <ReadinessItem
                  status="warn"
                  title="Production env warning"
                  text="Verifikasi Railway, Neon, Vercel, CORS."
                />
              </div>
            </Panel>
          </div>
        </section>
      </div>
    </>
  );
}

function Panel({ title, subtitle, children, className = "" }) {
  return (
    <section className={`pd-panel ${className}`}>
      <div className="pd-panel__header">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function TenantHealthRow({ tenant }) {
  const pkg = tenant.current_package || { id: "custom", label: "Custom" };
  return (
    <div className="pd-tenant-row">
      <div className="pd-tenant-row__main">
        <Link to={`/platform/tenants/${tenant.id}`}>{tenant.name}</Link>
        <span>{tenant.slug}</span>
      </div>
      <div className="pd-tenant-row__metrics">
        <span>{numberValue(tenant.total_santri)} santri</span>
        <span>{numberValue(tenant.total_users)} user</span>
        <span>{numberValue(tenant.enabled_features)} fitur</span>
      </div>
      <div className="pd-badge-stack">
        <Badge variant={statusBadgeVariant(tenant.status)} size="sm">
          {tenant.status || "-"}
        </Badge>
        <Badge variant={packageBadgeVariant(pkg.id)} size="sm">
          {pkg.label}
        </Badge>
        <Badge variant={billingBadgeVariant(tenant.billing_status)} size="sm">
          {tenant.billing_status || "-"}
        </Badge>
      </div>
      <Link className="pd-detail-link" to={`/platform/tenants/${tenant.id}`}>
        Detail
      </Link>
    </div>
  );
}

function WatchGroup({ title, rows }) {
  return (
    <div className="pd-watch-group">
      <div className="pd-watch-group__title">
        <strong>{title}</strong>
        <span>{numberValue(rows.length)}</span>
      </div>
      {rows.length === 0 ? (
        <p className="pd-watch-empty">Aman</p>
      ) : (
        rows.slice(0, 4).map((tenant) => (
          <Link
            className="pd-watch-row"
            key={`${title}-${tenant.id}`}
            to={`/platform/tenants/${tenant.id}`}
          >
            <span>{tenant.name}</span>
            <small>{safeDate(tenant.subscription_expires_at)}</small>
          </Link>
        ))
      )}
    </div>
  );
}

function ActivityItem({ item }) {
  const meta =
    item.meta && /^\d{4}-\d{2}-\d{2}/.test(String(item.meta))
      ? safeDate(item.meta)
      : item.meta;

  return (
    <Link className="pd-activity-item" to={`/platform/tenants/${item.tenant_id}`}>
      <span className="pd-activity-dot" />
      <div>
        <strong>{item.label}</strong>
        <p>
          {item.title}
          {meta ? ` · ${meta}` : ""}
        </p>
      </div>
      <small>{safeDate(item.at)}</small>
    </Link>
  );
}

function ReadinessItem({ status, title, text }) {
  return (
    <div className={`pd-readiness-item pd-readiness-item--${status}`}>
      <span>{status === "ok" ? "OK" : "WARN"}</span>
      <div>
        <strong>{title}</strong>
        {text && <p>{text}</p>}
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="pd-empty">{text}</div>;
}

function DashboardStyles() {
  return (
    <style>{`
      .platform-dashboard-v2 {
        display: flex;
        flex-direction: column;
        gap: 14px;
        width: 100%;
        color: var(--text-primary);
      }

      .pd-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-height: 80px;
        max-height: 96px;
        padding: 14px 18px;
        border-radius: var(--radius-md);
        border: 1px solid var(--border);
        background: var(--card);
        box-shadow: var(--shadow-sm);
        box-sizing: border-box;
      }

      .pd-header h1 {
        margin: 0;
        font-size: 18px;
        line-height: 1.2;
        font-weight: 800;
        color: var(--text-primary);
      }

      .pd-header p {
        margin: 4px 0 0;
        color: var(--text-muted);
        font-size: 12px;
        line-height: 1.35;
      }

      .pd-header__actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .pd-header__updated {
        font-size: 11px;
        color: var(--text-muted);
        white-space: nowrap;
      }

      .pd-health {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 11px;
        font-weight: 700;
      }

      .pd-health--healthy {
        color: var(--primary);
        background: var(--success-subtle);
        border: 1px solid rgba(22, 101, 52, 0.25);
      }

      .pd-health--attention {
        color: var(--warning);
        background: var(--warning-subtle);
        border: 1px solid rgba(245, 158, 11, 0.3);
      }

      .pd-kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }

      .pd-kpi-card,
      .pd-panel {
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        background: var(--card);
        box-shadow: var(--shadow-sm);
      }

      .pd-kpi-card {
        height: 104px;
        padding: 18px 20px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 4px;
        box-sizing: border-box;
      }

      .pd-kpi-card p {
        margin: 0;
        color: var(--text-muted);
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        line-height: 1.2;
      }

      .pd-kpi-card strong {
        display: block;
        color: var(--text-primary);
        font-size: 24px;
        line-height: 1;
        font-weight: 850;
      }

      .pd-main-grid {
        display: flex;
        flex-direction: column;
        gap: 14px;
        width: 100%;
      }

      .pd-panel {
        padding: 18px 20px;
      }

      .pd-panel--full {
        width: 100%;
      }

      .pd-secondary-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        width: 100%;
      }

      .pd-panel__header {
        margin-bottom: 10px;
      }

      .pd-panel h2 {
        margin: 0;
        color: var(--text-primary);
        font-size: 13px;
        font-weight: 800;
      }

      .pd-panel p {
        margin: 2px 0 0;
        color: var(--text-muted);
        font-size: 11px;
      }

      .pd-tenant-table {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .pd-tenant-table__head,
      .pd-tenant-row {
        display: grid;
        grid-template-columns: minmax(150px, 1.5fr) minmax(170px, 1.2fr) minmax(190px, 1fr) 64px;
        align-items: center;
        gap: 10px;
        width: 100%;
        box-sizing: border-box;
      }

      .pd-tenant-table__head {
        padding: 0 10px 4px;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-muted);
      }

      .pd-tenant-row {
        padding: 8px 12px;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        background: var(--surface-muted);
      }

      .pd-activity-list,
      .pd-readiness-list {
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      .pd-tenant-row__main a,
      .pd-detail-link,
      .pd-watch-row,
      .pd-activity-item {
        color: var(--primary);
        font-weight: 700;
        text-decoration: none;
      }

      .pd-tenant-row__main span {
        display: block;
        margin-top: 2px;
        color: var(--text-muted);
        font-size: 11px;
      }

      .pd-tenant-row__metrics span {
        padding: 3px 7px;
        border-radius: 999px;
        background: var(--success-subtle);
        color: var(--primary);
        font-size: 10px;
        font-weight: 700;
      }

      .pd-badge-stack {
        display: flex;
        gap: 3px;
        flex-wrap: wrap;
        justify-content: flex-start;
      }

      .pd-detail-link {
        justify-self: end;
        padding: 3px 7px;
        border-radius: 999px;
        background: var(--success-subtle);
        font-size: 10px;
        text-align: center;
      }

      .pd-watch-group {
        padding: 6px 0;
        border-top: 1px solid var(--border);
      }

      .pd-watch-group:first-of-type {
        border-top: 0;
        padding-top: 0;
      }

      .pd-watch-group__title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }

      .pd-watch-group__title strong {
        font-size: 11px;
        color: var(--text-secondary);
      }

      .pd-watch-group__title span {
        min-width: 20px;
        padding: 1px 6px;
        border-radius: 999px;
        background: var(--success-subtle);
        color: var(--primary);
        font-size: 10px;
        font-weight: 800;
        text-align: center;
      }

      .pd-watch-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 4px 0;
        border-top: 1px dashed var(--border);
        font-size: 11px;
      }

      .pd-watch-row small {
        color: var(--text-muted);
        font-size: 10px;
        white-space: nowrap;
      }

      .pd-watch-empty,
      .pd-empty {
        padding: 10px 12px;
        border-radius: var(--radius-sm);
        background: var(--surface-muted);
        color: var(--text-muted);
        font-size: 12px;
      }

      .pd-feature-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
      }

      .pd-feature-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 10px 8px;
        border-radius: var(--radius-sm);
        background: var(--surface-muted);
        border: 1px solid var(--border);
        text-align: center;
      }

      .pd-feature-stat span {
        color: var(--text-muted);
        font-size: 11px;
        font-weight: 700;
        line-height: 1.2;
      }

      .pd-feature-stat strong {
        color: var(--text-primary);
        font-size: 18px;
        line-height: 1;
        font-weight: 850;
      }

      .pd-activity-item {
        display: grid;
        grid-template-columns: 8px minmax(0, 1fr) auto;
        align-items: start;
        gap: 10px;
        padding: 7px 0;
        border-top: 1px solid var(--border);
      }

      .pd-activity-item:first-child {
        border-top: none;
        padding-top: 0;
      }

      .pd-activity-item > div {
        min-width: 0;
      }

      .pd-activity-item strong {
        display: block;
        color: var(--text-primary);
        font-size: 12px;
        line-height: 1.25;
      }

      .pd-activity-item p {
        overflow: hidden;
        margin: 2px 0 0;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 11px;
        color: var(--text-muted);
      }

      .pd-activity-item small {
        color: var(--text-muted);
        font-size: 10px;
        white-space: nowrap;
        padding-top: 1px;
      }

      .pd-activity-dot {
        width: 8px;
        height: 8px;
        margin-top: 4px;
        border-radius: 999px;
        background: var(--primary);
        box-shadow: 0 0 0 2px var(--success-subtle);
        flex-shrink: 0;
      }

      .pd-readiness-item {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 10px;
        padding: 7px 0;
        border-top: 1px solid var(--border);
        align-items: start;
      }

      .pd-readiness-item:first-child {
        border-top: none;
        padding-top: 0;
      }

      .pd-readiness-item > span {
        padding: 2px 6px;
        border-radius: 999px;
        font-size: 9px;
        font-weight: 800;
        line-height: 1.4;
      }

      .pd-readiness-item--ok > span {
        background: var(--success-subtle);
        color: var(--primary);
      }

      .pd-readiness-item--warn > span {
        background: var(--warning-subtle);
        color: var(--warning);
      }

      .pd-readiness-item strong {
        color: var(--text-primary);
        font-size: 12px;
        line-height: 1.3;
      }

      .pd-readiness-item p {
        margin: 2px 0 0;
        font-size: 11px;
        color: var(--text-muted);
        line-height: 1.35;
      }

      .pd-loading,
      .pd-error {
        padding: 16px 20px;
        border-radius: var(--radius-md);
        background: var(--card);
        color: var(--text-muted);
        border: 1px solid var(--border);
      }

      .pd-error {
        margin-bottom: 8px;
        color: var(--danger);
        background: var(--danger-subtle);
        border-color: rgba(220, 38, 38, 0.35);
      }

      @media (max-width: 1280px) {
        .pd-secondary-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .pd-feature-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 1100px) {
        .pd-kpi-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .pd-tenant-table__head,
        .pd-tenant-row {
          grid-template-columns: minmax(120px, 1fr) minmax(120px, 1fr);
        }

        .pd-tenant-table__head span:nth-child(n + 3),
        .pd-tenant-row > :nth-child(n + 3) {
          grid-column: 1 / -1;
        }

        .pd-badge-stack {
          justify-content: flex-start;
        }

        .pd-detail-link {
          justify-self: start;
        }
      }

      @media (max-width: 720px) {
        .pd-header {
          flex-direction: column;
          align-items: flex-start;
          max-height: none;
        }

        .pd-header__actions {
          justify-content: flex-start;
        }

        .pd-kpi-grid,
        .pd-secondary-grid,
        .pd-feature-grid {
          grid-template-columns: 1fr;
        }

        .pd-tenant-table__head {
          display: none;
        }

        .pd-tenant-row {
          grid-template-columns: 1fr;
        }
      }
    `}</style>
  );
}

export default PlatformDashboardPage;
