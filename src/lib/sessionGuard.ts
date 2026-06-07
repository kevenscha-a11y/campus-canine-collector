import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type MaybeApiError = {
  message?: string;
  code?: string;
  status?: number;
  statusCode?: number;
};

export function isAuthFailure(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const e = error as MaybeApiError;
  const status = e.status ?? e.statusCode;
  const msg = (e.message ?? "").toLowerCase();
  const code = (e.code ?? "").toUpperCase();

  if (status === 401 || status === 403 || status === 404) return true;

  return (
    code === "PGRST301" ||
    code === "401" ||
    code === "403" ||
    msg.includes("jwt expired") ||
    msg.includes("invalid jwt") ||
    msg.includes("not authenticated") ||
    msg.includes("not_authenticated") ||
    msg.includes("session missing") ||
    msg.includes("refresh token") ||
    msg.includes("invalid claim")
  );
}

let loggingOut = false;

/** Encerra sessão e manda para /login (funciona fora do React Router) */
export async function forceLogoutToLogin(reason = "session"): Promise<void> {
  if (loggingOut) return;
  loggingOut = true;

  try {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  } catch {
    /* ignore */
  }

  const path = window.location.pathname;
  const isAuthPage = ["/login", "/register", "/forgot-password", "/verify-email"].some((p) =>
    path.startsWith(p),
  );

  if (!isAuthPage) {
    const params = new URLSearchParams({ reason });
    window.location.assign(`/login?${params.toString()}`);
  } else {
    loggingOut = false;
  }
}
