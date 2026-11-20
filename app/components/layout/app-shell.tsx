"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { logout } from "@/app/login/actions";

type Item = { href: string; label: string; grupos?: string[] };

/** Sin `grupos`, lo ve cualquiera con acceso. direccion ve todo. */
const NAV: Item[] = [
  { href: "/pendientes", label: "Pendientes" },
  { href: "/visual-pendientes", label: "Visual Pendientes" },
  { href: "/", label: "Tablero" },
  { href: "/mapa", label: "Mapa", grupos: ["agricultura", "ganaderia"] },
  { href: "/agro", label: "Agro", grupos: ["agricultura"] },
  { href: "/hacienda", label: "Hacienda", grupos: ["ganaderia"] },
  { href: "/maquinaria", label: "Máquinas", grupos: ["agricultura", "ganaderia"] },
  { href: "/compras", label: "Compras", grupos: ["agricultura", "ganaderia", "compras"] },
];

function visible(item: Item, grupos: string[] | null): boolean {
  if (grupos === null || grupos.includes("direccion")) return true;
  if (!item.grupos) return grupos.length > 0;
  return item.grupos.some((grupo) => grupos.includes(grupo));
}

function active(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children, grupos = null }: { children: React.ReactNode; grupos?: string[] | null }) {
  const pathname = usePathname();
  const nav = NAV.filter((item) => visible(item, grupos));

  return (
    <div className="min-h-dvh bg-paper text-ink md:grid md:grid-cols-[232px_1fr]">
      <aside className="hidden border-r border-[#e4d3b0] bg-[#f6f0e4] md:flex md:flex-col md:px-4 md:py-6">
        <Brand />
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl px-3 py-2.5 text-sm font-medium ${
                active(pathname, item.href) ? "bg-forest text-white" : "text-ink hover:bg-black/5"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logout}>
          <button className="min-h-11 w-full rounded-xl px-3 text-left text-sm text-muted hover:bg-black/5" type="submit">
            Cerrar sesión
          </button>
        </form>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-paper/95 px-4 py-3 backdrop-blur md:hidden">
          <Brand compact />
          <form action={logout}>
            <button className="text-sm text-muted" type="submit">
              Salir
            </button>
          </form>
        </header>
        <main className="px-4 pb-28 pt-4 md:px-8 md:pb-12 md:pt-6">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex gap-1 overflow-x-auto border-t border-line bg-paper/95 px-2 py-2 backdrop-blur md:hidden">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-full px-3 py-2 text-sm font-medium ${
              active(pathname, item.href) ? "bg-forest text-white" : "text-ink"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div>
      <p className="font-display text-2xl leading-none text-forest">
        <span className="mb-2 block h-1 w-8 rounded-full bg-[#c4a15a]" />
        La Floresta
      </p>
      {compact ? null : (
        <p className="mt-2 text-sm text-muted">
          Chiquitanía, Bolivia
          <br />
          Campaña 2026-2027
        </p>
      )}
    </div>
  );
}
