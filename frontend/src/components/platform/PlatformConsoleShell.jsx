import { Link } from "react-router-dom";

export function PlatformConsoleShell({
  badge,
  title,
  subtitle,
  children,
  primaryLink,
  primaryLabel,
  secondaryLink = "/platform/tenants",
  secondaryLabel = "Tenant Management",
}) {
  return (
    <>
      <ConsoleStyles />
      <div className="platform-console">
        <section className="platform-console__header">
          {badge ? <span className="platform-console__badge">{badge}</span> : null}
          <h1 className="platform-page-title">{title}</h1>
          {subtitle ? <p className="platform-page-subtitle">{subtitle}</p> : null}
        </section>
        {children}
        {(primaryLink || secondaryLink) && (
          <div className="platform-console__actions">
            {primaryLink ? (
              <Link className="platform-console__button" to={primaryLink}>
                {primaryLabel}
              </Link>
            ) : null}
            {secondaryLink ? <Link to={secondaryLink}>{secondaryLabel}</Link> : null}
          </div>
        )}
      </div>
    </>
  );
}

export function ConsoleCard({ title, children, tone = "default" }) {
  return (
    <article className={`platform-console-card platform-console-card--${tone}`}>
      {title ? <h2>{title}</h2> : null}
      {children}
    </article>
  );
}

export function ConsoleList({ items }) {
  return (
    <ul className="platform-console-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function ConsoleStyles() {
  return (
    <style>{`
      .platform-console {
        display: flex;
        flex-direction: column;
        gap: 12px;
        color: var(--text-primary);
      }

      .platform-console__header {
        padding: 16px 20px;
        border-radius: var(--radius-lg);
        border: 1px solid var(--border);
        background: var(--card);
        box-shadow: var(--shadow-sm);
      }

      .platform-console__badge {
        display: inline-flex;
        padding: 3px 8px;
        border-radius: 999px;
        background: var(--alert-success-bg);
        color: var(--primary);
        border: 1px solid color-mix(in srgb, var(--primary) 24%, transparent);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .platform-console__header .platform-page-title {
        margin-top: 8px;
        color: var(--text-primary);
      }

      .platform-console__header .platform-page-subtitle {
        margin-bottom: 0;
        color: var(--text-muted);
      }

      .platform-console-card,
      .platform-console-table-wrap {
        border-radius: var(--radius-lg);
        border: 1px solid var(--border);
        background: var(--card);
        box-shadow: var(--shadow-sm);
        color: var(--text-primary);
      }

      .platform-console-card {
        padding: 16px 20px;
      }

      .platform-console-card h2 {
        margin: 0 0 10px;
        font-size: 15px;
        font-weight: 800;
        color: var(--text-primary);
      }

      .platform-console-card p {
        color: var(--text-secondary);
        line-height: 1.55;
      }

      .platform-console-card code {
        padding: 1px 5px;
        border-radius: 4px;
        background: var(--surface-muted);
        color: var(--text-primary);
        font-size: 12px;
      }

      .platform-console-card--warn {
        background: var(--alert-warning-bg);
        border-color: color-mix(in srgb, var(--warning) 35%, var(--border));
      }

      .platform-console-card--warn h2 {
        color: var(--warning);
      }

      .platform-console-card--warn p {
        color: var(--text-secondary);
      }

      .platform-console-card--active {
        background: var(--card);
        border-color: color-mix(in srgb, var(--primary) 22%, var(--border));
      }

      .platform-console-list {
        display: grid;
        gap: 8px;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .platform-console-list li {
        padding: 10px 12px;
        border-radius: var(--radius-md);
        background: var(--surface-muted);
        color: var(--text-secondary);
        font-size: 13px;
        font-weight: 600;
        line-height: 1.45;
        border: 1px solid var(--border);
      }

      .platform-console-card--active .platform-console-list li {
        background: var(--alert-success-bg);
        color: var(--primary);
        border-color: color-mix(in srgb, var(--primary) 20%, var(--border));
      }

      .platform-console-card--warn .platform-console-list li {
        background: color-mix(in srgb, var(--alert-warning-bg) 80%, var(--surface-muted));
        border-color: color-mix(in srgb, var(--warning) 22%, var(--border));
      }

      .platform-console__grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .platform-console-table-wrap {
        padding: 0;
        overflow-x: auto;
      }

      .platform-console-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }

      .platform-console-table th,
      .platform-console-table td {
        padding: 10px 14px;
        border-bottom: 1px solid var(--border);
        text-align: left;
        vertical-align: middle;
        color: var(--text-primary);
      }

      .platform-console-table th {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted);
        background: var(--surface-muted);
      }

      .platform-console-table a {
        color: var(--primary);
        font-weight: 700;
        text-decoration: none;
      }

      .platform-console__actions {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .platform-console__actions a {
        color: var(--primary);
        font-weight: 700;
        text-decoration: none;
      }

      .platform-console__button {
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

      .platform-console-empty {
        padding: 16px 20px;
        color: var(--text-muted);
        text-align: center;
        font-size: 13px;
      }

      @media (max-width: 760px) {
        .platform-console__grid {
          grid-template-columns: 1fr;
        }
      }
    `}</style>
  );
}
