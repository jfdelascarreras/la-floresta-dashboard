import { SectionBanner } from "@/app/components/layout/section-banner";
import { AgroBoard } from "@/app/components/modules/agro-board";
import { SheetBadge } from "@/app/components/ui/badge";
import { loadFarm } from "@/lib/data";
import { farmMetrics } from "@/lib/data/metrics";
import { formatHa, formatNumber } from "@/lib/format";

export const metadata = { title: "Agro" };

export default async function AgroPage({
  searchParams,
}: {
  searchParams: Promise<{ lote?: string }>;
}) {
  const params = await searchParams;
  const data = await loadFarm();
  const metrics = farmMetrics(data);
  return (
    <div className="space-y-5">
      <SectionBanner
        title="Agro"
        subtitle={`${formatHa(metrics.hectareas)} con superficie · ${metrics.cultivos.map((row) => `${row.cultivo} ${formatNumber(row.hectareas, 0)} ha`).join(" · ")}`}
        aside={<SheetBadge source={data.source} />}
      />
      <AgroBoard data={data} focus={params.lote ?? ""} />
    </div>
  );
}
