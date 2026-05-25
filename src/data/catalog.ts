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

// Removed example DOG_CATALOG data. The app should rely on the remote
// Supabase database for real catalog data. Keep helpers but they return
// undefined when no local fallback is available.

export const DOG_CATALOG: CatalogDog[] = [];

export function findDogByQrToken(_token: string): CatalogDog | undefined {
  return undefined;
}

export function findDogById(_id: string): CatalogDog | undefined {
  return undefined;
}
