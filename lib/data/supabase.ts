import type { SupabaseClient } from "@supabase/supabase-js";

import { asInt, coerceNumbers } from "@/lib/data/coerce";
import type {
  Combustible,
  Cosecha,
  Equipo,
  FarmData,
  HaciendaCalendario,
  HaciendaEntore,
  HaciendaIatf,
  HaciendaMuerte,
  HaciendaNacimiento,
  HaciendaPendiente,
  HaciendaPesada,
  HaciendaPotrero,
  HaciendaTacto,
  HaciendaVenta,
  Incidencia,
  Inspeccion,
  Insumo,
  Labor,
  Lista,
  Lluvia,
  Lote,
  ParteDiario,
  Pedido,
  PedidoItem,
  Pendiente,
  Producto,
  Recepcion,
  ReporteLibre,
  Stock,
  Suelo,
  TipoLabor,
} from "@/lib/domain/types";
import { createClient } from "@/lib/supabase/server";

const PAGE = 1000;

function todayInLaPaz(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/La_Paz",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Pages past PostgREST's default 1000-row cap. Ordered so pages do not skip rows. */
async function readAll<T>(supabase: SupabaseClient, table: string, orderBy: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order(orderBy, { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`No se pudo leer ${table}: ${error.message}`);
    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < PAGE) break;
  }
  return rows;
}

