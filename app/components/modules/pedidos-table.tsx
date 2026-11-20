import { SheetBadge } from "@/app/components/ui/badge";
import { Card, CardHeader } from "@/app/components/ui/card";
import { Table, Td } from "@/app/components/ui/table";
import type { FarmData, Pedido } from "@/lib/domain/types";
import { daysBetween } from "@/lib/data/metrics";
import { nombreArea } from "@/lib/data/tareas";
import { formatDate, formatNumber } from "@/lib/format";

export function PedidosTable({ data, pedidos, title }: { data: FarmData; pedidos: Pedido[]; title: string }) {
  const items = new Map<string, number>();
  for (const item of data.pedidoItems) {
    if (!item.id_pedido) continue;
    items.set(item.id_pedido, (items.get(item.id_pedido) ?? 0) + 1);
  }
  return (
    <Card>
      <CardHeader title={title} eyebrow=<SheetBadge source={data.source} /> />
      {pedidos.length === 0 ? (
        <p className="px-4 pb-5 text-sm text-muted">Sin datos cargados todavía</p>
      ) : (
        <Table headers={["Número", "Fecha", "Área", "Estado", "Días", "Ítems", "Motivo"]}>
          {pedidos.map((pedido) => (
            <tr key={pedido.id_pedido}>
              <Td className="font-semibold">{pedido.numero ?? pedido.id_pedido}</Td>
              <Td>{formatDate(pedido.fecha)}</Td>
              <Td>{nombreArea(pedido.area)}</Td>
              <Td>{pedido.estado}</Td>
              <Td>{formatNumber(daysBetween(pedido.fecha, data.asOf))}</Td>
              <Td>{formatNumber(items.get(pedido.id_pedido) ?? 0)}</Td>
              <Td>{pedido.equipo_motivo}</Td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );
}
