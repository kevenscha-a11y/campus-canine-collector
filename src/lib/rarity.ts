import type { Personality, Rarity } from "@/types/database";

export const RARITY_LABELS: Record<Rarity, string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
};

export const RARITY_CLASS: Record<Rarity, string> = {
  common: "text-rarity-common",
  rare: "text-rarity-rare",
  epic: "text-rarity-epic",
  legendary: "text-rarity-legendary",
};

export const PERSONALITY_LABELS: Record<Personality, string> = {
  playful: "Brincalhão",
  calm: "Calmo",
  shy: "Tímido",
  bold: "Ousado",
  curious: "Curioso",
  lazy: "Preguiçoso",
  energetic: "Energético",
};
