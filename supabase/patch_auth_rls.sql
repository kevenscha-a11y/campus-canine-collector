-- Rode se login funciona mas o app não carrega carteira/stats (RLS bloqueando insert)

DROP POLICY IF EXISTS "biscuit_wallet_insert_own" ON public.user_biscuit_wallets;
CREATE POLICY "biscuit_wallet_insert_own" ON public.user_biscuit_wallets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "dogdex_stats_insert_own" ON public.user_dogdex_stats;
CREATE POLICY "dogdex_stats_insert_own" ON public.user_dogdex_stats
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
