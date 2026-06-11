import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { ROUTE_PERMISSIONS } from "../constants/permissions";
import { hasPermission, getUser } from "../utils/hasPermission";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const location = useLocation();

  const [hydrating, setHydrating] = useState(true);

  // Self-heal: jika user tersimpan tanpa array permissions,
  // ambil ulang dari /auth/me lalu simpan kembali.
  useEffect(() => {
    if (!token) {
      setHydrating(false);
      return;
    }

    const user = getUser();

    if (user && Array.isArray(user.permissions)) {
      setHydrating(false);
      return;
    }

    let cancelled = false;
    api
      .get("/auth/me")
      .then((res) => {
        if (!cancelled && res.data?.user) {
          localStorage.setItem("user", JSON.stringify(res.data.user));
        }
      })
      .catch(() => {})
      .finally(() => {
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
          color: "#64748b",
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
