import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import platformApi from "../../services/platformApi";
import Badge from "../../components/ui/Badge";
import {
  PlatformConsoleShell,
} from "../../components/platform/PlatformConsoleShell";
import { formatDateShort } from "../../utils/formatDate";

function billingBadgeVariant(status) {
  if (status === "active") return "success";
  if (status === "trial") return "info";
  if (status === "overdue") return "warning";
  if (status === "suspended" || status === "cancelled") return "danger";
  return "neutral";
}

function tenantDisplayName(row) {
  return row?.nama || row?.name || "-";
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function PlatformBillingOverviewPage({ mode = "subscriptions" }) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await platformApi.get("/platform/tenants");
      setTenants(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "Gagal memuat billing tenant");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (mode === "overdue") {
      return tenants.filter((t) => t.billing_status === "overdue");
    }
    if (mode === "expiring-soon") {
      return tenants.filter((t) => {
        const days = daysUntil(t.subscription_expires_at);
        return days != null && days >= 0 && days <= 30;
      });
    }
    return tenants;
  }, [tenants, mode]);

  const pageCopy = {
    subscriptions: {
      badge: "BILLING OPS",
      title: "Subscriptions",
      subtitle: "Ringkasan billing manual semua tenant. Detail & edit di Tenant Detail.",
    },
    overdue: {
      badge: "BILLING ALERT",
      title: "Overdue",
      subtitle: "Tenant dengan status billing overdue — perlu follow-up owner.",
    },
    "expiring-soon": {
      badge: "BILLING ALERT",
      title: "Expiring Soon",
      subtitle: "Langganan berakhir dalam 30 hari ke depan.",
    },
  };

  const copy = pageCopy[mode] || pageCopy.subscriptions;

  return (
    <PlatformConsoleShell
      badge={copy.badge}
      title={copy.title}
      subtitle={copy.subtitle}
      primaryLink="/platform/tenants"
      primaryLabel="Semua Tenants"
    >
      {error && (
        <div style={errorStyle}>{error}</div>
      )}
      <div className="platform-console-table-wrap">
        {loading ? (
          <div className="platform-console-empty">Memuat...</div>
        ) : filtered.length === 0 ? (
          <div className="platform-console-empty">Tidak ada tenant untuk filter ini.</div>
        ) : (
          <table className="platform-console-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Plan</th>
                <th>Billing</th>
                <th>Expires</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link to={`/platform/tenants/${t.id}`}>{tenantDisplayName(t)}</Link>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{t.slug}</div>
                  </td>
                  <td>{t.plan_code || t.current_package?.label || "-"}</td>
                  <td>
                    <Badge variant={billingBadgeVariant(t.billing_status)} size="sm">
                      {t.billing_status || "active"}
                    </Badge>
                  </td>
                  <td>{formatDateShort(t.subscription_expires_at) || "-"}</td>
                  <td>
                    <Badge variant={t.status === "active" ? "success" : "danger"} size="sm">
                      {t.status}
                    </Badge>
                  </td>
                  <td>
                    <Link to={`/platform/tenants/${t.id}`}>Billing →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PlatformConsoleShell>
  );
}

const errorStyle = {
  padding: "12px 14px",
  borderRadius: 8,
  background: "var(--danger-subtle)",
  color: "var(--danger)",
  fontWeight: 600,
};

export default PlatformBillingOverviewPage;
