"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname } from "next/navigation";

import { marcarPendiente, verificarPendiente, type ConteoComentarios } from "@/app/pendientes/actions";
import { ComentariosPendiente, IconoCamara, IconoChat } from "@/app/components/modules/comentarios-pendiente";
import { PendientesGantt } from "@/app/components/modules/pendientes-gantt";
import { SheetBadge } from "@/app/components/ui/badge";
import { Input, Select } from "@/app/components/ui/input";
import { WhatsAppMark } from "@/app/components/ui/whatsapp-mark";
import type { FarmData } from "@/lib/domain/types";
import { incluyePersona, personasUnicas } from "@/lib/data/personas";
import { AREAS, chipsDeArea, coincideBusqueda, estaHecho, estaVerificado, FUENTES, tareasDe, TIPOS, type Fuente, type Tarea } from "@/lib/data/tareas";
import { daysBetween } from "@/lib/data/metrics";
import { formatDate } from "@/lib/format";

type Vista = "por-cerrar" | "abiertos" | "falta" | "verificados";
type Ajuste = Partial<Pick<Tarea, "estado" | "fechaHecho" | "cerradoPor" | "verificadoPor" | "fechaVerificado">>;

export function PendientesBoard({
  data,
  usuarioEmail,
  initialQuery = "",
  conteos = {},
  modo = "lista",
}: {
  data: FarmData;
  modo?: "lista" | "gantt";
  usuarioEmail: string | null;
  initialQuery?: string;
  conteos?: Record<string, ConteoComentarios>;
}) {
  const pathname = usePathname();
  const base = useMemo(() => tareasDe(data), [data]);
  const [q, setQ] = useState(initialQuery);
  const [area, setArea] = useState("todas");
  const [responsable, setResponsable] = useState("todos");
  const [urgencia, setUrgencia] = useState("todas");
  const [tipo, setTipo] = useState("todos");
  const [fuente, setFuente] = useState<"todas" | Fuente>("todas");
  const [vistaFiltro, setVistaFiltro] = useState<Vista>("por-cerrar");
  const [orden, setOrden] = useState<"urgencia" | "dias">("urgencia");
  const [minDias, setMinDias] = useState(0);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [ajustes, setAjustes] = useState<Record<string, Ajuste>>({});
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();

  const vista = useMemo(
    () => base.map((tarea) => ({ ...tarea, ...ajustes[tarea.key] })),
    [ajustes, base],
  );
  const abiertas = vista.filter((tarea) => !estaHecho(tarea.estado));
  const falta = vista.filter((tarea) => estaHecho(tarea.estado) && !estaVerificado(tarea));
  const responsables = personasUnicas(vista.map((tarea) => tarea.responsable));
  const urgencias = [...new Set(vista.map((tarea) => tarea.urgencia).filter(Boolean))] as string[];
  const tipos = TIPOS.filter((item) => item === tipo || vista.some((tarea) => tarea.tipo === item));
  const candidatas = vista.filter((tarea) => pasaVista(tarea, vistaFiltro) && pasaResto(tarea, responsable, urgencia, tipo, q));
  const pool = candidatas.filter((tarea) => fuente === "todas" || tarea.fuente === fuente);
  const chips = chipsDeArea(base, pool);
  const filtradas = pool.filter(
    (tarea) => (area === "todas" || tarea.area === area) && (minDias === 0 || (diasSinCumplir(tarea, data.asOf) ?? -1) >= minDias),
  );
  const filas =
    orden === "dias"
      ? [...filtradas].sort((a, b) => (diasSinCumplir(b, data.asOf) ?? -1) - (diasSinCumplir(a, data.asOf) ?? -1))
      : filtradas;
  const enArea = candidatas.filter((tarea) => area === "todas" || tarea.area === area);
  const consulta = q.trim();
  const elegida = filas.find((tarea) => tarea.key === seleccion) ?? null;

  function updateQ(value: string) {
    setQ(value);
    const params = new URLSearchParams(window.location.search);
    if (value) params.set("q", value);
    else params.delete("q");
    const query = params.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }

  function guardar(key: string, ajuste: Ajuste, correr: () => Promise<{ ok: boolean; error?: string }>) {
    const anterior = ajustes[key];
    setErrores((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    setAjustes((current) => ({ ...current, [key]: { ...current[key], ...ajuste } }));
    startTransition(async () => {
      const result = await correr();
      if (!result.ok) {
        setAjustes((current) => {
          const next = { ...current };
          if (anterior) next[key] = anterior;
          else delete next[key];
          return next;
        });
        setErrores((current) => ({ ...current, [key]: result.error ?? "No se pudo guardar." }));
      }
    });
  }

  function toggleHecho(tarea: Tarea) {
    const hecho = !estaHecho(tarea.estado);
    guardar(
      tarea.key,
      hecho
        ? {
            estado: "Hecho",
            fechaHecho: data.asOf,
            cerradoPor: usuarioEmail ?? "En este equipo",
          }
        : {
            estado: "Pendiente",
            fechaHecho: null,
            cerradoPor: null,
            verificadoPor: null,
            fechaVerificado: null,
          },
      () => marcarPendiente(tarea.tabla, tarea.id, hecho),
    );
  }

  function toggleVerificado(tarea: Tarea) {
    const verificado = !estaVerificado(tarea);
    guardar(
      tarea.key,
      verificado
        ? { verificadoPor: usuarioEmail ?? "Revisión en este equipo", fechaVerificado: data.asOf }
        : { verificadoPor: null, fechaVerificado: null },
      () => verificarPendiente(tarea.tabla, tarea.id, verificado),
    );
  }

  return (
    <section className="space-y-3">
      <div className="sticky top-[4.25rem] z-10 -mx-4 bg-paper/95 px-4 py-2 backdrop-blur md:static md:mx-0 md:bg-transparent md:px-0 md:py-0">
        <div className="relative">
          <Input
            value={q}
            onChange={(event) => updateQ(event.target.value)}
            placeholder="Buscar tarea, nota, responsable, tipo o código"
            aria-label="Buscar pendientes"
            autoComplete="off"
            enterKeyHint="search"
            className="min-h-14 w-full pr-12 text-base"
          />
          {q ? (
            <button
              type="button"
              aria-label="Borrar búsqueda"
              onClick={() => updateQ("")}
              className="absolute top-0 right-0 grid size-14 place-items-center text-lg text-muted"
            >
              ×
            </button>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <SheetBadge source={data.source} />
          <p className="text-sm text-muted">
            {consulta ? `${filas.length} de ${base.length}` : `${abiertas.length} abiertos · ${falta.length} falta verificar`}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Chip active={area === "todas"} onClick={() => setArea("todas")} label={`Todas ${pool.length}`} />
        {AREAS.map((item) => {
          const n = chips.find((chip) => chip.area === item)?.n ?? 0;
          return (
            <Chip
              key={item}
              active={area === item}
              onClick={() => setArea(area === item ? "todas" : item)}
              label={`${item} ${n}`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Origen">
        {FUENTES.map((item) => {
          const n = enArea.filter((tarea) => tarea.fuente === item).length;
          return (
            <Chip
              key={item}
              active={fuente === item}
              onClick={() => setFuente(fuente === item ? "todas" : item)}
              label={`${item} ${n}`}
            />
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Select value={vistaFiltro} onChange={(event) => setVistaFiltro(event.target.value as Vista)} aria-label="Estado">
          <option value="por-cerrar">Por cerrar</option>
          <option value="abiertos">Abiertos {abiertas.length}</option>
          <option value="falta">Falta verificar {falta.length}</option>
          <option value="verificados">Verificados</option>
        </Select>
        <Select value={responsable} onChange={(event) => setResponsable(event.target.value)} aria-label="Responsable">
          <option value="todos">Todos los responsables</option>
          {responsables.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Select value={urgencia} onChange={(event) => setUrgencia(event.target.value)} aria-label="Urgencia">
          <option value="todas">Toda urgencia</option>
          {urgencias.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Select value={orden} onChange={(event) => setOrden(event.target.value as "urgencia" | "dias")} aria-label="Orden">
          <option value="urgencia">Ordenar por urgencia y fecha</option>
          <option value="dias">Ordenar por más días sin cumplir</option>
        </Select>
        <Select value={String(minDias)} onChange={(event) => setMinDias(Number(event.target.value))} aria-label="Días sin cumplir">
          <option value="0">Cualquier antigüedad</option>
          {[7, 15, 30, 60, 90].map((n) => (
            <option key={n} value={n}>
              {n} días o más sin cumplir
            </option>
          ))}
        </Select>
        <Select value={tipo} onChange={(event) => setTipo(event.target.value)} aria-label="Tipo">
          <option value="todos">Todo tipo</option>
          {tipos.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </div>
      {filas.length === 0 ? (
        <p className="rounded-2xl border border-line bg-card px-4 py-6 text-sm text-muted">
          {base.length === 0 ? "Sin datos cargados todavía" : "No hay pendientes con ese filtro."}
        </p>
      ) : modo === "gantt" ? (
        <div className="space-y-3">
          <PendientesGantt tareas={filas} seleccion={elegida?.key ?? null} onSelect={setSeleccion} />
          {elegida ? (
            <TareaRow
              tarea={elegida}
              hoy={data.asOf}
              usuarioEmail={usuarioEmail}
              conteo={conteos[elegida.key]}
              onHecho={() => toggleHecho(elegida)}
              onVerificado={() => toggleVerificado(elegida)}
              error={errores[elegida.key]}
            />
          ) : (
            <p className="text-sm text-muted">Tocá un círculo para ver la tarea. La línea roja es hoy.</p>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {filas.map((tarea) => (
            <li key={tarea.key}>
              <TareaRow
                tarea={tarea}
                hoy={data.asOf}
                usuarioEmail={usuarioEmail}
                conteo={conteos[tarea.key]}
                onHecho={() => toggleHecho(tarea)}
                onVerificado={() => toggleVerificado(tarea)}
                error={errores[tarea.key]}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Días desde la fecha de alta, solo para pendientes que no están hechos. */
function diasSinCumplir(tarea: Tarea, hoy: string): number | null {
  if (estaHecho(tarea.estado)) return null;
  return daysBetween(tarea.fecha, hoy);
}

function pasaVista(tarea: Tarea, vista: Vista): boolean {
  const hecho = estaHecho(tarea.estado);
  const verificado = estaVerificado(tarea);
  if (vista === "abiertos") return !hecho;
  if (vista === "falta") return hecho && !verificado;
  if (vista === "verificados") return verificado;
  return !verificado;
}

function pasaResto(tarea: Tarea, responsable: string, urgencia: string, tipo: string, q: string): boolean {
  if (responsable !== "todos" && !incluyePersona(tarea.responsable, responsable)) return false;
  if (urgencia !== "todas" && tarea.urgencia !== urgencia) return false;
  if (tipo !== "todos" && tarea.tipo !== tipo) return false;
  return coincideBusqueda(tarea, q);
}

function Chip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold ${active ? "border-forest bg-forest text-white" : "border-line bg-white text-ink"}`}
    >
      {label}
    </button>
  );
}

function mismoUsuario(email: string | null, cerradoPor: string | null): boolean {
  if (!email || !cerradoPor) return false;
  return email.trim().toLowerCase() === cerradoPor.trim().toLowerCase();
}

function TareaRow({
  tarea,
  hoy,
  usuarioEmail,
  conteo,
  onHecho,
  onVerificado,
  error,
}: {
  tarea: Tarea;
  hoy: string;
  usuarioEmail: string | null;
  conteo?: ConteoComentarios;
  onHecho: () => void;
  onVerificado: () => void;
  error?: string;
}) {
  const hecho = estaHecho(tarea.estado);
  const verificado = estaVerificado(tarea);
  const urgente = (tarea.urgencia ?? "").toLowerCase() === "urgente" || (tarea.urgencia ?? "").toLowerCase() === "alta";
  const mismaPersona = mismoUsuario(usuarioEmail, tarea.cerradoPor);
  const verificarOff = !hecho || mismaPersona;
  const borde = verificado ? "border-[#b7d7c4]" : hecho ? "border-[#e7c98a]" : urgente ? "border-[#e7c2b8]" : "border-line";
  const aviso = verificado
    ? pie(tarea.verificadoPor, tarea.fechaVerificado)
    : !hecho
      ? "Primero marcalo como hecho"
      : mismaPersona
        ? "Lo verifica otra persona"
        : hecho
          ? pie(tarea.cerradoPor, tarea.fechaHecho)
          : "";
  const fecha =
    [
      tarea.fecha ? `Desde ${formatDate(tarea.fecha)}` : null,
      tarea.fechaLimite ? `Límite ${formatDate(tarea.fechaLimite)}` : null,
    ]
      .filter(Boolean)
      .join(" · ") || "Sin fecha";
  const dias = diasSinCumplir(tarea, hoy);
  const [abierto, setAbierto] = useState(false);
  const [montado, setMontado] = useState(false);
  const [notas, setNotas] = useState(false);
  const [total, setTotal] = useState(conteo?.n ?? 0);
  const [conFotos, setConFotos] = useState(conteo?.fotos ?? false);

  return (
    <article className={`rounded-2xl border bg-card shadow-sm ${borde}`}>
      <div className="flex items-start gap-2 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className={`text-base font-semibold leading-snug ${verificado ? "text-muted" : "text-ink"}`}>{tarea.titulo}</p>
        <p className="mt-0.5 text-sm text-muted">
          {tarea.responsable ?? "Sin responsable"} · {fecha}
        </p>
        {dias != null && dias >= 0 ? (
          <p className="mt-0.5 text-sm font-bold text-[#c0261a]">
            {dias === 0 ? "Abierto hoy" : dias === 1 ? "1 día sin cumplir" : `${dias} días sin cumplir`}
          </p>
        ) : null}
        {hecho ? (
          <p className="mt-0.5 truncate text-xs text-muted">
            Hecho {pie(tarea.cerradoPor, tarea.fechaHecho)}
            {verificado ? ` · Verificado ${pie(tarea.verificadoPor, tarea.fechaVerificado)}` : ""}
          </p>
        ) : null}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Tag>{tarea.area}</Tag>
          <SourceTag fuente={tarea.fuente} />
          {tarea.tipo && tarea.tipo !== "General" ? <Tag>{tarea.tipo}</Tag> : null}
          {urgente && tarea.urgencia ? <Tag tone="alert">{tarea.urgencia}</Tag> : null}
          <button
            type="button"
            aria-expanded={abierto}
            aria-label={total === 1 ? "1 comentario" : `${total} comentarios`}
            onClick={() => {
              setMontado(true);
              setAbierto((value) => !value);
            }}
            className="inline-flex h-7 items-center gap-1 rounded-full border border-line bg-white px-2 text-sm font-semibold text-forest"
          >
            <IconoChat size={16} />
            {total}
            {conFotos ? <IconoCamara size={14} /> : null}
          </button>
          {tarea.detalle ? (
            <button
              type="button"
              aria-expanded={notas}
              onClick={() => setNotas((value) => !value)}
              className="inline-flex h-7 items-center rounded-full border border-line bg-white px-2 text-sm font-semibold text-ink"
            >
              {notas ? "Ver menos" : "Ver más"}
            </button>
          ) : null}
        </div>
        {error ? <p className="mt-1 text-sm text-[#8f3d32]">{error}</p> : null}
      </div>
      <div className="flex w-[8.5rem] shrink-0 flex-col gap-1">
        <Check label="Hecho" checked={hecho} disabled={false} onClick={onHecho} title={hecho ? pie(tarea.cerradoPor, tarea.fechaHecho) : undefined} />
        <Check label="Verificado" checked={verificado} disabled={verificarOff} onClick={onVerificado} title={aviso || undefined} />
      </div>
      </div>
      {notas && tarea.detalle ? <p className="border-t border-line px-3 py-2 text-sm text-muted">{tarea.detalle}</p> : null}
      {montado ? (
        <div className={abierto ? "border-t border-line px-4 py-3" : "hidden"}>
          <ComentariosPendiente
            tabla={tarea.tabla}
            id={tarea.id}
            usuarioEmail={usuarioEmail}
            onCambio={(n, fotos) => {
              setTotal(n);
              setConFotos(fotos || Boolean(conteo?.fotos));
            }}
          />
        </div>
      ) : null}
    </article>
  );
}

function pie(quien: string | null, fecha: string | null): string {
  const nombre = quien ?? "alguien";
  return fecha ? `por ${nombre} · ${formatDate(fecha)}` : `por ${nombre}`;
}

function Check({
  label,
  checked,
  disabled,
  onClick,
  title,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-11 w-full items-center gap-2 rounded-xl border px-2 text-left text-sm font-semibold ${
        disabled ? "cursor-not-allowed border-line bg-[#f6f3ee] text-muted" : checked ? "border-forest bg-[#e7f4ee] text-forest" : "border-[#c4a15a] bg-white text-ink"
      }`}
    >
      <span className={`grid size-6 shrink-0 place-items-center rounded-md border-2 text-xs ${checked ? "border-forest bg-forest text-white" : "border-[#c4a15a]"}`}>
        {checked ? "✓" : ""}
      </span>
      {label}
    </button>
  );
}

function SourceTag({ fuente }: { fuente: string }) {
  const whatsapp = fuente.toLowerCase().includes("whatsapp");
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        whatsapp ? "bg-[#d9f0e3] text-[#007a33]" : "bg-[#e7eef6] text-[#1d3d66]"
      }`}
    >
      {whatsapp ? <WhatsAppMark /> : null}
      {fuente}
    </span>
  );
}

function Tag({ children, tone = "plain" }: { children: string; tone?: "plain" | "alert" | "wait" | "ok" }) {
  const toneClass =
    tone === "alert"
      ? "bg-[#f8e4e0] text-[#8f3d32]"
      : tone === "wait"
        ? "bg-[#f8e7c0] text-[#7a4b12]"
        : tone === "ok"
          ? "bg-[#d9f0e3] text-[#007a33]"
          : "bg-[#f4e3c3] text-[#7a4b12]";
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${toneClass}`}>{children}</span>;
}
