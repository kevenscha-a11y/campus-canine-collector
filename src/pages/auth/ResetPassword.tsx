import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { translateAuthError } from "@/lib/authHelpers";
import { toast } from "sonner";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          toast.error(translateAuthError(error.message));
          navigate("/login");
          return;
        }
        window.history.replaceState({}, "", "/auth/reset-password");
      }
      const { data: { session } } = await supabase.auth.getSession();
      setReady(!!session);
      if (!session) {
        toast.error("Link inválido ou expirado. Solicite um novo e-mail.");
      }
    }
    init();
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(translateAuthError(error.message));
      return;
    }
    toast.success("Senha atualizada!");
    navigate("/app", { replace: true });
  }

  return (
    <AuthLayout title="Nova senha" subtitle="Defina sua nova senha de acesso.">
      {!ready ? (
        <p className="text-sm text-muted-foreground">
          Carregando sessão de recuperação ou link expirado.{" "}
          <a href="/forgot-password" className="text-primary underline">
            Pedir novo link
          </a>
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password">Nova senha</Label>
            <Input
              id="password"
              type="password"
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <Button type="submit" variant="hero" className="w-full" disabled={loading}>
            Salvar senha
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
