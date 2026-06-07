import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { forceLogoutToLogin } from "@/lib/sessionGuard";
import { useAuth } from "@/contexts/AuthContext";

const PROTECTED_PREFIXES = ["/app", "/dogdex", "/admin"];

export function AuthSessionWatcher() {
  const { user, refreshSession } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
        const onProtected = PROTECTED_PREFIXES.some((p) => location.pathname.startsWith(p));
        if (onProtected) {
          void forceLogoutToLogin("signed_out");
        }
      }
    });

    return () => data.subscription.unsubscribe();
  }, [location.pathname]);

  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;

    async function validateOnFocus() {
      const session = await refreshSession();
      if (!session) {
        await forceLogoutToLogin("session");
      }
    }

    window.addEventListener("focus", validateOnFocus);
    return () => window.removeEventListener("focus", validateOnFocus);
  }, [user, refreshSession]);

  return null;
}
