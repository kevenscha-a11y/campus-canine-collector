-- Adiciona suporte a roles (user, admin) para controle de permissões

-- Criar enum de roles
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Adicionar coluna role à tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role public.user_role NOT NULL DEFAULT 'user';

-- Criar índice para queries de admin
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role) WHERE role = 'admin';

-- Atualizar políticas RLS para dogs permitir CRUD por admin
DROP POLICY IF EXISTS "dogs_read_authenticated" ON public.dogs;

CREATE POLICY "dogs_read_authenticated" ON public.dogs
  FOR SELECT TO authenticated USING (is_active = true);

-- Política para inserir dogs (apenas admin)
CREATE POLICY "dogs_insert_admin" ON public.dogs
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para atualizar dogs (apenas admin)
CREATE POLICY "dogs_update_admin" ON public.dogs
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para deletar dogs (apenas admin)
CREATE POLICY "dogs_delete_admin" ON public.dogs
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para dog_qr_codes (inserir/atualizar apenas admin)
DROP POLICY IF EXISTS "dog_qr_read" ON public.dog_qr_codes;

CREATE POLICY "dog_qr_read" ON public.dog_qr_codes
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "dog_qr_insert_admin" ON public.dog_qr_codes
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "dog_qr_update_admin" ON public.dog_qr_codes
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "dog_qr_delete_admin" ON public.dog_qr_codes
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para dog_evolution_stages (inserir/atualizar apenas admin)
DROP POLICY IF EXISTS "dog_evolution_read" ON public.dog_evolution_stages;

CREATE POLICY "dog_evolution_read" ON public.dog_evolution_stages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "dog_evolution_insert_admin" ON public.dog_evolution_stages
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "dog_evolution_update_admin" ON public.dog_evolution_stages
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "dog_evolution_delete_admin" ON public.dog_evolution_stages
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
