import { createBrowserSupabase } from "@/lib/supabase/browser";
import { supabaseCredentials } from "@/lib/supabase/env";

const LADO = 1600;
const CALIDAD = 0.82;

export async function comprimirFoto(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("No se pudo leer la foto. Probá con otra.");
  }
  const escala = Math.min(1, LADO / Math.max(bitmap.width, bitmap.height));
  const ancho = Math.max(1, Math.round(bitmap.width * escala));
  const alto = Math.max(1, Math.round(bitmap.height * escala));
  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("No se pudo leer la foto. Probá con otra.");
  }
  ctx.drawImage(bitmap, 0, 0, ancho, alto);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", CALIDAD));
  if (!blob) throw new Error("No se pudo leer la foto. Probá con otra.");
  if (blob.size > 10 * 1024 * 1024) throw new Error("La foto sigue siendo demasiado grande.");
  return blob;
}

export async function subirFoto(path: string, blob: Blob, onProgress: (pct: number) => void): Promise<void> {
  const credentials = supabaseCredentials();
  const supabase = createBrowserSupabase();
  if (!credentials || !supabase) return;
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Tenés que ingresar de nuevo.");
  const destino = path.split("/").map(encodeURIComponent).join("/");
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${credentials.url}/storage/v1/object/pendientes-fotos/${destino}`);
    xhr.setRequestHeader("authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", credentials.key);
    xhr.setRequestHeader("content-type", "image/jpeg");
    xhr.setRequestHeader("cache-control", "3600");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
        return;
      }
      reject(new Error(xhr.status === 413 ? "La foto es demasiado grande." : "No se pudo subir la foto."));
    };
    xhr.onerror = () => reject(new Error("No se pudo subir la foto."));
    xhr.send(blob);
  });
}

export async function borrarFoto(path: string): Promise<void> {
  const supabase = createBrowserSupabase();
  if (!supabase || path.startsWith("blob:")) return;
  await supabase.storage.from("pendientes-fotos").remove([path]);
}

export async function firmarFotos(paths: string[]): Promise<Record<string, string>> {
  const unicas = [...new Set(paths.filter((path) => path && !path.startsWith("blob:") && !path.startsWith("data:")))];
  if (unicas.length === 0) return {};
  const supabase = createBrowserSupabase();
  if (!supabase) return {};
  const { data, error } = await supabase.storage.from("pendientes-fotos").createSignedUrls(unicas, 60 * 60 * 6);
  if (error || !data) return {};
  const firmas: Record<string, string> = {};
  for (const item of data) {
    if (item.path && item.signedUrl) firmas[item.path] = item.signedUrl;
  }
  return firmas;
}
