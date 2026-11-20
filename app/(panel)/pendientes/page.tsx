import { SectionBanner } from "@/app/components/layout/section-banner";
import { PendientesBoard } from "@/app/components/modules/pendientes-board";
import { conteoComentarios } from "@/app/pendientes/actions";
import { loadFarm } from "@/lib/data";
import { correoUsuario } from "@/lib/supabase/usuario";
import { estaHecho, tareasDe } from "@/lib/data/tareas";

export const metadata = { title: "Pendientes" };

export default async function PendientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const data = await loadFarm();
  const usuarioEmail = await correoUsuario();
  const conteos = await conteoComentarios();
  const abiertos = tareasDe(data).filter((tarea) => !estaHecho(tarea.estado)).length;
  return (
    <div className="space-y-4">
      <SectionBanner title="Pendientes" subtitle={`${abiertos} abiertos entre campo y hacienda`} />
      <PendientesBoard data={data} usuarioEmail={usuarioEmail} initialQuery={params.q ?? ""} conteos={conteos} />
    </div>
  );
}
