"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS: Record<string, string> = {
  Soja: "#1f7a4d",
  Maíz: "#d4a017",
};

export function CultivoChart({ rows }: { rows: { cultivo: string; hectareas: number }[] }) {
  const data = rows.map((row) => ({ name: row.cultivo, value: row.hectareas }));
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={2}>
            {data.map((row) => (
              <Cell key={row.name} fill={COLORS[row.name] ?? "#8d867c"} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${Number(value).toLocaleString("es-AR")} ha`, "Superficie"]} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LluviaChart({ rows }: { rows: { fecha: string; mm: number }[] }) {
  if (rows.length === 0) {
    return <p className="px-4 py-10 text-sm text-muted">Sin datos cargados todavía</p>;
  }
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e4dccf" vertical={false} />
          <XAxis dataKey="fecha" tick={{ fontSize: 12 }} stroke="#6d645b" />
          <YAxis tick={{ fontSize: 12 }} stroke="#6d645b" width={32} />
          <Tooltip formatter={(value) => [`${value} mm`, "Lluvia"]} />
          <Line type="monotone" dataKey="mm" stroke="#1d4e89" strokeWidth={2.4} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const URGENCIA_COLOR: Record<string, string> = {
  Urgente: "#8f3d32",
  alta: "#8f3d32",
  Normal: "#8d867c",
  media: "#d4a017",
  baja: "#8d867c",
};

export function PendientesChart({
  rows,
}: {
  rows: { area: string; counts: { urgencia: string; n: number }[] }[];
}) {
  if (rows.length === 0) {
    return <p className="px-4 py-10 text-sm text-muted">No hay pendientes abiertos.</p>;
  }
  const keys = [...new Set(rows.flatMap((row) => row.counts.map((item) => item.urgencia)))];
  const data = rows.map((row) => {
    const point: Record<string, string | number> = { area: row.area };
    for (const key of keys) point[key] = row.counts.find((item) => item.urgencia === key)?.n ?? 0;
    return point;
  });
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e4dccf" vertical={false} />
          <XAxis dataKey="area" tick={{ fontSize: 12 }} stroke="#6d645b" />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#6d645b" width={28} />
          <Tooltip />
          {keys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="p"
              fill={URGENCIA_COLOR[key] ?? "#5c7c6a"}
              name={key}
              radius={index === keys.length - 1 ? [4, 4, 0, 0] : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
