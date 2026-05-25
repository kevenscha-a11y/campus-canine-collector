import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  ensureUserGameRows,
  isEmailVerified,
  translateAuthError,
} from "@/lib/authHelpers";

export type AuthResult = {
  error: string | null;
  needsVerification?: boolean;
  user?: User | null;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signUp: (email: string, password: string, name: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  resendVerification: (email: string) => Promise<{ error: string | null }>;
  refreshSession: () => Promise<Session | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(initialSession);
          if (initialSession?.user) {
            ensureUserGameRows(initialSession.user).catch(() => {});
          }
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (mounted) {
        setSession(s);
        if (s?.user) {
          ensureUserGameRows(s.user).catch(() => {
            /* tabelas podem não existir ainda */
          });
        }
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return { error: translateAuthError(error.message) };
    }

    const user = data.user;
    const activeSession = data.session;

    if (user && activeSession) {
      ensureUserGameRows(user).catch(() => {});
      if (isEmailVerified(user)) {
        setSession(activeSession);
        return { error: null, needsVerification: false, user };
      }
    }

    // Confirmação de e-mail obrigatória no Supabase → sem sessão ou e-mail pendente
    return {
      error: null,
      needsVerification: true,
      user: user ?? null,
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { error: translateAuthError(error.message) };
    }

    const user = data.user;
    const activeSession = data.session;

    if (!user || !activeSession) {
      return { error: "Não foi possível iniciar a sessão." };
    }

    ensureUserGameRows(user).catch(() => {});

    if (!isEmailVerified(user)) {
      return {
        error: null,
        needsVerification: true,
        user,
      };
    }

    setSession(activeSession);
    return { error: null, needsVerification: false, user };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error: error ? translateAuthError(error.message) : null };
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    if (!email.trim()) {
      return { error: "Informe o e-mail usado no cadastro." };
    }
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    return { error: error ? translateAuthError(error.message) : null };
  }, []);

  const refreshSession = useCallback(async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) return null;
    setSession(data.session);
    return data.session;
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      isConfigured: isSupabaseConfigured,
      signUp,
      signIn,
      signOut,
      resetPassword,
      resendVerification,
      refreshSession,
    }),
    [
      session,
      loading,
      signUp,
      signIn,
      signOut,
      resetPassword,
      resendVerification,
      refreshSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve estar dentro de AuthProvider");
  return ctx;
}
