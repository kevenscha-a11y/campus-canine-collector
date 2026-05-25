export type Rarity = "common" | "rare" | "epic" | "legendary";
export type Personality =
  | "playful"
  | "calm"
  | "shy"
  | "bold"
  | "curious"
  | "lazy"
  | "energetic";
export type BiscuitType = "normal" | "premium";

export interface Dog {
  id: string;
  dex_number: number;
  name: string;
  slug: string;
  breed: string;
  age_years: number | null;
  description: string;
  personality: Personality;
  rarity: Rarity;
  emoji: string;
  max_evolution_stage: number;
}

export interface UserDogEntry {
  id: string;
  user_id: string;
  dog_id: string;
  is_captured: boolean;
  is_shiny: boolean;
  scan_count: number;
  evolution_stage: number;
  first_seen_at: string | null;
  captured_at: string | null;
  last_encounter_at: string | null;
  dogs?: Dog;
}

export interface BiscuitWallet {
  normal_balance: number;
  premium_balance: number;
  normal_last_reset_at: string;
  premium_last_weekly_at: string | null;
}

export interface DogDexStats {
  total_discovered: number;
  total_captured: number;
  total_shiny: number;
  total_scans: number;
  catalog_total: number;
  completion_percent: number;
}

export interface EncounterData {
  qr: { id: string; token: string; label: string | null };
  dog: {
    id: string;
    dex_number: number;
    name: string;
    breed: string;
    age_years: number | null;
    description: string;
    personality: Personality;
    rarity: Rarity;
    emoji: string;
  };
  owned: boolean;
  is_shiny: boolean;
  scan_count: number;
  evolution_stage: number;
  catch_rates: { normal: number; premium: number };
}

export interface CaptureResult {
  result: string;
  success: boolean;
  became_shiny?: boolean;
  final_catch_rate: number;
  roll_value: number;
  message: string;
  wallet?: { normal: number; premium: number };
  dog?: { id: string; name: string; emoji: string; dex_number: number };
  scan_count?: number;
  evolution_stage?: number;
}

export type Database = {
  public: {
    Tables: Record<string, unknown>;
    Functions: {
      resolve_qr_encounter: { Args: { p_token: string }; Returns: EncounterData };
      attempt_capture: {
        Args: { p_token: string; p_biscuit_type: string };
        Returns: CaptureResult;
      };
      sync_biscuit_wallet: { Args: { p_user_id: string }; Returns: BiscuitWallet };
    };
  };
};
