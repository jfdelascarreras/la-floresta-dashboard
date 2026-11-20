export type ReporteGrupo = {
  id: string;
  fecha: string;
  titulo: string;
  detalle: string;
  lote: string | null;
  idLote: string | null;
  cantidad: number | null;
  unidad: string | null;
  parcial: boolean;
  autor: string;
};

/** Hechos dichos en el grupo entre el 7 y el 15 nov 2026. No se suman a las métricas. */
export const reportesGrupo: ReporteGrupo[] = [
  {
    id: "chicharrita-2026-11-07",
    fecha: "2026-11-07",
    titulo: "Chicharrita en maíz guacho",
    detalle: "La vieron en maíz guacho. El mensaje no dice lote ni severidad.",
    lote: null,
    idLote: null,
    cantidad: null,
    unidad: null,
    parcial: false,
    autor: "Martín",
  },
  {
    id: "lluvia-2026-11-08",
    fecha: "2026-11-08",
    titulo: "Llovieron 55 mm",
    detalle: "Joaquín confirmó la cifra. No nombran pluviómetro ni lote.",
    lote: null,
    idLote: null,
    cantidad: 55,
    unidad: "mm",
    parcial: false,
    autor: "Martín",
  },
  {
    id: "lluvia-2026-11-11",
    fecha: "2026-11-11",
    titulo: "11 mm en el campamento",
    detalle: "Lectura de las 13:40, marcada como parcial. No es el total del día.",
    lote: null,
    idLote: null,
    cantidad: 11,
    unidad: "mm",
    parcial: true,
    autor: "Martín",
  },
  {
    id: "fertilizante-2026-11-11",
    fecha: "2026-11-11",
    titulo: "Dosis de fertilizante",
    detalle: "Quedó en 100 kg/ha para maíz, 80 kg/ha para soja y 90 kg/ha de SPC37 en soja.",
    lote: null,
    idLote: null,
    cantidad: null,
    unidad: null,
    parcial: false,
    autor: "El grupo",
  },
  {
    id: "siembra-h-2026-11-12",
    fecha: "2026-11-12",
    titulo: "Empezó la siembra de maíz en H",
    detalle: "El mensaje no dice cuántas hectáreas de ese lote iban sembradas.",
    lote: "H",
    idLote: "LOT-029",
    cantidad: null,
    unidad: null,
    parcial: false,
    autor: "Joaquín",
  },
  {
    id: "fumigacion-h-2026-11-12",
    fecha: "2026-11-12",
    titulo: "Fumigación en H, después de sembrar",
    detalle: "Atrazina 1.7, acethoclor 1.5 y paraquat 2. La respuesta no repite la unidad.",
    lote: "H",
    idLote: "LOT-029",
    cantidad: null,
    unidad: null,
    parcial: false,
    autor: "Joaquín",
  },
  {
    id: "lote-l-2026-11-13",
    fecha: "2026-11-13",
    titulo: "Aplicación en el lote L",
    detalle: "Es el lote enmalezado. No dicen producto ni hectáreas.",
    lote: "L",
    idLote: "LOT-033",
    cantidad: null,
    unidad: null,
    parcial: false,
    autor: "Joaquín",
  },
  {
    id: "siembra-2026-11-14",
    fecha: "2026-11-14",
    titulo: "Van 57 ha sembradas",
    detalle: "Terminaron F y G. Siguen con dos John Deere y una Semeato. La tercera sembradora todavía no entraba.",
    lote: null,
    idLote: null,
    cantidad: 57,
    unidad: "ha",
    parcial: false,
    autor: "Joaquín",
  },
  {
    id: "barbecho-2026-11-14",
    fecha: "2026-11-14",
    titulo: "40 ha de barbecho",
    detalle: "Las aplicó ese día. El mensaje no dice en qué lote.",
    lote: null,
    idLote: null,
    cantidad: 40,
    unidad: "ha",
    parcial: false,
    autor: "Joaquín",
  },
];
