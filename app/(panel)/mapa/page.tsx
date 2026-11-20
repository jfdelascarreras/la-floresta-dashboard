import { MapFrame } from "@/app/components/map/map-frame";
import { loadFarm } from "@/lib/data";

export const metadata = { title: "Mapa" };

export default async function MapaPage() {
  const data = await loadFarm();
  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-4xl">Mapa de lotes</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Pasá el cursor para ver nombre, ID, hectáreas, cultivo, campaña, estado, última lluvia y última labor. El fondo es el plano 20LPH (8 oct 2026), en píxeles. Lote B (LOT-025) no tiene polígono. Mike e India comparten uno. El trazo de baja confianza va punteado.
        </p>
      </header>
      <MapFrame
        lotes={data.lotes}
        lluvias={data.lluvias}
        labores={data.labores}
        inspecciones={data.inspecciones}
        source={data.source}
        suelo={data.suelo}
      />
    </div>
  );
}
