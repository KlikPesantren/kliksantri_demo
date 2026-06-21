import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import platformApi from "../../services/platformApi";
import {
  getPlatformToken,
  getPlatformUser,
  setPlatformSession,
} from "../../utils/platformStorage";

let mePromise = null;

function validatePlatformSessionOnce() {
  if (!mePromise) {
    mePromise = platformApi
      .get("/platform/auth/me")
      .then((res) => {
        if (res.data?.user) {
          const token = getPlatformToken();
          setPlatformSession(token, res.data.user);
        }
        return res.data?.user ?? null;
      })
      .catch(() => null)
      .finally(() => {
        mePromise = null;
      });
  }
  return mePromise;
}

function PlatformProtectedRoute({ children }) {
  const token = getPlatformToken();
  const location = useLocation();
  const [state, setState] = useState(() => ({
    loading: Boolean(token),
    valid: Boolean(token && getPlatformUser()?.platform),
  }));

  useEffect(() => {
    if (!token) {
      setState({ loading: false, valid: false });
      return;
    }

    let cancelled = false;

    validatePlatformSessionOnce().then((user) => {
      if (cancelled) return;
      setState({
        loading: false,
        valid: Boolean(user?.platform),
      });
    });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) {
    return <Navigate to="/platform/login" state={{ from: location.pathname }} replace />;
  }

  if (state.loading) {
    return (
      <div style={loadingStyle}>
        Memuat sesi platform...
      </div>
    );
  }

  if (!state.valid) {
    return <Navigate to="/platform/login" replace />;
  }

  return children;
}

const loadingStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "15px",
  color: "var(--text-secondary)",
  background: "var(--background)",
};

export default PlatformProtectedRoute;
