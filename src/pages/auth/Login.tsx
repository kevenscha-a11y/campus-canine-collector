import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Login() {
<<<<<<< HEAD
  const { signIn } = useAuth();
=======
  const { signIn, isConfigured } = useAuth();
>>>>>>> master
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/app";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn(email, password);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.needsVerification) {
        toast.success("Confirme seu e-mail para continuar.");
        return;
      }

      toast.success("Bem-vindo de volta!");
      navigate(from, { replace: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Entrar" subtitle="Continue sua jornada na DogDex.">
<<<<<<< HEAD
=======
      {!isConfigured && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
          Modo local ativo — crie uma conta ou entre com qualquer e-mail/senha (dados salvos no navegador).
        </p>
      )}
>>>>>>> master
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1"
          />
        </div>
        <Button type="submit" variant="hero" className="w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <p className="text-sm text-center text-muted-foreground mt-6">
        <Link to="/forgot-password" className="text-primary hover:underline">
          Esqueci a senha
        </Link>
        {" · "}
        <Link to="/register" className="text-primary hover:underline">
          Criar conta
        </Link>
      </p>
    </AuthLayout>
  );
}
