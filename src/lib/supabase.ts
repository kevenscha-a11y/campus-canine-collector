import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY
)?.trim();

const PLACEHOLDER_PATTERNS = [
  "placeholder",
  "sua-chave",
  "your-",
  "eyJ...",
  "xxxx",
  "changeme",
];

function isRealKey(value: string | undefined): boolean {
  if (!value || value.length < 20) return false;
  const lower = value.toLowerCase();
  return !PLACEHOLDER_PATTERNS.some((p) => lower.includes(p));
}

function isRealUrl(value: string | undefined): boolean {
  if (!value) return false;
  return (
    value.includes(".supabase.co") &&
    !value.includes("placeholder") &&
    !value.includes("xxxx")
  );
}

export const isSupabaseConfigured = isRealUrl(url) && isRealKey(supabaseKey);

function createSupabaseClient() {
  return createBrowserClient<Database>(url!, supabaseKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

/** Cliente browser — equivalente ao utils/supabase/client.ts do guia Next.js */
export const supabase = isSupabaseConfigured
  ? createSupabaseClient()
  : createBrowserClient<Database>("http://127.0.0.1:1", "local-dev-no-network", {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
