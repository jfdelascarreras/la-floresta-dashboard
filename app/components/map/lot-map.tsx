"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap, PathOptions } from "leaflet";

import { SheetBadge } from "@/app/components/ui/badge";
import { Input, Select } from "@/app/components/ui/input";
import type { DataSource, Inspeccion, Labor, Lluvia, Lote, Suelo } from "@/lib/domain/types";
import { sueloFlags } from "@/lib/data/metrics";
import { formatDate, formatHa, formatMm } from "@/lib/format";

type Kind = "lote" | "zona" | "limite";
type Metric = "cultivo" | "estado" | "lluvia";

type FeatureProps = {
  id: string;
  id_lote: string | null;
  id_lotes: string[];
  name: string;
  nombre_mapa: string;
  area_ha: number | null;
  confidence: number | string;
  note: string;
  kind: Kind;
};

type MapFeature = {
  type: "Feature";
  properties: FeatureProps;
  geometry: { type: string; coordinates: unknown };
};

type Collection = {
  type: "FeatureCollection";
  properties: { schematic?: boolean; width: number; height: number; image: string; note?: string };
  features: MapFeature[];
};

export type LotMapProps = {
  lotes: Lote[];
  lluvias: Lluvia[];
  labores: Labor[];
  inspecciones: Inspeccion[];
  source: DataSource;
  suelo?: Suelo[];
  compact?: boolean;
};

const ESTADO_COLOR: Record<string, string> = {
  Excelente: "#1f7a4d",
  Buena: "#3d8b66",
  Regular: "#d4a017",
  Mala: "#c46b2c",
  "Muy mala": "#8f3d32",
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function latest<T extends { fecha: string | null }>(rows: T[]): T | undefined {
  return [...rows].sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? ""))[0];
}

function rainColor(mm: number, max: number): string {
  if (max <= 0 || mm <= 0) return "#d9d3c7";
  const t = Math.min(1, mm / max);
  const mix = (from: number, to: number) => Math.round(from + (to - from) * t);
  return `rgb(${mix(231, 29)}, ${mix(238, 78)}, ${mix(242, 137)})`;
}

