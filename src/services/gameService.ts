import { DOG_CATALOG } from "@/data/catalog";
import { translateGameError } from "@/lib/gameErrors";
import { extractCampusToken } from "@/lib/qrToken";
import { localGameStore } from "@/lib/localGameStore";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type {
  BiscuitWallet,
  CaptureResult,
  Dog,
  DogDexStats,
  EncounterData,
  UserDogEntry,
} from "@/types/database";
import type { CaptureHistoryItem } from "@/lib/localGameStore";

const useLocalGame =
  import.meta.env.VITE_GAME_MODE === "local" || !isSupabaseConfigured;

async function tryRemote<T>(fn: () => Promise<T>): Promise<T | null> {
  if (useLocalGame) return null;
  try {
    return await fn();
  } catch {
    return null;
  }
}

function mapDogFromRow(row: Record<string, unknown>): Dog {
  return {
    id: String(row.id),
    dex_number: Number(row.dex_number),
    name: String(row.name),
    slug: String(row.slug),
    breed: String(row.breed),
    age_years: row.age_years != null ? Number(row.age_years) : null,
    description: String(row.description),
    personality: row.personality as Dog["personality"],
    rarity: row.rarity as Dog["rarity"],
    emoji: String(row.emoji ?? "🐕"),
    max_evolution_stage: Number(row.max_evolution_stage ?? 3),
  };
}

export const gameService = {
  usesLocalGame: () => useLocalGame,

  async syncWallet(userId: string): Promise<BiscuitWallet> {
    const remote = await tryRemote(async () => {
      const { data, error } = await supabase.rpc("sync_biscuit_wallet", { p_user_id: userId });
      if (error) throw error;
      return data as BiscuitWallet;
    });
    return remote ?? localGameStore.getWallet(userId);
  },

  async getStats(userId: string): Promise<DogDexStats> {
    const remote = await tryRemote(async () => {
      const { data, error } = await supabase
        .from("user_dogdex_stats")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (error) throw error;
      return data as DogDexStats;
    });
    return remote ?? localGameStore.getStats(userId);
  },

  async getDexRows(userId: string): Promise<{ dog: Dog; entry: UserDogEntry | null }[]> {
    const remote = await tryRemote(async () => {
      const { data: dogs, error: de } = await supabase
        .from("dogs")
        .select("*")
        .eq("is_active", true)
        .order("dex_number");
      if (de) throw de;
      const { data: entries, error: ee } = await supabase
        .from("user_dog_entries")
        .select("*")
        .eq("user_id", userId);
      if (ee) throw ee;
      const map = new Map((entries as UserDogEntry[]).map((e) => [e.dog_id, e]));
      return (dogs as Record<string, unknown>[]).map((row) => ({
        dog: mapDogFromRow(row),
        entry: map.get(String(row.id)) ?? null,
      }));
    });
    return remote ?? localGameStore.getDexRows(userId);
  },

  async getCaptureHistory(userId: string, dogId: string): Promise<CaptureHistoryItem[]> {
    const remote = await tryRemote(async () => {
      const { data, error } = await supabase
        .from("capture_attempts")
        .select("id, dog_id, biscuit_type, final_catch_rate, result, created_at")
        .eq("user_id", userId)
        .eq("dog_id", dogId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as CaptureHistoryItem[];
    });
    return remote ?? localGameStore.getCaptureHistory(userId, dogId);
  },

  async resolveQr(userId: string, token: string): Promise<EncounterData> {
    const normalized = extractCampusToken(token) ?? token.trim().toUpperCase();

    if (!useLocalGame) {
      const { data, error } = await supabase.rpc("resolve_qr_encounter", {
        p_token: normalized,
      });
      if (error) throw new Error(translateGameError(error.message));
      if (data) return data as EncounterData;
    }

    return localGameStore.resolveQr(userId, normalized);
  },

  async attemptCapture(
    userId: string,
    token: string,
    biscuit: "normal" | "premium",
  ): Promise<CaptureResult> {
    const normalized = extractCampusToken(token) ?? token.trim().toUpperCase();

    if (!useLocalGame) {
      const { data, error } = await supabase.rpc("attempt_capture", {
        p_token: normalized,
        p_biscuit_type: biscuit,
      });
      if (error) throw new Error(translateGameError(error.message));
      if (data) return data as CaptureResult;
    }

    return localGameStore.attemptCapture(userId, normalized, biscuit);
  },

  getCatalogPreview() {
    return DOG_CATALOG;
  },
};
