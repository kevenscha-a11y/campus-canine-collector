import { motion } from "framer-motion";
import { Cookie, Sparkles } from "lucide-react";
import { useBiscuitWallet } from "@/hooks/useGameData";
import { useGameUi } from "@/contexts/GameContext";
import { gameService } from "@/services/gameService";
import biscuitImg from "@/assets/biscuit.png";

export function BiscuitHUD() {
  const { data: wallet, isLoading } = useBiscuitWallet();
  const { lastBiscuitSpent } = useGameUi();
  const isLocal = gameService.usesLocalGame();

  return (
    <div className="w-full max-w-xs">
      <div className="flex items-stretch gap-1 rounded-2xl border-2 border-[hsl(0_72%_42%)] bg-[hsl(0_65%_38%)] p-1 shadow-lg">
        <motion.div
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2 bg-card/95 ${
            lastBiscuitSpent === "normal" ? "ring-2 ring-destructive scale-95" : ""
          }`}
          animate={lastBiscuitSpent === "normal" ? { x: [0, -2, 0] } : {}}
          key={`n-${wallet?.normal_balance}`}
        >
          <div className="relative">
            <img src={biscuitImg} alt="" className="h-7 w-7 object-contain" />
            <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center border-2 border-card tabular-nums">
              {isLoading ? "·" : wallet?.normal_balance ?? 0}
            </span>
          </div>
          <div className="text-left hidden xs:block">
            <p className="text-[9px] uppercase font-bold text-muted-foreground leading-none">
              Normal
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight">Reset diário</p>
          </div>
        </motion.div>

        <motion.div
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200/80 ${
            lastBiscuitSpent === "premium" ? "ring-2 ring-destructive scale-95" : ""
          }`}
          animate={lastBiscuitSpent === "premium" ? { x: [0, -2, 0] } : {}}
          key={`p-${wallet?.premium_balance}`}
        >
          <div className="relative">
            <Cookie className="h-7 w-7 text-rarity-legendary" />
            <Sparkles className="h-3 w-3 text-accent absolute -top-0.5 -right-0.5" />
            <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-accent text-[9px] font-bold text-accent-foreground flex items-center justify-center border-2 border-amber-50 tabular-nums">
              {isLoading ? "·" : wallet?.premium_balance ?? 0}
            </span>
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-[9px] uppercase font-bold text-amber-900/70 leading-none">
              Premium
            </p>
            <p className="text-[10px] text-amber-800/60 leading-tight">Semanal</p>
          </div>
        </motion.div>
      </div>
      {isLocal && (
        <p className="text-[9px] text-center text-muted-foreground mt-1 opacity-80">
          Modo local — progresso salvo neste navegador
        </p>
      )}
    </div>
  );
}
