-- Dados iniciais: 12 cachorros, QR codes, evoluções, meta

INSERT INTO public.dogs (
  dex_number, name, slug, breed, age_years, description, personality, rarity, emoji
) VALUES
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
VALUES (
  'campus-feed-2026',
  'Meta: ração para o campus',
  'Cada captura e scan ajuda a alimentar os doguinhos.',
  1000,
  0
)
ON CONFLICT (slug) DO NOTHING;
