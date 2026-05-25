import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ForgotPassword() {
  const { resetPassword, isConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await resetPassword(email);
    if (error) {
      toast.error(error);
      return;
    }
    setSent(true);
    toast.success("Link de recuperação enviado.");
  }

  return (
    <AuthLayout title="Recuperar senha" subtitle="Enviaremos um link para seu e-mail.">
      {sent ? (
        <p className="text-sm text-muted-foreground">
          Confira sua caixa de entrada.{" "}
          <Link to="/login" className="text-primary">
            Voltar ao login
          </Link>
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!isConfigured}
              className="mt-1"
            />
          </div>
          <Button type="submit" variant="hero" className="w-full" disabled={!isConfigured}>
            Enviar link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
