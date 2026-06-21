import { NavLink, Outlet, useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import { clearPlatformSession, getPlatformUser } from "../../utils/platformStorage";

function PlatformLayoutStyles() {
  return (
    <style>{`
      .platform-shell {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 240px minmax(0, 1fr);
        background: var(--background);
      }

      .platform-sidebar {
        background: #0F172A;
        color: #F8FAFC;
        display: flex;
        flex-direction: column;
        padding: 24px 16px;
        box-sizing: border-box;
        border-right: 1px solid rgba(255,255,255,0.06);
      }

      .platform-brand {
        padding: 0 8px 24px;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        margin-bottom: 20px;
      }

      .platform-brand__title {
        margin: 0;
        font-size: 18px;
        font-weight: 800;
        letter-spacing: -0.02em;
      }

      .platform-brand__subtitle {
        margin: 6px 0 0;
        font-size: 12px;
        color: #94A3B8;
        font-weight: 500;
      }

      .platform-nav {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
      }

      .platform-nav__link {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: var(--radius-md);
        color: #CBD5E1;
        text-decoration: none;
        font-size: 14px;
        font-weight: 600;
        transition: background 0.15s ease, color 0.15s ease;
      }

      .platform-nav__link:hover {
        background: rgba(255,255,255,0.06);
        color: #F8FAFC;
      }

      .platform-nav__link.active {
        background: rgba(22, 163, 74, 0.18);
        color: #4ADE80;
      }

      .platform-sidebar__footer {
        padding-top: 16px;
        border-top: 1px solid rgba(255,255,255,0.08);
      }

      .platform-user {
        padding: 0 8px 12px;
        font-size: 12px;
        color: #94A3B8;
        line-height: 1.4;
      }

      .platform-user strong {
        display: block;
        color: #E2E8F0;
        font-size: 13px;
        margin-bottom: 2px;
      }

      .platform-main {
        min-width: 0;
        display: flex;
        flex-direction: column;
      }

      .platform-topbar {
        background: var(--surface);
        border-bottom: 1px solid var(--border);
        padding: 16px 28px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .platform-topbar__title {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
        color: var(--text-primary);
      }

      .platform-content {
        padding: 24px 28px 40px;
        flex: 1;
        box-sizing: border-box;
      }

      @media (max-width: 900px) {
        .platform-shell {
          grid-template-columns: 1fr;
        }

        .platform-sidebar {
          display: none;
        }
      }
    `}</style>
  );
}

function PlatformLayout({ title = "Platform Console" }) {
  const navigate = useNavigate();
  const user = getPlatformUser();

  const handleLogout = () => {
    clearPlatformSession();
    navigate("/platform/login", { replace: true });
  };

  return (
    <>
      <PlatformLayoutStyles />
      <div className="platform-shell">
        <aside className="platform-sidebar">
          <div className="platform-brand">
            <h1 className="platform-brand__title">KlikSantri</h1>
            <p className="platform-brand__subtitle">Platform Console</p>
          </div>

          <nav className="platform-nav">
            <NavLink
              to="/platform/dashboard"
              className={({ isActive }) =>
                `platform-nav__link${isActive ? " active" : ""}`
              }
              end
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/platform/tenants"
              className={({ isActive }) =>
                `platform-nav__link${isActive ? " active" : ""}`
              }
            >
              Tenants
            </NavLink>
          </nav>

          <div className="platform-sidebar__footer">
            <div className="platform-user">
              <strong>{user?.nama || user?.username || "Platform Admin"}</strong>
              {user?.role || "platform_superadmin"}
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} style={{ width: "100%" }}>
              Logout
            </Button>
          </div>
        </aside>

        <div className="platform-main">
          <header className="platform-topbar">
            <h2 className="platform-topbar__title">{title}</h2>
          </header>
          <div className="platform-content">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
}

export default PlatformLayout;
