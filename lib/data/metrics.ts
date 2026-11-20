import { estaHecho, tareasDe } from "@/lib/data/tareas";
import type { FarmData, Labor, Lluvia, Pedido, Pendiente, Stock } from "@/lib/domain/types";

const CLOSED = new Set(["hecho", "cerrada", "cerrado", "resuelta", "resuelto", "cancelado", "recibido"]);

export type CultivoHa = { cultivo: string; hectareas: number; lotes: number };

export type AreaUrgencia = { area: string; counts: { urgencia: string; n: number }[] };

export type FarmMetrics = {
  hectareas: number;
  lotes: number;
  sinSuperficie: { id: string; nombre: string }[];
  cultivos: CultivoHa[];
  lluviaMes: number | null;
  lluviaMesEtiqueta: string;
  lluviaCampana: number | null;
  lluviaEsGeneral: boolean;
  ultimoLluvia: { fecha: string; mm: number | null; acumulado: number | null; pluviometro: string | null } | null;
  sumaRegistros: number | null;
  laboresEnCurso: number;
  pendientesAbiertos: number;
  incidenciasAbiertas: number;
  pedidosAbiertos: number;
  pedidosDiasPromedio: number | null;
  pedidoMasViejoDias: number | null;
  stockVencido: number;
  stockPorVencer: number;
  prenezPct: number | null;
  prenezNumerador: number;
  prenezDenominador: number;
  prenezFecha: string | null;
  cabezasVendidas: number;
  ventasUsd: number;
  ventasUsdConDato: number;
  ventasTotal: number;
  ventasBs: number;
  pendientesPorArea: AreaUrgencia[];
  lluviaPorDia: { fecha: string; mm: number }[];
};

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export function isClosed(estado: string | null | undefined): boolean {
  return CLOSED.has((estado ?? "").trim().toLowerCase());
}

export function isOpen(estado: string | null | undefined): boolean {
  return !isClosed(estado);
}

