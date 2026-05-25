import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Login() {
  const { signIn, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/app";
  const setupRequired = (location.state as { setupRequired?: boolean })?.setupRequired;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isConfigured) {
      toast.error("Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env");
      return;
    }
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.needsVerification) {
      toast.message("Confirme seu e-mail para continuar.");
      navigate("/verify-email", { state: { email: email.trim() } });
      return;
    }

    toast.success("Bem-vindo de volta!");
    navigate(from, { replace: true });
  }

  return (
    <AuthLayout title="Entrar" subtitle="Continue sua jornada na DogDex.">
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
