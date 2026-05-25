import type { BiscuitType, Dog, EncounterData, Personality, Rarity } from "@/types/database";

export const GAME_RULES = {
  captureRates: { normal: 0.3, premium: 0.75 },
  shinyChance: 0.05,
  evolutionScans: 3,
  normalDaily: 5,
  premiumWeekly: 2,
  personalityModifiers: {
    playful: 1.05,
    calm: 1.0,
    shy: 0.9,
    bold: 1.1,
    curious: 1.05,
    lazy: 0.85,
    energetic: 1.08,
  } satisfies Record<Personality, number>,
  rarityModifiers: {
    common: 1.1,
    rare: 1.0,
    epic: 0.85,
    legendary: 0.7,
  } satisfies Record<Rarity, number>,
};

export function calcCatchRate(dog: Dog, biscuit: BiscuitType): number {
  const base = GAME_RULES.captureRates[biscuit];
  const p = GAME_RULES.personalityModifiers[dog.personality];
  const r = GAME_RULES.rarityModifiers[dog.rarity];
  return Math.min(base * p * r, 0.99);
}

export function buildEncounter(dog: Dog, owned: boolean, entry?: {
  is_shiny: boolean;
  scan_count: number;
  evolution_stage: number;
}): EncounterData {
  return {
    qr: { id: `qr-${dog.dex_number}`, token: `CAMPUS-${String(dog.dex_number).padStart(3, "0")}`, label: `${dog.name} — coleira` },
    dog: {
      id: dog.id,
      dex_number: dog.dex_number,
      name: dog.name,
      breed: dog.breed,
      age_years: dog.age_years,
      description: dog.description,
      personality: dog.personality,
      rarity: dog.rarity,
      emoji: dog.emoji,
    },
    owned,
    is_shiny: entry?.is_shiny ?? false,
    scan_count: entry?.scan_count ?? 0,
    evolution_stage: entry?.evolution_stage ?? 0,
    catch_rates: {
      normal: calcCatchRate(dog, "normal"),
      premium: calcCatchRate(dog, "premium"),
    },
  };
}

export function rollCapture(rate: number): { success: boolean; roll: number } {
  const roll = Math.random();
  return { success: roll <= rate, roll };
}

export function rollShiny(): boolean {
  return Math.random() <= GAME_RULES.shinyChance;
}

export function weekStartISO(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
