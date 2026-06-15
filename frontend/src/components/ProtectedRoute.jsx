import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { ROUTE_PERMISSIONS } from "../constants/permissions";
import { hasPermission } from "../utils/hasPermission";
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
  const allowed = !required || hasPermission(required);

  if (!allowed) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "30px",
          fontWeight: "bold",
        }}
      >
        AKSES DITOLAK
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
