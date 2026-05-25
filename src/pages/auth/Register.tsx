import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Register() {
  const { signUp, isConfigured } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isConfigured) {
      toast.error("Configure o .env com as chaves do Supabase.");
      return;
    }
    setLoading(true);
    const result = await signUp(email, password, name);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.needsVerification) {
      toast.success("Conta criada! Abra o link no e-mail para ativar.");
      navigate("/verify-email", { state: { email: email.trim() } });
      return;
    }

    toast.success("Conta criada! Bem-vindo ao campus.");
    navigate("/app", { replace: true });
  }

  return (
    <AuthLayout title="Cadastro" subtitle="Crie sua conta de treinador canino.">
      {!isConfigured && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          Sem <code className="font-mono">.env</code> configurado o cadastro não funciona.
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={!isConfigured}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={!isConfigured}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={!isConfigured}
            className="mt-1"
          />
        </div>
        <Button type="submit" variant="hero" className="w-full" disabled={loading || !isConfigured}>
          {loading ? "Criando..." : "Criar conta"}
        </Button>
      </form>

      <p className="text-sm text-center text-muted-foreground mt-6">
        Já tem conta?{" "}
        <Link to="/login" className="text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  );
}
