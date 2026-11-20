import { Suspense, type ReactNode } from "react";

import { AppShell } from "@/app/components/layout/app-shell";
import { gruposUsuario } from "@/lib/supabase/usuario";

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<AppShell grupos={[]}>{null}</AppShell>}>
      <ConPermisos>{children}</ConPermisos>
    </Suspense>
  );
}

async function ConPermisos({ children }: { children: ReactNode }) {
  const grupos = await gruposUsuario();
  return (
    <AppShell grupos={grupos}>
      {grupos !== null && grupos.length === 0 ? <SinAcceso /> : children}
    </AppShell>
  );
}

function SinAcceso() {
  return (
    <div className="mx-auto mt-12 max-w-md rounded-2xl border border-line bg-white p-6 text-center">
      <p className="font-display text-xl text-forest">Tu usuario todavía no tiene acceso</p>
      <p className="mt-2 text-sm text-muted">
        Pedile a Martín o a Jorge que te asignen un grupo: Agricultura, Ganadería o Compras.
      </p>
    </div>
  );
}
