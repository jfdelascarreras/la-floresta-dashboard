import { SectionBanner } from "@/app/components/layout/section-banner";
import { PendientesBoard } from "@/app/components/modules/pendientes-board";
import { conteoComentarios } from "@/app/pendientes/actions";
import { loadFarm } from "@/lib/data";
import { correoUsuario } from "@/lib/supabase/usuario";

export const metadata = { title: "Visual Pendientes" };

export default async function VisualPendientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const data = await loadFarm();
  const usuarioEmail = await correoUsuario();
  const conteos = await conteoComentarios();
  return (
    <div className="space-y-4">
      <SectionBanner title="Visual Pendientes" subtitle="Pendientes por fecha límite. La línea roja es hoy." />
      <PendientesBoard data={data} usuarioEmail={usuarioEmail} initialQuery={params.q ?? ""} conteos={conteos} modo="gantt" />
    </div>
  );
}
