-- Funções, triggers e RPC de jogo (Supabase)

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER trg_dogs_updated_at
  BEFORE UPDATE ON public.dogs
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER trg_user_dog_entries_updated_at
  BEFORE UPDATE ON public.user_dog_entries
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Novo usuário: perfil, carteira e stats
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
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
  VALUES (
    NEW.id,
    v_name,
    NEW.raw_user_meta_data ->> 'avatar_url'
  );

  INSERT INTO public.user_biscuit_wallets (user_id) VALUES (NEW.id);

  SELECT COUNT(*)::integer INTO v_catalog FROM public.dogs WHERE is_active = true;

  INSERT INTO public.user_dogdex_stats (user_id, catalog_total)
  VALUES (NEW.id, COALESCE(v_catalog, 0));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.refresh_user_dogdex_stats(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  FROM public.user_dog_entries
  WHERE user_id = p_user_id;

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

-- Reset diário (normal) e semanal (premium)
CREATE OR REPLACE FUNCTION public.sync_biscuit_wallet(p_user_id uuid)
RETURNS public.user_biscuit_wallets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  w public.user_biscuit_wallets;
  v_daily smallint;
  v_weekly smallint;
  v_week_start date;
BEGIN
  SELECT (value ->> 'normal_daily')::smallint,
         (value ->> 'premium_weekly')::smallint
  INTO v_daily, v_weekly
  FROM public.game_settings
  WHERE key = 'biscuit_allowances';

  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  v_daily := COALESCE(v_daily, 5);
  v_weekly := COALESCE(v_weekly, 2);
  v_week_start := date_trunc('week', CURRENT_DATE)::date;

  SELECT * INTO w FROM public.user_biscuit_wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.user_biscuit_wallets (user_id) VALUES (p_user_id)
    RETURNING * INTO w;
  END IF;

  IF w.normal_last_reset_at < CURRENT_DATE THEN
    UPDATE public.user_biscuit_wallets SET
      normal_balance = w.normal_daily_allowance,
      normal_last_reset_at = CURRENT_DATE,
      updated_at = now()
    WHERE user_id = p_user_id
    RETURNING * INTO w;

    INSERT INTO public.biscuit_transactions (user_id, biscuit_type, amount, balance_after, reason)
    VALUES (p_user_id, 'normal', w.normal_daily_allowance, w.normal_balance, 'daily_reset');
  END IF;

  IF w.premium_last_weekly_at IS NULL OR w.premium_last_weekly_at < v_week_start THEN
    UPDATE public.user_biscuit_wallets SET
      premium_balance = premium_balance + w.premium_weekly_allowance,
      premium_last_weekly_at = CURRENT_DATE,
      updated_at = now()
    WHERE user_id = p_user_id
    RETURNING * INTO w;

    INSERT INTO public.biscuit_transactions (user_id, biscuit_type, amount, balance_after, reason)
    VALUES (p_user_id, 'premium', w.premium_weekly_allowance, w.premium_balance, 'weekly_reward');
  END IF;

  RETURN w;
END;
$$;

-- Resolver QR → dados do encontro
CREATE OR REPLACE FUNCTION public.resolve_qr_encounter(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO v_qr FROM public.dog_qr_codes
  WHERE token = upper(trim(p_token)) AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_qr';
  END IF;

  SELECT * INTO v_dog FROM public.dogs WHERE id = v_qr.dog_id AND is_active = true;

  SELECT * INTO v_entry FROM public.user_dog_entries
  WHERE user_id = v_uid AND dog_id = v_dog.id;

  SELECT value INTO v_rates FROM public.game_settings WHERE key = 'capture_rates';
  SELECT value INTO v_personality FROM public.game_settings WHERE key = 'personality_modifiers';
  SELECT value INTO v_rarity FROM public.game_settings WHERE key = 'rarity_modifiers';

  v_normal_rate := (v_rates ->> 'normal')::numeric
    * (v_personality ->> v_dog.personality::text)::numeric
    * (v_rarity ->> v_dog.rarity::text)::numeric;
  v_premium_rate := (v_rates ->> 'premium')::numeric
    * (v_personality ->> v_dog.personality::text)::numeric
    * (v_rarity ->> v_dog.rarity::text)::numeric;

  v_normal_rate := LEAST(v_normal_rate, 0.99);
  v_premium_rate := LEAST(v_premium_rate, 0.99);

  -- Registrar “visto” sem captura
  IF v_entry.id IS NULL THEN
    INSERT INTO public.user_dog_entries (user_id, dog_id, first_seen_at, last_encounter_at, scan_count)
    VALUES (v_uid, v_dog.id, now(), now(), 0);
  ELSE
    UPDATE public.user_dog_entries SET
      first_seen_at = COALESCE(first_seen_at, now()),
      last_encounter_at = now()
    WHERE user_id = v_uid AND dog_id = v_dog.id;
  END IF;

  PERFORM public.refresh_user_dogdex_stats(v_uid);

  RETURN jsonb_build_object(
    'qr', jsonb_build_object('id', v_qr.id, 'token', v_qr.token, 'label', v_qr.label),
    'dog', jsonb_build_object(
      'id', v_dog.id,
      'dex_number', v_dog.dex_number,
      'name', v_dog.name,
      'breed', v_dog.breed,
      'age_years', v_dog.age_years,
      'description', v_dog.description,
      'personality', v_dog.personality,
      'rarity', v_dog.rarity,
      'emoji', v_dog.emoji
    ),
    'owned', COALESCE(v_entry.is_captured, false),
    'is_shiny', COALESCE(v_entry.is_shiny, false),
    'scan_count', COALESCE(v_entry.scan_count, 0),
    'evolution_stage', COALESCE(v_entry.evolution_stage, 0),
    'catch_rates', jsonb_build_object('normal', v_normal_rate, 'premium', v_premium_rate)
  );
END;
$$;

-- Tentativa de captura
CREATE OR REPLACE FUNCTION public.attempt_capture(p_token text, p_biscuit_type text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  IF p_biscuit_type NOT IN ('normal', 'premium') THEN
    RAISE EXCEPTION 'invalid_biscuit_type';
  END IF;

  PERFORM public.sync_biscuit_wallet(v_uid);
  SELECT * INTO v_wallet FROM public.user_biscuit_wallets WHERE user_id = v_uid FOR UPDATE;

  IF p_biscuit_type = 'normal' AND v_wallet.normal_balance < 1 THEN
    RAISE EXCEPTION 'no_normal_biscuits';
  END IF;
  IF p_biscuit_type = 'premium' AND v_wallet.premium_balance < 1 THEN
    RAISE EXCEPTION 'no_premium_biscuits';
  END IF;

  SELECT * INTO v_qr FROM public.dog_qr_codes
  WHERE token = upper(trim(p_token)) AND is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'invalid_qr'; END IF;

  SELECT * INTO v_dog FROM public.dogs WHERE id = v_qr.dog_id;

  SELECT * INTO v_entry FROM public.user_dog_entries
  WHERE user_id = v_uid AND dog_id = v_dog.id FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.user_dog_entries (user_id, dog_id, first_seen_at, last_encounter_at)
    VALUES (v_uid, v_dog.id, now(), now())
    RETURNING * INTO v_entry;
  END IF;

  IF v_entry.is_captured THEN
    UPDATE public.user_dog_entries SET
      scan_count = scan_count + 1,
      last_encounter_at = now()
    WHERE id = v_entry.id
    RETURNING * INTO v_entry;

    v_evolution_scans := (SELECT (value #>> '{}')::integer FROM public.game_settings WHERE key = 'evolution_scans');
    IF v_entry.scan_count >= v_evolution_scans AND v_entry.evolution_stage < v_dog.max_evolution_stage THEN
      v_new_stage := LEAST(v_entry.evolution_stage + 1, v_dog.max_evolution_stage);
      UPDATE public.user_dog_entries SET evolution_stage = v_new_stage WHERE id = v_entry.id;
      v_entry.evolution_stage := v_new_stage;
    END IF;

    PERFORM public.refresh_user_dogdex_stats(v_uid);

    RETURN jsonb_build_object(
      'result', 'already_owned',
      'success', false,
      'message', 'Você já capturou este doguinho! Escaneio contado para evolução.',
      'scan_count', v_entry.scan_count,
      'evolution_stage', v_entry.evolution_stage
    );
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

    UPDATE public.user_dog_entries SET
      is_captured = true,
      is_shiny = v_shiny,
      captured_at = now(),
      last_encounter_at = now(),
      scan_count = scan_count + 1,
      evolution_stage = GREATEST(evolution_stage, 1),
      first_seen_at = COALESCE(first_seen_at, now())
    WHERE id = v_entry.id
    RETURNING * INTO v_entry;
  ELSE
    v_result := 'miss';
    UPDATE public.user_dog_entries SET
      last_encounter_at = now(),
      scan_count = scan_count + 1,
      first_seen_at = COALESCE(first_seen_at, now())
    WHERE id = v_entry.id
    RETURNING * INTO v_entry;
  END IF;

  IF p_biscuit_type = 'normal' THEN
    UPDATE public.user_biscuit_wallets SET normal_balance = normal_balance - 1, updated_at = now()
    WHERE user_id = v_uid RETURNING * INTO v_wallet;
    INSERT INTO public.biscuit_transactions (user_id, biscuit_type, amount, balance_after, reason)
    VALUES (v_uid, 'normal', -1, v_wallet.normal_balance, 'capture_attempt');
  ELSE
    UPDATE public.user_biscuit_wallets SET premium_balance = premium_balance - 1, updated_at = now()
    WHERE user_id = v_uid RETURNING * INTO v_wallet;
    INSERT INTO public.biscuit_transactions (user_id, biscuit_type, amount, balance_after, reason)
    VALUES (v_uid, 'premium', -1, v_wallet.premium_balance, 'capture_attempt');
  END IF;

  INSERT INTO public.capture_attempts (
    user_id, dog_id, qr_code_id, biscuit_type,
    base_catch_rate, personality_modifier, rarity_modifier,
    final_catch_rate, roll_value, shiny_roll_value, result, became_shiny
  ) VALUES (
    v_uid, v_dog.id, v_qr.id, p_biscuit_type::public.biscuit_type,
    v_base, v_p_mod, v_r_mod, v_final, v_roll, CASE WHEN v_success THEN v_shiny_roll ELSE NULL END,
    v_result, v_shiny
  ) RETURNING id INTO v_attempt_id;

  INSERT INTO public.community_goal_events (goal_id, user_id, event_type)
  SELECT id, v_uid, CASE WHEN v_success THEN 'capture' ELSE 'scan' END
  FROM public.community_goals WHERE slug = 'campus-feed-2026' AND is_active = true LIMIT 1;

  UPDATE public.community_goals SET current_count = current_count + 1
  WHERE slug = 'campus-feed-2026' AND is_active = true;

  PERFORM public.refresh_user_dogdex_stats(v_uid);

  RETURN jsonb_build_object(
    'result', v_result::text,
    'success', v_success,
    'became_shiny', v_shiny,
    'final_catch_rate', v_final,
    'roll_value', v_roll,
    'message', CASE
      WHEN v_success AND v_shiny THEN 'Capturado! ✨ Versão Shiny desbloqueada!'
      WHEN v_success THEN 'Capturado! Novo doguinho na sua DogDex!'
      ELSE 'O doguinho escapou! Tente outro biscoito.'
    END,
    'wallet', jsonb_build_object('normal', v_wallet.normal_balance, 'premium', v_wallet.premium_balance),
    'dog', jsonb_build_object('id', v_dog.id, 'name', v_dog.name, 'emoji', v_dog.emoji, 'dex_number', v_dog.dex_number),
    'attempt_id', v_attempt_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_qr_encounter(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.attempt_capture(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_biscuit_wallet(uuid) TO authenticated;
