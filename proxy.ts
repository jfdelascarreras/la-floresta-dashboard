import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { PILOT_COOKIE, safeNextPath, verifyPilotToken } from "@/lib/auth/pilot";
import { supabaseCredentials } from "@/lib/supabase/env";

function isPublicPath(pathname: string): boolean {
  return pathname === "/login";
}

async function pilotProxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();
  if (verifyPilotToken(request.cookies.get(PILOT_COOKIE)?.value)) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

async function supabaseProxy(request: NextRequest) {
  const credentials = supabaseCredentials();
  if (!credentials) return pilotProxy(request);

  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(credentials.url, credentials.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  if (user && pathname === "/login") {
    const next = safeNextPath(request.nextUrl.searchParams.get("next") ?? "/");
    const redirect = NextResponse.redirect(new URL(next, request.url));
    supabaseResponse.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return supabaseResponse;
}

export async function proxy(request: NextRequest) {
  if (!supabaseCredentials()) return pilotProxy(request);
  return supabaseProxy(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login-campo.webp|_vercel/insights).*)"],
};
