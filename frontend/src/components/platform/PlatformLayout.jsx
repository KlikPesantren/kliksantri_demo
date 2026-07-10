import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import ThemeToggle from "../ThemeToggle";
import { PlatformThemeStyles } from "./PlatformTheme";
import { clearPlatformSession, getPlatformUser } from "../../utils/platformStorage";

function getInitials(name = "") {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "P";
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function PlatformLayoutStyles() {
  return (
    <style>{`
      .platform-shell {
        min-height: 100vh;
        background: var(--bg);
      }

      .platform-sidebar {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 30;
        width: 260px;
        height: 100vh;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding: 12px 10px;
        background: var(--platform-sidebar-bg, #0F172A);
        color: var(--platform-sidebar-text, #F8FAFC);
        border-right: 1px solid var(--platform-sidebar-border, #1E293B);
      }

      .platform-sidebar-backdrop {
        display: none;
      }

      .platform-brand {
        flex-shrink: 0;
        padding: 0 6px 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        margin-bottom: 8px;
      }

      .platform-brand__badge {
        display: inline-flex;
        align-items: center;
        margin-bottom: 4px;
        padding: 2px 7px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #BBF7D0;
        background: rgba(22, 101, 52, 0.22);
        border: 1px solid rgba(34, 197, 94, 0.28);
      }

      .platform-brand__title {
        margin: 0;
        font-size: 15px;
        font-weight: 800;
        letter-spacing: -0.02em;
      }

      .platform-brand__subtitle {
        margin: 2px 0 0;
        font-size: 11px;
        color: #94A3B8;
        font-weight: 500;
      }

      .platform-nav {
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        padding-right: 2px;
        margin-right: -2px;
      }

      .platform-sidebar__footer {
        flex-shrink: 0;
        padding: 10px 6px 0;
        margin-top: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }

      .platform-sidebar__logout {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 36px;
        padding: 0 12px;
        border-radius: 10px;
        border: 1px solid rgba(248, 113, 113, 0.28);
        background: rgba(127, 29, 29, 0.18);
        color: #FCA5A5;
        font-family: inherit;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
      }

      .platform-sidebar__logout:hover {
        background: rgba(127, 29, 29, 0.32);
        color: #FEE2E2;
      }

      .platform-nav__group {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .platform-nav__group-label {
        padding: 0 8px 2px;
        font-size: 10px;
        font-weight: 850;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #64748B;
      }

      .platform-nav__link {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 7px 10px;
        border-radius: 10px;
        color: #CBD5E1;
        text-decoration: none;
        font-size: 13px;
        font-weight: 600;
        transition: background 0.15s ease, color 0.15s ease;
      }

      .platform-nav__link:hover {
        background: rgba(255, 255, 255, 0.06);
        color: #F8FAFC;
      }

      .platform-nav__link.active {
        background: rgba(22, 101, 52, 0.24);
        color: #BBF7D0;
      }

      .platform-main {
        margin-left: 260px;
        width: calc(100% - 260px);
        height: 100vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: var(--bg);
        box-sizing: border-box;
      }

      .platform-topbar {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
        padding: 8px 16px;
        border-bottom: 1px solid var(--border);
        background: var(--card);
      }

      .platform-topbar__nav-btn {
        display: none;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--text-primary);
        cursor: pointer;
      }

      .platform-topbar__nav-icon {
        display: grid;
        gap: 4px;
        width: 18px;
      }

      .platform-topbar__nav-icon span {
        display: block;
        height: 2px;
        border-radius: 999px;
        background: currentColor;
      }

      .platform-topbar__menu {
        position: relative;
      }

      .platform-topbar__profile-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 4px 8px 4px 4px;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--background);
        color: var(--text-primary);
        font-family: inherit;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        max-width: 220px;
      }

      .platform-topbar__profile-btn:hover {
        border-color: var(--border-hover);
        background: var(--neutral-subtle);
      }

      .platform-topbar__avatar {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background: var(--primary-subtle);
        color: var(--primary);
        border: 1px solid rgba(22, 101, 52, 0.2);
        display: grid;
        place-items: center;
        font-size: 10px;
        font-weight: 800;
        flex-shrink: 0;
      }

      .platform-topbar__profile-name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .platform-topbar__dropdown {
        position: absolute;
        top: calc(100% + 6px);
        right: 0;
        min-width: 200px;
        padding: 6px;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: var(--surface);
        box-shadow: var(--shadow-md);
        z-index: 40;
      }

      .platform-topbar__dropdown-meta {
        padding: 8px 10px;
        border-bottom: 1px solid var(--border);
        margin-bottom: 4px;
      }

      .platform-topbar__dropdown-name {
        display: block;
        font-size: 13px;
        font-weight: 700;
        color: var(--text-primary);
      }

      .platform-topbar__dropdown-role {
        display: block;
        margin-top: 2px;
        font-size: 11px;
        color: var(--text-muted);
      }

      .platform-topbar__logout {
        width: 100%;
        padding: 8px 10px;
        border: none;
        border-radius: 8px;
        background: transparent;
        color: var(--danger);
        font-family: inherit;
        font-size: 13px;
        font-weight: 600;
        text-align: left;
        cursor: pointer;
      }

      .platform-topbar__logout:hover {
        background: var(--danger-subtle);
      }

      .platform-content-scroll {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
      }

      .platform-content {
        width: 100%;
        max-width: none;
        padding: 12px 16px 16px;
        box-sizing: border-box;
      }

      .platform-shell input,
      .platform-shell textarea,
      .platform-shell select {
        background: var(--surface);
        color: var(--text-primary);
        border-color: var(--border);
        color-scheme: light;
      }

      .platform-shell input::placeholder,
      .platform-shell textarea::placeholder {
        color: var(--text-muted);
        opacity: 1;
      }

      [data-theme="dark"] .platform-shell input,
      [data-theme="dark"] .platform-shell textarea,
      [data-theme="dark"] .platform-shell select {
        background: var(--surface);
        color: var(--text-primary);
        border-color: var(--border);
        color-scheme: dark;
      }

      [data-theme="dark"] .platform-shell input:-webkit-autofill,
      [data-theme="dark"] .platform-shell textarea:-webkit-autofill,
      [data-theme="dark"] .platform-shell select:-webkit-autofill {
        -webkit-text-fill-color: var(--text-primary);
        box-shadow: 0 0 0 1000px var(--surface) inset;
      }

      [data-theme="dark"] .platform-shell select option {
        background: var(--surface);
        color: var(--text-primary);
      }

      .platform-mobile-banner {
        display: none;
        flex-shrink: 0;
        padding: 10px 16px;
        background: #0F172A;
        border-bottom: 1px solid #1E293B;
      }

      @media (max-width: 900px) {
        .platform-sidebar {
          display: flex;
          transform: translateX(-105%);
          transition: transform 0.2s ease;
          box-shadow: 18px 0 40px rgba(15, 23, 42, 0.26);
        }

        .platform-sidebar--open {
          transform: translateX(0);
        }

        .platform-sidebar-backdrop {
          display: block;
          position: fixed;
          inset: 0;
          z-index: 25;
          border: 0;
          background: rgba(15, 23, 42, 0.52);
          cursor: pointer;
        }

        .platform-main {
          margin-left: 0;
          width: 100%;
        }

        .platform-topbar {
          justify-content: space-between;
          padding: 8px 12px;
        }

        .platform-topbar__nav-btn {
          display: inline-flex;
        }

        .platform-mobile-banner {
          display: block;
        }
      }
    `}</style>
  );
}

function PlatformLayout() {
  const navigate = useNavigate();
  const user = getPlatformUser();
  const displayName = user?.nama || user?.username || "Platform Admin";
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    clearPlatformSession();
    navigate("/platform/login", { replace: true });
  };

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  return (
    <>
      <PlatformThemeStyles />
      <PlatformLayoutStyles />
      <div className="platform-shell">
        {sidebarOpen && (
          <button
            type="button"
            className="platform-sidebar-backdrop"
            aria-label="Tutup menu platform"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <aside className={`platform-sidebar${sidebarOpen ? " platform-sidebar--open" : ""}`}>
          <div className="platform-brand">
            <span className="platform-brand__badge">Platform</span>
            <h1 className="platform-brand__title">KlikPesantren</h1>
            <p className="platform-brand__subtitle">Platform Console</p>
          </div>

          <nav className="platform-nav">
            <NavSection
              items={[
                { to: "/platform/dashboard", label: "Dashboard", end: true },
              ]}
              onNavigate={() => setSidebarOpen(false)}
            />
            <NavSection
              label="Tenants"
              items={[
                { to: "/platform/tenants", label: "Semua Tenant", end: true },
                { to: "/platform/tenants/health", label: "Tenant Health" },
              ]}
              onNavigate={() => setSidebarOpen(false)}
            />
            <NavSection
              label="Billing"
              items={[
                { to: "/platform/billing", label: "Subscriptions", end: true },
                { to: "/platform/billing/overdue", label: "Overdue" },
                { to: "/platform/billing/expiring-soon", label: "Expiring Soon" },
              ]}
              onNavigate={() => setSidebarOpen(false)}
            />
            <NavSection
              label="Website"
              items={[
                { to: "/platform/website", label: "Website Resmi" },
              ]}
              onNavigate={() => setSidebarOpen(false)}
            />
            <NavSection
              label="System"
              items={[
                { to: "/platform/system/deployment-checklist", label: "Deployment Checklist" },
                { to: "/platform/system/upload-storage", label: "Upload Storage" },
                { to: "/platform/system/backup-restore", label: "Backup & Restore" },
                { to: "/platform/system/announcements", label: "Pengumuman Platform" },
              ]}
              onNavigate={() => setSidebarOpen(false)}
            />
            <NavSection
              items={[
                { to: "/platform/profile", label: "Profile Platform" },
              ]}
              onNavigate={() => setSidebarOpen(false)}
            />
          </nav>

          <div className="platform-sidebar__footer">
            <button
              type="button"
              className="platform-sidebar__logout"
              onClick={handleLogout}
            >
              Logout Platform
            </button>
          </div>
        </aside>

        <div className="platform-main">
          <div className="platform-mobile-banner">
            <span style={{ color: "#E2E8F0", fontSize: 13, fontWeight: 700 }}>
              KlikPesantren Platform
            </span>
          </div>

          <header className="platform-topbar">
            <button
              type="button"
              className="platform-topbar__nav-btn"
              aria-label="Buka menu platform"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen((open) => !open)}
            >
              <span className="platform-topbar__nav-icon" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>
            <ThemeToggle size="sm" />
            <div className="platform-topbar__menu" ref={menuRef}>
              <button
                type="button"
                className="platform-topbar__profile-btn"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <span className="platform-topbar__avatar" aria-hidden="true">
                  {getInitials(displayName)}
                </span>
                <span className="platform-topbar__profile-name">{displayName}</span>
              </button>
              {menuOpen && (
                <div className="platform-topbar__dropdown" role="menu">
                  <div className="platform-topbar__dropdown-meta">
                    <span className="platform-topbar__dropdown-name">{displayName}</span>
                    <span className="platform-topbar__dropdown-role">
                      {user?.role || "platform_superadmin"}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="platform-topbar__logout"
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </header>

          <div className="platform-content-scroll">
            <div className="platform-content">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function NavSection({ label, items, onNavigate }) {
  return (
    <div className="platform-nav__group">
      {label && <div className="platform-nav__group-label">{label}</div>}
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `platform-nav__link${isActive ? " active" : ""}`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}

export default PlatformLayout;
