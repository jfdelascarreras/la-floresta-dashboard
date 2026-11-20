"use client";

export default function PanelError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-line bg-card p-6">
      <h1 className="font-display text-3xl">No se pudo cargar</h1>
      <p className="mt-3 text-sm text-muted">{error.message}</p>
      <button className="mt-5 min-h-11 rounded-xl bg-forest px-4 text-sm font-semibold text-white" type="button" onClick={reset}>
        Reintentar
      </button>
    </div>
  );
}
