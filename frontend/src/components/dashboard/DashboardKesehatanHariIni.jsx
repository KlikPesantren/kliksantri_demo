import Card from "../ui/Card";
import SectionHeading from "../ui/SectionHeading";
import KpiCard from "../ui/KpiCard";
import KpiGrid from "../ui/KpiGrid";
import { formatNumber } from "../../utils/formatCurrency";

export default function DashboardKesehatanHariIni({ summary }) {
  const sehat = summary?.kesehatan_sehat ?? 0;
  const sakit = summary?.kesehatan_sakit ?? 0;
  const perlu = summary?.kesehatan_perlu_tindak_lanjut ?? 0;

  return (
    <Card padding="md" shadow="card" border={false} radius="xl" style={{ marginBottom: "var(--space-6)" }}>
      <SectionHeading variant="eyebrow" spacing="first">
        Kesehatan Hari Ini
      </SectionHeading>
      <KpiGrid>
        <KpiCard label="Sehat" value={formatNumber(sehat)} accent="success" />
        <KpiCard label="Sakit" value={formatNumber(sakit)} accent={sakit > 0 ? "danger" : "primary"} />
        <KpiCard
          label="Perlu Tindak Lanjut"
          value={formatNumber(perlu)}
          accent={perlu > 0 ? "warning" : "primary"}
        />
      </KpiGrid>
    </Card>
  );
}
