"use client";

import { estaHecho, estaVerificado, TIPOS, type Tarea } from "@/lib/data/tareas";
import { formatDate } from "@/lib/format";

const DAY = 48;
const OTRAS = "Otras";

const COLORES: Record<string, { fill: string; tinta: string }> = {
  Campo: { fill: "#1e4d3a", tinta: "#e7f4ee" },
  Compras: { fill: "#b8860b", tinta: "#f8e7c0" },
  Infraestructura: { fill: "#1d3d66", tinta: "#e7eef6" },
  General: { fill: "#7a4b12", tinta: "#f4e3c3" },
  Otras: { fill: "#6d645b", tinta: "#f3efe6" },
};

export function PendientesGantt({
  tareas,
  seleccion,
  onSelect,
}: {
  tareas: Tarea[];
  seleccion: string | null;
  onSelect: (key: string) => void;
}) {
  const filas = filasDe(tareas);
  const fechadas = tareas.filter((tarea) => diaDe(tarea));
  const sinFecha = tareas.filter((tarea) => !diaDe(tarea));
  const eje = ejeDe(fechadas.map((tarea) => diaDe(tarea)!), sinFecha.length > 0);
  const hoy = hoyEnBolivia();
  const hoyX = hoy && eje.desde && eje.hasta && hoy >= eje.desde && hoy <= eje.hasta ? xDe(hoy, eje) : null;

  const bandas = filas.map((fila) => {
    const color = COLORES[fila] ?? COLORES.Otras;
    const deFila = fechadas.filter((tarea) => categoriaDe(tarea) === fila);
    const sueltas = sinFecha.filter((tarea) => categoriaDe(tarea) === fila);
    const alto = altoDe(deFila, sueltas.length);
    return { fila, color, alto, sueltas, puntos: puntosDe(deFila, eje, alto) };
  });

  return (
    <div className="flex overflow-hidden rounded-2xl border border-line bg-card">
      <div className="w-36 shrink-0 border-r border-line">
        <div className="h-9 border-b border-line" />
        {bandas.map((banda) => (
          <div key={banda.fila} className="flex items-center gap-2 border-t border-line px-3 text-sm font-semibold" style={{ height: banda.alto, background: banda.color.tinta }}>
            <span className="size-3 shrink-0 rounded-full" style={{ background: banda.color.fill }} />
            <span className="truncate">{banda.fila}</span>
          </div>
        ))}
      </div>
      <div className="min-w-0 flex-1 overflow-x-auto">
        <div style={{ width: eje.ancho }}>
          <div className="relative h-9 border-b border-line">
            {eje.marcas.map((marca) => (
              <span key={`${marca.iso}-${marca.x}`} className="absolute top-3 -translate-x-1/2 text-[11px] text-muted" style={{ left: marca.x }}>
                {marca.label}
              </span>
            ))}
            {sinFecha.length > 0 ? (
              <span className="absolute top-3 -translate-x-1/2 text-[11px] text-muted" style={{ left: eje.ancho - 36 }}>
                Sin fecha
              </span>
            ) : null}
          </div>
          {bandas.map((banda) => (
            <Fila
              key={banda.fila}
              color={banda.color}
              alto={banda.alto}
              ancho={eje.ancho}
              marcas={eje.marcas}
              hoyX={hoyX}
              puntos={banda.puntos}
              sueltas={banda.sueltas}
              seleccion={seleccion}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Fila({
  color,
  alto,
  ancho,
  marcas,
  hoyX,
  puntos,
  sueltas,
  seleccion,
  onSelect,
}: {
  color: { fill: string; tinta: string };
  alto: number;
  ancho: number;
  marcas: { iso: string; x: number }[];
  hoyX: number | null;
  puntos: { tarea: Tarea; x: number; y: number }[];
  sueltas: Tarea[];
  seleccion: string | null;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="relative border-t border-line" style={{ height: alto, width: ancho, background: color.tinta }}>
        {marcas.map((marca) => (
          <span key={`${marca.iso}-${marca.x}`} className="absolute top-0 bottom-0 border-l border-white/70" style={{ left: marca.x }} />
        ))}
        {hoyX != null ? <span className="absolute top-0 bottom-0 border-l-2 border-[#8f3d32]" style={{ left: hoyX }} /> : null}
        {puntos.map((punto) => (
          <Circulo key={punto.tarea.key} tarea={punto.tarea} color={color.fill} selected={seleccion === punto.tarea.key} onSelect={onSelect} style={{ left: punto.x, top: punto.y }} />
        ))}
        {sueltas.map((tarea, index) => (
          <Circulo
            key={tarea.key}
            tarea={tarea}
            color={color.fill}
            selected={seleccion === tarea.key}
            onSelect={onSelect}
            style={{ left: ancho - 36, top: 20 + index * 40 }}
          />
        ))}
    </div>
  );
}

function Circulo({
  tarea,
  color,
  selected,
  onSelect,
  style,
}: {
  tarea: Tarea;
  color: string;
  selected: boolean;
  onSelect: (key: string) => void;
  style: { left: number; top: number };
}) {
  const cerrado = estaVerificado(tarea) || estaHecho(tarea.estado);
  return (
    <button
      type="button"
      title={`${tarea.titulo} · ${formatDate(diaDe(tarea))}`}
      aria-label={tarea.titulo}
      aria-pressed={selected}
      onClick={() => onSelect(tarea.key)}
      className={`absolute grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white text-[10px] font-semibold text-white ${selected ? "ring-2 ring-ink ring-offset-2" : ""} ${cerrado ? "opacity-45" : ""}`}
      style={{ ...style, background: color }}
    >
      {inicial(tarea)}
    </button>
  );
}

function categoriaDe(tarea: Tarea): string {
  return tarea.tipo ?? OTRAS;
}

function filasDe(tareas: Tarea[]): string[] {
  const presentes = new Set(tareas.map(categoriaDe));
  const orden: string[] = TIPOS.filter((tipo) => presentes.has(tipo));
  if (presentes.has(OTRAS)) orden.push(OTRAS);
  return orden;
}

function diaDe(tarea: Tarea): string | null {
  const valor = (tarea.fechaLimite ?? tarea.fecha ?? "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : null;
}

function agregarMarca(marcas: { iso: string; x: number; label: string }[], vistos: Set<string>, iso: string, x: number) {
  if (vistos.has(iso)) return;
  vistos.add(iso);
  marcas.push({ iso, x, label: etiqueta(iso) });
}

function ejeDe(dias: string[], conSinFecha: boolean): { desde: string | null; hasta: string | null; ancho: number; marcas: { iso: string; x: number; label: string }[] } {
  if (dias.length === 0) return { desde: null, hasta: null, ancho: conSinFecha ? 96 : 48, marcas: [] };
  const orden = [...dias].sort();
  const desde = orden[0];
  const hasta = orden[orden.length - 1];
  const total = diferenciaDias(desde, hasta);
  const ancho = 32 + Math.max(total, 1) * DAY + (conSinFecha ? 72 : 16);
  const marcas: { iso: string; x: number; label: string }[] = [];
  const paso = total > 45 ? 7 : total > 21 ? 3 : 1;
  const vistos = new Set<string>();
  for (let i = 0; i <= total; i += paso) {
    agregarMarca(marcas, vistos, sumarDias(desde, i), 16 + i * DAY);
  }
  agregarMarca(marcas, vistos, hasta, 16 + total * DAY);
  return { desde, hasta, ancho, marcas };
}

function xDe(iso: string, eje: { desde: string | null }): number {
  if (!eje.desde) return 16;
  return 16 + diferenciaDias(eje.desde, iso) * DAY;
}

function altoDe(tareas: Tarea[], sueltas: number): number {
  const porDia = new Map<string, number>();
  for (const tarea of tareas) {
    const dia = diaDe(tarea);
    if (!dia) continue;
    porDia.set(dia, (porDia.get(dia) ?? 0) + 1);
  }
  const pila = Math.max(1, sueltas, ...porDia.values());
  return 16 + pila * 40;
}

function puntosDe(tareas: Tarea[], eje: { desde: string | null }, alto: number): { tarea: Tarea; x: number; y: number }[] {
  const grupos = new Map<string, Tarea[]>();
  for (const tarea of tareas) {
    const dia = diaDe(tarea);
    if (!dia) continue;
    const grupo = grupos.get(dia) ?? [];
    grupo.push(tarea);
    grupos.set(dia, grupo);
  }
  const puntos: { tarea: Tarea; x: number; y: number }[] = [];
  for (const [dia, grupo] of grupos) {
    const inicio = (alto - grupo.length * 40) / 2 + 20;
    grupo.forEach((tarea, index) => puntos.push({ tarea, x: xDe(dia, eje), y: inicio + index * 40 }));
  }
  return puntos;
}

function inicial(tarea: Tarea): string {
  const letra = tarea.titulo.trim().charAt(0);
  return letra ? letra.toUpperCase() : "·";
}

function etiqueta(iso: string): string {
  return formatDate(iso).replace(/ \d{4}$/, "");
}

function diferenciaDias(desde: string, hasta: string): number {
  return Math.round((utc(hasta) - utc(desde)) / 86_400_000);
}

function sumarDias(iso: string, dias: number): string {
  const fecha = new Date(utc(iso) + dias * 86_400_000);
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getUTCDate()).padStart(2, "0");
  return `${fecha.getUTCFullYear()}-${mes}-${dia}`;
}

function utc(iso: string): number {
  const [anio, mes, dia] = iso.split("-").map(Number);
  return Date.UTC(anio, mes - 1, dia);
}

function hoyEnBolivia(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/La_Paz" }).format(new Date());
}
