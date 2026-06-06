import type { Dog, Personality, Rarity } from "@/types/database";

type CatalogDog = Dog & { qr_token: string; is_active?: boolean };

const def = (
  dex: number,
  name: string,
  breed: string,
  age: number,
  description: string,
  personality: Personality,
  rarity: Rarity,
  emoji: string,
): CatalogDog => ({
  id: `dog-${name.toLowerCase()}`,
  dex_number: dex,
  name,
  slug: name.toLowerCase(),
  breed,
  age_years: age,
  description,
  personality,
  rarity,
  emoji,
  max_evolution_stage: 3,
  qr_token: `CAMPUS-${String(dex).padStart(3, "0")}`,
  is_active: true,
});

export const DOG_CATALOG: CatalogDog[] = [
  def(1, "Rex", "Vira-lata", 3, "Guardião do pátio central. Adora correr atrás da bola.", "bold", "common", "🐕"),
  def(2, "Thor", "Golden Retriever", 5, "O professor favorito dos alunos na biblioteca.", "playful", "rare", "🦮"),
  def(3, "Luna", "Poodle", 2, "Elegante e tímida. Aparece ao entardecer no jardim.", "shy", "rare", "🐩"),
  def(4, "Mel", "Shih Tzu", 4, "Pequena e cheia de energia no bloco B.", "energetic", "common", "🐶"),
  def(5, "Bob", "Labrador", 6, "Ex-mascote do time de vôlei do campus.", "playful", "epic", "🐕‍🦺"),
  def(6, "Nina", "SRD", 1.5, "Filhote curiosa que explora cada mochila nova.", "curious", "common", "🐾"),
  def(7, "Zeus", "Pastor Alemão", 7, "Vigia o estacionamento com seriedade.", "calm", "epic", "🦴"),
  def(8, "Pipoca", "Maltês", 2.5, "Branca como nuvem. Aparece perto da cantina.", "lazy", "rare", "☁️"),
  def(9, "Caramelo", "Vira-lata", 4, "Lenda do campus. O mais fotografado.", "bold", "legendary", "🌟"),
  def(10, "Bolinha", "Bulldog Francês", 3, "Ronca durante as aulas no auditório.", "lazy", "rare", "🐶"),
  def(11, "Frajola", "Border Collie", 5.5, "Inteligente demais. Já aprendeu a abrir portas.", "curious", "epic", "🎾"),
  def(12, "Buddy", "Beagle", 2, "Fareja lanches a quilômetros na cantina.", "playful", "common", "🦴"),
];

export function findDogByQrToken(token: string): CatalogDog | undefined {
  const normalized = token.trim().toUpperCase();
  return DOG_CATALOG.find((d) => d.qr_token === normalized);
}

export function findDogById(id: string): CatalogDog | undefined {
  return DOG_CATALOG.find((d) => d.id === id);
}
