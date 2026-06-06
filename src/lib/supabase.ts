import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY
)?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = createClient<Database>(
  supabaseUrl ?? "http://127.0.0.1:1",
  supabaseKey ?? "local-dev-no-network",
  {
    auth: {
      persistSession: isSupabaseConfigured,
      autoRefreshToken: isSupabaseConfigured,
      detectSessionInUrl: isSupabaseConfigured,
    },
  },
);
