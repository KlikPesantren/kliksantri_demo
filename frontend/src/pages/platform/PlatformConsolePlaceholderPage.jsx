import { Link } from "react-router-dom";
import { getPlatformUser } from "../../utils/platformStorage";

const PAGE_COPY = {
  billing: {
    badge: "BILLING OPS",
    title: "Subscriptions Center",
    subtitle:
      "Pantau billing manual tenant: active, trial, overdue, suspended, dan expiring soon.",
    active: [
      "Billing manual aktif di Tenant Detail",
      "Mark Active, Mark Overdue, Suspend Billing",
      "Extend 30 Days dan notes billing",
    ],
    coming: [
      "Filter global overdue dan expiring soon",
      "Invoice history",
      "Payment gateway belum aktif",
    ],
    primaryLink: "/platform/tenants",
    primaryLabel: "Buka Tenant Billing",
  },
  features: {
    badge: "PRODUCT CONTROL",
    title: "Feature Access",
    subtitle:
      "Kontrol akses fitur dan package per tenant tanpa masuk ke tenant dashboard.",
    active: [
      "Package Basic, Standard, Premium, Custom aktif",
      "Feature Management aktif di Tenant Detail",
      "Core feature terkunci ON",
    ],
    coming: [
      "Bulk apply package",
      "Feature adoption analytics lanjutan",
      "Policy template per segment customer",
    ],
    primaryLink: "/platform/tenants",
    primaryLabel: "Kelola Feature Tenant",
  },
  support: {
    badge: "SUPPORT OPS",
    title: "Support Center",
    subtitle:
      "Tempat kerja support KlikPesantren untuk membantu admin pesantren.",
    active: [
      "Open tenant portal dari Tenant Detail",
      "Reset admin tenant password aktif",
      "Tenant health dan billing status tersedia",
    ],
    coming: [
      "Support notes per tenant",
      "Issue log dan assignment",
      "Reset Wali PIN dari platform/support",
    ],
    primaryLink: "/platform/tenants",
    primaryLabel: "Buka Tenant Tools",
  },
  system: {
    badge: "SYSTEM READINESS",
    title: "System Operations",
    subtitle:
      "Checklist operasional production: storage, deployment, backup, dan migration.",
    active: [
      "Deployment checklist tersedia di docs",
      "JWT secret fail-fast aktif",
      "Safe tenant cleanup aktif",
    ],
    coming: [
      "Upload masih local filesystem; Railway Volume recommended",
      "Migration status UI",
      "Backup status UI",
    ],
    primaryLink: "/platform/dashboard",
    primaryLabel: "Kembali ke Console",
  },
  profile: {
    badge: "PLATFORM PROFILE",
    title: "Profile Platform",
    subtitle:
      "Identitas operator platform yang sedang mengelola lifecycle tenant.",
    active: ["Session platform aktif", "Role platform terpisah dari tenant admin"],
    coming: [
      "Platform users management",
      "2FA dan credential policy",
      "Activity log operator",
    ],
    primaryLink: "/platform/dashboard",
    primaryLabel: "Dashboard",
  },
  health: {
    badge: "TENANT HEALTH",
    title: "Tenant Health Center",
    subtitle:
      "Ringkasan kesehatan tenant. Detail lengkap tetap tersedia per tenant.",
    active: [
      "Health panel aktif di dashboard",
      "Detail health aktif di Tenant Detail",
      "Feature enabled/disabled count tersedia",
    ],
    coming: [
      "Filter global tenant bermasalah",
      "Last activity alert",
      "Operational SLA per tenant",
    ],
    primaryLink: "/platform/dashboard",
    primaryLabel: "Lihat Health Dashboard",
  },
};

