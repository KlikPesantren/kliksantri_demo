import { useEffect, useState } from "react";
import api from "../services/api";
import Button from "../components/ui/Button";
import TenantBrand from "../components/TenantBrand";
import { setUser } from "../utils/storage";
import {
  getCachedTenantProfile,
  resolveTenantDisplay,
  setCachedTenantProfile,
} from "../utils/tenantProfile";

function LoginPageStyles() {
  return (
    <style>{`
      .login-page {
        min-height: 100vh;
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        background: var(--background);
      }

      .login-branding {
        background: var(--dark);
        color: #F8FAFC;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 48px;
        box-sizing: border-box;
      }

      .login-branding-inner {
        max-width: 420px;
        width: 100%;
      }

      .login-tagline {
        margin: var(--space-5) 0 0;
        font-size: 15px;
        line-height: 1.6;
        color: #CBD5E1;
        font-weight: 500;
      }

      .login-powered {
        margin: var(--space-6) 0 0;
        font-size: 12px;
        color: var(--neutral);
        font-weight: 500;
      }

      .login-form-panel {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 32px 24px;
        box-sizing: border-box;
      }

      .login-form-card {
        width: 100%;
        max-width: 400px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-card);
        padding: var(--space-6);
        box-sizing: border-box;
      }

      .login-form-title {
        margin: 0;
        font-size: 22px;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1.25;
      }

      .login-form-subtitle {
        margin: var(--space-2) 0 var(--space-5);
        font-size: 14px;
        color: var(--text-secondary);
        line-height: 1.5;
      }

      .login-field {
        margin-bottom: var(--space-4);
      }

      .login-label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 6px;
      }

      .login-input {
        width: 100%;
        padding: 11px 12px;
        border-radius: var(--radius-md);
        border: 1px solid var(--border);
        font-size: 14px;
        box-sizing: border-box;
        font-family: inherit;
        outline: none;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }

      .login-input:focus {
        border-color: var(--primary);
        box-shadow: 0 0 0 3px var(--focus-ring);
      }

      .login-mobile-brand {
        display: none;
        background: var(--dark);
        padding: var(--space-5);
        box-sizing: border-box;
      }

      @media (max-width: 767px) {
        .login-page {
          grid-template-columns: 1fr;
        }

        .login-branding {
          display: none;
        }

        .login-mobile-brand {
          display: block;
        }

        .login-form-panel {
          padding: var(--space-5) var(--space-4) var(--space-6);
        }
      }
    `}</style>
  );
}

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [display, setDisplay] = useState(() =>
    resolveTenantDisplay(getCachedTenantProfile()),
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      window.location.href = "/dashboard";
      return;
    }

    const cached = getCachedTenantProfile();
    if (cached) {
      setDisplay(resolveTenantDisplay(cached));
    }

    api
      .get("/profil-pesantren")
      .then((res) => {
        const data = res.data?.data ?? null;
        setCachedTenantProfile(data);
        setDisplay(resolveTenantDisplay(data));
      })
      .catch(() => {
        // Unauthenticated login uses cache + fallbacks.
      });
  }, []);

  const login = async () => {
    try {
      const response = await api.post("/auth/login", { username, password });

      localStorage.setItem("token", response.data.token);
      setUser(response.data.user);
      window.location.href = "/dashboard";
    } catch {
      alert("Login gagal");
    }
  };

  const brandingBlock = (
    <>
      <TenantBrand
        variant="sidebar"
        size="lg"
        logo={display.logo}
        name={display.name}
        location={display.address}
      />
      <p className="login-tagline">{display.tagline || "Sistem Administrasi Pesantren Modern"}</p>
      <p className="login-powered">Powered by KlikSantri</p>
    </>
  );

  return (
    <>
      <LoginPageStyles />
      <div className="login-page">
        <div className="login-mobile-brand">{brandingBlock}</div>

        <div className="login-branding">
          <div className="login-branding-inner">{brandingBlock}</div>
        </div>

        <div className="login-form-panel">
          <div className="login-form-card">
            <h1 className="login-form-title">Login Admin</h1>
            <p className="login-form-subtitle">
              Masuk ke panel administrasi pesantren Anda.
            </p>

            <div className="login-field">
              <label className="login-label" htmlFor="login-username">
                Username
              </label>
              <input
                id="login-username"
                className="login-input"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                className="login-input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                onKeyDown={(e) => e.key === "Enter" && login()}
              />
            </div>

            <Button variant="primary" onClick={login} style={{ width: "100%" }}>
              Login
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default LoginPage;
