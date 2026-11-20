import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function correoUsuario(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email;
  return typeof email === "string" && email.length > 0 ? email : null;
}

/**
 * Grupos del usuario en el tablero (direccion, agricultura, ganaderia, compras).
 * null = la base no tiene todavía la tabla de permisos o no hay base: no se filtra el menú.
 */
export async function gruposUsuario(): Promise<string[] | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("mis_grupos");
  if (error) return null;
  return Array.isArray(data) ? data.filter((g): g is string => typeof g === "string") : [];
}
