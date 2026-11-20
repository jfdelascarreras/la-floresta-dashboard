import { Suspense } from "react";

import { loginPilot, loginSupabase } from "@/app/login/actions";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { PasswordInput } from "@/app/components/ui/password-input";
import { pilotPasswordIsDefault, safeNextPath } from "@/lib/auth/pilot";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Ingresar" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-[#c4a574]" />}>
      <LoginForm searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const supabase = isSupabaseConfigured();
  const error =
    params.error === "clave"
      ? "La clave no coincide."
      : params.error === "auth"
        ? "Correo o clave incorrectos."
        : null;

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-8 sm:py-10 md:justify-items-end md:pr-[6vw]">
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/login-campo.webp)" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-[#1c1915]/50 via-[#3a2a16]/25 to-[#1c1915]/60"
      />
      <form
        action={supabase ? loginSupabase : loginPilot}
        className="relative w-full max-w-md rounded-3xl border border-white/50 bg-white/85 p-5 shadow-[0_20px_50px_rgba(28,25,21,0.28)] backdrop-blur-md sm:p-6"
      >
        <div
          role="img"
          aria-label="Bandera de Santa Cruz: verde, blanco, verde"
          className="mb-5 flex h-12 flex-row overflow-hidden rounded-lg ring-1 ring-line sm:h-[68px]"
        >
          <span className="flex-1 bg-forest" />
          <span className="flex-1 bg-white" />
          <span className="flex-1 bg-forest" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">Chiquitanía, Bolivia</p>
        <h1 className="mt-2 font-display text-4xl text-forest sm:text-5xl">La Floresta</h1>
        <p className="mt-3 text-sm text-muted">
          Ingresá con tu cuenta.
        </p>
        <input type="hidden" name="next" value={next} />
        <div className="mt-6 space-y-3">
          {supabase ? (
            <label className="block text-sm font-medium">
              Correo
              <Input className="mt-1" name="email" type="email" autoComplete="username" required />
            </label>
          ) : null}
          <label className="block text-sm font-medium">
            Clave
            <PasswordInput className="mt-1" name="password" autoComplete="current-password" required />
          </label>
        </div>
        {error ? <p className="mt-3 text-sm text-[#8f3d32]">{error}</p> : null}
        {!supabase && pilotPasswordIsDefault() ? (
          <p className="mt-3 text-sm text-muted">
            Clave del piloto: <span className="font-semibold text-ink">floresta-piloto</span>
          </p>
        ) : null}
        <Button className="mt-5 w-full" type="submit">
          Ingresar
        </Button>
      </form>
    </main>
  );
}
