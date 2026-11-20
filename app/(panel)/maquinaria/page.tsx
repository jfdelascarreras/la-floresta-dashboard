import { SectionBanner } from "@/app/components/layout/section-banner";
import { PedidosTable } from "@/app/components/modules/pedidos-table";
import { SheetBadge } from "@/app/components/ui/badge";
import { Card, CardHeader } from "@/app/components/ui/card";
import { Table, Td } from "@/app/components/ui/table";
import { loadFarm } from "@/lib/data";
import { pedidosAbiertos } from "@/lib/data/metrics";
import { formatBs, formatDate, formatNumber } from "@/lib/format";

export const metadata = { title: "Maquinaria" };

export default async function MaquinariaPage() {
  const data = await loadFarm();
  const badge = <SheetBadge source={data.source} />;
  const deMaquinaria = pedidosAbiertos(data.pedidos).filter((pedido) =>
    (pedido.area ?? "").toLowerCase().includes("maquin"),
  );

  return (
    <div className="space-y-5">
      <SectionBanner title="Maquinaria" subtitle="Pedidos del área, equipos y combustible" />
      <PedidosTable data={data} pedidos={deMaquinaria} title="Pedidos de maquinaria" />
      <Card>
        <CardHeader title="Equipos" eyebrow={badge} />
        {data.equipos.length === 0 ? (
          <p className="px-4 pb-5 text-sm text-muted">Sin datos cargados todavía</p>
        ) : (
          <Table headers={["Equipo", "Tipo", "Marca", "Año", "Horómetro", "Bs/hora"]}>
            {data.equipos.map((equipo) => (
              <tr key={equipo.id_equipo}>
                <Td className="font-semibold">{equipo.nombre}</Td>
                <Td>{equipo.tipo}</Td>
                <Td>
                  {equipo.marca} {equipo.modelo}
                </Td>
                <Td>{equipo.anio ?? "—"}</Td>
                <Td>{formatNumber(equipo.horometro)}</Td>
                <Td>{formatBs(equipo.costo_hora_bs)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      <Card>
        <CardHeader title="Incidencias" eyebrow={badge} />
        {data.incidencias.length === 0 ? (
          <p className="px-4 pb-5 text-sm text-muted">Sin datos cargados todavía</p>
        ) : (
          <Table headers={["Fecha", "Estado", "Detalle"]}>
            {data.incidencias.map((row) => (
              <tr key={row.id_incidencia}>
                <Td>{formatDate(row.fecha)}</Td>
                <Td>{row.estado}</Td>
                <Td>{row.descripcion}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      <Card>
        <CardHeader title="Combustible" eyebrow={badge} />
        {data.combustible.length === 0 ? (
          <p className="px-4 pb-5 text-sm text-muted">Sin datos cargados todavía</p>
        ) : (
          <Table headers={["Fecha", "Tipo", "Litros", "Saldo", "Destino"]}>
            {data.combustible.map((row) => (
              <tr key={row.id_combustible}>
                <Td>{formatDate(row.fecha)}</Td>
                <Td>{row.tipo}</Td>
                <Td>{formatNumber(row.litros)}</Td>
                <Td>{formatNumber(row.saldo_tanque_lts)}</Td>
                <Td>{row.destino}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
