import {
  ConsoleCard,
  ConsoleList,
  PlatformConsoleShell,
} from "../../components/platform/PlatformConsoleShell";

function PlatformUploadStoragePage() {
  return (
    <PlatformConsoleShell
      badge="UPLOAD STORAGE"
      title="Upload Storage Status"
      subtitle="Status penyimpanan file upload admin tenant (logo, dokumen, dll)."
      primaryLink="/platform/system/deployment-checklist"
      primaryLabel="Deployment Checklist"
    >
      <ConsoleCard tone="warn" title="⚠ Local Filesystem Detected">
        <p style={{ margin: "0 0 12px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Upload saat ini memakai folder <code>uploads/</code> di local filesystem
          server. Cocok untuk development LAN, <strong>tidak persistent</strong> di
          Railway tanpa volume.
        </p>
        <ConsoleList
          items={[
            "Development: OK — file tersimpan di disk laptop/server lokal",
            "Railway production: gunakan Railway Volume mount ke uploads/",
            "Cloudinary / S3: opsional fase berikutnya (belum aktif)",
            "Backup uploads terpisah dari database Neon",
          ]}
        />
      </ConsoleCard>

      <div className="platform-console__grid">
        <ConsoleCard title="Rekomendasi Railway" tone="active">
          <ConsoleList
            items={[
              "Buat Railway Volume di service API",
              "Mount path: /app/uploads atau sesuai server.js",
              "Set permission write untuk process Node",
              "Verifikasi upload logo profil pesantren setelah deploy",
            ]}
          />
        </ConsoleCard>
        <ConsoleCard title="Belum Aktif">
          <ConsoleList
            items={[
              "Cloudinary integration",
              "Auto migration uploads ke object storage",
              "Storage quota per tenant",
              "Health probe API upload storage",
            ]}
          />
        </ConsoleCard>
      </div>
    </PlatformConsoleShell>
  );
}

export default PlatformUploadStoragePage;
