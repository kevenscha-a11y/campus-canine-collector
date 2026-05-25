import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isEmailVerified } from "@/lib/authHelpers";
import { toast } from "sonner";

export default function VerifyEmail() {
  const { user, resendVerification, signOut, refreshSession } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const emailFromState = (location.state as { email?: string })?.email ?? "";
  const [email, setEmail] = useState(emailFromState || user?.email || "");
  const [checking, setChecking] = useState(false);

  async function handleResend() {
    const { error } = await resendVerification(email);
    if (error) toast.error(error);
    else toast.success("E-mail de confirmação reenviado. Veja spam/lixo eletrônico.");
  }

  async function handleAlreadyConfirmed() {
    setChecking(true);
    const session = await refreshSession();
    setChecking(false);

    const u = session?.user ?? user;
    if (u && isEmailVerified(u)) {
      toast.success("E-mail confirmado! Entrando...");
      navigate("/app", { replace: true });
      return;
    }
    toast.message("Ainda não confirmado. Abra o link no e-mail e tente de novo.");
  }

  return (
    <AuthLayout
      title="Confirme seu e-mail"
      subtitle="Quase lá — falta um clique no link que enviamos."
    >
      <div>
        <Label htmlFor="verify-email">E-mail do cadastro</Label>
        <Input
          id="verify-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1"
          placeholder="seu@email.com"
        />
      </div>

      <Button variant="hero" className="w-full mt-4" onClick={handleResend}>
        Reenviar e-mail de confirmação
      </Button>

      <Button
        variant="secondary"
        className="w-full mt-2"
        onClick={handleAlreadyConfirmed}
        disabled={checking}
      >
        {checking ? "Verificando..." : "Já confirmei — continuar"}
      </Button>

      <Button variant="outline" className="w-full mt-2" onClick={() => signOut()}>
        Sair
      </Button>

      <p className="text-sm text-center mt-4">
        <Link to="/login" className="text-primary hover:underline">
          Voltar ao login
        </Link>
      </p>
    </AuthLayout>
  );
}
