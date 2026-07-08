import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { ROUTE_PERMISSIONS, ROUTE_FEATURES } from "../constants/permissions";
import { hasPermission } from "../utils/hasPermission";
import { hasFeature } from "../utils/hasFeature";
import { setUser } from "../utils/storage";

let sessionPermissionsPromise = null;

function refreshPermissionsOnce() {
  if (!sessionPermissionsPromise) {
    sessionPermissionsPromise = api
      .get("/auth/me")
      .then((res) => {
        if (res.data?.user) {
          setUser(res.data.user);
        }
      })
      .catch(() => {});
  }
  return sessionPermissionsPromise;
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const location = useLocation();

  const [hydrating, setHydrating] = useState(Boolean(token));

  // Refresh permissions from server on every app load (once per session).
  useEffect(() => {
    if (!token) {
      setHydrating(false);
      return;
    }

    let cancelled = false;

    refreshPermissionsOnce().finally(() => {
      if (!cancelled) setHydrating(false);
    });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) {
    return <Navigate to="/" />;
  }

  if (hydrating) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "16px",
          color: "var(--text-secondary)",
        }}
      >
        Memuat hak akses...
      </div>
    );
  }

  const required = ROUTE_PERMISSIONS[location.pathname];
  const isDashboardRoute = location.pathname === "/dashboard";
  const allowed = isDashboardRoute || !required || hasPermission(required);

  if (!allowed) {
    const message =
      required === "dashboard.view"
        ? "Role belum memiliki izin dashboard"
        : "Role belum memiliki izin untuk halaman ini";

    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 12,
          padding: 24,
          textAlign: "center",
          background: "var(--background)",
        }}
      >
        <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--text-primary)" }}>
          {message}
        </div>
        <p style={{ margin: 0, color: "var(--text-secondary)", maxWidth: 460, lineHeight: 1.5 }}>
          Minta admin memberi permission <strong>{required}</strong> pada matrix role ini.
        </p>
      </div>
    );
  }

  const requiredFeature = ROUTE_FEATURES[location.pathname];
  const featureAllowed = !requiredFeature || hasFeature(requiredFeature);

  if (!featureAllowed) {
    if (location.pathname !== "/dashboard") {
      return <Navigate to="/dashboard" replace />;
    }

    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 12,
          padding: 24,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)" }}>
          FITUR TIDAK AKTIF
        </div>
        <p style={{ margin: 0, color: "var(--text-secondary)", maxWidth: 420 }}>
          Modul ini tidak diaktifkan untuk pesantren Anda. Hubungi operator KlikPesantren.
        </p>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