export async function readSupabase(): Promise<FarmData> {
  const supabase = await createClient();
  const [
    lotes,
    productos,
    listas,
    tiposLabor,
    equipos,
    pedidos,
    pedidoItems,
    parteDiario,
    labores,
    insumos,
    inspecciones,
    cosecha,
    lluvias,
    pendientes,
    incidencias,
    recepciones,
    combustible,
    reportes,
    stock,
    suelo,
    tactos,
    pesadas,
    ventas,
    calendario,
    iatf,
    entore,
    potreros,
    nacimientos,
    muertes,
    haciendaPendientes,
  ] = await Promise.all([
    readAll<Lote>(supabase, "lotes", "id_lote"),
    readAll<Producto>(supabase, "productos", "id_producto"),
    readAll<Lista>(supabase, "listas", "id_lista"),
    readAll<TipoLabor>(supabase, "tipos_labor", "id_tipo_labor"),
    readAll<Equipo>(supabase, "equipos", "id_equipo"),
    readAll<Pedido>(supabase, "pedidos", "id_pedido"),
    readAll<PedidoItem>(supabase, "pedido_items", "id_item"),
    readAll<ParteDiario>(supabase, "parte_diario", "id_parte"),
    readAll<Labor>(supabase, "labores", "id_labor"),
    readAll<Insumo>(supabase, "insumos", "id_insumo_aplicado"),
    readAll<Inspeccion>(supabase, "inspecciones", "id_inspeccion"),
    readAll<Cosecha>(supabase, "cosecha", "id_cosecha"),
    readAll<Lluvia>(supabase, "lluvias", "id_lluvia"),
    readAll<Pendiente>(supabase, "pendientes", "id_pendiente"),
    readAll<Incidencia>(supabase, "incidencias", "id_incidencia"),
    readAll<Recepcion>(supabase, "recepciones", "id_recepcion"),
    readAll<Combustible>(supabase, "combustible", "id_combustible"),
    readAll<ReporteLibre>(supabase, "reporte_libre", "id_reporte"),
    readAll<Stock>(supabase, "stock", "id_stock"),
    readAll<Suelo>(supabase, "suelo", "id_suelo"),
    readAll<HaciendaTacto>(supabase, "hacienda_tacto", "id_tacto"),
    readAll<HaciendaPesada>(supabase, "hacienda_pesadas", "id_pesada"),
    readAll<HaciendaVenta>(supabase, "hacienda_ventas", "id_venta"),
    readAll<HaciendaCalendario>(supabase, "hacienda_calendario_sanitario", "id_cal"),
    readAll<HaciendaIatf>(supabase, "hacienda_iatf", "id_iatf"),
    readAll<HaciendaEntore>(supabase, "hacienda_entore", "id_entore"),
    readAll<HaciendaPotrero>(supabase, "hacienda_potreros", "id_potrero"),
    readAll<HaciendaNacimiento>(supabase, "hacienda_nacimientos", "id_nacimientos"),
    readAll<HaciendaMuerte>(supabase, "hacienda_muertes", "id_muerte"),
    readAll<HaciendaPendiente>(supabase, "hacienda_pendientes", "id_pendiente"),
  ]);

  return {
    source: "supabase",
    asOf: todayInLaPaz(),
    lotes: lotes.map((row) => coerceNumbers(row, ["superficie_ha"])),
    productos,
    listas,
    tiposLabor,
    equipos: equipos.map((row) => ({
      ...coerceNumbers(row, ["horometro", "costo_hora_bs"]),
      anio: asInt(row.anio),
    })),
    pedidos: pedidos.sort((a, b) => (a.fecha ?? "").localeCompare(b.fecha ?? "")),
    pedidoItems: pedidoItems.map((row) => coerceNumbers(row, ["cantidad"])),
    parteDiario,
    labores: labores.map((row) => coerceNumbers(row, ["hectareas", "horas", "litros_gasoil"])),
    insumos: insumos.map((row) => coerceNumbers(row, ["cantidad_total"])),
    inspecciones,
    cosecha: cosecha.map((row) =>
      coerceNumbers(row, ["hectareas_cosechadas", "kg_totales", "humedad_pct", "toneladas_viaje"]),
    ),
    lluvias: lluvias
      .map((row) => coerceNumbers(row, ["milimetros", "acumulado_mes"]))
      .sort((a, b) => (a.fecha ?? "").localeCompare(b.fecha ?? "")),
    pendientes: pendientes.sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? "")),
    incidencias: incidencias.map((row) => coerceNumbers(row, ["costo_bs"])),
    recepciones: recepciones.map((row) => coerceNumbers(row, ["cantidad", "precio_unit_bs"])),
    combustible: combustible.map((row) => coerceNumbers(row, ["litros", "saldo_tanque_lts", "horometro"])),
    reportes,
    stock: stock
      .map((row) => coerceNumbers(row, ["saldo"]))
      .sort((a, b) => (a.vencimiento ?? "9999").localeCompare(b.vencimiento ?? "9999")),
    suelo: suelo.map((row) =>
      coerceNumbers(row, [
        "ph_cacl2",
        "ph_h2o",
        "mo_pct",
        "n_disp_mg_kg",
        "k_mg_dm3",
        "ca_cmolc",
        "mg_cmolc",
        "p_resina_mg_dm3",
        "al_cmolc",
        "cice_cmolc",
        "sat_bases_pct",
        "s_mg_dm3",
        "sat_al_pct",
      ]),
    ),
    tactos: tactos.map((row) => coerceNumbers(row, ["meses_prenez"])),
    pesadas: pesadas.map((row) => coerceNumbers(row, ["peso_kg"])),
    ventas: ventas.map((row) =>
      coerceNumbers(row, [
        "cabezas",
        "kilos_totales",
        "kg_promedio",
        "precio_bs_kg",
        "total_bs",
        "tc_bcb",
        "total_usd",
        "valor_flujo_usd",
      ]),
    ),
    calendario,
    iatf: iatf.map((row) => coerceNumbers(row, ["nro_lista"])),
    entore: entore.map((row) => coerceNumbers(row, ["vacas_vaquillas", "toros", "vacas_por_toro"])),
    potreros,
    nacimientos: nacimientos.map((row) =>
      coerceNumbers(row, [
        "nacidos",
        "machos",
        "hembras",
        "brangus_criollo",
        "nelore_brangus",
        "brangus_puro",
        "brangus_pardo",
        "muertos",
        "vivos",
      ]),
    ),
    muertes,
    haciendaPendientes: haciendaPendientes.map((row) => coerceNumbers(row, ["cantidad"])),
  };
}
