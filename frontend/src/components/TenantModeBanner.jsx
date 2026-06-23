import { getUser } from "../utils/storage";
import { useTenantProfile } from "../context/TenantProfileContext";

function TenantModeBannerStyles() {
  return (
    <style>{`
      .tenant-mode-banner {
        display: flex;
        align-items: center;
        margin-bottom: var(--space-3);
        padding: 8px 12px;
        border-radius: var(--radius-md);
        background: rgba(22, 163, 74, 0.06);
        border: 1px solid rgba(22, 163, 74, 0.16);
        box-sizing: border-box;
      }

      .tenant-mode-banner__name {
        margin: 0;
        font-size: 14px;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1.3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `}</style>
  );
}

function resolveTenantDisplayName(display, user) {
  if (display?.hasCustomName && display?.name?.trim()) {
    return display.name.trim();
  }
  const fromUser = user?.tenant_nama || user?.tenant_name;
  if (fromUser?.trim()) return fromUser.trim();
  if (display?.name?.trim() && display.name !== "Pesantren") {
    return display.name.trim();
  }
  return "Pesantren";
}

function TenantModeBanner() {
  const { display } = useTenantProfile();
  const user = getUser();
  const tenantName = resolveTenantDisplayName(display, user);

  return (
    <>
      <TenantModeBannerStyles />
      <div className="tenant-mode-banner" role="status" aria-label={tenantName}>
        <p className="tenant-mode-banner__name">{tenantName}</p>
      </div>
    </>
  );
}

export default TenantModeBanner;
