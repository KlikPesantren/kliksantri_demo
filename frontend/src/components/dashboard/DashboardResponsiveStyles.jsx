export function DashboardResponsiveStyles() {
  return (
    <style>{`
      .dashboard-page {
        min-width: 0;
        max-width: 100%;
      }

      .dashboard-monitoring-v3 {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .dashboard-role-v3 {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        min-width: 0;
        max-width: 100%;
      }

      .dashboard-row-full {
        min-width: 0;
      }

      .dashboard-monitor-grid {
        display: grid;
        gap: var(--space-3);
        grid-template-columns: repeat(3, minmax(0, 1fr));
        min-width: 0;
      }

      .dashboard-monitor-stat {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-top: var(--space-2);
      }

      .dashboard-monitor-stat__value {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--text-primary);
        line-height: 1.1;
      }

      .dashboard-monitor-stat__value--text {
        font-size: 1.125rem;
        line-height: 1.25;
        word-break: break-word;
      }

      .dashboard-monitor-stat__label {
        font-size: 11px;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .dashboard-monitor-meta {
        margin: var(--space-2) 0 0;
        font-size: 12px;
        color: var(--text-secondary);
        line-height: 1.4;
      }

      .dashboard-compact-list-main {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .dashboard-compact-list-sub {
        font-size: 11px;
        color: var(--text-muted);
        line-height: 1.35;
      }

      .dashboard-feed-badge {
        flex-shrink: 0;
      }

      .dashboard-section-title {
        margin-bottom: var(--space-2);
      }

      .dashboard-section-title h2 {
        margin: 0;
        font-size: 13px;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1.3;
      }

      .dashboard-section-title p {
        margin: 2px 0 0;
        font-size: 11px;
        color: var(--text-secondary);
        line-height: 1.35;
      }

      .dashboard-row-2 {
        display: grid;
        gap: var(--space-3);
        grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
        align-items: stretch;
      }

      .dashboard-panel {
        min-width: 0;
        height: 100%;
        box-sizing: border-box;
      }

      .dashboard-donut-layout {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        min-width: 0;
      }

      .dashboard-donut-center {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        text-align: center;
        padding: 0 8px;
      }

      .dashboard-donut-center__value {
        font-size: 1.125rem;
        font-weight: 800;
        color: var(--text-primary);
        line-height: 1.1;
      }

      .dashboard-donut-center__subtitle {
        font-size: 10px;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-top: 2px;
      }

      .dashboard-donut-legend {
        flex: 1;
        min-width: 0;
      }

      .dashboard-donut-legend-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 0;
        font-size: 12px;
        color: var(--text-primary);
      }

      .dashboard-donut-legend-label {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
      }

      .dashboard-donut-legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .dashboard-donut-legend-pct {
        font-weight: 700;
        color: var(--text-secondary);
        flex-shrink: 0;
      }

      .dashboard-violations-list {
        display: flex;
        flex-direction: column;
      }

      .dashboard-violation-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--space-2);
        padding: 5px 0;
        font-size: 12px;
      }

      .dashboard-violation-row--bordered {
        border-bottom: 1px solid var(--border);
      }

      .dashboard-violation-poin {
        font-weight: 700;
        color: var(--text-secondary);
        flex-shrink: 0;
        font-size: 11px;
      }

      .dashboard-empty-note {
        margin: 0;
        font-size: 12px;
        color: var(--text-muted);
      }

      .dashboard-pelanggar-name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 500;
        color: var(--text-primary);
      }

      .dashboard-cashflow-wrap {
        min-width: 0;
        max-height: 220px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .dashboard-cashflow-bars {
        display: flex;
        gap: 3px;
        align-items: flex-end;
        flex: 1;
        min-width: 0;
        min-height: 130px;
        max-height: 130px;
      }

      .dashboard-cashflow-month {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        min-width: 0;
        height: 100%;
        justify-content: flex-end;
      }

      .dashboard-cashflow-bar-group {
        display: flex;
        gap: 2px;
        align-items: flex-end;
        flex: 1;
        width: 100%;
        justify-content: center;
      }

      .dashboard-cashflow-bar {
        width: 8px;
        max-width: 40%;
        border-radius: 3px 3px 0 0;
      }

      .dashboard-cashflow-bar--in {
        background: var(--chart-positive);
      }

      .dashboard-cashflow-bar--out {
        background: var(--chart-negative);
      }

      .dashboard-cashflow-label {
        font-size: 9px;
        color: var(--text-muted);
        margin-top: 4px;
        line-height: 1;
      }

      .dashboard-cashflow-legend {
        display: flex;
        gap: var(--space-4);
        margin-top: var(--space-2);
        padding-top: var(--space-2);
        border-top: 1px solid var(--border);
      }

      .dashboard-cashflow-legend-item {
        font-size: 11px;
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .dashboard-cashflow-legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 2px;
      }

      .dashboard-cashflow-legend-dot--in {
        background: var(--chart-positive);
      }

      .dashboard-cashflow-legend-dot--out {
        background: var(--chart-negative);
      }

      @media (min-width: 768px) and (max-width: 1023px) {
        .dashboard-monitor-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (min-width: 1024px) {
        .dashboard-monitor-grid--rfid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
      }

      @media (max-width: 1024px) {
        .dashboard-row-2 {
          grid-template-columns: 1fr;
        }

        .dashboard-monitor-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 767px) {
        .dashboard-donut-layout {
          flex-direction: column;
          align-items: stretch;
        }

        .dashboard-donut-chart-ring {
          align-self: center;
        }

        .dashboard-pelanggar-name {
          white-space: normal;
          overflow: visible;
          text-overflow: unset;
          word-break: break-word;
        }

        .dashboard-cashflow-bars {
          gap: 2px;
        }
      }
    `}</style>
  );
}
