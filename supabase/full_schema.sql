-- =============================================================================
-- Campus Canine Collector — SCRIPT COMPLETO (Supabase)
-- Cole e execute de uma vez no SQL Editor.
-- Não altera public.todos. Auth fica em auth.users (Supabase Auth).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. TIPOS
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.rarity_level AS ENUM ('common', 'rare', 'epic', 'legendary');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.biscuit_type AS ENUM ('normal', 'premium');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.personality_type AS ENUM (
    'playful', 'calm', 'shy', 'bold', 'curious', 'lazy', 'energetic'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.capture_result AS ENUM ('miss', 'captured', 'already_owned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 2. TABELAS
-- ---------------------------------------------------------------------------

-- Perfil (estende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

-- Catálogo
CREATE TABLE IF NOT EXISTS public.dogs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dex_number smallint NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  breed text NOT NULL,
  age_years numeric(4, 1),
  description text NOT NULL,
  personality public.personality_type NOT NULL DEFAULT 'playful',
  rarity public.rarity_level NOT NULL DEFAULT 'common',
  emoji text NOT NULL DEFAULT '🐕',
  sprite_url text,
  silhouette_url text,
  large_image_url text,
  max_evolution_stage smallint NOT NULL DEFAULT 3,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dogs_pkey PRIMARY KEY (id),
  CONSTRAINT dogs_dex_number_unique UNIQUE (dex_number),
  CONSTRAINT dogs_slug_unique UNIQUE (slug),
  CONSTRAINT dogs_dex_number_positive CHECK (dex_number > 0)
);

CREATE TABLE IF NOT EXISTS public.dog_evolution_stages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dog_id uuid NOT NULL REFERENCES public.dogs (id) ON DELETE CASCADE,
  stage smallint NOT NULL,
  stage_name text NOT NULL,
  scans_required smallint NOT NULL DEFAULT 0,
  emoji text,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dog_evolution_stages_pkey PRIMARY KEY (id),
  CONSTRAINT dog_evolution_stages_dog_stage_unique UNIQUE (dog_id, stage)
);

CREATE TABLE IF NOT EXISTS public.dog_qr_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dog_id uuid NOT NULL REFERENCES public.dogs (id) ON DELETE CASCADE,
  token text NOT NULL,
  label text,
  location_hint text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dog_qr_codes_pkey PRIMARY KEY (id),
  CONSTRAINT dog_qr_codes_token_unique UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS idx_dog_qr_codes_token ON public.dog_qr_codes (token) WHERE is_active = true;

-- DogDex por usuário
CREATE TABLE IF NOT EXISTS public.user_dog_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  dog_id uuid NOT NULL REFERENCES public.dogs (id) ON DELETE CASCADE,
  is_captured boolean NOT NULL DEFAULT false,
  is_shiny boolean NOT NULL DEFAULT false,
  scan_count integer NOT NULL DEFAULT 0,
  evolution_stage smallint NOT NULL DEFAULT 0,
  first_seen_at timestamp with time zone,
  captured_at timestamp with time zone,
  last_encounter_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_dog_entries_pkey PRIMARY KEY (id),
  CONSTRAINT user_dog_entries_user_dog_unique UNIQUE (user_id, dog_id),
  CONSTRAINT user_dog_entries_scan_count_non_negative CHECK (scan_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_user_dog_entries_user ON public.user_dog_entries (user_id);

CREATE TABLE IF NOT EXISTS public.capture_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  dog_id uuid NOT NULL REFERENCES public.dogs (id) ON DELETE CASCADE,
  qr_code_id uuid REFERENCES public.dog_qr_codes (id) ON DELETE SET NULL,
  biscuit_type public.biscuit_type NOT NULL,
  base_catch_rate numeric(5, 4) NOT NULL,
  personality_modifier numeric(5, 4) NOT NULL DEFAULT 1,
  rarity_modifier numeric(5, 4) NOT NULL DEFAULT 1,
  final_catch_rate numeric(5, 4) NOT NULL,
  roll_value numeric(8, 6) NOT NULL,
  shiny_roll_value numeric(8, 6),
  result public.capture_result NOT NULL,
  became_shiny boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT capture_attempts_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.user_dogdex_stats (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  total_discovered integer NOT NULL DEFAULT 0,
  total_captured integer NOT NULL DEFAULT 0,
  total_shiny integer NOT NULL DEFAULT 0,
  total_scans integer NOT NULL DEFAULT 0,
  catalog_total integer NOT NULL DEFAULT 0,
  completion_percent numeric(5, 2) NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_dogdex_stats_pkey PRIMARY KEY (user_id)
);

-- Biscoitos
CREATE TABLE IF NOT EXISTS public.user_biscuit_wallets (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  normal_balance smallint NOT NULL DEFAULT 5,
  premium_balance smallint NOT NULL DEFAULT 2,
  normal_daily_allowance smallint NOT NULL DEFAULT 5,
  premium_weekly_allowance smallint NOT NULL DEFAULT 2,
  normal_last_reset_at date NOT NULL DEFAULT (CURRENT_DATE),
  premium_last_weekly_at date,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_biscuit_wallets_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_biscuit_wallets_normal_non_negative CHECK (normal_balance >= 0),
  CONSTRAINT user_biscuit_wallets_premium_non_negative CHECK (premium_balance >= 0)
);

CREATE TABLE IF NOT EXISTS public.biscuit_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  biscuit_type public.biscuit_type NOT NULL,
  amount smallint NOT NULL,
  balance_after smallint NOT NULL,
  reason text NOT NULL,
  reference_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT biscuit_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT biscuit_transactions_amount_non_zero CHECK (amount <> 0)
);

-- Meta e config
CREATE TABLE IF NOT EXISTS public.community_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  title text NOT NULL,
  description text,
  target_count integer NOT NULL,
  current_count integer NOT NULL DEFAULT 0,
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  ends_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT community_goals_pkey PRIMARY KEY (id),
  CONSTRAINT community_goals_slug_unique UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS public.community_goal_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.community_goals (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  event_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT community_goal_events_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.game_settings (
  key text NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT game_settings_pkey PRIMARY KEY (key)
);

-- ---------------------------------------------------------------------------
-- 3. DADOS DE CONFIGURAÇÃO
-- ---------------------------------------------------------------------------
INSERT INTO public.game_settings (key, value, description) VALUES
  ('capture_rates', '{"normal": 0.30, "premium": 0.75}', 'Chance base por biscoito'),
  ('shiny_chance', '0.05', 'Chance de shiny na captura'),
  ('evolution_scans', '3', 'Escaneios para evoluir'),
  ('personality_modifiers', '{"playful":1.05,"calm":1.00,"shy":0.90,"bold":1.10,"curious":1.05,"lazy":0.85,"energetic":1.08}', 'Modificador de captura'),
  ('rarity_modifiers', '{"common":1.10,"rare":1.00,"epic":0.85,"legendary":0.70}', 'Modificador de captura'),
  ('biscuit_allowances', '{"normal_daily":5,"premium_weekly":2}', 'Reset diário e semanal')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. RLS (Row Level Security)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dog_evolution_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dog_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_dog_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capture_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_dogdex_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_biscuit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biscuit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_goal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "dogs_read_authenticated" ON public.dogs;
CREATE POLICY "dogs_read_authenticated" ON public.dogs FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "dog_evolution_read" ON public.dog_evolution_stages;
CREATE POLICY "dog_evolution_read" ON public.dog_evolution_stages FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "dog_qr_read" ON public.dog_qr_codes;
CREATE POLICY "dog_qr_read" ON public.dog_qr_codes FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "user_dog_entries_own" ON public.user_dog_entries;
CREATE POLICY "user_dog_entries_own" ON public.user_dog_entries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "capture_attempts_select_own" ON public.capture_attempts;
CREATE POLICY "capture_attempts_select_own" ON public.capture_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "dogdex_stats_own" ON public.user_dogdex_stats;
CREATE POLICY "dogdex_stats_own" ON public.user_dogdex_stats FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "biscuit_wallet_own" ON public.user_biscuit_wallets;
CREATE POLICY "biscuit_wallet_own" ON public.user_biscuit_wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "biscuit_tx_select_own" ON public.biscuit_transactions;
CREATE POLICY "biscuit_tx_select_own" ON public.biscuit_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "community_goals_read" ON public.community_goals;
CREATE POLICY "community_goals_read" ON public.community_goals FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "community_events_insert_own" ON public.community_goal_events;
CREATE POLICY "community_events_insert_own" ON public.community_goal_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "game_settings_read" ON public.game_settings;
CREATE POLICY "game_settings_read" ON public.game_settings FOR SELECT TO authenticated USING (true);

-- ---------------------------------------------------------------------------
-- 5. FUNÇÕES E TRIGGERS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trg_dogs_updated_at ON public.dogs;
CREATE TRIGGER trg_dogs_updated_at BEFORE UPDATE ON public.dogs FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trg_user_dog_entries_updated_at ON public.user_dog_entries;
CREATE TRIGGER trg_user_dog_entries_updated_at BEFORE UPDATE ON public.user_dog_entries FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_name text;
  v_catalog integer;
BEGIN
  v_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1),
    'Treinador'
  );

  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id, v_name, NEW.raw_user_meta_data ->> 'avatar_url')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_biscuit_wallets (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;

  SELECT COUNT(*)::integer INTO v_catalog FROM public.dogs WHERE is_active = true;

  INSERT INTO public.user_dogdex_stats (user_id, catalog_total)
  VALUES (NEW.id, COALESCE(v_catalog, 0))
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.refresh_user_dogdex_stats(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_catalog integer;
  v_captured integer;
  v_discovered integer;
  v_shiny integer;
  v_scans integer;
BEGIN
  SELECT COUNT(*)::integer INTO v_catalog FROM public.dogs WHERE is_active = true;

  SELECT
    COUNT(*) FILTER (WHERE is_captured),
    COUNT(*) FILTER (WHERE first_seen_at IS NOT NULL OR is_captured),
    COUNT(*) FILTER (WHERE is_shiny),
    COALESCE(SUM(scan_count), 0)::integer
  INTO v_captured, v_discovered, v_shiny, v_scans
  FROM public.user_dog_entries WHERE user_id = p_user_id;

  INSERT INTO public.user_dogdex_stats (
    user_id, total_discovered, total_captured, total_shiny,
    total_scans, catalog_total, completion_percent, updated_at
  ) VALUES (
    p_user_id, v_discovered, v_captured, v_shiny, v_scans, v_catalog,
    CASE WHEN v_catalog > 0 THEN ROUND((v_captured::numeric / v_catalog) * 100, 2) ELSE 0 END,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_discovered = EXCLUDED.total_discovered,
    total_captured = EXCLUDED.total_captured,
    total_shiny = EXCLUDED.total_shiny,
    total_scans = EXCLUDED.total_scans,
    catalog_total = EXCLUDED.catalog_total,
    completion_percent = EXCLUDED.completion_percent,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_biscuit_wallet(p_user_id uuid)
RETURNS public.user_biscuit_wallets LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  w public.user_biscuit_wallets;
  v_daily smallint;
  v_weekly smallint;
  v_week_start date;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN RAISE EXCEPTION 'forbidden'; END IF;

  SELECT (value ->> 'normal_daily')::smallint, (value ->> 'premium_weekly')::smallint
  INTO v_daily, v_weekly FROM public.game_settings WHERE key = 'biscuit_allowances';

  v_daily := COALESCE(v_daily, 5);
  v_weekly := COALESCE(v_weekly, 2);
  v_week_start := date_trunc('week', CURRENT_DATE)::date;

  SELECT * INTO w FROM public.user_biscuit_wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.user_biscuit_wallets (user_id) VALUES (p_user_id) RETURNING * INTO w;
  END IF;

  IF w.normal_last_reset_at < CURRENT_DATE THEN
    UPDATE public.user_biscuit_wallets SET
      normal_balance = w.normal_daily_allowance, normal_last_reset_at = CURRENT_DATE, updated_at = now()
    WHERE user_id = p_user_id RETURNING * INTO w;
    INSERT INTO public.biscuit_transactions (user_id, biscuit_type, amount, balance_after, reason)
    VALUES (p_user_id, 'normal', w.normal_daily_allowance, w.normal_balance, 'daily_reset');
  END IF;

  IF w.premium_last_weekly_at IS NULL OR w.premium_last_weekly_at < v_week_start THEN
    UPDATE public.user_biscuit_wallets SET
      premium_balance = premium_balance + w.premium_weekly_allowance,
      premium_last_weekly_at = CURRENT_DATE, updated_at = now()
    WHERE user_id = p_user_id RETURNING * INTO w;
    INSERT INTO public.biscuit_transactions (user_id, biscuit_type, amount, balance_after, reason)
    VALUES (p_user_id, 'premium', w.premium_weekly_allowance, w.premium_balance, 'weekly_reward');
  END IF;

  RETURN w;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_qr_encounter(p_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid;
  v_qr public.dog_qr_codes%ROWTYPE;
  v_dog public.dogs%ROWTYPE;
  v_entry public.user_dog_entries%ROWTYPE;
  v_rates jsonb;
  v_personality jsonb;
  v_rarity jsonb;
  v_normal_rate numeric;
  v_premium_rate numeric;
  v_found boolean := false;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT * INTO v_qr FROM public.dog_qr_codes WHERE token = upper(trim(p_token)) AND is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'invalid_qr'; END IF;

  SELECT * INTO v_dog FROM public.dogs WHERE id = v_qr.dog_id AND is_active = true;

  SELECT * INTO v_entry FROM public.user_dog_entries WHERE user_id = v_uid AND dog_id = v_dog.id;
  v_found := FOUND;

  SELECT value INTO v_rates FROM public.game_settings WHERE key = 'capture_rates';
  SELECT value INTO v_personality FROM public.game_settings WHERE key = 'personality_modifiers';
  SELECT value INTO v_rarity FROM public.game_settings WHERE key = 'rarity_modifiers';

  v_normal_rate := LEAST((v_rates ->> 'normal')::numeric * (v_personality ->> v_dog.personality::text)::numeric * (v_rarity ->> v_dog.rarity::text)::numeric, 0.99);
  v_premium_rate := LEAST((v_rates ->> 'premium')::numeric * (v_personality ->> v_dog.personality::text)::numeric * (v_rarity ->> v_dog.rarity::text)::numeric, 0.99);

  IF NOT v_found THEN
    INSERT INTO public.user_dog_entries (user_id, dog_id, first_seen_at, last_encounter_at, scan_count)
    VALUES (v_uid, v_dog.id, now(), now(), 0);
  ELSE
    UPDATE public.user_dog_entries SET first_seen_at = COALESCE(first_seen_at, now()), last_encounter_at = now()
    WHERE user_id = v_uid AND dog_id = v_dog.id;
  END IF;

  PERFORM public.refresh_user_dogdex_stats(v_uid);

  RETURN jsonb_build_object(
    'qr', jsonb_build_object('id', v_qr.id, 'token', v_qr.token, 'label', v_qr.label),
    'dog', jsonb_build_object('id', v_dog.id, 'dex_number', v_dog.dex_number, 'name', v_dog.name, 'breed', v_dog.breed, 'age_years', v_dog.age_years, 'description', v_dog.description, 'personality', v_dog.personality, 'rarity', v_dog.rarity, 'emoji', v_dog.emoji),
    'owned', CASE WHEN v_found THEN v_entry.is_captured ELSE false END,
    'is_shiny', CASE WHEN v_found THEN v_entry.is_shiny ELSE false END,
    'scan_count', CASE WHEN v_found THEN v_entry.scan_count ELSE 0 END,
    'evolution_stage', CASE WHEN v_found THEN v_entry.evolution_stage ELSE 0 END,
    'catch_rates', jsonb_build_object('normal', v_normal_rate, 'premium', v_premium_rate)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.attempt_capture(p_token text, p_biscuit_type text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid;
  v_qr public.dog_qr_codes%ROWTYPE;
  v_dog public.dogs%ROWTYPE;
  v_entry public.user_dog_entries%ROWTYPE;
  v_wallet public.user_biscuit_wallets%ROWTYPE;
  v_rates jsonb;
  v_personality_mod jsonb;
  v_rarity_mod jsonb;
  v_shiny_chance numeric;
  v_evolution_scans integer;
  v_base numeric;
  v_p_mod numeric;
  v_r_mod numeric;
  v_final numeric;
  v_roll numeric;
  v_shiny_roll numeric;
  v_success boolean;
  v_shiny boolean := false;
  v_result public.capture_result;
  v_new_stage smallint;
  v_attempt_id uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_biscuit_type NOT IN ('normal', 'premium') THEN RAISE EXCEPTION 'invalid_biscuit_type'; END IF;

  PERFORM public.sync_biscuit_wallet(v_uid);
  SELECT * INTO v_wallet FROM public.user_biscuit_wallets WHERE user_id = v_uid FOR UPDATE;

  IF p_biscuit_type = 'normal' AND v_wallet.normal_balance < 1 THEN RAISE EXCEPTION 'no_normal_biscuits'; END IF;
  IF p_biscuit_type = 'premium' AND v_wallet.premium_balance < 1 THEN RAISE EXCEPTION 'no_premium_biscuits'; END IF;

  SELECT * INTO v_qr FROM public.dog_qr_codes WHERE token = upper(trim(p_token)) AND is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'invalid_qr'; END IF;

  SELECT * INTO v_dog FROM public.dogs WHERE id = v_qr.dog_id;

  SELECT * INTO v_entry FROM public.user_dog_entries WHERE user_id = v_uid AND dog_id = v_dog.id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.user_dog_entries (user_id, dog_id, first_seen_at, last_encounter_at)
    VALUES (v_uid, v_dog.id, now(), now()) RETURNING * INTO v_entry;
  END IF;

  IF v_entry.is_captured THEN
    UPDATE public.user_dog_entries SET scan_count = scan_count + 1, last_encounter_at = now() WHERE id = v_entry.id RETURNING * INTO v_entry;
    v_evolution_scans := (SELECT (value #>> '{}')::integer FROM public.game_settings WHERE key = 'evolution_scans');
    IF v_entry.scan_count >= v_evolution_scans AND v_entry.evolution_stage < v_dog.max_evolution_stage THEN
      v_new_stage := LEAST(v_entry.evolution_stage + 1, v_dog.max_evolution_stage);
      UPDATE public.user_dog_entries SET evolution_stage = v_new_stage WHERE id = v_entry.id;
      v_entry.evolution_stage := v_new_stage;
    END IF;
    PERFORM public.refresh_user_dogdex_stats(v_uid);
    RETURN jsonb_build_object('result', 'already_owned', 'success', false, 'message', 'Você já capturou este doguinho! Escaneio contado para evolução.', 'scan_count', v_entry.scan_count, 'evolution_stage', v_entry.evolution_stage);
  END IF;

  SELECT value INTO v_rates FROM public.game_settings WHERE key = 'capture_rates';
  SELECT value INTO v_personality_mod FROM public.game_settings WHERE key = 'personality_modifiers';
  SELECT value INTO v_rarity_mod FROM public.game_settings WHERE key = 'rarity_modifiers';
  SELECT (value #>> '{}')::numeric INTO v_shiny_chance FROM public.game_settings WHERE key = 'shiny_chance';
  SELECT (value #>> '{}')::integer INTO v_evolution_scans FROM public.game_settings WHERE key = 'evolution_scans';

  v_base := (v_rates ->> p_biscuit_type)::numeric;
  v_p_mod := (v_personality_mod ->> v_dog.personality::text)::numeric;
  v_r_mod := (v_rarity_mod ->> v_dog.rarity::text)::numeric;
  v_final := LEAST(v_base * v_p_mod * v_r_mod, 0.99);
  v_roll := random();
  v_success := v_roll <= v_final;

  IF v_success THEN
    v_shiny_roll := random();
    v_shiny := v_shiny_roll <= COALESCE(v_shiny_chance, 0.05);
    v_result := 'captured';
    UPDATE public.user_dog_entries SET is_captured = true, is_shiny = v_shiny, captured_at = now(), last_encounter_at = now(), scan_count = scan_count + 1, evolution_stage = GREATEST(evolution_stage, 1), first_seen_at = COALESCE(first_seen_at, now()) WHERE id = v_entry.id RETURNING * INTO v_entry;
  ELSE
    v_result := 'miss';
    UPDATE public.user_dog_entries SET last_encounter_at = now(), scan_count = scan_count + 1, first_seen_at = COALESCE(first_seen_at, now()) WHERE id = v_entry.id RETURNING * INTO v_entry;
  END IF;

  IF p_biscuit_type = 'normal' THEN
    UPDATE public.user_biscuit_wallets SET normal_balance = normal_balance - 1, updated_at = now() WHERE user_id = v_uid RETURNING * INTO v_wallet;
    INSERT INTO public.biscuit_transactions (user_id, biscuit_type, amount, balance_after, reason) VALUES (v_uid, 'normal', -1, v_wallet.normal_balance, 'capture_attempt');
  ELSE
    UPDATE public.user_biscuit_wallets SET premium_balance = premium_balance - 1, updated_at = now() WHERE user_id = v_uid RETURNING * INTO v_wallet;
    INSERT INTO public.biscuit_transactions (user_id, biscuit_type, amount, balance_after, reason) VALUES (v_uid, 'premium', -1, v_wallet.premium_balance, 'capture_attempt');
  END IF;

  INSERT INTO public.capture_attempts (user_id, dog_id, qr_code_id, biscuit_type, base_catch_rate, personality_modifier, rarity_modifier, final_catch_rate, roll_value, shiny_roll_value, result, became_shiny)
  VALUES (v_uid, v_dog.id, v_qr.id, p_biscuit_type::public.biscuit_type, v_base, v_p_mod, v_r_mod, v_final, v_roll, CASE WHEN v_success THEN v_shiny_roll ELSE NULL END, v_result, v_shiny)
  RETURNING id INTO v_attempt_id;

  INSERT INTO public.community_goal_events (goal_id, user_id, event_type)
  SELECT id, v_uid, CASE WHEN v_success THEN 'capture' ELSE 'scan' END FROM public.community_goals WHERE slug = 'campus-feed-2026' AND is_active = true LIMIT 1;

  UPDATE public.community_goals SET current_count = current_count + 1 WHERE slug = 'campus-feed-2026' AND is_active = true;

  PERFORM public.refresh_user_dogdex_stats(v_uid);

  RETURN jsonb_build_object(
    'result', v_result::text, 'success', v_success, 'became_shiny', v_shiny, 'final_catch_rate', v_final, 'roll_value', v_roll,
    'message', CASE WHEN v_success AND v_shiny THEN 'Capturado! ✨ Versão Shiny desbloqueada!' WHEN v_success THEN 'Capturado! Novo doguinho na sua DogDex!' ELSE 'O doguinho escapou! Tente outro biscoito.' END,
    'wallet', jsonb_build_object('normal', v_wallet.normal_balance, 'premium', v_wallet.premium_balance),
    'dog', jsonb_build_object('id', v_dog.id, 'name', v_dog.name, 'emoji', v_dog.emoji, 'dex_number', v_dog.dex_number),
    'attempt_id', v_attempt_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_qr_encounter(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.attempt_capture(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_biscuit_wallet(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. SEED — 12 cachorros, QR codes, evoluções, meta
-- ---------------------------------------------------------------------------
INSERT INTO public.dogs (dex_number, name, slug, breed, age_years, description, personality, rarity, emoji) VALUES
  (1, 'Rex', 'rex', 'Vira-lata', 3.0, 'Guardião do pátio central. Adora correr atrás da bola.', 'bold', 'common', '🐕'),
  (2, 'Thor', 'thor', 'Golden Retriever', 5.0, 'O professor favorito dos alunos na biblioteca.', 'playful', 'rare', '🦮'),
  (3, 'Luna', 'luna', 'Poodle', 2.0, 'Elegante e tímida. Aparece ao entardecer no jardim.', 'shy', 'rare', '🐩'),
  (4, 'Mel', 'mel', 'Shih Tzu', 4.0, 'Pequena e cheia de energia no bloco B.', 'energetic', 'common', '🐶'),
  (5, 'Bob', 'bob', 'Labrador', 6.0, 'Ex-mascote do time de vôlei do campus.', 'playful', 'epic', '🐕‍🦺'),
  (6, 'Nina', 'nina', 'SRD', 1.5, 'Filhote curiosa que explora cada mochila nova.', 'curious', 'common', '🐾'),
  (7, 'Zeus', 'zeus', 'Pastor Alemão', 7.0, 'Vigia o estacionamento com seriedade.', 'calm', 'epic', '🦴'),
  (8, 'Pipoca', 'pipoca', 'Maltês', 2.5, 'Branca como nuvem. Aparece perto da cantina.', 'lazy', 'rare', '☁️'),
  (9, 'Caramelo', 'caramelo', 'Vira-lata', 4.0, 'Lenda do campus. O mais fotografado.', 'bold', 'legendary', '🌟'),
  (10, 'Bolinha', 'bolinha', 'Bulldog Francês', 3.0, 'Ronca durante as aulas no auditório.', 'lazy', 'rare', '🐶'),
  (11, 'Frajola', 'frajola', 'Border Collie', 5.5, 'Inteligente demais. Já aprendeu a abrir portas.', 'curious', 'epic', '🎾'),
  (12, 'Buddy', 'buddy', 'Beagle', 2.0, 'Fareja lanches a quilômetros na cantina.', 'playful', 'common', '🦴')
ON CONFLICT (dex_number) DO NOTHING;

INSERT INTO public.dog_qr_codes (dog_id, token, label, location_hint)
SELECT d.id, 'CAMPUS-' || LPAD(d.dex_number::text, 3, '0'), d.name || ' — coleira', 'Campus'
FROM public.dogs d
ON CONFLICT (token) DO NOTHING;

INSERT INTO public.dog_evolution_stages (dog_id, stage, stage_name, scans_required, emoji, description)
SELECT d.id, s.stage, s.stage_name, s.scans_required, d.emoji, s.description
FROM public.dogs d
CROSS JOIN (
  VALUES
    (1::smallint, 'Filhote', 0::smallint, 'Forma inicial'),
    (2::smallint, 'Adulto', 3::smallint, 'Após 3 encontros'),
    (3::smallint, 'Lendário', 6::smallint, 'Coleção dedicada')
) AS s(stage, stage_name, scans_required, description)
ON CONFLICT (dog_id, stage) DO NOTHING;

INSERT INTO public.community_goals (slug, title, description, target_count, current_count)
VALUES ('campus-feed-2026', 'Meta: ração para o campus', 'Cada captura e scan ajuda a alimentar os doguinhos.', 1000, 0)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- FIM — RPCs usadas pelo app: resolve_qr_encounter, attempt_capture, sync_biscuit_wallet
-- QR de teste: CAMPUS-001 … CAMPUS-012
-- =============================================================================
