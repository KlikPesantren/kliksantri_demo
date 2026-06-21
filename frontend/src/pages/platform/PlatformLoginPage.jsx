import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import platformApi from "../../services/platformApi";
import Button from "../../components/ui/Button";
import {
  getPlatformToken,
  setPlatformSession,
} from "../../utils/platformStorage";

function PlatformLoginStyles() {
  return (
    <style>{`
      .platform-login {
        min-height: 100vh;
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        background: var(--background);
      }

      .platform-login-brand {
        background: #0F172A;
        color: #F8FAFC;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 48px;
        box-sizing: border-box;
      }

      .platform-login-brand h1 {
        margin: 0;
        font-size: 32px;
        font-weight: 800;
        letter-spacing: -0.03em;
      }

      .platform-login-brand p {
        margin: 16px 0 0;
        font-size: 15px;
        line-height: 1.6;
        color: #94A3B8;
        max-width: 420px;
      }

      .platform-login-panel {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 32px 24px;
      }

      .platform-login-card {
        width: 100%;
        max-width: 400px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-card);
        padding: var(--space-6);
        box-sizing: border-box;
      }

      .platform-login-card h2 {
        margin: 0;
        font-size: 22px;
        font-weight: 700;
        color: var(--text-primary);
      }

      .platform-login-card .subtitle {
        margin: var(--space-2) 0 var(--space-5);
        font-size: 14px;
        color: var(--text-secondary);
      }

      .platform-field {
        margin-bottom: var(--space-4);
      }

      .platform-field label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 6px;
        color: var(--text-primary);
      }

      .platform-field input {
        width: 100%;
        padding: 11px 12px;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        font-size: 14px;
        box-sizing: border-box;
        font-family: inherit;
      }

      .platform-error {
        margin-bottom: var(--space-4);
        padding: 10px 12px;
        border-radius: var(--radius-sm);
        background: var(--danger-subtle);
        color: var(--danger);
        font-size: 13px;
        font-weight: 600;
      }

      @media (max-width: 900px) {
        .platform-login {
          grid-template-columns: 1fr;
        }

        .platform-login-brand {
          display: none;
        }
      }
    `}</style>
  );
}

function PlatformLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getPlatformToken();
    if (!token) {
      setChecking(false);
      return;
    }

    platformApi
      .get("/platform/auth/me")
      .then((res) => {
        if (res.data?.user?.platform) {
          navigate("/platform/dashboard", { replace: true });
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await platformApi.post("/platform/auth/login", {
        username,
        password,
      });

      if (!res.data?.token) {
        setError("Login gagal. Periksa kredensial.");
        return;
      }

      setPlatformSession(res.data.token, res.data.user);
      navigate("/platform/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Login gagal. Periksa kredensial.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        Memuat...
      </div>
    );
  }

  return (
    <>
      <PlatformLoginStyles />
      <div className="platform-login">
        <div className="platform-login-brand">
          <h1>KlikSantri Platform</h1>
          <p>
            Console administrasi multi-tenant untuk operator KlikSantri.
            Kelola pesantren, pantau statistik, dan kontrol status layanan.
          </p>
        </div>

        <div className="platform-login-panel">
          <div className="platform-login-card">
            <h2>Masuk Platform</h2>
            <p className="subtitle">Gunakan akun platform_superadmin</p>

            {error && <div className="platform-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="platform-field">
                <label htmlFor="platform-username">Username</label>
                <input
                  id="platform-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="platform-field">
                <label htmlFor="platform-password">Password</label>
                <input
                  id="platform-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <Button type="submit" loading={loading} style={{ width: "100%" }}>
                Masuk
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default PlatformLoginPage;
