"use client";

import { useMemo, useState, type ReactNode } from "react";

import { LluviaChart } from "@/app/components/dashboard/charts";
import { SheetBadge } from "@/app/components/ui/badge";
import { Card, CardHeader } from "@/app/components/ui/card";
import { Input, Select } from "@/app/components/ui/input";
import { Table, Td } from "@/app/components/ui/table";
import type { FarmData } from "@/lib/domain/types";
import { farmMetrics, isOpen, stockEstado, sueloFlags } from "@/lib/data/metrics";
import { nombreArea } from "@/lib/data/tareas";
import { formatDate, formatHa, formatMm, formatNumber } from "@/lib/format";

const TABS = ["Lotes", "Lluvias", "Pendientes", "Stock", "Suelo", "Labores", "Inspecciones", "Cosecha", "Insumos", "Parte", "Reportes"] as const;
type Tab = (typeof TABS)[number];

export function AgroBoard({ data, focus }: { data: FarmData; focus: string }) {
  const [tab, setTab] = useState<Tab>("Lotes");
  const [query, setQuery] = useState(focus);
  const [tipo, setTipo] = useState("todos");
  const metrics = farmMetrics(data);
  const agroPendientes = data.pendientes.filter(
    (row) => isOpen(row.estado) && (row.area ?? "").toLowerCase().startsWith("agric"),
  );
  const nombres = useMemo(
    () => new Map(data.lotes.map((lote) => [lote.id_lote, lote.nombre_lote ?? lote.id_lote])),
    [data.lotes],
  );
  const lotes = data.lotes.filter((lote) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      lote.id_lote.toLowerCase().includes(q) ||
      (lote.nombre_lote ?? "").toLowerCase().includes(q) ||
      (lote.cultivo_actual ?? "").toLowerCase().includes(q)
    );
  });
  const tipos = [...new Set(data.productos.map((producto) => producto.tipo).filter(Boolean))] as string[];
  const productos = data.productos.filter((producto) => tipo === "todos" || producto.tipo === tipo);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`shrink-0 rounded-full px-3 py-2 text-sm font-semibold ${
              tab === item ? "bg-forest text-white" : "bg-white text-ink"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Lotes" ? (
        <Card>
          <CardHeader title="Lotes" eyebrow={<SheetBadge source={data.source} />} />
          <div className="px-4 py-3 md:px-5">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar por nombre, ID o cultivo" aria-label="Filtrar lotes" />
          </div>
          <Table headers={["Lote", "ID", "ha", "Cultivo", "Campaña"]}>
            {lotes.map((lote) => (
              <tr key={lote.id_lote} className={lote.id_lote === focus ? "bg-[#f4e3c3]/60" : undefined}>
                <Td className="font-semibold">{lote.nombre_lote}</Td>
                <Td>{lote.id_lote}</Td>
                <Td>{lote.superficie_ha == null ? "Sin cargar" : formatNumber(lote.superficie_ha, Number.isInteger(lote.superficie_ha) ? 0 : 1)}</Td>
                <Td>{lote.cultivo_actual}</Td>
                <Td>{lote.campana}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      ) : null}

      {tab === "Lluvias" ? (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Milímetros"
              eyebrow={<SheetBadge source={data.source} />}
            />
            <LluviaChart rows={metrics.lluviaPorDia} />
          </Card>
          <ActivityTable title="Registros" source={data.source} headers={["Fecha", "Pluviómetro", "Lote", "mm", "Acumulado"]}>
          {data.lluvias.map((row) => (
            <tr key={row.id_lluvia}>
              <Td>{formatDate(row.fecha)}</Td>
              <Td>{row.pluviometro}</Td>
              <Td>{nombres.get(row.id_lote ?? "") ?? "General"}</Td>
              <Td>{formatMm(row.milimetros)}</Td>
              <Td>{formatMm(row.acumulado_mes)}</Td>
            </tr>
          ))}
        </ActivityTable>
        </div>
      ) : null}

      {tab === "Pendientes" ? (
        <ActivityTable title="Pendientes de agricultura" source={data.source} headers={["Fecha", "Urgencia", "Tarea", "Estado", "Límite"]}>
          {agroPendientes.map((row) => (
            <tr key={row.id_pendiente}>
              <Td>{formatDate(row.fecha)}</Td>
              <Td>{row.urgencia}</Td>
              <Td>{row.tarea}</Td>
              <Td>{row.estado}</Td>
              <Td>{formatDate(row.fecha_limite)}</Td>
            </tr>
          ))}
        </ActivityTable>
      ) : null}

      {tab === "Stock" ? (
        <Card>
          <CardHeader title="Stock" eyebrow={data.stock.length ? <SheetBadge source={data.source} /> : undefined} />
          {data.stock.length === 0 ? (
            <p className="px-4 pb-5 text-sm text-muted">Sin datos cargados todavía</p>
          ) : (
            <Table headers={["Producto", "Saldo", "Vencimiento", "Estado"]}>
              {data.stock.map((row) => {
                const estado = stockEstado(row, data.asOf);
                const tone = estado === "vencido" ? "bg-[#f8e4e0]" : estado === "por-vencer" ? "bg-[#f8efd4]" : "";
                return (
                  <tr key={row.id_stock} className={tone}>
                    <Td className="font-semibold">{row.nombre_comercial}</Td>
                    <Td>
                      {formatNumber(row.saldo, 1)} {row.unidad}
                    </Td>
                    <Td>{formatDate(row.vencimiento)}</Td>
                    <Td>{estado === "vencido" ? "Vencido" : estado === "por-vencer" ? "Por vencer" : estado === "sin-fecha" ? "Sin fecha" : "Vigente"}</Td>
                  </tr>
                );
              })}
            </Table>
          )}
        </Card>
      ) : null}

      {tab === "Suelo" ? (
        <Card>
          <CardHeader title="Análisis de suelo" eyebrow={data.suelo.length ? <SheetBadge source={data.source} /> : undefined} />
          <p className="px-4 text-sm text-muted md:px-5">Aluminio alto: saturación de 5% o más. Fósforo bajo: menos de 10 mg/dm³.</p>
          {data.suelo.length === 0 ? (
            <p className="px-4 pb-5 text-sm text-muted">Sin datos cargados todavía</p>
          ) : (
            <Table headers={["Lotes", "Fecha", "pH", "P", "Al %", "Avisos"]}>
              {data.suelo.map((row) => {
                const flags = sueloFlags(row);
                return (
                  <tr key={row.id_suelo} className={flags.alAlto || flags.pBajo ? "bg-[#f8efd4]" : undefined}>
                    <Td className="font-semibold">{row.lotes ?? row.ids_lotes ?? "Sin lote"}</Td>
                    <Td>{row.fecha_analisis}</Td>
                    <Td>{formatNumber(row.ph_h2o, 1)}</Td>
                    <Td>{formatNumber(row.p_resina_mg_dm3, 1)}</Td>
                    <Td>{formatNumber(row.sat_al_pct, 1)}</Td>
                    <Td>
                      {flags.alAlto ? "Aluminio alto" : ""}
                      {flags.alAlto && flags.pBajo ? " · " : ""}
                      {flags.pBajo ? "Fósforo bajo" : ""}
                      {!flags.alAlto && !flags.pBajo ? "—" : ""}
                    </Td>
                  </tr>
                );
              })}
            </Table>
          )}
        </Card>
      ) : null}

      {tab === "Labores" ? (
        <ActivityTable title="Labores" source={data.source} headers={["Fecha", "Lote", "Labor", "ha", "Máquina", "Estado"]}>
          {data.labores.map((row) => (
            <tr key={row.id_labor}>
              <Td>{formatDate(row.fecha)}</Td>
              <Td>{nombres.get(row.id_lote ?? "") ?? row.id_lote}</Td>
              <Td>{row.tipo_labor}</Td>
              <Td>{formatHa(row.hectareas)}</Td>
              <Td>{row.maquina ?? "—"}</Td>
              <Td>{row.estado}</Td>
            </tr>
          ))}
        </ActivityTable>
      ) : null}

      {tab === "Inspecciones" ? (
        <ActivityTable title="Inspecciones" source={data.source} headers={["Fecha", "Lote", "Estado", "Fenología", "Hallazgo", "Severidad"]}>
          {data.inspecciones.map((row) => (
            <tr key={row.id_inspeccion}>
              <Td>{formatDate(row.fecha)}</Td>
              <Td>{nombres.get(row.id_lote ?? "") ?? row.id_lote}</Td>
              <Td>{row.estado_cultivo}</Td>
              <Td>{row.estado_fenologico}</Td>
              <Td>{row.plaga_enfermedad}</Td>
              <Td>{row.severidad}</Td>
            </tr>
          ))}
        </ActivityTable>
      ) : null}

      {tab === "Cosecha" ? (
        <ActivityTable title="Cosecha" source={data.source} headers={["Fecha", "Lote", "ha", "kg", "Humedad", "Destino"]}>
          {data.cosecha.map((row) => (
            <tr key={row.id_cosecha}>
              <Td>{formatDate(row.fecha)}</Td>
              <Td>{nombres.get(row.id_lote ?? "") ?? row.id_lote}</Td>
              <Td>{formatHa(row.hectareas_cosechadas)}</Td>
              <Td>{formatNumber(row.kg_totales)}</Td>
              <Td>{row.humedad_pct == null ? "—" : `${formatNumber(row.humedad_pct, 1)}%`}</Td>
              <Td>{row.destino}</Td>
            </tr>
          ))}
        </ActivityTable>
      ) : null}

      {tab === "Insumos" ? (
        <Card>
          <CardHeader title="Catálogo de productos" eyebrow={<SheetBadge source={data.source} />} />
          <div className="px-4 py-3 md:px-5">
            <Select value={tipo} onChange={(event) => setTipo(event.target.value)} aria-label="Filtrar por tipo">
              <option value="todos">Todos los tipos</option>
              {tipos.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>
          <Table headers={["ID", "Producto", "Tipo", "Principio activo", "Unidad", "Cultivo"]}>
            {productos.map((producto) => (
              <tr key={producto.id_producto}>
                <Td>{producto.id_producto}</Td>
                <Td className="font-semibold">{producto.nombre}</Td>
                <Td>{producto.tipo}</Td>
                <Td>{producto.principio_activo ?? "—"}</Td>
                <Td>{producto.unidad}</Td>
                <Td>{producto.cultivo}</Td>
              </tr>
            ))}
          </Table>
          {data.insumos.length > 0 ? (
            <div className="border-t border-line">
              <CardHeader title="Aplicaciones registradas" eyebrow={<SheetBadge source={data.source} />} />
              <Table headers={["Fecha", "Lote", "Producto", "Dosis", "Total"]}>
                {data.insumos.map((row) => (
                  <tr key={row.id_insumo_aplicado}>
                    <Td>{formatDate(row.fecha)}</Td>
                    <Td>{nombres.get(row.id_lote ?? "") ?? row.id_lote}</Td>
                    <Td>{row.producto}</Td>
                    <Td>
                      {row.dosis} {row.unidad}
                    </Td>
                    <Td>{formatNumber(row.cantidad_total, 2)}</Td>
                  </tr>
                ))}
              </Table>
            </div>
          ) : (
            <div className="border-t border-line px-4 py-4 text-sm text-muted">
              {data.insumos.length === 0
                ? "Todavía no hay aplicaciones cargadas en insumos."
                : `${data.insumos.length} aplicaciones cargadas.`}
            </div>
          )}
        </Card>
      ) : null}

      {tab === "Parte" ? (
        <ActivityTable title="Parte diario" source={data.source} headers={["Fecha", "Responsable", "Clima", "Resumen"]}>
          {data.parteDiario.map((row) => (
            <tr key={row.id_parte}>
              <Td>{formatDate(row.fecha)}</Td>
              <Td>{row.responsable}</Td>
              <Td>{row.clima}</Td>
              <Td>{row.resumen}</Td>
            </tr>
          ))}
        </ActivityTable>
      ) : null}

      {tab === "Reportes" ? (
        <ActivityTable title="Reporte libre" source={data.source} headers={["Fecha", "Área", "Lote", "Texto", "Revisado"]}>
          {data.reportes.map((row) => (
            <tr key={row.id_reporte}>
              <Td>{formatDate(row.fecha)}</Td>
              <Td>{nombreArea(row.area)}</Td>
              <Td>{nombres.get(row.id_lote ?? "") ?? "—"}</Td>
              <Td>{row.texto}</Td>
              <Td>{row.revisado ? "Sí" : "No"}</Td>
            </tr>
          ))}
        </ActivityTable>
      ) : null}
    </div>
  );
}

function ActivityTable({
  title,
  source,
  headers,
  children,
}: {
  title: string;
  source: FarmData["source"];
  headers: string[];
  children: ReactNode;
}) {
  const rows = Array.isArray(children) ? children.length : 1;
  return (
    <Card>
      <CardHeader title={title} eyebrow=<SheetBadge source={source} /> />
      {rows === 0 ? <p className="px-4 py-6 text-sm text-muted">Sin datos cargados todavía</p> : <Table headers={headers}>{children}</Table>}
    </Card>
  );
}
