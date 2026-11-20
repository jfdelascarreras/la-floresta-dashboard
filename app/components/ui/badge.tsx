import type { DataSource } from "@/lib/domain/types";

export function SheetBadge({ source }: { source: DataSource }) {
  const live = source === "supabase";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
        live ? "bg-[#e7eef6] text-[#1d3d66]" : "bg-[#e5f0e8] text-[#007a33]"
      }`}
    >
      {live ? "En vivo" : "De la hoja"}
    </span>
  );
}
