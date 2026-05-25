import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

/** Supabase pode preencher email_confirmed_at ou confirmed_at */
export function isEmailVerified(user: User): boolean {
  return !!(user.email_confirmed_at ?? user.confirmed_at);
}

export function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (m.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar (veja a caixa de entrada).";
  }
  if (m.includes("user already registered")) {
    return "Este e-mail já está cadastrado. Tente entrar.";
  }
  if (m.includes("password should be at least")) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }
  if (m.includes("unable to validate email")) {
    return "E-mail inválido.";
  }
  if (m.includes("signup is disabled")) {
    return "Cadastro desativado no Supabase.";
  }
  if (m.includes("email rate limit")) {
    return "Muitas tentativas. Aguarde alguns minutos.";
  }
  return message;
}

/** Garante perfil/carteira/stats se o trigger SQL não rodou */
export async function ensureUserGameRows(user: User): Promise<void> {
  const name =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    user.email?.split("@")[0] ||
    "Treinador";

  await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: name,
      avatar_url: (user.user_metadata?.avatar_url as string) ?? null,
    },
    { onConflict: "id" },
  );

  const { data: existingWallet } = await supabase
    .from("user_biscuit_wallets")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingWallet) {
    await supabase.from("user_biscuit_wallets").insert({ user_id: user.id });
  }

  const { count } = await supabase
    .from("dogs")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const { data: existingStats } = await supabase
    .from("user_dogdex_stats")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingStats) {
    await supabase.from("user_dogdex_stats").insert({
      user_id: user.id,
      catalog_total: count ?? 0,
    });
  }
}
