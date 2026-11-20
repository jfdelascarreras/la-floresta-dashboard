import { SectionBanner } from "@/app/components/layout/section-banner";
import { HaciendaView } from "@/app/components/modules/hacienda-view";
import { loadFarm } from "@/lib/data";
import { farmMetrics } from "@/lib/data/metrics";
import { formatNumber } from "@/lib/format";

export const metadata = { title: "Hacienda" };

export default async function HaciendaPage() {
  const data = await loadFarm();
  const metrics = farmMetrics(data);
  return (
    <div className="space-y-5">
      <SectionBanner
        title="Hacienda"
        subtitle={
          metrics.prenezPct == null
            ? "Sin tacto cargado"
            : `Preñez ${formatNumber(metrics.prenezPct, 0)}% en el último tacto`
        }
      />
      <HaciendaView data={data} />
    </div>
  );
}
