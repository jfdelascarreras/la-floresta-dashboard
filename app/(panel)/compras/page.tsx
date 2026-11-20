import { SectionBanner } from "@/app/components/layout/section-banner";
import { PedidosTable } from "@/app/components/modules/pedidos-table";
import { SheetBadge } from "@/app/components/ui/badge";
import { Card, CardHeader } from "@/app/components/ui/card";
import { Table, Td } from "@/app/components/ui/table";
import { loadFarm } from "@/lib/data";
import { pedidosAbiertos } from "@/lib/data/metrics";
import { formatDate, formatNumber } from "@/lib/format";

export const metadata = { title: "Compras" };

export default async function ComprasPage() {
  const data = await loadFarm();
  const abiertos = pedidosAbiertos(data.pedidos);
  const numeros = new Map(data.pedidos.map((pedido) => [pedido.id_pedido, pedido.numero ?? pedido.id_pedido]));

  return (
    <div className="space-y-5">
      <SectionBanner
        title="Compras"
        subtitle={`${formatNumber(abiertos.length)} pedidos abiertos al ${formatDate(data.asOf)}`}
      />
      <PedidosTable data={data} pedidos={abiertos} title="Pedidos abiertos" />
      <Card>
        <CardHeader title="Ítems" eyebrow=<SheetBadge source={data.source} /> />
        {data.pedidoItems.length === 0 ? (
          <p className="px-4 pb-5 text-sm text-muted">Sin datos cargados todavía</p>
        ) : (
          <Table headers={["Pedido", "Descripción", "Cantidad", "Estado", "Recibido"]}>
            {data.pedidoItems.map((item) => (
              <tr key={item.id_item}>
                <Td>{numeros.get(item.id_pedido ?? "") ?? item.id_pedido}</Td>
                <Td>{item.descripcion}</Td>
                <Td>
                  {formatNumber(item.cantidad)} {item.unidad}
                </Td>
                <Td>{item.estado}</Td>
                <Td>{formatDate(item.fecha_recibido)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
