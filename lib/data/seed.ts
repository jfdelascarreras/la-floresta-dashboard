import listas from "@/data/seed/listas.json";
import lotes from "@/data/seed/lotes.json";
import productos from "@/data/seed/productos.json";
import tiposLabor from "@/data/seed/tipos_labor.json";
import type { FarmData } from "@/lib/domain/types";

/** Sin Supabase: solo lo que sale de la hoja (lotes y catálogos). La actividad queda vacía. */
export function readSeed(): FarmData {
  return {
    source: "seed",
    asOf: "2026-11-10",
    lotes,
    productos,
    listas,
    tiposLabor,
    equipos: [],
    pedidos: [],
    pedidoItems: [],
    parteDiario: [],
    labores: [],
    insumos: [],
    inspecciones: [],
    cosecha: [],
    lluvias: [],
    pendientes: [],
    incidencias: [],
    recepciones: [],
    combustible: [],
    reportes: [],
    stock: [],
    suelo: [],
    tactos: [],
    pesadas: [],
    ventas: [],
    calendario: [],
    iatf: [],
    entore: [],
    potreros: [],
    nacimientos: [],
    muertes: [],
    haciendaPendientes: [],
  };
}
