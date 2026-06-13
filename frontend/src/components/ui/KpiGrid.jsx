function KpiGridStyles() {
  return (
    <style>{`
      .kpi-grid-v3 {
        display: grid;
        gap: var(--space-4);
        margin-bottom: var(--space-2);
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
      }

      @media (min-width: 1024px) {
        .kpi-grid-v3 {
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }
      }

      @media (min-width: 768px) and (max-width: 1023px) {
        .kpi-grid-v3 {
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
        }
      }

      @media (max-width: 767px) {
        .kpi-grid-v3 {
          grid-template-columns: minmax(0, 1fr);
        }
      }
    `}</style>
  );
}

function KpiGrid({ children, className = "" }) {
  return (
    <>
      <KpiGridStyles />
      <div className={`kpi-grid-v3${className ? ` ${className}` : ""}`}>
        {children}
      </div>
    </>
  );
}

export default KpiGrid;
