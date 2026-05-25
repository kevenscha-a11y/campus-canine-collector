-- Configura bucket e políticas de storage para sprites dos dogs

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dog-sprites',
  'dog-sprites',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "dog_sprites_public_read" ON storage.objects;
CREATE POLICY "dog_sprites_public_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'dog-sprites');

DROP POLICY IF EXISTS "dog_sprites_admin_insert" ON storage.objects;
CREATE POLICY "dog_sprites_admin_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'dog-sprites'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "dog_sprites_admin_update" ON storage.objects;
CREATE POLICY "dog_sprites_admin_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'dog-sprites'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'dog-sprites'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "dog_sprites_admin_delete" ON storage.objects;
CREATE POLICY "dog_sprites_admin_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'dog-sprites'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
