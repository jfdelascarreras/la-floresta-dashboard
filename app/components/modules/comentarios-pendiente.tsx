"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { comentarPendiente, listarComentarios, type Comentario } from "@/app/pendientes/actions";
import { borrarFoto, comprimirFoto, firmarFotos, subirFoto } from "@/lib/fotos-cliente";
import { formatDateTime } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { TablaPendiente } from "@/lib/data/tareas";

type Borrador = {
  key: string;
  preview: string;
  path: string | null;
  progreso: number;
  error: string | null;
};

export function ComentariosPendiente({
  tabla,
  id,
  usuarioEmail,
  onCambio,
}: {
  tabla: TablaPendiente;
  id: string;
  usuarioEmail: string | null;
  onCambio: (n: number, fotos: boolean) => void;
}) {
  const [items, setItems] = useState<Comentario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [draft, setDraft] = useState("");
  const [fotos, setFotos] = useState<Borrador[]>([]);
  const [error, setError] = useState("");
  const [firmas, setFirmas] = useState<Record<string, string>>({});
  const [ampliada, setAmpliada] = useState<string | null>(null);
  const archivo = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();
  const onCambioRef = useRef(onCambio);
  useEffect(() => {
    onCambioRef.current = onCambio;
  }, [onCambio]);

  function publicar(next: Comentario[]) {
    setItems(next);
  }

  useEffect(() => {
    let vivo = true;
    listarComentarios(tabla, id).then((rows) => {
      if (!vivo) return;
      setItems((current) => mezclar(rows, current));
      setCargando(false);
    });
    return () => {
      vivo = false;
    };
  }, [tabla, id]);

  useEffect(() => {
    if (cargando && items.length === 0) return;
    onCambioRef.current(
      items.length,
      items.some((item) => item.fotos.length > 0),
    );
  }, [cargando, items]);

  useEffect(() => {
    const paths = items.flatMap((item) => item.fotos);
    let vivo = true;
    firmarFotos(paths).then((map) => {
      if (vivo) setFirmas((current) => ({ ...current, ...map }));
    });
    return () => {
      vivo = false;
    };
  }, [items]);

  async function elegir(lista: FileList | null) {
    if (!lista || lista.length === 0) return;
    const cupo = 6 - fotos.length;
    if (cupo <= 0) {
      setError("Máximo 6 fotos por comentario.");
      return;
    }
    const elegidas = [...lista].slice(0, cupo);
    if (lista.length > cupo) setError("Máximo 6 fotos por comentario.");
    else setError("");
    for (const file of elegidas) {
      const key = crypto.randomUUID();
      setFotos((current) => [...current, { key, preview: "", path: null, progreso: 8, error: null }]);
      try {
        const blob = await comprimirFoto(file);
        const preview = URL.createObjectURL(blob);
        if (!isSupabaseConfigured()) {
          setFotos((current) => current.map((item) => (item.key === key ? { ...item, preview, path: preview, progreso: 100 } : item)));
          continue;
        }
        setFotos((current) => current.map((item) => (item.key === key ? { ...item, preview, progreso: 25 } : item)));
        const path = `${tabla}/${id}/${crypto.randomUUID()}.jpg`;
        await subirFoto(path, blob, (pct) => {
          setFotos((current) => current.map((item) => (item.key === key ? { ...item, progreso: 25 + Math.round(pct * 0.75) } : item)));
        });
        setFotos((current) => current.map((item) => (item.key === key ? { ...item, path, progreso: 100 } : item)));
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "No se pudo preparar la foto.";
        setFotos((current) => current.map((item) => (item.key === key ? { ...item, error: message, progreso: 0 } : item)));
      }
    }
  }

  function quitar(key: string) {
    const item = fotos.find((foto) => foto.key === key);
    if (item?.preview.startsWith("blob:")) URL.revokeObjectURL(item.preview);
    if (item?.path && !item.path.startsWith("blob:")) void borrarFoto(item.path);
    setFotos((current) => current.filter((foto) => foto.key !== key));
  }

  function enviar() {
    const texto = draft.trim();
    const listas = fotos.filter((foto) => !foto.error);
    if (listas.some((foto) => foto.progreso < 100 || !foto.path)) {
      setError("Esperá a que terminen de subir las fotos.");
      return;
    }
    const rutas = listas.map((foto) => foto.path).filter((path): path is string => Boolean(path));
    if (!texto && rutas.length === 0) {
      setError("El comentario está vacío.");
      return;
    }
    const tempId = `tmp-${crypto.randomUUID()}`;
    const temp: Comentario = {
      id: tempId,
      autor: usuarioEmail ?? "En este equipo",
      texto,
      created_at: new Date().toISOString(),
      fotos: rutas,
    };
    const anterior = items;
    const fotosAnterior = fotos;
    publicar([...items, temp]);
    setDraft("");
    setFotos([]);
    setError("");
    startTransition(async () => {
      const result = await comentarPendiente(tabla, id, texto, rutas);
      if (!result.ok) {
        publicar(anterior);
        setDraft(texto);
        setFotos(fotosAnterior);
        setError(result.error);
        return;
      }
      publicar([...anterior, result.comentario ?? temp]);
    });
  }

  return (
    <div>
      {cargando ? <p className="text-sm text-muted">Cargando comentarios…</p> : null}
      {!cargando && items.length === 0 ? <p className="text-sm text-muted">Todavía no hay comentarios.</p> : null}
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <p className="text-xs text-muted">
              {nombreAutor(item.autor)} · {formatDateTime(item.created_at)}
            </p>
            {item.texto ? <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{item.texto}</p> : null}
            {item.fotos.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {item.fotos.map((foto) => {
                  const src = urlDe(foto, firmas);
                  if (!src) return null;
                  return (
                    <button key={foto} type="button" onClick={() => setAmpliada(src)} className="size-16 overflow-hidden rounded-lg border border-line" aria-label="Ver foto">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="size-full object-cover" />
                    </button>
                  );
                })}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="mt-3 space-y-2">
        {fotos.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {fotos.map((foto) => (
              <div key={foto.key} className="relative size-16 overflow-hidden rounded-lg border border-line bg-[#f6f3ee]">
                {foto.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={foto.preview} alt="" className="size-full object-cover" />
                ) : null}
                {foto.progreso < 100 && !foto.error ? (
                  <span className="absolute inset-x-1 bottom-1 h-1 overflow-hidden rounded-full bg-white/80">
                    <span className="block h-full bg-forest" style={{ width: `${foto.progreso}%` }} />
                  </span>
                ) : null}
                <button type="button" aria-label="Quitar foto" onClick={() => quitar(foto.key)} className="absolute top-0.5 right-0.5 grid size-6 place-items-center rounded-full bg-[#1c1915]/70 text-xs text-white">
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              enviar();
            }
          }}
          rows={2}
          maxLength={2000}
          placeholder="Escribí un comentario"
          aria-label="Comentario"
          className="min-h-16 w-full rounded-xl border border-line bg-white px-3 py-2 text-base text-ink outline-none ring-forest/30 placeholder:text-muted focus:ring-2"
        />
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Agregar fotos" onClick={() => archivo.current?.click()} disabled={fotos.length >= 6} className="grid size-11 place-items-center rounded-xl border border-line bg-white text-forest disabled:text-muted">
            <IconoCamara />
          </button>
          <input
            ref={archivo}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="sr-only"
            onChange={(event) => {
              void elegir(event.target.files);
              event.target.value = "";
            }}
          />
          <button type="button" onClick={enviar} className="min-h-11 rounded-xl bg-forest px-4 text-sm font-semibold text-white">
            Comentar
          </button>
        </div>
        {error ? <p className="text-sm text-[#8f3d32]">{error}</p> : null}
        {fotos.some((foto) => foto.error) ? <p className="text-sm text-[#8f3d32]">{fotos.find((foto) => foto.error)?.error}</p> : null}
      </div>
      {ampliada ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#1c1915]/80 p-4" onClick={() => setAmpliada(null)} role="presentation">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ampliada} alt="Foto del comentario" className="max-h-[90dvh] max-w-full rounded-lg object-contain" />
        </div>
      ) : null}
    </div>
  );
}

function mezclar(rows: Comentario[], current: Comentario[]): Comentario[] {
  const locales = current.filter((item) => String(item.id).startsWith("tmp-"));
  const ids = new Set(rows.map((item) => String(item.id)));
  return [...rows, ...locales.filter((item) => !ids.has(String(item.id)))];
}

function nombreAutor(autor: string): string {
  const nombre = autor.split("@")[0]?.trim();
  return nombre || "alguien";
}

function urlDe(foto: string, firmas: Record<string, string>): string | null {
  if (foto.startsWith("blob:") || foto.startsWith("data:") || foto.startsWith("http")) return foto;
  return firmas[foto] ?? null;
}

export function IconoChat({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 6h14v9H8l-3 3V6z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconoCamara({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 8h3l2-2h6l2 2h3v11H4V8z" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}
