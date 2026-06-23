import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import TenantModeBanner from "../components/TenantModeBanner";

function AppShell({ children, title, description, breadcrumb }) {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isDashboard = location.pathname === "/dashboard";
  const showBanner = !isDashboard;

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  const closeDrawer = () => setDrawerOpen(false);
  const openDrawer = () => setDrawerOpen(true);

  return (
    <div className="app-shell">
      {drawerOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Tutup menu navigasi"
          onClick={closeDrawer}
        />
      )}

      <Sidebar drawerOpen={drawerOpen} onDrawerClose={closeDrawer} />

      <main className="app-shell-main">
        {showBanner ? <TenantModeBanner /> : null}
        <PageHeader
          title={isDashboard ? "" : title}
          description={description}
          breadcrumb={isDashboard ? "" : breadcrumb}
          onMenuClick={openDrawer}
          hideUserCard={isDashboard}
          compact={isDashboard}
        />

        <div className="app-shell-content">{children}</div>
      </main>
    </div>
  );
}

export default AppShell;
