import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type GameContextValue = {
  lastBiscuitSpent: "normal" | "premium" | null;
  notifyBiscuitSpent: (type: "normal" | "premium") => void;
  celebrationTick: number;
  triggerCelebration: () => void;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [lastBiscuitSpent, setLastBiscuitSpent] = useState<"normal" | "premium" | null>(null);
  const [celebrationTick, setCelebrationTick] = useState(0);

  const notifyBiscuitSpent = useCallback((type: "normal" | "premium") => {
    setLastBiscuitSpent(type);
    setTimeout(() => setLastBiscuitSpent(null), 600);
  }, []);

  const triggerCelebration = useCallback(() => {
    setCelebrationTick((t) => t + 1);
  }, []);

  const value = useMemo(
    () => ({ lastBiscuitSpent, notifyBiscuitSpent, celebrationTick, triggerCelebration }),
    [lastBiscuitSpent, celebrationTick, notifyBiscuitSpent, triggerCelebration],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameUi() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGameUi requer GameProvider");
  return ctx;
}
