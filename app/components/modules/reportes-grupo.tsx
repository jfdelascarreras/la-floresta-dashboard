import Link from "next/link";

import { Card, CardHeader } from "@/app/components/ui/card";
import { reportesGrupo } from "@/lib/data/grupo";
import { formatDate, formatNumber } from "@/lib/format";

export function ReportesGrupo() {
  return (
    <Card>
      <CardHeader
        title="Reportes del grupo"
        eyebrow={
          <span className="inline-flex items-center rounded-full bg-[#e7eef6] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#1d3d66]">
            Grupo · 7 al 15 nov
          </span>
        }
      />
      <p className="px-4 pt-2 text-sm text-muted md:px-5">
        Mensajes del grupo, copiados tal como quedaron. No se suman a la lluvia del tablero: no hay pluviómetro y la lectura del 11 es parcial.
      </p>
      <ul className="divide-y divide-line px-2 py-2">
        {reportesGrupo.map((reporte) => (
          <li key={reporte.id} className="px-3 py-3 text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold">{reporte.titulo}</p>
              {reporte.cantidad != null && reporte.unidad ? (
                <p className="font-display text-xl text-ink">
                  {formatNumber(reporte.cantidad, Number.isInteger(reporte.cantidad) ? 0 : 1)} {reporte.unidad}
                </p>
              ) : null}
            </div>
            <p className="mt-1 text-muted">
              {formatDate(reporte.fecha)}
              {reporte.lote ? (
                <>
                  {" · "}
                  {reporte.idLote ? (
                    <Link className="font-semibold text-forest" href={`/agro?lote=${reporte.idLote}`}>
                      Lote {reporte.lote}
                    </Link>
                  ) : (
                    `Lote ${reporte.lote}`
                  )}
                </>
              ) : null}
              {" · "}
              {reporte.autor}
              {reporte.parcial ? " · lectura parcial" : ""}
            </p>
            <p className="mt-1 text-muted">{reporte.detalle}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
