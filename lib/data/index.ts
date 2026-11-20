import { cache } from "react";
import { connection } from "next/server";

import type { FarmData } from "@/lib/domain/types";
import { readSeed } from "@/lib/data/seed";
import { readSupabase } from "@/lib/data/supabase";
import { isSupabaseConfigured } from "@/lib/supabase/env";

async function readSeedCached(): Promise<FarmData> {
  "use cache";
  return readSeed();
}

export const loadFarm = cache(async function loadFarm(): Promise<FarmData> {
  if (!isSupabaseConfigured()) return readSeedCached();
  await connection();
  return readSupabase();
});
