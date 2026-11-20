"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  PILOT_COOKIE,
  checkPilotPassword,
  issuePilotToken,
  safeNextPath,
} from "@/lib/auth/pilot";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function loginPilot(formData: FormData) {
  const next = safeNextPath(String(formData.get("next") ?? "/"));
  const password = String(formData.get("password") ?? "");
  if (!checkPilotPassword(password)) {
    redirect(`/login?error=clave&next=${encodeURIComponent(next)}`);
  }
  const jar = await cookies();
  jar.set(PILOT_COOKIE, issuePilotToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  redirect(next);
}

export async function loginSupabase(formData: FormData) {
  const next = safeNextPath(String(formData.get("next") ?? "/"));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (error) {
    redirect(`/login?error=auth&next=${encodeURIComponent(next)}`);
  }
  redirect(next);
}

export async function logout() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  const jar = await cookies();
  jar.delete(PILOT_COOKIE);
  redirect("/login");
}
