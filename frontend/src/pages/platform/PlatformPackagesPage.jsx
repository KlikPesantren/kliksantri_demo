import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import platformApi from "../../services/platformApi";
import {
  ConsoleCard,
  ConsoleList,
  PlatformConsoleShell,
} from "../../components/platform/PlatformConsoleShell";

function PlatformPackagesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await platformApi.get("/platform/tenants/packages");
        setPackages(res.data?.packages || []);
      } catch (err) {
        setError(err.response?.data?.error || "Gagal memuat package preset");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <PlatformConsoleShell
      badge="PRODUCT CONTROL"
      title="Packages"
      subtitle="Preset fitur saat provisioning tenant. Apply per tenant dari Tenant Detail."
      primaryLink="/platform/tenants"
      primaryLabel="Kelola di Tenant Detail"
    >
      {error && <ConsoleCard tone="warn"><p style={{ margin: 0 }}>{error}</p></ConsoleCard>}
      {loading ? (
        <ConsoleCard><p style={{ margin: 0 }}>Memuat package...</p></ConsoleCard>
      ) : (
        <div className="platform-console__grid">
          {packages.map((pkg) => (
            <ConsoleCard key={pkg.id} tone="active">
              <h2>{pkg.label}</h2>
              <p style={{ margin: "0 0 12px", color: "#475569", lineHeight: 1.5 }}>
                {pkg.description}
              </p>
              <ConsoleList
                items={
                  pkg.id === "custom"
                    ? ["Core selalu aktif", "Owner centang fitur manual"]
                    : (pkg.features || []).map((f) => f.replace(/_/g, " "))
                }
              />
            </ConsoleCard>
          ))}
        </div>
      )}
      <ConsoleCard title="Cara pakai">
        <ConsoleList
          items={[
            "Create Tenant → pilih package saat onboarding",
            "Tenant Detail → Package & Feature → apply preset",
            "Feature Management tetap bisa fine-tune per tenant",
          ]}
        />
        <p style={{ margin: "12px 0 0" }}>
          <Link to="/platform/features">Feature Access overview →</Link>
        </p>
      </ConsoleCard>
    </PlatformConsoleShell>
  );
}

export default PlatformPackagesPage;
