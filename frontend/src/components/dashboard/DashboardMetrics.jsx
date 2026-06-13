import KpiCard from "../ui/KpiCard";
import KpiGrid from "../ui/KpiGrid";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatNumber } from "../../utils/formatCurrency";

function DashboardMetrics({ summary }) {
  return (
    <KpiGrid>
      <KpiCard label="Total Santri" value={formatNumber(summary.total_santri)} accent="primary" />
      <KpiCard
        label="Santri Belum Kembali"
        value={formatNumber(summary.belum_kembali || 0)}
        accent={summary.belum_kembali > 0 ? "danger" : "primary"}
      />
      <KpiCard label="Saldo Buku Kas" value={formatCurrency(summary.saldo_kas)} accent="success" />
      <KpiCard
        label="Total Tunggakan"
        value={formatCurrency(summary.total_tunggakan)}
        accent={summary.total_tunggakan > 0 ? "danger" : "primary"}
      />
    </KpiGrid>
  );
}

export default DashboardMetrics;
