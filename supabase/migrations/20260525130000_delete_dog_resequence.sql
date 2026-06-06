-- Exclui (hard delete) um dog e resequencia os números da Pokédex

CREATE OR REPLACE FUNCTION public.admin_delete_dog_and_resequence(p_dog_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_uid uuid;
  v_catalog integer;
BEGIN
  v_uid := auth.uid();

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = v_uid AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  DELETE FROM public.dogs
  WHERE id = p_dog_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE public.dogs
  SET dex_number = dex_number + 10000,
      updated_at = now()
  WHERE is_active = true;

  WITH ordered AS (
    SELECT
      id,
      row_number() OVER (ORDER BY dex_number, created_at, id)::smallint AS new_dex
    FROM public.dogs
    WHERE is_active = true
  )
  UPDATE public.dogs d
  SET dex_number = o.new_dex,
      updated_at = now()
  FROM ordered o
  WHERE d.id = o.id;

  SELECT COUNT(*)::integer INTO v_catalog
  FROM public.dogs
  WHERE is_active = true;

  UPDATE public.user_dogdex_stats
  SET catalog_total = v_catalog,
      completion_percent = CASE
        WHEN v_catalog > 0 THEN ROUND((total_captured::numeric / v_catalog) * 100, 2)
        ELSE 0
      END,
      updated_at = now();

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_dog_and_resequence(uuid) TO authenticated;
