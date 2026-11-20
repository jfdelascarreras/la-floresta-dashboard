import Link from "next/link";

import { CultivoChart, LluviaChart, PendientesChart } from "@/app/components/dashboard/charts";
import { ReportesGrupo } from "@/app/components/modules/reportes-grupo";
import { MapFrame } from "@/app/components/map/map-frame";
import { SheetBadge } from "@/app/components/ui/badge";
import { Card, CardHeader } from "@/app/components/ui/card";
import { loadFarm } from "@/lib/data";
import { farmMetrics, nombrePorLote } from "@/lib/data/metrics";
import { nombreArea } from "@/lib/data/tareas";
import { formatBs, formatDate, formatHa, formatMm, formatNumber } from "@/lib/format";

export const metadata = { title: "Tablero" };

export default async function DashboardPage() {
  const data = await loadFarm();
  const metrics = farmMetrics(data);
  const nombres = nombrePorLote(data);
  const enCurso = data.labores.filter((labor) => (labor.estado ?? "").toLowerCase() === "en curso");
  const urgentes = data.pendientes.filter((row) => {
    const estado = (row.estado ?? "").toLowerCase();
    const urgencia = (row.urgencia ?? "").toLowerCase();
    const abierto = !["hecho", "recibido", "cerrado", "cerrada", "cancelado"].includes(estado);
    return abierto && (urgencia === "alta" || urgencia === "urgente");
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Actualización prevista a las 07:00 y a las 19:00</p>
          <h1 className="font-display text-4xl text-ink md:text-5xl">Tablero</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            {"Datos de la finca. Si una tabla está vacía, todavía no se cargó."}
          </p>
        </div>
        <SheetBadge source={data.source} />
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Superficie con dato" value={formatHa(metrics.hectareas)} detail={`${formatNumber(metrics.lotes)} lotes`} />
        {metrics.cultivos.map((row) => (
          <Kpi
            key={row.cultivo}
            label={row.cultivo}
            value={formatHa(row.hectareas)}
            detail={`${formatNumber(row.lotes)} lotes`}
          />
        ))}
        <Kpi
          label="Sin superficie"
          value={formatNumber(metrics.sinSuperficie.length)}
          detail={metrics.sinSuperficie.map((lote) => lote.nombre).join(", ") || "Ninguno"}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label={`Lluvia de ${metrics.lluviaMesEtiqueta}`}
          value={formatMm(metrics.lluviaMes)}
          detail={
            metrics.ultimoLluvia
              ? `Último registro ${formatDate(metrics.ultimoLluvia.fecha)}: ${formatMm(metrics.ultimoLluvia.mm)}${metrics.ultimoLluvia.acumulado != null ? ` · acumulado de planilla ${formatMm(metrics.ultimoLluvia.acumulado)}` : ""}`
              : "Sin registros"
          }
         
        />
        <Kpi
          label="Lluvia de campaña"
          value={formatMm(metrics.lluviaCampana)}
          detail={
            metrics.lluviaCampana == null
              ? "Sin registros desde el 1 sep"
              : metrics.lluviaEsGeneral
                ? "Pluviómetro general, desde el 1 sep"
                : "Suma de registros desde el 1 sep"
          }
         
        />
        <Kpi
          label="Pendientes abiertos"
          value={formatNumber(metrics.pendientesAbiertos)}
          detail="Estado distinto de recibido o hecho"
         
        />
        <Kpi
          label="Pedidos abiertos"
          value={formatNumber(metrics.pedidosAbiertos)}
          detail={
            metrics.pedidosDiasPromedio == null
              ? "Sin pedidos abiertos"
              : `Promedio ${formatNumber(metrics.pedidosDiasPromedio)} días · el más viejo ${formatNumber(metrics.pedidoMasViejoDias)}`
          }
         
        />
        <Kpi
          label="Stock a mirar"
          value={formatNumber(metrics.stockVencido + metrics.stockPorVencer)}
          detail={`${formatNumber(metrics.stockVencido)} vencidos · ${formatNumber(metrics.stockPorVencer)} en 60 días`}
         
        />
        <Kpi
          label="Preñez"
          value={metrics.prenezPct == null ? "—" : `${formatNumber(metrics.prenezPct, 0)}%`}
          detail={
            metrics.prenezDenominador
              ? `${formatNumber(metrics.prenezNumerador)} de ${formatNumber(metrics.prenezDenominador)} · ${formatDate(metrics.prenezFecha)}`
              : "Sin tacto cargado"
          }
         
        />
        <Kpi
          label="Ventas"
          value={`${formatNumber(metrics.cabezasVendidas)} cab.`}
          detail={
            metrics.ventasTotal
              ? `${formatBs(metrics.ventasBs)} · USD ${formatNumber(metrics.ventasUsd, 0)} en ${formatNumber(metrics.ventasUsdConDato)} de ${formatNumber(metrics.ventasTotal)}`
              : "Sin ventas cargadas"
          }
         
        />
        <Kpi label="Productos" value={formatNumber(data.productos.length)} detail="Catálogo de insumos" />
      </section>

      <ReportesGrupo />

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Hectáreas por cultivo" eyebrow={<SheetBadge source={data.source} />} />
          <CultivoChart rows={metrics.cultivos} />
        </Card>
        <Card>
          <CardHeader
            title="Lluvia"
            eyebrow={<SheetBadge source={data.source} />}
          />
          <LluviaChart rows={metrics.lluviaPorDia} />
        </Card>
        <Card>
          <CardHeader
            title="Pendientes por área"
            eyebrow={<SheetBadge source={data.source} />}
          />
          <PendientesChart rows={metrics.pendientesPorArea} />
        </Card>
      </section>

      <Card className="overflow-hidden">
        <CardHeader
          title="Mapa de lotes"
          eyebrow={<SheetBadge source={data.source} />}
          action={
            <Link className="text-sm font-semibold text-forest" href="/mapa">
              Abrir mapa
            </Link>
          }
        />
        <p className="px-4 pb-3 text-sm text-muted md:px-5">
          Plano 20LPH del 8 oct 2026. Superficie, cultivo y campaña del hover salen de la hoja. El lote B no tiene polígono y Mike e India comparten uno.
        </p>
        <div className="px-3 pb-3 md:px-4">
          <MapFrame
            lotes={data.lotes}
            lluvias={data.lluvias}
            labores={data.labores}
            inspecciones={data.inspecciones}
            source={data.source}
            suelo={data.suelo}
            compact
          />
        </div>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Labores en curso"
            eyebrow={undefined}
          />
          <ul className="divide-y divide-line px-2 py-2">
            {enCurso.length === 0 ? <Empty /> : null}
            {enCurso.map((labor) => (
              <li key={labor.id_labor} className="px-3 py-3 text-sm">
                <p className="font-semibold">
                  {labor.tipo_labor} · {nombres.get(labor.id_lote ?? "") ?? labor.id_lote}
                </p>
                <p className="text-muted">
                  {formatDate(labor.fecha)} · {formatHa(labor.hectareas)} · {labor.maquina ?? "Sin máquina"}
                </p>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader
            title="Pendientes urgentes"
            eyebrow={undefined}
          />
          <ul className="divide-y divide-line px-2 py-2">
            {urgentes.length === 0 ? <Empty /> : null}
            {urgentes.map((row) => (
              <li key={row.id_pendiente} className="px-3 py-3 text-sm">
                <p className="font-semibold">{row.tarea}</p>
                <p className="text-muted">
                  {nombreArea(row.area)} · límite {formatDate(row.fecha_limite)}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-2xl border border-line bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      </div>
      <p className="mt-2 font-display text-3xl text-ink">{value}</p>
      <p className="mt-1 text-sm text-muted">{detail}</p>
    </article>
  );
}

function Empty() {
  return <li className="px-3 py-6 text-sm text-muted">Sin registros.</li>;
}
