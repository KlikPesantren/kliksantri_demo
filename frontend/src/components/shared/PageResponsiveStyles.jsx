export function KeuanganPageStyles() {
  return (
    <style>{`
      .keuangan-page {
        min-width: 0;
        max-width: 100%;
      }

      .legacy-page {
        min-width: 0;
        max-width: 100%;
      }

      .table-scroll-x {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        max-width: 100%;
        min-width: 0;
      }

      .table-scroll-x > table,
      .table-scroll-x > .table-scroll-v3 > .table-v3 {
        width: max-content;
        min-width: 100%;
      }

      .keuangan-filter-panel select,
      .keuangan-filter-panel input:not([type="radio"]):not([type="checkbox"]) {
        min-width: 0;
        flex: 1 1 140px;
        max-width: 100%;
      }

      .keuangan-form-controls input:not([type="radio"]):not([type="checkbox"]),
      .keuangan-form-controls select,
      .keuangan-form-controls textarea {
        max-width: 100%;
        box-sizing: border-box;
      }

      @media (max-width: 767px) {
        .keuangan-filter-panel select,
        .keuangan-filter-panel input:not([type="radio"]):not([type="checkbox"]) {
          flex: 1 1 100%;
        }

        .keuangan-form-controls input:not([type="radio"]):not([type="checkbox"]),
        .keuangan-form-controls select,
        .keuangan-form-controls textarea {
          width: 100%;
        }
      }

      .roles-perm-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 8px;
      }

      .legacy-form-grid input,
      .legacy-form-grid select,
      .legacy-form-grid textarea {
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
      }
    `}</style>
  );
}

/** @deprecated Use KeuanganPageStyles */
export const KeuanganResponsiveStyles = KeuanganPageStyles;

/** @deprecated Use KeuanganPageStyles — legacy scroll helpers merged into shared styles */
export const LegacyPageStyles = KeuanganPageStyles;
