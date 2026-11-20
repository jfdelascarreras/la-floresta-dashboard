import type { FarmData } from "@/lib/domain/types";

export type TablaPendiente = "pendientes" | "hacienda_pendientes";

export const AREAS = ["Agricultura", "Hacienda", "General", "Maquinaria"] as const;
export const TIPOS = ["Campo", "Compras", "Infraestructura", "General"] as const;
export const FUENTES = ["WhatsApp", "Google Sheets"] as const;
export type Fuente = (typeof FUENTES)[number];

export function sinAcento(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function nombreArea(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  if (sinAcento(raw).includes("ganader")) return "Hacienda";
  return raw;
}

export function areaCanon(value: string | null | undefined): string {
  const key = sinAcento(value ?? "");
  if (!key) return "General";
  if (key.includes("ganader") || key.includes("hacienda")) return "Hacienda";
  if (key.includes("maquin") || key.includes("vehicul") || key.includes("repar")) return "Maquinaria";
  if (key === "agro" || key.includes("agricultur") || key.includes("siembra")) return "Agricultura";
  return "General";
}

export function tipoCanon(value: string | null | undefined): string | null {
  const key = sinAcento(value ?? "");
  if (!key) return null;
  if (key.includes("contact")) return null;
  if (key.includes("compr") || key.includes("pedido") || key.includes("recep") || key.includes("insumo")) return "Compras";
  if (key.includes("maquin") || key.includes("repar") || key.includes("vehicul") || key.includes("tractor") || key.includes("sembrador")) return null;
  if (key.includes("infra") || key.includes("energ") || key.includes("solar") || key.includes("protocol") || key.includes("administr") || key.includes("inventario")) return "Infraestructura";
  if (key.includes("labor") || key.includes("siembra") || key.includes("fumig") || key.includes("agricultur") || key.includes("agro") || key.includes("cultivo")) return "Campo";
  return "General";
}

export function esContacto(id: string, tipo: string | null | undefined): boolean {
  if (/^pen-3-/i.test(id)) return true;
  return sinAcento(tipo ?? "").includes("contact");
}

export function origenDe(id: string, fuente: string | null | undefined): Fuente {
  const key = sinAcento(fuente ?? "");
  if (key.includes("whatsapp") || key === "wa" || key === "wpp") return "WhatsApp";
  if (key.includes("google") || key.includes("sheet") || key.includes("hoja")) return "Google Sheets";
  if (/^pen-[23]-/.test(id.toLowerCase())) return "WhatsApp";
  return "Google Sheets";
}

export function coincideBusqueda(tarea: Pick<Tarea, "titulo" | "detalle" | "responsable" | "pedidoPor" | "tipo" | "codigo" | "id" | "fuente">, q: string): boolean {
  const terms = sinAcento(q).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const texto = sinAcento(
    [tarea.titulo, tarea.detalle, tarea.responsable, tarea.pedidoPor, tarea.tipo, tarea.codigo, tarea.id, tarea.fuente]
      .filter((part): part is string => Boolean(part))
      .join(" "),
  );
  return terms.every((term) => texto.includes(term));
}

export type Tarea = {
  key: string;
  tabla: TablaPendiente;
  id: string;
  area: string;
  titulo: string;
  detalle: string | null;
  responsable: string | null;
  pedidoPor: string | null;
  tipo: string | null;
  codigo: string | null;
  urgencia: string | null;
  fecha: string | null;
  fechaLimite: string | null;
  estado: string | null;
  fechaHecho: string | null;
  cerradoPor: string | null;
  cambioWebAt: string | null;
  verificadoPor: string | null;
  fechaVerificado: string | null;
  fuente: Fuente;
};

export function estaVerificado(tarea: { verificadoPor: string | null; fechaVerificado: string | null }): boolean {
  return Boolean(tarea.verificadoPor || tarea.fechaVerificado);
}

export function estaHecho(estado: string | null | undefined): boolean {
  return (estado ?? "").trim().toLowerCase() === "hecho";
}

function urgente(value: string | null): boolean {
  const text = (value ?? "").toLowerCase();
  return text === "urgente" || text === "alta";
}

export function tareasDe(data: FarmData): Tarea[] {
  const agro: Tarea[] = data.pendientes.filter((row) => !esContacto(row.id_pendiente, row.tipo)).map((row) => ({
    key: `pendientes:${row.id_pendiente}`,
    tabla: "pendientes",
    id: row.id_pendiente,
    area: areaCanon(row.area),
    titulo: row.tarea || "Sin tarea",
    detalle: row.observaciones,
    responsable: row.responsable,
    pedidoPor: row.pedido_por,
    tipo: tipoCanon(row.tipo),
    codigo: null,
    urgencia: row.urgencia,
    fecha: row.fecha,
    fechaLimite: row.fecha_limite,
    estado: row.estado,
    fechaHecho: row.fecha_hecho,
    cerradoPor: row.cerrado_por ?? null,
    cambioWebAt: row.cambio_web_at ?? null,
    verificadoPor: row.verificado_por ?? null,
    fechaVerificado: row.fecha_verificado ?? null,
    fuente: origenDe(row.id_pendiente, row.fuente),
  }));
  const campo: Tarea[] = data.haciendaPendientes.filter((row) => !esContacto(row.id_pendiente, row.tipo)).map((row) => ({
    key: `hacienda_pendientes:${row.id_pendiente}`,
    tabla: "hacienda_pendientes",
    id: row.id_pendiente,
    area: "Hacienda",
    titulo: row.item || "Sin tarea",
    detalle: [row.cantidad != null ? `${row.cantidad} ${row.unidad ?? ""}`.trim() : null, row.notas]
      .filter(Boolean)
      .join(" · ") || null,
    responsable: row.responsable,
    pedidoPor: row.pedido_por,
    tipo: tipoCanon(row.tipo),
    codigo: row.codigo,
    urgencia: row.urgencia,
    fecha: row.fecha_pedido,
    // Ganadería no tiene fecha límite: la fecha de la planilla es la del pedido.
    fechaLimite: null,
    estado: row.estado,
    fechaHecho: row.fecha_hecho,
    cerradoPor: row.cerrado_por ?? null,
    cambioWebAt: row.cambio_web_at ?? null,
    verificadoPor: row.verificado_por ?? null,
    fechaVerificado: row.fecha_verificado ?? null,
    fuente: origenDe(row.id_pendiente, row.fuente),
  }));
  return [...agro, ...campo].sort(compararTareas);
}

function compararTareas(a: Tarea, b: Tarea): number {
  const urgencia = Number(urgente(b.urgencia)) - Number(urgente(a.urgencia));
  if (urgencia !== 0) return urgencia;
  const fechaA = a.fechaLimite ?? a.fecha ?? "9999-12-31";
  const fechaB = b.fechaLimite ?? b.fecha ?? "9999-12-31";
  return fechaA.localeCompare(fechaB);
}

export function chipsDeArea(_tareas: Tarea[], conteo: Tarea[]): { area: string; n: number }[] {
  const counts = new Map<string, number>();
  for (const tarea of conteo) counts.set(tarea.area, (counts.get(tarea.area) ?? 0) + 1);
  return AREAS.map((area) => ({ area, n: counts.get(area) ?? 0 }));
}