export function daysBetween(from: string | null | undefined, to: string): number | null {
  if (!from) return null;
  const start = Date.parse(`${from.slice(0, 10)}T00:00:00Z`);
  const end = Date.parse(`${to.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return Math.round((end - start) / 86_400_000);
}

export function addDays(iso: string, days: number): string {
  const time = Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) + days * 86_400_000;
  return new Date(time).toISOString().slice(0, 10);
}

export function stockEstado(row: Stock, asOf: string): "vencido" | "por-vencer" | "ok" | "sin-fecha" {
  if (!row.vencimiento) return "sin-fecha";
  const date = row.vencimiento.slice(0, 10);
  if (date < asOf) return "vencido";
  if (date <= addDays(asOf, 60)) return "por-vencer";
  return "ok";
}

/** Aluminio de saturación notable en estos análisis, y fósforo resina bajo el umbral de 10 mg/dm³. */
export function sueloFlags(row: { sat_al_pct: number | null; p_resina_mg_dm3: number | null }): {
  alAlto: boolean;
  pBajo: boolean;
} {
  return {
    alAlto: (row.sat_al_pct ?? 0) >= 5,
    pBajo: row.p_resina_mg_dm3 != null && row.p_resina_mg_dm3 < 10,
  };
}

export function sueloDeLote(data: FarmData, idLote: string) {
  return data.suelo.filter((row) =>
    (row.ids_lotes ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .includes(idLote),
  );
}

function sumMm(rows: { milimetros: number | null }[]): number | null {
  let total = 0;
  let any = false;
  for (const row of rows) {
    if (row.milimetros == null) continue;
    total += row.milimetros;
    any = true;
  }
  return any ? total : null;
}

function campaignStart(asOf: string): string {
  const year = Number(asOf.slice(0, 4));
  const month = Number(asOf.slice(5, 7));
  const startYear = month >= 9 ? year : year - 1;
  return `${startYear}-09-01`;
}

function rainBasis(lluvias: Lluvia[]): { rows: Lluvia[]; general: boolean } {
  const general = lluvias.filter((row) => !row.id_lote);
  if (general.length > 0) return { rows: general, general: true };
  return { rows: lluvias, general: false };
}

export function farmMetrics(data: FarmData): FarmMetrics {
  const asOf = data.asOf;
  const hectareas = data.lotes.reduce((total, lote) => total + (lote.superficie_ha ?? 0), 0);
  const byCultivo = new Map<string, CultivoHa>();
  for (const lote of data.lotes) {
    const cultivo = lote.cultivo_actual || "Sin cultivo";
    const current = byCultivo.get(cultivo) ?? { cultivo, hectareas: 0, lotes: 0 };
    current.hectareas += lote.superficie_ha ?? 0;
    current.lotes += 1;
    byCultivo.set(cultivo, current);
  }

  const basis = rainBasis(data.lluvias);
  const monthKey = asOf.slice(0, 7);
  const month = basis.rows.filter((row) => (row.fecha ?? "").startsWith(monthKey));
  const campaign = basis.rows.filter((row) => (row.fecha ?? "") >= campaignStart(asOf));
  const ultimo = [...basis.rows].sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? ""))[0];
  const monthIndex = Number(asOf.slice(5, 7)) - 1;
  const byDay = new Map<string, number>();
  for (const row of basis.rows) {
    if (!row.fecha || row.milimetros == null) continue;
    byDay.set(row.fecha, (byDay.get(row.fecha) ?? 0) + row.milimetros);
  }

  const openPendientes = tareasDe(data).filter((row) => !estaHecho(row.estado));
  const areas = new Map<string, Map<string, number>>();
  for (const row of openPendientes) {
    const area = row.area || "Sin área";
    const urgencia = row.urgencia || "Sin urgencia";
    const bucket = areas.get(area) ?? new Map<string, number>();
    bucket.set(urgencia, (bucket.get(urgencia) ?? 0) + 1);
    areas.set(area, bucket);
  }

  const abiertos = data.pedidos.filter((row) => isOpen(row.estado));
  const dias = abiertos
    .map((row) => daysBetween(row.fecha, asOf))
    .filter((value): value is number => value != null);
  const preñadas = data.tactos.filter((row) => (row.resultado ?? "").toLowerCase().startsWith("preñ"));
  const fechasTacto = data.tactos.map((row) => row.fecha).filter((fecha): fecha is string => Boolean(fecha));
  const usdConDato = data.ventas.filter((row) => row.total_usd != null);

  return {
    hectareas,
    lotes: data.lotes.length,
    sinSuperficie: data.lotes
      .filter((lote) => lote.superficie_ha == null)
      .map((lote) => ({ id: lote.id_lote, nombre: lote.nombre_lote ?? lote.id_lote })),
    cultivos: [...byCultivo.values()].sort((a, b) => b.hectareas - a.hectareas),
    lluviaMes: sumMm(month),
    lluviaMesEtiqueta: MONTHS[monthIndex] ?? monthKey,
    lluviaCampana: sumMm(campaign),
    lluviaEsGeneral: basis.general,
    ultimoLluvia: ultimo?.fecha
      ? {
          fecha: ultimo.fecha,
          mm: ultimo.milimetros,
          acumulado: ultimo.acumulado_mes,
          pluviometro: ultimo.pluviometro,
        }
      : null,
    sumaRegistros: sumMm(basis.rows),
    laboresEnCurso: data.labores.filter((row) => (row.estado ?? "").toLowerCase() === "en curso").length,
    pendientesAbiertos: openPendientes.length,
    incidenciasAbiertas: data.incidencias.filter((row) => isOpen(row.estado)).length,
    pedidosAbiertos: abiertos.length,
    pedidosDiasPromedio: dias.length ? Math.round(dias.reduce((total, value) => total + value, 0) / dias.length) : null,
    pedidoMasViejoDias: dias.length ? Math.max(...dias) : null,
    stockVencido: data.stock.filter((row) => stockEstado(row, asOf) === "vencido").length,
    stockPorVencer: data.stock.filter((row) => stockEstado(row, asOf) === "por-vencer").length,
    prenezPct: data.tactos.length ? (preñadas.length / data.tactos.length) * 100 : null,
    prenezNumerador: preñadas.length,
    prenezDenominador: data.tactos.length,
    prenezFecha: fechasTacto.sort().at(-1) ?? null,
    cabezasVendidas: data.ventas.reduce((total, row) => total + (row.cabezas ?? 0), 0),
    ventasUsd: usdConDato.reduce((total, row) => total + (row.total_usd ?? 0), 0),
    ventasUsdConDato: usdConDato.length,
    ventasTotal: data.ventas.length,
    ventasBs: data.ventas.reduce((total, row) => total + (row.total_bs ?? 0), 0),
    pendientesPorArea: [...areas.entries()]
      .map(([area, counts]) => ({
        area,
        counts: [...counts.entries()]
          .map(([urgencia, n]) => ({ urgencia, n }))
          .sort((a, b) => b.n - a.n),
      }))
      .sort((a, b) => sumCounts(b) - sumCounts(a)),
    lluviaPorDia: [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, mm]) => ({ fecha: fecha.slice(5), mm })),
  };
}

function sumCounts(row: AreaUrgencia): number {
  return row.counts.reduce((total, item) => total + item.n, 0);
}

export function nombrePorLote(data: FarmData): Map<string, string> {
  return new Map(data.lotes.map((lote) => [lote.id_lote, lote.nombre_lote ?? lote.id_lote]));
}

export function ultimaLabor(labores: Labor[], idLote: string): Labor | undefined {
  return labores
    .filter((row) => row.id_lote === idLote)
    .sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? ""))[0];
}

export function ultimaLluvia(lluvias: Lluvia[], idLote: string): Lluvia | undefined {
  return lluvias
    .filter((row) => row.id_lote === idLote)
    .sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? ""))[0];
}

export function pedidosAbiertos(pedidos: Pedido[]): Pedido[] {
  return pedidos
    .filter((row) => isOpen(row.estado))
    .sort((a, b) => (a.fecha ?? "").localeCompare(b.fecha ?? ""));
}

export function pendientesAbiertos(pendientes: Pendiente[]): Pendiente[] {
  return pendientes.filter((row) => isOpen(row.estado));
}

