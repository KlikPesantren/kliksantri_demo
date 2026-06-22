export function OperationalPageStyles() {
  return (
    <style>{`
      .ops-page {
        min-width: 0;
        max-width: 100%;
        display: flex;
        flex-direction: column;
        gap: var(--space-5);
      }

      .ops-page__card > div,
      .ops-page__form-card > div {
        border: 1px solid var(--border) !important;
        border-radius: 20px !important;
        box-shadow: 0 2px 16px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.04) !important;
        overflow: hidden;
      }

      .ops-page__meta {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        padding: 6px 12px;
        border-radius: 999px;
        background: var(--primary-subtle);
        color: var(--primary);
        font-size: 12px;
        font-weight: 700;
        line-height: 1;
      }

      .ops-page__summary {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: var(--space-4);
      }

      .ops-page__stat {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: var(--space-4) var(--space-5);
        box-shadow: 0 2px 16px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.04);
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        min-width: 0;
        transition: box-shadow 180ms ease, transform 180ms ease;
      }

      .ops-page__stat:hover {
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(15, 23, 42, 0.04);
        transform: translateY(-1px);
      }

      .ops-page__stat-label {
        font-size: 11px;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .ops-page__stat-value {
        font-size: clamp(1.25rem, 2vw, 1.625rem);
        font-weight: 800;
        color: var(--text-primary);
        letter-spacing: -0.03em;
        line-height: 1.1;
      }

      .ops-page__filter {
        margin-bottom: var(--space-4);
      }

      .ops-page__filter .filter-bar-v3__label {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .ops-page__filter-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-2);
        margin-left: auto;
      }

      .ops-page__empty {
        border: 1px dashed var(--border);
        border-radius: 20px;
        background: var(--surface);
      }

      .ops-page__empty > div {
        min-height: 220px;
      }

      .ops-page__empty [aria-hidden] {
        background: var(--primary-subtle) !important;
        color: var(--primary) !important;
      }

      .ops-page .table-v3 thead th {
        background: var(--neutral-subtle);
      }

      .ops-page .table-v3 tbody tr:hover td {
        background: #F9FAFB;
      }

      .ops-page .table-v3 tbody td {
        padding: 11px 12px;
      }

      .ops-status span {
        font-weight: 600 !important;
        letter-spacing: 0.01em;
      }

      .ops-status--keluar span {
        background: #FEF3C7 !important;
        color: #B45309 !important;
      }

      .ops-status--kembali span {
        background: var(--primary-subtle) !important;
        color: var(--primary) !important;
      }

      .ops-status--menunggu span,
      .ops-status--pending span {
        background: #DBEAFE !important;
        color: #2563EB !important;
      }

      .ops-poin {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 36px;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        line-height: 1;
      }

      .ops-poin--low {
        background: var(--neutral-subtle);
        color: var(--text-secondary);
      }

      .ops-poin--mid {
        background: #FEF3C7;
        color: #B45309;
      }

      .ops-poin--high {
        background: #FEE2E2;
        color: #DC2626;
      }

      .ops-kelas-count {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 999px;
        background: var(--primary-subtle);
        color: var(--primary);
        font-size: 12px;
        font-weight: 700;
      }

      .ops-health span {
        font-weight: 600 !important;
        letter-spacing: 0.01em;
      }

      .ops-health--sehat span {
        background: var(--primary-subtle) !important;
        color: var(--primary) !important;
      }

      .ops-health--sakit span {
        background: #FEE2E2 !important;
        color: #DC2626 !important;
      }

      .ops-health--observasi span,
      .ops-health--istirahat span {
        background: #DBEAFE !important;
        color: #2563EB !important;
      }

      .ops-tamu--masuk span {
        background: var(--primary-subtle) !important;
        color: var(--primary) !important;
      }

      .ops-tamu--keluar span {
        background: var(--neutral-subtle) !important;
        color: var(--text-secondary) !important;
      }

      .ops-akademik-card > div {
        border: 1px solid var(--border) !important;
        border-radius: 20px !important;
        box-shadow: 0 2px 16px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.04) !important;
      }

      .ops-akademik-filter.filter-bar-v3 {
        margin-bottom: 0;
      }

      .ops-nilai-input {
        width: 72px;
        min-height: 36px;
        padding: 6px 8px;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        background: var(--surface);
        text-align: center;
        font-weight: 700;
        color: var(--text-primary);
        box-sizing: border-box;
      }

      .ops-nilai-input:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px var(--focus-ring);
      }

      .ops-hafalan-input {
        width: 100%;
        min-width: 80px;
        min-height: 36px;
        padding: 8px 10px;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        background: var(--surface);
        box-sizing: border-box;
        font-size: 13px;
      }

      .ops-hafalan-input:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px var(--focus-ring);
      }

      @media (max-width: 767px) {
        .ops-page__summary {
          grid-template-columns: 1fr;
        }

        .ops-page__filter-actions {
          width: 100%;
          margin-left: 0;
        }
      }
    `}</style>
  );
}

export function resolvePoinTone(poin) {
  const value = Number(poin) || 0;
  if (value >= 50) return "high";
  if (value >= 20) return "mid";
  return "low";
}

export function resolveStatusClass(status) {
  const key = String(status || "").trim().toLowerCase();
  if (key === "kembali") return "kembali";
  if (key === "keluar") return "keluar";
  if (key === "menunggu" || key === "pending") return "menunggu";
  return key.replace(/\s+/g, "-");
}

export function resolveHealthClass(status) {
  const key = String(status || "").trim().toLowerCase();
  if (key === "sakit") return "sakit";
  return "sehat";
}

export function resolveTamuStatusClass(status) {
  const key = String(status || "").trim().toLowerCase();
  if (key === "masuk") return "masuk";
  return "keluar";
}
