#!/usr/bin/env python3
"""Build bundled seed JSON and the schematic lot plan.

Real rows (lotes, productos, listas, tipos de labor) come from the sheet.
There are no sample activity rows: activity comes only from Supabase.
The plan is area-proportional and schematic: the surveyed plano.jpg was not
in the repository. Lot B (LOT-025) has no polygon. Mike and India share one.
"""

from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / "data" / "seed"
PUBLIC = ROOT / "public" / "mapa"

WIDTH = 2000
HEIGHT = 1480
FECHA_CARGA = "2026-11-10T03:00:00.000Z"

PHONETIC = {
    "Mike",
    "India",
    "Juliet",
    "Lima",
    "Kilo",
    "Hotel",
    "Golf",
    "Plaza",
    "Foxtrot",
    "Alpha",
    "Bravo",
    "Delta",
    "Charlie",
    "Echo",
    "Oscar",
    "Papa",
    "Quebec",
    "Romeo",
}
LOW_CONFIDENCE = {"C7/C8", "D456", "D789", "CDE"}


def xml(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def group_of(nombre: str) -> int:
    if nombre in PHONETIC:
        return 0
    if nombre[:1].isdigit():
        return 1
    if nombre in {"A", "A1", "A4", "A7", "A12"}:
        return 2
    if nombre in {"B", "B6", "B7", "B8"}:
        return 3
    if nombre in {"C1", "C5", "C6", "C7/C8"}:
        return 4
    if nombre in {"D1", "D456", "D789"}:
        return 5
    return 6


def read_lotes() -> list[dict]:
    rows = []
    with (SEED / "lotes_real.csv").open(newline="", encoding="utf-8") as handle:
        for raw in csv.DictReader(handle):
            superficie = raw["Superficie_ha"].strip()
            rows.append(
                {
                    "id_lote": raw["ID_Lote"].strip(),
                    "nombre_lote": raw["Nombre_Lote"].strip(),
                    "superficie_ha": float(superficie) if superficie else None,
                    "cultivo_actual": raw["Cultivo_actual"].strip() or None,
                    "campana": raw["Campaña"].strip() or None,
                    "ubicacion": raw["Ubicacion"].strip() or None,
                    "observaciones": raw["Observaciones"].strip() or None,
                    "activo": raw["Activo"].strip().upper() == "TRUE",
                    "cargado_por": raw["Cargado_por"].strip() or None,
                    "fecha_carga": FECHA_CARGA,
                }
            )
    return rows


def read_productos() -> list[dict]:
    rows = []
    with (SEED / "productos_real.csv").open(newline="", encoding="utf-8") as handle:
        for raw in csv.DictReader(handle):
            rows.append(
                {
                    "id_producto": raw["ID_Producto"].strip(),
                    "nombre": raw["Nombre"].strip() or None,
                    "tipo": raw["Tipo"].strip() or None,
                    "principio_activo": raw["Principio_activo"].strip() or None,
                    "unidad": raw["Unidad"].strip() or None,
                    "cultivo": raw["Cultivo"].strip() or None,
                    "observaciones": raw["Observaciones"].strip() or None,
                    "activo": raw["Activo"].strip().upper() == "TRUE",
                    "cargado_por": raw["Cargado_por"].strip() or None,
                    "fecha_carga": FECHA_CARGA,
                }
            )
    return rows


def listas() -> list[dict]:
    items = [
        ("LIS-001", "Tipo_labor", "siembra"),
        ("LIS-002", "Tipo_labor", "pulverización"),
        ("LIS-003", "Tipo_labor", "fertilización"),
        ("LIS-004", "Tipo_labor", "cosecha"),
        ("LIS-005", "Tipo_labor", "otra"),
        ("LIS-006", "Unidad", "L/ha"),
        ("LIS-007", "Unidad", "kg/ha"),
        ("LIS-008", "Unidad", "g/ha"),
        ("LIS-009", "Unidad", "L"),
        ("LIS-010", "Unidad", "kg"),
        ("LIS-011", "Unidad", "unidades"),
        ("LIS-012", "Severidad", "Baja"),
        ("LIS-013", "Severidad", "Media"),
        ("LIS-014", "Severidad", "Alta"),
        ("LIS-015", "Estado_cultivo", "Excelente"),
        ("LIS-016", "Estado_cultivo", "Buena"),
        ("LIS-017", "Estado_cultivo", "Regular"),
        ("LIS-018", "Estado_cultivo", "Mala"),
        ("LIS-019", "Estado_cultivo", "Muy mala"),
        ("LIS-020", "Estado_fenologico", "Soja VE"),
        ("LIS-021", "Estado_fenologico", "Soja VC"),
        ("LIS-022", "Estado_fenologico", "Soja V1"),
        ("LIS-023", "Estado_fenologico", "Soja V2"),
        ("LIS-024", "Estado_fenologico", "Soja V3"),
        ("LIS-025", "Estado_fenologico", "Soja V4"),
        ("LIS-026", "Estado_fenologico", "Soja V5"),
        ("LIS-027", "Estado_fenologico", "Soja V6+"),
        ("LIS-028", "Estado_fenologico", "Soja R1"),
        ("LIS-029", "Estado_fenologico", "Soja R2"),
        ("LIS-030", "Estado_fenologico", "Soja R3"),
        ("LIS-031", "Estado_fenologico", "Soja R4"),
        ("LIS-032", "Estado_fenologico", "Soja R5"),
        ("LIS-033", "Estado_fenologico", "Soja R6"),
        ("LIS-034", "Estado_fenologico", "Soja R7"),
        ("LIS-035", "Estado_fenologico", "Soja R8"),
        ("LIS-036", "Estado_fenologico", "Maíz VE"),
        ("LIS-037", "Estado_fenologico", "Maíz V2"),
        ("LIS-038", "Estado_fenologico", "Maíz V4"),
        ("LIS-039", "Estado_fenologico", "Maíz V6"),
        ("LIS-040", "Estado_fenologico", "Maíz V8"),
        ("LIS-041", "Estado_fenologico", "Maíz V10"),
        ("LIS-042", "Estado_fenologico", "Maíz V12"),
        ("LIS-043", "Estado_fenologico", "Maíz VT"),
        ("LIS-044", "Estado_fenologico", "Maíz R1"),
        ("LIS-045", "Estado_fenologico", "Maíz R2"),
        ("LIS-046", "Estado_fenologico", "Maíz R3"),
        ("LIS-047", "Estado_fenologico", "Maíz R4"),
        ("LIS-048", "Estado_fenologico", "Maíz R5"),
        ("LIS-049", "Estado_fenologico", "Maíz R6"),
        ("LIS-050", "Plaga_enfermedad", "Sin novedad"),
        ("LIS-051", "Plaga_enfermedad", "Chinche"),
        ("LIS-052", "Plaga_enfermedad", "Oruga bolillera (Helicoverpa)"),
        ("LIS-053", "Plaga_enfermedad", "Oruga medidora"),
        ("LIS-054", "Plaga_enfermedad", "Oruga militar / cogollero (Spodoptera)"),
        ("LIS-055", "Plaga_enfermedad", "Falsa medidora (Rachiplusia)"),
        ("LIS-056", "Plaga_enfermedad", "Trips"),
        ("LIS-057", "Plaga_enfermedad", "Arañuela"),
        ("LIS-058", "Plaga_enfermedad", "Mosca blanca"),
        ("LIS-059", "Plaga_enfermedad", "Pulgón"),
        ("LIS-060", "Plaga_enfermedad", "Chicharrita (Dalbulus)"),
        ("LIS-061", "Plaga_enfermedad", "Gusano barrenador (Diatraea)"),
        ("LIS-062", "Plaga_enfermedad", "Picudo"),
        ("LIS-063", "Plaga_enfermedad", "Roya asiática"),
        ("LIS-064", "Plaga_enfermedad", "Mancha ojo de rana"),
        ("LIS-065", "Plaga_enfermedad", "Mancha marrón (Septoria)"),
        ("LIS-066", "Plaga_enfermedad", "Tizón de la hoja"),
        ("LIS-067", "Plaga_enfermedad", "Antracnosis"),
        ("LIS-068", "Plaga_enfermedad", "Mildiu"),
        ("LIS-069", "Plaga_enfermedad", "Podredumbre de tallo"),
        ("LIS-070", "Plaga_enfermedad", "Roya común (maíz)"),
        ("LIS-071", "Plaga_enfermedad", "Achaparramiento (Spiroplasma)"),
        ("LIS-072", "Plaga_enfermedad", "Maleza: Amaranthus (yuyo colorado)"),
        ("LIS-073", "Plaga_enfermedad", "Maleza: Sorgo de Alepo"),
        ("LIS-074", "Plaga_enfermedad", "Maleza: Rama negra (Conyza)"),
        ("LIS-075", "Plaga_enfermedad", "Maleza: Pasto / gramíneas"),
        ("LIS-076", "Plaga_enfermedad", "Maleza: Malezas de hoja ancha"),
        ("LIS-077", "Plaga_enfermedad", "Daño por granizo / clima"),
        ("LIS-078", "Plaga_enfermedad", "Otro"),
    ]
    notes = {
        "Estado_cultivo": "Escala condición 5 niveles",
        "Estado_fenologico": "Escala fenológica de referencia",
        "Plaga_enfermedad": "Referencia monitoreo",
        "Severidad": "Valor de referencia para AppSheet",
        "Tipo_labor": "Valor de referencia para AppSheet",
        "Unidad": "Valor de referencia para AppSheet",
    }
    return [
        {
            "id_lista": id_lista,
            "tipo_lista": tipo,
            "valor": valor,
            "activo": True,
            "observaciones": notes[tipo],
            "cargado_por": None,
            "fecha_carga": FECHA_CARGA,
        }
        for id_lista, tipo, valor in items
    ]


def tipos_labor() -> list[dict]:
    rows = [
        ("TL-001", "Romplow", True, "Romplow", "ha", None),
        ("TL-002", "Disco", True, "Rastra de discos", "ha", None),
        ("TL-003", "Siembra", True, "Sembradora", "ha", None),
        (
            "TL-004",
            "Fumigación",
            True,
            "Fumigadora",
            "ha",
            "Mosquito autopropulsado no requiere tractor",
        ),
        ("TL-005", "Chafreo", False, None, "ha", "Manual"),
        ("TL-006", "Desgrosado", True, "Desgrosadora", "ha", None),
        ("TL-007", "Cosecha", False, "Cosechadora", "ha", None),
    ]
    return [
        {
            "id_tipo_labor": id_tipo,
            "nombre": nombre,
            "requiere_tractor": tractor,
            "tipo_implemento": implemento,
            "unidad": unidad,
            "observaciones": nota,
        }
        for id_tipo, nombre, tractor, implemento, unidad, nota in rows
    ]


def partition(items: list[dict], x: float, y: float, w: float, h: float) -> None:
    if not items:
        return
    if len(items) == 1:
        items[0]["rect"] = (x, y, w, h)
        return
    total = sum(item["ha"] for item in items)
    acc = 0.0
    split = 1
    for index, item in enumerate(items):
        acc += item["ha"]
        if acc >= total / 2 and index < len(items) - 1:
            split = index + 1
            break
    split = max(1, min(len(items) - 1, split))
    left = items[:split]
    right = items[split:]
    share = sum(item["ha"] for item in left) / total
    if w >= h:
        width = w * share
        partition(left, x, y, width, h)
        partition(right, x + width, y, w - width, h)
    else:
        height = h * share
        partition(left, x, y, w, height)
        partition(right, x, y + height, w, h - height)


def inset(rect: tuple[float, float, float, float], pad: float) -> tuple[float, float, float, float]:
    x, y, w, h = rect
    return (x + pad, y + pad, max(8, w - pad * 2), max(8, h - pad * 2))


def ring_y_up(rect: tuple[float, float, float, float]) -> list[list[float]]:
    x, y, w, h = rect
    points = [(x, y), (x + w, y), (x + w, y + h), (x, y + h)]

    def convert(px: float, py: float) -> list[float]:
        return [round(px, 2), round(HEIGHT - py, 2)]

    ring = [convert(px, py) for px, py in points]
    ring.append(ring[0])
    return ring


def build_plan(lotes: list[dict]) -> dict:
    cells = []
    skipped = []
    mike = next(row for row in lotes if row["nombre_lote"] == "Mike")
    india = next(row for row in lotes if row["nombre_lote"] == "India")
    for row in lotes:
        nombre = row["nombre_lote"]
        if nombre in {"B", "A7"}:
            skipped.append(row)
            continue
        if nombre == "India":
            continue
        if nombre == "Mike":
            cells.append(
                {
                    "ids": [mike["id_lote"], india["id_lote"]],
                    "nombres": ["Mike", "India"],
                    "label": "Mike / India",
                    "ha": (mike["superficie_ha"] or 0) + (india["superficie_ha"] or 0),
                    "cultivo": "Soja",
                    "confidence": 0.55,
                    "note": "Mike e India comparten un solo polígono",
                    "kind": "lote",
                }
            )
            continue
        cells.append(
            {
                "ids": [row["id_lote"]],
                "nombres": [nombre],
                "label": nombre,
                "ha": row["superficie_ha"] or 0,
                "cultivo": row["cultivo_actual"],
                "confidence": 0.46 if nombre in LOW_CONFIDENCE else 0.9,
                "note": "Polígono de baja confianza en el plano esquemático"
                if nombre in LOW_CONFIDENCE
                else "",
                "kind": "lote",
            }
        )
    cells.sort(key=lambda cell: (group_of(cell["nombres"][0]), -cell["ha"], cell["label"]))
    partition(cells, 40, 108, 1920, 1088)
    for cell in cells:
        cell["rect"] = inset(cell["rect"], 4)

    zonas = [
        ("Zona casco", (40, 1224, 640, 200), "Casco y galpones. Zona de ejemplo, no está en la hoja de lotes."),
        ("Corrales", (688, 1224, 520, 200), "Corrales. Zona de ejemplo, no está en la hoja de lotes."),
        ("Monte", (1216, 1224, 744, 200), "Monte de reserva. Zona de ejemplo, no está en la hoja de lotes."),
    ]
    return {"cells": cells, "zonas": zonas, "skipped": skipped}


def write_geojson(plan: dict) -> None:
    features = []
    for cell in plan["cells"]:
        features.append(
            {
                "type": "Feature",
                "properties": {
                    "id": "+".join(cell["ids"]),
                    "id_lote": cell["ids"][0],
                    "id_lotes": cell["ids"],
                    "name": cell["label"],
                    "nombre_mapa": cell["label"],
                    "area_ha": cell["ha"],
                    "confidence": cell["confidence"],
                    "note": cell["note"],
                    "kind": "lote",
                },
                "geometry": {"type": "Polygon", "coordinates": [ring_y_up(cell["rect"])]},
            }
        )
    for label, rect, note in plan["zonas"]:
        features.append(
            {
                "type": "Feature",
                "properties": {
                    "id": label,
                    "id_lote": None,
                    "id_lotes": [],
                    "name": label,
                    "nombre_mapa": label,
                    "area_ha": None,
                    "confidence": 1,
                    "note": note,
                    "kind": "zona",
                },
                "geometry": {"type": "Polygon", "coordinates": [ring_y_up(rect)]},
            }
        )
    limite = (28, 96, 1944, 1340)
    features.append(
        {
            "type": "Feature",
            "properties": {
                "id": "limite",
                "id_lote": None,
                "id_lotes": [],
                "name": "Límite",
                "nombre_mapa": "Límite",
                "area_ha": None,
                "confidence": 1,
                "note": "Perímetro esquemático del plano, no es el alambrado relevado.",
                "kind": "limite",
            },
            "geometry": {"type": "Polygon", "coordinates": [ring_y_up(limite)]},
        }
    )
    collection = {
        "type": "FeatureCollection",
        "properties": {
            "schematic": True,
            "width": WIDTH,
            "height": HEIGHT,
            "image": "/mapa/plano.svg",
            "note": "Disposición esquemática. Superficie, cultivo y campaña salen de la hoja de lotes.",
        },
        "features": features,
    }
    (PUBLIC / "lotes.geojson").write_text(json.dumps(collection, ensure_ascii=False), encoding="utf-8")
    (PUBLIC / "plano.json").write_text(
        json.dumps(
            {
                "width": WIDTH,
                "height": HEIGHT,
                "image": "/mapa/plano.svg",
                "schematic": True,
            },
            indent=2,
        ),
        encoding="utf-8",
    )


def write_svg(plan: dict) -> None:
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" viewBox="0 0 {WIDTH} {HEIGHT}">',
        "<rect width='100%' height='100%' fill='#efe6d4'/>",
        "<rect x='28' y='96' width='1944' height='1340' fill='none' stroke='#3d4a3f' stroke-width='3'/>",
        "<text x='48' y='42' font-family='Georgia, serif' font-size='28' fill='#1c1915'>Finca La Floresta</text>",
        "<text x='48' y='68' font-family='sans-serif' font-size='14' fill='#5c564c'>Chiquitanía, Santa Cruz · plano esquemático · campaña 2026-2027</text>",
        "<text x='1500' y='46' font-family='sans-serif' font-size='13' fill='#5c564c'>N</text>",
        "<polygon points='1492,52 1508,52 1500,28' fill='#1e4d3a'/>",
    ]
    for cell in plan["cells"]:
        x, y, w, h = cell["rect"]
        fill = "#d7ebdf" if cell["cultivo"] == "Soja" else "#f6e4b8"
        dash = "6 4" if cell["confidence"] < 0.6 else "0"
        parts.append(
            f"<rect x='{x:.1f}' y='{y:.1f}' width='{w:.1f}' height='{h:.1f}' fill='{fill}' stroke='#314238' stroke-width='1.4' stroke-dasharray='{dash}'/>"
        )
        if min(w, h) >= 36:
            size = 16 if min(w, h) > 70 else 12
            parts.append(
                f"<text x='{x + 8:.1f}' y='{y + size + 6:.1f}' font-family='sans-serif' font-size='{size}' fill='#1c1915'>{xml(cell['label'])}</text>"
            )
            if h > 52:
                parts.append(
                    f"<text x='{x + 8:.1f}' y='{y + size + 24:.1f}' font-family='sans-serif' font-size='11' fill='#5c564c'>{cell['ha']:.0f} ha</text>"
                )
    for label, rect, _note in plan["zonas"]:
        x, y, w, h = rect
        parts.append(
            f"<rect x='{x}' y='{y}' width='{w}' height='{h}' fill='#e7dcc8' stroke='#6d6256' stroke-width='1.2'/>"
        )
        parts.append(
            f"<text x='{x + 16}' y='{y + 36}' font-family='sans-serif' font-size='16' fill='#3d342c'>{xml(label)}</text>"
        )
    parts.append(
        "<text x='48' y='1458' font-family='sans-serif' font-size='13' fill='#6d6256'>La superficie es la de la hoja. La posición no es el relevamiento. Lote B y A7 no tienen polígono. Mike e India comparten uno.</text>"
    )
    parts.append("</svg>")
    (PUBLIC / "plano.svg").write_text("\n".join(parts), encoding="utf-8")


def dump(name: str, payload: object) -> None:
    (SEED / name).write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    lotes = read_lotes()
    productos = read_productos()
    catalogo = listas()
    tipos = tipos_labor()
    dump("lotes.json", lotes)
    dump("productos.json", productos)
    dump("listas.json", catalogo)
    dump("tipos_labor.json", tipos)
    # public/mapa holds the surveyed plano.webp and lotes.geojson. Do not regenerate it here.
    total = sum(row["superficie_ha"] or 0 for row in lotes)
    soja = sum(row["superficie_ha"] or 0 for row in lotes if row["cultivo_actual"] == "Soja")
    maiz = sum(row["superficie_ha"] or 0 for row in lotes if row["cultivo_actual"] == "Maíz")
    print(
        f"lotes={len(lotes)} productos={len(productos)} listas={len(catalogo)} tipos={len(tipos)} "
        f"ha={total:.0f} soja={soja:.0f} maiz={maiz:.0f}"
    )


if __name__ == "__main__":
    main()
