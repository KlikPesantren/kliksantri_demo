import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import {
  getCachedTenantProfile,
  normalizeTenantProfile,
  resolveTenantDisplay,
  setCachedTenantProfile,
} from "../utils/tenantProfile";

const TenantProfileContext = createContext(null);

export function TenantProfileProvider({ children }) {
  const [profile, setProfile] = useState(() => getCachedTenantProfile());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    try {
      const res = await api.get("/profil-pesantren");
      const data = normalizeTenantProfile(res.data?.data ?? null);
      setProfile(data);
      setCachedTenantProfile(data);
    } catch {
      // Keep cached/fallback values when fetch fails.
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLocal = useCallback((nextProfile) => {
    const normalized = normalizeTenantProfile(nextProfile);
    setProfile(normalized);
    setCachedTenantProfile(normalized);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const display = useMemo(() => resolveTenantDisplay(profile), [profile]);

  const value = useMemo(
    () => ({
      profile,
      display,
      loading,
      refresh,
      updateLocal,
    }),
    [profile, display, loading, refresh, updateLocal],
  );

  return (
    <TenantProfileContext.Provider value={value}>
      {children}
    </TenantProfileContext.Provider>
  );
}

export function useTenantProfile() {
  const ctx = useContext(TenantProfileContext);
  if (!ctx) {
    throw new Error("useTenantProfile must be used within TenantProfileProvider");
  }
  return ctx;
}
