import { createBrowserClient } from "@supabase/ssr";

import { supabaseCredentials } from "@/lib/supabase/env";

export function createBrowserSupabase() {
  const credentials = supabaseCredentials();
  if (!credentials) return null;
  return createBrowserClient(credentials.url, credentials.key);
}
