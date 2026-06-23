import {
  ConsoleCard,
  ConsoleList,
  PlatformConsoleShell,
} from "../../components/platform/PlatformConsoleShell";

const CHECKLIST = [
  {
    title: "1. Backup",
    items: [
      "Ambil backup database Neon sebelum deploy",
      "Simpan timestamp backup dan environment target",
      "Pastikan akses restore sudah diuji di staging",
      "Jangan lanjut jika backup gagal atau tidak terverifikasi",
    ],
  },
  {
    title: "2. Migration Order",
    items: [
      "Jalankan migration sesuai urutan angka",
      "Pastikan 027, 029, 030, 032, 035, 036, 041–045 applied",
      "Cek tenants, tenant_features, feature_catalog, users",
      "Jangan cleanup tenant bersamaan dengan migration",
    ],
  },
  {
    title: "3. Railway Deploy",
    items: [
      "Set DATABASE_URL, JWT_SECRET, WALI_JWT_SECRET",
      "Set FRONTEND_URL dan CORS_ORIGIN (HTTPS Vercel admin)",
      "JWT secret bukan fallback dev",
      "Railway Volume untuk uploads/ jika masih local filesystem",
    ],
  },
  {
    title: "4. Vercel Deploy",
    items: [
      "Set VITE_API_BASE_URL ke Railway production API",
      "Deploy frontend setelah backend + migration selesai",
      "Uji platform login dan tenant login",
    ],
  },
  {
    title: "5. Smoke Test",
    items: [
      "Backend syntax check + frontend build",
      "MT-8, MT-10, MT-11, MT-12 smoke scripts",
      "Tenant default dan al-hikmah tidak rusak",
    ],
  },
  {
    title: "6. Rollback",
    items: [
      "Rollback Railway release jika gagal pre-migration",
      "Restore DB jika migration applied dan data rusak",
      "Jangan hard delete tenant production sebagai rollback",
    ],
  },
];

function PlatformDeploymentChecklistPage() {
  return (
    <PlatformConsoleShell
      badge="SYSTEM READINESS"
      title="Deployment Checklist"
      subtitle="Ringkasan operasional dari docs/PRODUCTION_DEPLOY_CHECKLIST.md — baca full doc sebelum production deploy."
      primaryLink="/platform/dashboard"
      primaryLabel="Kembali ke Dashboard"
    >
      <div className="platform-console__grid">
        {CHECKLIST.map((section) => (
          <ConsoleCard key={section.title} title={section.title}>
            <ConsoleList items={section.items} />
          </ConsoleCard>
        ))}
      </div>
      <ConsoleCard tone="active" title="Referensi">
        <ConsoleList
          items={[
            "Full checklist: docs/PRODUCTION_DEPLOY_CHECKLIST.md",
            "DEPLOYMENT_CHECKLIST.md — ringkasan repo",
            "ENVIRONMENT.md — variabel wajib production",
          ]}
        />
      </ConsoleCard>
    </PlatformConsoleShell>
  );
}

export default PlatformDeploymentChecklistPage;
