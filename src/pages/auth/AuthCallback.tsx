import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ensureUserGameRows, isEmailVerified, translateAuthError } from "@/lib/authHelpers";
import { toast } from "sonner";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Autenticando...");

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const authError = params.get("error_description");

        if (authError) {
          throw new Error(decodeURIComponent(authError.replace(/\+/g, " ")));
        }

        if (code) {
          setMessage("Validando login...");
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          window.history.replaceState({}, "", "/auth/callback");
        }

        // Aguarda o cliente processar hash (#access_token) se houver
        await new Promise((r) => setTimeout(r, 100));

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (cancelled) return;

        if (!session?.user) {
          setMessage("Sessão não encontrada.");
          toast.error("Não foi possível concluir o login. Tente novamente.");
          navigate("/login", { replace: true });
          return;
        }

        ensureUserGameRows(session.user).catch(() => {});

        if (isEmailVerified(session.user)) {
          navigate("/app", { replace: true });
        } else {
          navigate("/verify-email", {
            replace: true,
            state: { email: session.user.email },
          });
        }
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? translateAuthError(e.message) : "Erro ao autenticar.";
        setMessage(msg);
        toast.error(msg);
        navigate("/login", { replace: true });
      }
    }

    finish();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "SIGNED_IN" && session?.user) {
        ensureUserGameRows(session.user).catch(() => {});
        if (isEmailVerified(session.user)) {
          navigate("/app", { replace: true });
        }
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-2 p-6">
      <p className="text-muted-foreground animate-pulse">{message}</p>
      <p className="text-xs text-muted-foreground">Aguarde, não feche esta aba.</p>
    </div>
  );
}
