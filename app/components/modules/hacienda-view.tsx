import { SheetBadge } from "@/app/components/ui/badge";
import { Card, CardHeader } from "@/app/components/ui/card";
import { Table, Td } from "@/app/components/ui/table";
import type { FarmData } from "@/lib/domain/types";
import { isOpen } from "@/lib/data/metrics";
import { formatBs, formatDate, formatNumber } from "@/lib/format";

export function HaciendaView({ data }: { data: FarmData }) {
  const porGrupo = new Map<string, { grupo: string; fecha: string; total: number; prenadas: number }>();
  for (const row of data.tactos) {
    const grupo = row.grupo || "Sin grupo";
    const fecha = row.fecha ?? "";
    const key = `${grupo}|${fecha}`;
    const current = porGrupo.get(key) ?? { grupo, fecha, total: 0, prenadas: 0 };
    current.total += 1;
    if ((row.resultado ?? "").toLowerCase().startsWith("preñ")) current.prenadas += 1;
    porGrupo.set(key, current);
  }
  const tactoRows = [...porGrupo.values()].sort((a, b) => a.grupo.localeCompare(b.grupo, "es"));

  const pesadas = new Map<string, { fecha: string; categoria: string; n: number; suma: number }>();
  for (const row of data.pesadas) {
    const fecha = row.fecha ?? "—";
    const categoria = row.categoria || "Sin categoría";
    const key = `${fecha}|${categoria}`;
    const current = pesadas.get(key) ?? { fecha, categoria, n: 0, suma: 0 };
    current.n += 1;
    current.suma += row.peso_kg ?? 0;
    pesadas.set(key, current);
  }

  const iatf = new Map<string, { toro: string; n: number; prenadas: number }>();
  for (const row of data.iatf) {
    const toro = row.toro || "Sin toro";
    const current = iatf.get(toro) ?? { toro, n: 0, prenadas: 0 };
    current.n += 1;
    if ((row.resultado_tacto ?? "").toLowerCase().startsWith("preñ")) current.prenadas += 1;
    iatf.set(toro, current);
  }

  const proximos = data.calendario
    .filter((row) => row.hecho !== true)
    .sort((a, b) => (a.fecha_aviso ?? a.mes ?? "").localeCompare(b.fecha_aviso ?? b.mes ?? ""))
    .slice(0, 8);

  const haciendaAbiertos = data.haciendaPendientes.filter((row) => isOpen(row.estado));

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Preñez por grupo" eyebrow={<SheetBadge source={data.source} />} />
          {tactoRows.length === 0 ? (
            <Empty />
          ) : (
            <Table headers={["Grupo", "Fecha", "Preñadas", "Total", "%"]}>
              {tactoRows.map((row) => (
                <tr key={`${row.grupo}-${row.fecha}`}>
                  <Td className="font-semibold">{row.grupo}</Td>
                  <Td>{formatDate(row.fecha)}</Td>
                  <Td>{formatNumber(row.prenadas)}</Td>
                  <Td>{formatNumber(row.total)}</Td>
                  <Td>{formatNumber(row.total ? (row.prenadas / row.total) * 100 : 0, 0)}%</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
        <Card>
          <CardHeader title="Pesadas" eyebrow={<SheetBadge source={data.source} />} />
          {pesadas.size === 0 ? (
            <Empty />
          ) : (
            <Table headers={["Fecha", "Categoría", "Cabezas", "Promedio"]}>
              {[...pesadas.values()].map((row) => (
                <tr key={`${row.fecha}-${row.categoria}`}>
                  <Td>{formatDate(row.fecha)}</Td>
                  <Td>{row.categoria}</Td>
                  <Td>{formatNumber(row.n)}</Td>
                  <Td>{formatNumber(row.n ? row.suma / row.n : 0, 0)} kg</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </section>

      <Card>
        <CardHeader title="Ventas" eyebrow={<SheetBadge source={data.source} />} />
        {data.ventas.length === 0 ? (
          <Empty />
        ) : (
          <Table headers={["Fecha", "Categoría", "Cabezas", "Bs/kg", "Total Bs", "USD", "Comprador"]}>
            {data.ventas.map((row) => (
              <tr key={row.id_venta}>
                <Td>{formatDate(row.fecha)}</Td>
                <Td>{row.categoria}</Td>
                <Td>{formatNumber(row.cabezas)}</Td>
                <Td>{formatNumber(row.precio_bs_kg, 2)}</Td>
                <Td>{formatBs(row.total_bs)}</Td>
                <Td>{row.total_usd == null ? "—" : formatNumber(row.total_usd, 0)}</Td>
                <Td>{row.comprador}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Calendario sanitario" eyebrow={<SheetBadge source={data.source} />} />
          {proximos.length === 0 ? (
            <Empty />
          ) : (
            <Table headers={["Aviso", "Categoría", "Actividad"]}>
              {proximos.map((row) => (
                <tr key={row.id_cal}>
                  <Td>{formatDate(row.fecha_aviso ?? row.mes)}</Td>
                  <Td>{row.categoria}</Td>
                  <Td>{row.actividad}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
        <Card>
          <CardHeader title="IATF por toro" eyebrow={<SheetBadge source={data.source} />} />
          {iatf.size === 0 ? (
            <Empty />
          ) : (
            <Table headers={["Toro", "Vacas", "Preñadas", "%"]}>
              {[...iatf.values()]
                .sort((a, b) => b.n - a.n)
                .map((row) => (
                  <tr key={row.toro}>
                    <Td>{row.toro}</Td>
                    <Td>{formatNumber(row.n)}</Td>
                    <Td>{formatNumber(row.prenadas)}</Td>
                    <Td>{formatNumber(row.n ? (row.prenadas / row.n) * 100 : 0, 0)}%</Td>
                  </tr>
                ))}
            </Table>
          )}
        </Card>
      </section>

      <Card>
        <CardHeader title="Entore" eyebrow={<SheetBadge source={data.source} />} />
        {data.entore.length === 0 ? (
          <Empty />
        ) : (
          <Table headers={["Grupo", "Vacas", "Toros", "Vacas por toro", "Entrada"]}>
            {data.entore.map((row) => (
              <tr key={row.id_entore}>
                <Td className="font-semibold">{row.grupo}</Td>
                <Td>{formatNumber(row.vacas_vaquillas)}</Td>
                <Td>{formatNumber(row.toros)}</Td>
                <Td>{formatNumber(row.vacas_por_toro, 1)}</Td>
                <Td>{row.entrada_toros}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader title="Potreros" eyebrow={<SheetBadge source={data.source} />} />
        {data.potreros.length === 0 ? (
          <Empty />
        ) : (
          <Table headers={["Potrero", "Campo", "ha", "Pastura", "Estado", "Agua", "Prioridad"]}>
            {data.potreros.map((row) => (
              <tr key={row.id_potrero}>
                <Td className="font-semibold">{row.potrero}</Td>
                <Td>{row.campo}</Td>
                <Td>{row.ha_texto}</Td>
                <Td>{row.pastura}</Td>
                <Td>{row.estado_pastura}</Td>
                <Td>{row.agua}</Td>
                <Td>{row.prioridad}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Pendientes de hacienda"
          eyebrow={<SheetBadge source={data.source} />}
        />
        {haciendaAbiertos.length === 0 ? (
          <Empty />
        ) : (
          <Table headers={["Pedido", "Item", "Urgencia", "Estado", "Responsable"]}>
            {haciendaAbiertos.slice(0, 12).map((row) => (
              <tr key={row.id_pendiente}>
                <Td>{formatDate(row.fecha_pedido)}</Td>
                <Td>{row.item}</Td>
                <Td>{row.urgencia}</Td>
                <Td>{row.estado ?? "Sin estado"}</Td>
                <Td>{row.responsable}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}

function Empty() {
  return <p className="px-4 pb-5 text-sm text-muted">Sin datos cargados todavía</p>;
}
