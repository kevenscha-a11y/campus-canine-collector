import { DOG_CATALOG, findDogByQrToken } from "@/data/catalog";
import {
  buildEncounter,
  calcCatchRate,
  GAME_RULES,
  rollCapture,
  rollShiny,
  todayISO,
  weekStartISO,
} from "@/lib/gameEngine";
import type {
  BiscuitWallet,
  CaptureResult,
  Dog,
  DogDexStats,
  EncounterData,
  UserDogEntry,
} from "@/types/database";

export interface CaptureHistoryItem {
  id: string;
  dog_id: string;
  biscuit_type: string;
  final_catch_rate: number;
  result: string;
  created_at: string;
}

interface LocalState {
  entries: Record<string, UserDogEntry>;
  wallet: BiscuitWallet;
  history: CaptureHistoryItem[];
}

const key = (userId: string) => `dogdex-game:${userId}`;

const legacyKey = (userId: string) => `campus-canine-game:${userId}`;

function defaultWallet(): BiscuitWallet {
  return {
    normal_balance: GAME_RULES.normalDaily,
    premium_balance: GAME_RULES.premiumWeekly,
    normal_last_reset_at: todayISO(),
    premium_last_weekly_at: null,
  };
}

function load(userId: string): LocalState {
  try {
    const raw = localStorage.getItem(key(userId)) ?? localStorage.getItem(legacyKey(userId));
    if (raw) return JSON.parse(raw) as LocalState;
  } catch {
    /* ignore */
  }
  return { entries: {}, wallet: defaultWallet(), history: [] };
}

function save(userId: string, state: LocalState) {
  localStorage.setItem(key(userId), JSON.stringify(state));
}

function syncWallet(wallet: BiscuitWallet): BiscuitWallet {
  const today = todayISO();
  const week = weekStartISO();
  let w = { ...wallet };

  if (w.normal_last_reset_at < today) {
    w = {
      ...w,
      normal_balance: GAME_RULES.normalDaily,
      normal_last_reset_at: today,
    };
  }

  const lastWeek = w.premium_last_weekly_at;
  if (!lastWeek || lastWeek < week) {
    w = {
      ...w,
      premium_balance: w.premium_balance + GAME_RULES.premiumWeekly,
      premium_last_weekly_at: today,
    };
  }

  return w;
}

function computeStats(entries: Record<string, UserDogEntry>): DogDexStats {
  const list = Object.values(entries);
  const catalog = DOG_CATALOG.length;
  const captured = list.filter((e) => e.is_captured).length;
  const discovered = list.filter((e) => e.first_seen_at || e.is_captured).length;
  const shiny = list.filter((e) => e.is_shiny).length;
  const scans = list.reduce((s, e) => s + e.scan_count, 0);

  return {
    total_discovered: discovered,
    total_captured: captured,
    total_shiny: shiny,
    total_scans: scans,
    catalog_total: catalog,
    completion_percent: catalog ? Math.round((captured / catalog) * 10000) / 100 : 0,
  };
}

function ensureEntry(state: LocalState, userId: string, dog: Dog): UserDogEntry {
  if (state.entries[dog.id]) return state.entries[dog.id];
  const entry: UserDogEntry = {
    id: `entry-${dog.id}`,
    user_id: userId,
    dog_id: dog.id,
    is_captured: false,
    is_shiny: false,
    scan_count: 0,
    evolution_stage: 0,
    first_seen_at: null,
    captured_at: null,
    last_encounter_at: null,
  };
  state.entries[dog.id] = entry;
  return entry;
}

export const localGameStore = {
  getWallet(userId: string): BiscuitWallet {
    const state = load(userId);
    state.wallet = syncWallet(state.wallet);
    save(userId, state);
    return state.wallet;
  },

  getStats(userId: string): DogDexStats {
    return computeStats(load(userId).entries);
  },

  getDexRows(userId: string): { dog: Dog; entry: UserDogEntry | null }[] {
    const state = load(userId);
    return DOG_CATALOG.map((dog) => ({
      dog,
      entry: state.entries[dog.id] ?? null,
    }));
  },

  getCaptureHistory(userId: string, dogId: string): CaptureHistoryItem[] {
    return load(userId).history.filter((h) => h.dog_id === dogId).slice(0, 10);
  },

  resolveQr(userId: string, token: string): EncounterData {
    const dog = findDogByQrToken(token);
    if (!dog) throw new Error("QR Code inválido ou inativo.");

    const state = load(userId);
    const entry = ensureEntry(state, userId, dog);
    const now = new Date().toISOString();

    if (!entry.first_seen_at) entry.first_seen_at = now;
    entry.last_encounter_at = now;
    state.entries[dog.id] = entry;
    save(userId, state);

    return buildEncounter(dog, entry.is_captured, entry);
  },

  attemptCapture(userId: string, token: string, biscuit: "normal" | "premium"): CaptureResult {
    const dog = findDogByQrToken(token);
    if (!dog) throw new Error("QR Code inválido.");

    const state = load(userId);
    state.wallet = syncWallet(state.wallet);

    if (biscuit === "normal" && state.wallet.normal_balance < 1) {
      throw new Error("no_normal_biscuits");
    }
    if (biscuit === "premium" && state.wallet.premium_balance < 1) {
      throw new Error("no_premium_biscuits");
    }

    const entry = ensureEntry(state, userId, dog);
    const rate = calcCatchRate(dog, biscuit);

    if (entry.is_captured) {
      entry.scan_count += 1;
      entry.last_encounter_at = new Date().toISOString();
      if (entry.scan_count >= GAME_RULES.evolutionScans && entry.evolution_stage < dog.max_evolution_stage) {
        entry.evolution_stage += 1;
      }
      save(userId, state);
      return {
        result: "already_owned",
        success: false,
        final_catch_rate: rate,
        roll_value: 0,
        message: "Você já capturou este doguinho! Escaneio contado para evolução.",
        scan_count: entry.scan_count,
        evolution_stage: entry.evolution_stage,
      };
    }

    const { success, roll } = rollCapture(rate);
    const now = new Date().toISOString();

    if (biscuit === "normal") state.wallet.normal_balance -= 1;
    else state.wallet.premium_balance -= 1;

    let becameShiny = false;
    if (success) {
      becameShiny = rollShiny();
      entry.is_captured = true;
      entry.is_shiny = becameShiny;
      entry.captured_at = now;
      entry.evolution_stage = Math.max(entry.evolution_stage, 1);
    }

    entry.scan_count += 1;
    entry.last_encounter_at = now;
    if (!entry.first_seen_at) entry.first_seen_at = now;

    state.history.unshift({
      id: crypto.randomUUID(),
      dog_id: dog.id,
      biscuit_type: biscuit,
      final_catch_rate: rate,
      result: success ? "captured" : "miss",
      created_at: now,
    });
    state.history = state.history.slice(0, 200);

    save(userId, state);

    return {
      result: success ? "captured" : "miss",
      success,
      became_shiny: becameShiny,
      final_catch_rate: rate,
      roll_value: roll,
      message: success
        ? becameShiny
          ? "Capturado! ✨ Versão Shiny desbloqueada!"
          : "Capturado! Novo doguinho na sua DogDex!"
        : "O doguinho escapou! Tente outro biscoito.",
      wallet: {
        normal: state.wallet.normal_balance,
        premium: state.wallet.premium_balance,
      },
      dog: { id: dog.id, name: dog.name, emoji: dog.emoji, dex_number: dog.dex_number },
      scan_count: entry.scan_count,
      evolution_stage: entry.evolution_stage,
    };
  },
};
