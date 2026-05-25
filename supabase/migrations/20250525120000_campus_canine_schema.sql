-- Campus Canine Collector — Supabase (schema public + auth.users)
-- Rode no SQL Editor do Supabase, nesta ordem, após a tabela public.todos existir.

-- ---------------------------------------------------------------------------
-- Tipos
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
-- Perfil (estende auth.users — login, Google, reset e e-mail via Supabase Auth)
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Catálogo de cachorros
-- ---------------------------------------------------------------------------
CREATE TABLE public.dogs (
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

CREATE TABLE public.dog_evolution_stages (
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

CREATE TABLE public.dog_qr_codes (
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

CREATE INDEX idx_dog_qr_codes_token ON public.dog_qr_codes (token) WHERE is_active = true;

-- ---------------------------------------------------------------------------
-- DogDex por usuário
-- ---------------------------------------------------------------------------
CREATE TABLE public.user_dog_entries (
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

CREATE INDEX idx_user_dog_entries_user ON public.user_dog_entries (user_id);

CREATE TABLE public.capture_attempts (
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

CREATE TABLE public.user_dogdex_stats (
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

-- ---------------------------------------------------------------------------
-- Biscoitos
-- ---------------------------------------------------------------------------
CREATE TABLE public.user_biscuit_wallets (
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

CREATE TABLE public.biscuit_transactions (
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

-- ---------------------------------------------------------------------------
-- Meta comunitária e balanceamento
-- ---------------------------------------------------------------------------
CREATE TABLE public.community_goals (
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

CREATE TABLE public.community_goal_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.community_goals (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  event_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT community_goal_events_pkey PRIMARY KEY (id)
);

CREATE TABLE public.game_settings (
  key text NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT game_settings_pkey PRIMARY KEY (key)
);

INSERT INTO public.game_settings (key, value, description) VALUES
  ('capture_rates', '{"normal": 0.30, "premium": 0.75}', 'Chance base por biscoito'),
  ('shiny_chance', '0.05', 'Chance de shiny na captura'),
  ('evolution_scans', '3', 'Escaneios para evoluir'),
  ('personality_modifiers', '{"playful":1.05,"calm":1.00,"shy":0.90,"bold":1.10,"curious":1.05,"lazy":0.85,"energetic":1.08}', 'Modificador de captura'),
  ('rarity_modifiers', '{"common":1.10,"rare":1.00,"epic":0.85,"legendary":0.70}', 'Modificador de captura'),
  ('biscuit_allowances', '{"normal_daily":5,"premium_weekly":2}', 'Reset diário e semanal')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
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

CREATE POLICY "dogs_read_authenticated" ON public.dogs
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "dog_evolution_read" ON public.dog_evolution_stages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "dog_qr_read" ON public.dog_qr_codes
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "user_dog_entries_own" ON public.user_dog_entries
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "capture_attempts_select_own" ON public.capture_attempts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "dogdex_stats_own" ON public.user_dogdex_stats
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "biscuit_wallet_own" ON public.user_biscuit_wallets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "biscuit_tx_select_own" ON public.biscuit_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "community_goals_read" ON public.community_goals
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "community_events_insert_own" ON public.community_goal_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "game_settings_read" ON public.game_settings
  FOR SELECT TO authenticated USING (true);
