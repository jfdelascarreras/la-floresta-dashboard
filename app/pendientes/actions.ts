"use server";

import { revalidatePath } from "next/cache";

import type { TablaPendiente } from "@/lib/data/tareas";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function marcarPendiente(tabla: TablaPendiente, id: string, hecho: boolean) {
  if (tabla !== "pendientes" && tabla !== "hacienda_pendientes") {
    return { ok: false as const, error: "No se pudo guardar." };
  }
  if (!id) return { ok: false as const, error: "No se pudo guardar." };
  if (!isSupabaseConfigured()) return { ok: true as const, local: true };

  const supabase = await createClient();
  const { error } = await supabase.rpc("marcar_pendiente", {
    p_tabla: tabla,
    p_id: id,
    p_hecho: hecho,
  });
  if (error) return { ok: false as const, error: mensaje(error.message) };
  revalidatePath("/");
  revalidatePath("/pendientes");
  revalidatePath("/visual-pendientes");
  return { ok: true as const, local: false };
}

export async function verificarPendiente(tabla: TablaPendiente, id: string, verificado: boolean) {
  if (tabla !== "pendientes" && tabla !== "hacienda_pendientes") {
    return { ok: false as const, error: "No se pudo guardar." };
  }
  if (!id) return { ok: false as const, error: "No se pudo guardar." };
  if (!isSupabaseConfigured()) return { ok: true as const, local: true };

  const supabase = await createClient();
  const { error } = await supabase.rpc("verificar_pendiente", {
    p_tabla: tabla,
    p_id: id,
    p_verificado: verificado,
  });
  if (error) return { ok: false as const, error: mensaje(error.message) };
  revalidatePath("/");
  revalidatePath("/pendientes");
  revalidatePath("/visual-pendientes");
  return { ok: true as const, local: false };
}

export type Comentario = {
  id: number | string;
  autor: string;
  texto: string;
  created_at: string;
  fotos: string[];
};

export type ConteoComentarios = { n: number; fotos: boolean };

export async function conteoComentarios(): Promise<Record<string, ConteoComentarios>> {
  if (!isSupabaseConfigured()) return {};
  const supabase = await createClient();
  const { data, error } = await supabase.from("pendiente_comentarios").select("tabla, id_pendiente, fotos").limit(5000);
  if (error || !data) return {};
  const counts: Record<string, ConteoComentarios> = {};
  for (const row of data) {
    const key = `${row.tabla}:${row.id_pendiente}`;
    const current = counts[key] ?? { n: 0, fotos: false };
    current.n += 1;
    if (Array.isArray(row.fotos) && row.fotos.length > 0) current.fotos = true;
    counts[key] = current;
  }
  return counts;
}

export async function listarComentarios(tabla: TablaPendiente, id: string): Promise<Comentario[]> {
  if (tabla !== "pendientes" && tabla !== "hacienda_pendientes") return [];
  if (!id || !isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pendiente_comentarios")
    .select("id, autor, texto, created_at, fotos")
    .eq("tabla", tabla)
    .eq("id_pendiente", id)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map(comoComentario);
}

export async function comentarPendiente(tabla: TablaPendiente, id: string, texto: string, fotos: string[] = []) {
  const limpio = texto.trim();
  const rutas = fotos.map((foto) => foto.trim()).filter(Boolean).slice(0, 6);
  if (tabla !== "pendientes" && tabla !== "hacienda_pendientes") {
    return { ok: false as const, error: "No se pudo comentar." };
  }
  if (!id) return { ok: false as const, error: "No se pudo comentar." };
  if (!limpio && rutas.length === 0) return { ok: false as const, error: "El comentario está vacío." };
  if (limpio.length > 2000) return { ok: false as const, error: "El comentario puede tener hasta 2000 caracteres." };
  if (rutas.length > 6) return { ok: false as const, error: "Máximo 6 fotos por comentario." };
  if (!isSupabaseConfigured()) {
    return {
      ok: true as const,
      local: true,
      comentario: {
        id: `local-${Date.now()}`,
        autor: "En este equipo",
        texto: limpio,
        created_at: new Date().toISOString(),
        fotos: rutas,
      } satisfies Comentario,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("comentar_pendiente", {
    p_tabla: tabla,
    p_id: id,
    p_texto: limpio,
    p_fotos: rutas,
  });
  if (error) return { ok: false as const, error: mensajeComentario(error.message) };
  const comentario = comoComentario(Array.isArray(data) ? data[0] : data);
  return { ok: true as const, local: false, comentario };
}

function comoComentario(row: unknown): Comentario {
  const value = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
  const id = typeof value.id === "number" || typeof value.id === "string" ? value.id : `srv-${Date.now()}`;
  return {
    id,
    autor: typeof value.autor === "string" ? value.autor : "",
    texto: typeof value.texto === "string" ? value.texto : "",
    created_at: typeof value.created_at === "string" ? value.created_at : new Date().toISOString(),
    fotos: Array.isArray(value.fotos) ? value.fotos.filter((foto): foto is string => typeof foto === "string" && foto.length > 0) : [],
  };
}

function mensajeComentario(raw: string): string {
  const text = raw.toLowerCase();
  if (text.includes("vacio") || text.includes("vacío")) return "El comentario está vacío.";
  if (text.includes("6 fotos")) return "Máximo 6 fotos por comentario.";
  if (text.includes("foto no encontrada")) return "No se encontró la foto.";
  if (text.includes("no autenticado")) return "Tenés que ingresar de nuevo.";
  if (text.includes("no encontrado")) return "No encontramos ese pendiente.";
  if (text.includes("2000") || text.includes("texto_check")) return "El comentario puede tener hasta 2000 caracteres.";
  return "No se pudo comentar. Probá de nuevo.";
}

function mensaje(raw: string): string {
  const text = raw.toLowerCase();
  if (text.includes("otra persona")) return "Lo tiene que verificar otra persona.";
  if (text.includes("estar hecho")) return "Primero tiene que estar hecho.";
  if (text.includes("no autenticado")) return "Tenés que ingresar de nuevo.";
  if (text.includes("no encontrado")) return "No encontramos ese pendiente.";
  return "No se pudo guardar. Probá de nuevo.";
}
