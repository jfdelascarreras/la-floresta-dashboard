import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabaseCredentials } from "@/lib/supabase/env";

export async function createClient() {
  const credentials = supabaseCredentials();
  if (!credentials) {
    throw new Error("La base no está configurada.");
  }

  const cookieStore = await cookies();
  return createServerClient(credentials.url, credentials.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component. The proxy refreshes the session.
        }
      },
    },
  });
}
