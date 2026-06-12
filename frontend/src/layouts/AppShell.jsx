import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";

function AppShell({ children, title, description, breadcrumb }) {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

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
        <PageHeader
          title={title}
          description={description}
          breadcrumb={breadcrumb}
          onMenuClick={openDrawer}
        />

        <div className="app-shell-content">{children}</div>
      </main>
    </div>
  );
}

export default AppShell;