function PlatformConsolePlaceholderPage({ type }) {
  const user = getPlatformUser();
  const page = PAGE_COPY[type] || PAGE_COPY.system;

  return (
    <>
      <PlaceholderStyles />
      <div className="platform-placeholder">
        <section className="platform-placeholder__hero">
          <span>{page.badge}</span>
          <h1>{page.title}</h1>
          <p>{page.subtitle}</p>
          {type === "profile" && (
            <div className="platform-placeholder__profile">
              <strong>{user?.nama || user?.username || "Platform Admin"}</strong>
              <small>{user?.role || "platform_superadmin"}</small>
            </div>
          )}
        </section>

        <section className="platform-placeholder__grid">
          <PlaceholderCard title="Sudah Aktif" items={page.active} tone="active" />
          <PlaceholderCard title="Belum Aktif / Berikutnya" items={page.coming} tone="next" />
        </section>

        {type === "system" && (
          <section className="platform-placeholder__storage">
            <h2>Upload Storage Status</h2>
            <p>
              Upload saat ini memakai local filesystem folder <code>uploads/</code>.
              Untuk Railway production, gunakan Railway Volume. Cloudinary optional
              untuk fase berikutnya.
            </p>
          </section>
        )}

        <div className="platform-placeholder__actions">
          <Link className="platform-placeholder__button" to={page.primaryLink}>
            {page.primaryLabel}
          </Link>
          <Link to="/platform/tenants">Tenant Management</Link>
        </div>
      </div>
    </>
  );
}

function PlaceholderCard({ title, items, tone }) {
  return (
    <article className={`platform-placeholder-card platform-placeholder-card--${tone}`}>
      <h2>{title}</h2>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

function PlaceholderStyles() {
  return (
    <style>{`
      .platform-placeholder {
        display: flex;
        flex-direction: column;
        gap: 12px;
        color: var(--text-primary);
      }

      .platform-placeholder__hero,
      .platform-placeholder-card,
      .platform-placeholder__storage {
        border-radius: var(--radius-lg);
        border: 1px solid var(--border);
        background: var(--card);
        box-shadow: var(--shadow-sm);
      }

      .platform-placeholder__hero {
        padding: 16px 20px;
      }

      .platform-placeholder__hero span {
        display: inline-flex;
        padding: 3px 8px;
        border-radius: 999px;
        background: var(--alert-success-bg);
        color: var(--primary);
        border: 1px solid color-mix(in srgb, var(--primary) 24%, transparent);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.06em;
      }

      .platform-placeholder__hero h1 {
        margin: 8px 0 4px;
        font-size: 22px;
        font-weight: 800;
        color: var(--text-primary);
      }

      .platform-placeholder__hero p {
        margin: 0;
        max-width: 720px;
        color: var(--text-muted);
        line-height: 1.5;
        font-size: 13px;
      }

      .platform-placeholder__profile {
        display: inline-flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 12px;
        padding: 12px 14px;
        border-radius: var(--radius-md);
        background: var(--sidebar-bg);
        color: var(--sidebar-active-text);
        border: 1px solid var(--sidebar-border);
      }

      .platform-placeholder__profile small {
        color: var(--primary-subtle);
      }

      .platform-placeholder__grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .platform-placeholder-card {
        padding: 16px 20px;
      }

      .platform-placeholder-card h2,
      .platform-placeholder__storage h2 {
        margin: 0 0 10px;
        font-size: 15px;
        font-weight: 800;
        color: var(--text-primary);
      }

      .platform-placeholder-card ul {
        display: grid;
        gap: 8px;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .platform-placeholder-card li {
        padding: 10px 12px;
        border-radius: var(--radius-md);
        background: var(--surface-muted);
        color: var(--text-secondary);
        font-size: 13px;
        font-weight: 600;
        border: 1px solid var(--border);
      }

      .platform-placeholder-card--active li {
        background: var(--alert-success-bg);
        color: var(--primary);
        border-color: color-mix(in srgb, var(--primary) 20%, var(--border));
      }

      .platform-placeholder-card--next li {
        background: var(--surface-muted);
        color: var(--text-muted);
      }

      .platform-placeholder__storage {
        padding: 16px 20px;
        background: var(--alert-warning-bg);
        border-color: color-mix(in srgb, var(--warning) 35%, var(--border));
      }

      .platform-placeholder__storage p {
        margin: 0;
        color: var(--text-secondary);
        line-height: 1.5;
        font-size: 13px;
      }

      .platform-placeholder__actions {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .platform-placeholder__actions a {
        color: var(--primary);
        font-weight: 700;
        text-decoration: none;
      }

      .platform-placeholder__button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 36px;
        padding: 0 16px;
        border-radius: var(--radius-sm);
        background: var(--primary);
        color: var(--on-primary) !important;
        border: 1px solid var(--primary);
      }

      @media (max-width: 760px) {
        .platform-placeholder__grid {
          grid-template-columns: 1fr;
        }
      }
    `}</style>
  );
}

export default PlatformConsolePlaceholderPage;