export default function LotMap(props: LotMapProps) {
  const { lotes, lluvias, labores, inspecciones, source, suelo = [], compact = false } = props;
  const holder = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [metric, setMetric] = useState<Metric>("cultivo");
  const [showNames, setShowNames] = useState(true);
  const [showImage, setShowImage] = useState(true);
  const [showZonas, setShowZonas] = useState(false);
  const [showLimite, setShowLimite] = useState(true);
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState<Collection | null>(null);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lotesById = useMemo(() => new Map(lotes.map((lote) => [lote.id_lote, lote])), [lotes]);
  const maxRain = useMemo(() => {
    const totals = lotes.map((lote) =>
      lluvias.filter((row) => row.id_lote === lote.id_lote).reduce((sum, row) => sum + (row.milimetros ?? 0), 0),
    );
    return Math.max(1, ...totals);
  }, [lotes, lluvias]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/mapa/lotes.geojson", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("plano");
        return response.json() as Promise<Collection>;
      })
      .then((raw) => setCollection(prepareCollection(raw)))
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError("No se pudo abrir el plano.");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!collection || !holder.current) return;
    let map: LeafletMap | null = null;
    let cancelled = false;
    const { width, height } = collection.properties;

    void import("leaflet").then((L) => {
      if (cancelled || !holder.current) return;
      const bounds = L.latLngBounds([0, 0], [height, width]);
      map = L.map(holder.current, {
        crs: L.CRS.Simple,
        minZoom: -2,
        maxZoom: 2,
        zoomSnap: 0.25,
        attributionControl: false,
      });
      map.fitBounds(bounds, { padding: [12, 12] });
      map.setMinZoom(map.getZoom() - 1);
      mapRef.current = map;
      setReady(true);
    });

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, [collection]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !collection) return;
    const bucket: { group: LayerGroup | null; disposed: boolean } = { group: null, disposed: false };

    void import("leaflet").then((L) => {
      if (bucket.disposed || !mapRef.current) return;
      const group = L.layerGroup().addTo(mapRef.current);
      if (bucket.disposed) {
        group.remove();
        return;
      }
      bucket.group = group;
      const bounds = L.latLngBounds([0, 0], [collection.properties.height, collection.properties.width]);
      if (showImage) group.addLayer(L.imageOverlay(collection.properties.image, bounds));

      const visible = collection.features.filter((feature) => {
        const kind = feature.properties.kind;
        if (kind === "zona" && !showZonas) return false;
        if (kind === "limite" && !showLimite) return false;
        return true;
      });
      const draw = (features: MapFeature[], interactive: boolean) => {
        if (features.length === 0) return;
        const layer = L.geoJSON(
          { type: "FeatureCollection", features } as GeoJSON.FeatureCollection,
          {
            interactive,
            coordsToLatLng: (coords) => L.latLng(coords[1], coords[0]),
            style: (feature) => {
              const props = feature?.properties as FeatureProps;
              return styleFor(props, metric, lotesById, lluvias, inspecciones, maxRain);
            },
            onEachFeature: (feature, path) => {
              const props = feature.properties as FeatureProps;
              if (!interactive || props.kind === "limite") return;
              path.bindTooltip(tooltip(props, lotesById, lluvias, labores, inspecciones, suelo), {
                className: "lf-tip",
                sticky: true,
                opacity: 1,
              });
              path.on("click", () => setSelected(props.id));
              if (showNames && props.kind === "lote" && "getBounds" in path) {
                const center = (path as { getBounds: () => L.LatLngBounds }).getBounds().getCenter();
                group.addLayer(
                  L.marker(center, {
                    interactive: false,
                    keyboard: false,
                    icon: L.divIcon({
                      className: "lf-label",
                      html: `<span style="font:700 11px/1.1 Outfit,sans-serif;color:#fff;text-shadow:0 0 3px #000,0 0 3px #000">${escapeHtml(props.nombre_mapa)}</span>`,
                      iconSize: [88, 14],
                      iconAnchor: [44, 7],
                    }),
                  }),
                );
              }
            },
          },
        );
        group.addLayer(layer);
      };
      draw(
        visible.filter((feature) => feature.properties.kind !== "limite"),
        true,
      );
      draw(
        visible.filter((feature) => feature.properties.kind === "limite"),
        false,
      );
    });

    return () => {
      bucket.disposed = true;
      bucket.group?.remove();
    };
  }, [
    collection,
    inspecciones,
    labores,
    lluvias,
    lotesById,
    maxRain,
    metric,
    ready,
    showImage,
    suelo,
    showLimite,
    showNames,
    showZonas,
  ]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return lotes
      .map((lote) => ({ lote, score: scoreLote(lote, q) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.lote.id_lote.localeCompare(b.lote.id_lote))
      .slice(0, 8);
  }, [lotes, query]);

  const selectedFeature = collection?.features.find((feature) => feature.properties.id === selected) ?? null;
  const selectedLotes = resolveSelection(selected, selectedFeature?.properties, lotesById);

  function focusLote(lote: Lote) {
    const feature = collection?.features.find(
      (item) => item.properties.kind === "lote" && item.properties.id_lotes.includes(lote.id_lote),
    );
    setSelected(feature?.properties.id ?? `missing:${lote.id_lote}`);
    setQuery("");
    const map = mapRef.current;
    if (!map || !feature) return;
    void import("leaflet").then((L) => {
      const points = collectLatLngs(feature.geometry.coordinates, L);
      if (points.length === 0) return;
      map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 1 });
    });
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-line bg-[#1c1412] ${compact ? "h-[420px]" : "h-[calc(100dvh-9rem)] min-h-[560px]"}`}>
      <div ref={holder} className="absolute inset-0" />
      <div className="pointer-events-none absolute left-3 top-3 z-[500] flex w-[min(100%-1.5rem,340px)] flex-col gap-2">
        <div className="pointer-events-auto rounded-2xl border border-line bg-card/95 p-3 shadow-sm backdrop-blur">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <SheetBadge source={source} />
          </div>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o ID"
            aria-label="Buscar lote"
          />
          {matches.length > 0 ? (
            <ul className="mt-2 max-h-48 overflow-auto">
              {matches.map(({ lote }) => (
                <li key={lote.id_lote}>
                  <button
                    className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-black/5"
                    type="button"
                    onClick={() => focusLote(lote)}
                  >
                    <span>
                      {lote.nombre_lote} <span className="text-muted">{lote.id_lote}</span>
                    </span>
                    <span className="text-muted">{lote.cultivo_actual}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-3 flex flex-col gap-2">
            <Select value={metric} onChange={(event) => setMetric(event.target.value as Metric)} aria-label="Colorear por">
              <option value="cultivo">Color: cultivo</option>
              <option value="estado">Color: estado</option>
              <option value="lluvia">Color: lluvia</option>
            </Select>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
              <Toggle label="Nombres" checked={showNames} onChange={setShowNames} />
              <Toggle label="Imagen" checked={showImage} onChange={setShowImage} />
              <Toggle label="Zonas" checked={showZonas} onChange={setShowZonas} />
              <Toggle label="Límite" checked={showLimite} onChange={setShowLimite} />
            </div>
          </div>
        </div>
        {error ? <p className="pointer-events-auto rounded-xl bg-white px-3 py-2 text-sm text-[#8f3d32]">{error}</p> : null}
      </div>
      {selected ? (
        <aside className="absolute inset-x-3 bottom-3 z-[500] max-h-[48%] overflow-auto rounded-2xl border border-line bg-card p-4 shadow-lg md:inset-y-3 md:left-auto md:right-3 md:max-h-none md:w-80">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h2 className="font-display text-2xl leading-tight">
              {selectedFeature?.properties.name ?? selectedLotes[0]?.nombre_lote ?? "Lote"}
            </h2>
            <button className="text-sm text-muted" type="button" onClick={() => setSelected(null)}>
              Cerrar
            </button>
          </div>
          {selectedFeature?.properties.note ? <p className="mb-3 text-sm text-muted">{selectedFeature.properties.note}</p> : null}
          {selectedLotes.length === 0 ? (
            <p className="text-sm">Este elemento no está en la hoja de lotes.</p>
          ) : (
            <ul className="space-y-3">
              {selectedLotes.map((lote) => (
                <LoteDetail
                  key={lote.id_lote}
                  lote={lote}
                  hasPolygon={Boolean(
                    collection?.features.some(
                      (feature) => feature.properties.kind === "lote" && feature.properties.id_lotes.includes(lote.id_lote),
                    ),
                  )}
                  labor={latest(labores.filter((row) => row.id_lote === lote.id_lote))}
                  rain={latest(lluvias.filter((row) => row.id_lote === lote.id_lote))}
                  visit={latest(inspecciones.filter((row) => row.id_lote === lote.id_lote))}
                  suelos={suelo.filter((row) =>
                    (row.ids_lotes ?? "")
                      .split(",")
                      .map((id) => id.trim())
                      .includes(lote.id_lote),
                  )}
                />
              ))}
            </ul>
          )}
          {selectedFeature && isLowConfidence(selectedFeature.properties.confidence) ? (
            <p className="mt-3 text-xs text-muted">Confianza del dibujo: baja.</p>
          ) : null}
        </aside>
      ) : null}
    </div>
  );
}

function LoteDetail({
  lote,
  hasPolygon,
  labor,
  rain,
  visit,
  suelos,
}: {
  lote: Lote;
  hasPolygon: boolean;
  labor?: Labor;
  rain?: Lluvia;
  visit?: Inspeccion;
  suelos: Suelo[];
}) {
  return (
    <li className="rounded-xl bg-paper p-3 text-sm">
      <p className="font-semibold">
        {lote.nombre_lote} · {lote.id_lote}
      </p>
      <p className="mt-1 text-muted">
        {formatHa(lote.superficie_ha)} · {lote.cultivo_actual ?? "Sin cultivo"} · {lote.campana ?? "Sin campaña"}
      </p>
      <p className="mt-2">
        Estado: {visit?.estado_cultivo ?? "Sin inspección"}
      </p>
      <p>
        Última lluvia: {rain ? `${formatMm(rain.milimetros)} · ${formatDate(rain.fecha)}` : "Sin registro"}
      </p>
      <p>
        Última labor: {labor ? `${labor.tipo_labor} · ${formatDate(labor.fecha)}` : "Sin registro"}
      </p>
      {suelos.map((row) => {
        const flags = sueloFlags(row);
        return (
          <p key={row.id_suelo} className="mt-2">
            Suelo {row.fecha_analisis ?? ""}: pH {row.ph_h2o ?? "—"} · P {row.p_resina_mg_dm3 ?? "—"} · Al {row.sat_al_pct ?? "—"}%
            {flags.alAlto ? " · aluminio alto" : ""}
            {flags.pBajo ? " · fósforo bajo" : ""}
          </p>
        );
      })}
      {hasPolygon ? null : <p className="mt-2 text-[#7a4b12]">Sin polígono en el plano.</p>}
      <a className="mt-2 inline-block font-semibold text-forest" href={`/agro?lote=${lote.id_lote}`}>
        Ver en Agro
      </a>
    </li>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-1">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

function scoreLote(lote: Lote, query: string): number {
  const nombre = (lote.nombre_lote ?? "").toLowerCase();
  const id = lote.id_lote.toLowerCase();
  if (id === query || nombre === query) return 3;
  if (id.startsWith(query) || nombre.startsWith(query)) return 2;
  if (id.includes(query) || nombre.includes(query)) return 1;
  return 0;
}

function resolveSelection(selected: string | null, props: FeatureProps | undefined, lotesById: Map<string, Lote>): Lote[] {
  if (props?.kind === "lote") {
    const ids = props.id_lotes.length ? props.id_lotes : props.id_lote ? [props.id_lote] : [];
    return ids.map((id) => lotesById.get(id)).filter((lote): lote is Lote => Boolean(lote));
  }
  if (selected?.startsWith("missing:")) {
    const lote = lotesById.get(selected.slice("missing:".length));
    return lote ? [lote] : [];
  }
  return [];
}

function styleFor(
  props: FeatureProps,
  metric: Metric,
  lotesById: Map<string, Lote>,
  lluvias: Lluvia[],
  inspecciones: Inspeccion[],
  maxRain: number,
): PathOptions {
  if (props.kind === "limite") return { color: "#f2d36b", weight: 2, fill: false, fillOpacity: 0 };
  if (props.kind === "zona") return { color: "#efeae2", weight: 1, dashArray: "4 4", fillColor: "#c8c2b8", fillOpacity: 0.12 };
  const ids = props.id_lotes.length ? props.id_lotes : props.id_lote ? [props.id_lote] : [];
  const cultivo = ids.map((id) => lotesById.get(id)?.cultivo_actual).find(Boolean);
  let fill = "#c8c0b2";
  if (metric === "cultivo") fill = cultivo === "Soja" ? "#1f7a4d" : cultivo === "Maíz" ? "#d4a017" : "#8d867c";
  else if (metric === "estado") {
    const visit = latest(inspecciones.filter((row) => row.id_lote != null && ids.includes(row.id_lote)));
    fill = ESTADO_COLOR[visit?.estado_cultivo ?? ""] ?? "#c8c0b2";
  } else {
    const mm = lluvias
      .filter((row) => row.id_lote != null && ids.includes(row.id_lote))
      .reduce((sum, row) => sum + (row.milimetros ?? 0), 0);
    fill = rainColor(mm, maxRain);
  }
  const low = isLowConfidence(props.confidence);
  return {
    color: low ? "#ffe08a" : "#f7f4ef",
    weight: low ? 2.2 : 1.5,
    dashArray: low ? "6 4" : undefined,
    fillColor: fill,
    fillOpacity: 0.4,
  };
}

function isLowConfidence(confidence: number | string): boolean {
  if (typeof confidence === "number") return confidence < 0.6;
  return confidence.toLowerCase() === "baja";
}

function prepareCollection(raw: Collection): Collection {
  const width = raw.properties?.width ?? 1241;
  const height = raw.properties?.height ?? 1755;
  return {
    type: "FeatureCollection",
    properties: {
      schematic: Boolean(raw.properties?.schematic),
      width,
      height,
      image: raw.properties?.image || "/mapa/plano.webp",
      note: raw.properties?.note,
    },
    features: raw.features.map((feature) => {
      const props = feature.properties as FeatureProps & { kind?: string; id_lotes?: string[] };
      const idLote = props.id_lote || null;
      const listed = Array.isArray(props.id_lotes) ? props.id_lotes.filter((id) => id.length > 0) : [];
      const kindRaw = String(props.kind ?? "lote");
      const kind: Kind = kindRaw === "sin_etiqueta" || kindRaw === "zona" ? "zona" : kindRaw === "limite" ? "limite" : "lote";
      return {
        ...feature,
        properties: {
          ...props,
          id: props.id || idLote || props.name,
          id_lote: idLote,
          id_lotes: listed.length > 0 ? listed : idLote ? [idLote] : [],
          nombre_mapa: props.nombre_mapa || props.name,
          note: props.note || "",
          kind,
        },
      };
    }),
  };
}

function collectLatLngs(coordinates: unknown, leaflet: typeof import("leaflet")): import("leaflet").LatLng[] {
  const points: import("leaflet").LatLng[] = [];
  const walk = (node: unknown) => {
    if (!Array.isArray(node) || node.length < 2) return;
    if (typeof node[0] === "number" && typeof node[1] === "number") {
      points.push(leaflet.latLng(node[1], node[0]));
      return;
    }
    node.forEach(walk);
  };
  walk(coordinates);
  return points;
}

function tooltip(
  props: FeatureProps,
  lotesById: Map<string, Lote>,
  lluvias: Lluvia[],
  labores: Labor[],
  inspecciones: Inspeccion[],
  suelo: Suelo[],
): string {
  if (props.kind !== "lote") return `<strong>${escapeHtml(props.name)}</strong><br/>${escapeHtml(props.note)}`;
  const ids = props.id_lotes.length ? props.id_lotes : props.id_lote ? [props.id_lote] : [];
  return ids
    .map((id) => {
      const lote = lotesById.get(id);
      const rain = latest(lluvias.filter((row) => row.id_lote === id));
      const labor = latest(labores.filter((row) => row.id_lote === id));
      const visit = latest(inspecciones.filter((row) => row.id_lote === id));
      const analisis = suelo.filter((row) =>
        (row.ids_lotes ?? "")
          .split(",")
          .map((item) => item.trim())
          .includes(id),
      );
      const sueloLine = analisis
        .map((row) => {
          const flags = sueloFlags(row);
          return `Suelo: pH ${row.ph_h2o ?? "—"} · P ${row.p_resina_mg_dm3 ?? "—"} · Al ${row.sat_al_pct ?? "—"}%${flags.alAlto ? " · Al alto" : ""}${flags.pBajo ? " · P bajo" : ""}`;
        })
        .join("<br/>");
      return [
        `<strong>${escapeHtml(lote?.nombre_lote ?? props.name)}</strong> · ${escapeHtml(id)}`,
        `${escapeHtml(formatHa(lote?.superficie_ha))} · ${escapeHtml(lote?.cultivo_actual ?? "Sin cultivo")} · ${escapeHtml(lote?.campana ?? "—")}`,
        `Estado: ${escapeHtml(visit?.estado_cultivo ?? "Sin inspección")}`,
        `Lluvia: ${escapeHtml(rain ? `${formatMm(rain.milimetros)} · ${formatDate(rain.fecha)}` : "sin registro")}`,
        `Labor: ${escapeHtml(labor ? `${labor.tipo_labor ?? "Labor"} · ${formatDate(labor.fecha)}` : "sin registro")}`,
        sueloLine,
      ]
        .filter(Boolean)
        .join("<br/>");
    })
    .join("<hr style='border:0;border-top:1px solid #3d342c;margin:6px 0'/>");
}
