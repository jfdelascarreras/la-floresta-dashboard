const ALIAS: Record<string, string> = {
  charly: "Charly",
  charli: "Charly",
  "don charli": "Charly",
  "don charly": "Charly",
  alex: "Alex",
  alexander: "Alex",
  alejandro: "Alex",
  saldana: "Saldaña",
  "ing saldana": "Saldaña",
  "maria latife": "María Latife Pino Nallar",
  "maria latife pino nallar": "María Latife Pino Nallar",
};

const DESCARTAR = new Set(["persona de tecnologia", "mecanico", "muestreo", "sigue el tema"]);

function clave(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Nombres canónicos dentro de un responsable escrito a mano. La frase original no se modifica. */
export function personasDe(value: string | null | undefined): string[] {
  if (!value) return [];
  const partes = value
    .replace(/\([^)]*\)/g, " ")
    .split(/\s*(?:\/|,|\by\b|\bcon\b)\s*/i);
  const nombres: string[] = [];
  for (const parte of partes) {
    let limpio = parte.replace(/\s+/g, " ").trim();
    let anterior = "";
    while (limpio && limpio !== anterior) {
      anterior = limpio;
      limpio = limpio.replace(/^(?:el|la|ing\.?|don)\s+/i, "").trim();
    }
    const key = clave(limpio);
    if (key.length < 2 || DESCARTAR.has(key)) continue;
    const nombre = ALIAS[key] ?? limpio;
    if (!nombres.includes(nombre)) nombres.push(nombre);
  }
  return nombres;
}

export function personasUnicas(valores: Array<string | null | undefined>): string[] {
  const vistos = new Map<string, string>();
  for (const valor of valores) {
    for (const nombre of personasDe(valor)) {
      const key = clave(nombre);
      if (!vistos.has(key)) vistos.set(key, nombre);
    }
  }
  return [...vistos.values()].sort((a, b) => a.localeCompare(b, "es"));
}

export function incluyePersona(valor: string | null | undefined, persona: string): boolean {
  const buscada = clave(persona);
  return personasDe(valor).some((nombre) => clave(nombre) === buscada);
}
