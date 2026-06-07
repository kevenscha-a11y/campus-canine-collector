import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { EncounterData } from "@/types/database";
import { PERSONALITY_LABELS, RARITY_CLASS, RARITY_LABELS } from "@/lib/rarity";
import { useBiscuitWallet, useGameActions } from "@/hooks/useGameData";
import { useGameUi } from "@/contexts/GameContext";
import { CaptureShake } from "./CaptureShake";
import { DogSprite } from "./DogSprite";
import biscuitImg from "@/assets/biscuit.png";
import { Cookie, Sparkles, X, Zap } from "lucide-react";
import { toast } from "sonner";

type Phase = "intro" | "choose" | "throwing" | "result";

export function EncounterScreen({
  encounter,
  qrToken,
  onClose,
}: {
  encounter: EncounterData;
  qrToken: string;
  onClose: () => void;
}) {
  const { attemptCapture } = useGameActions();
  const { data: wallet } = useBiscuitWallet();
  const { notifyBiscuitSpent, triggerCelebration } = useGameUi();
  const [phase, setPhase] = useState<Phase>(encounter.owned ? "choose" : "intro");
  const [biscuitType, setBiscuitType] = useState<"normal" | "premium">("normal");
  const [progress, setProgress] = useState(0);
  const [shakePhase, setShakePhase] = useState<"throw" | "shake" | "success" | "fail">("throw");
  const [selectedRate, setSelectedRate] = useState(0);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    shiny?: boolean;
    outcome: "captured" | "miss" | "already_owned";
  } | null>(null);

  const { dog } = encounter;
  const normalLeft = wallet?.normal_balance ?? 0;
  const premiumLeft = wallet?.premium_balance ?? 0;
  const hasAnyBiscuit = normalLeft > 0 || premiumLeft > 0;

  function backToChoose() {
    setResult(null);
    setPhase("choose");
    setShakePhase("throw");
    setProgress(0);
  }

  async function throwBiscuit(type: "normal" | "premium") {
    const rate =
      type === "normal" ? encounter.catch_rates.normal : encounter.catch_rates.premium;
    setBiscuitType(type);
    setSelectedRate(rate);
    setPhase("throwing");
    setProgress(0);
    setShakePhase("throw");
    notifyBiscuitSpent(type);

    await new Promise((r) => setTimeout(r, 400));
    setShakePhase("shake");

    const progressInterval = setInterval(() => {
      setProgress((p) => {
        const next = p + 4;
        if (next >= 92) clearInterval(progressInterval);
        return Math.min(next, 92);
      });
    }, 120);

    try {
      const res = await attemptCapture(qrToken, type);
      clearInterval(progressInterval);
      setProgress(100);

      await new Promise((r) => setTimeout(r, 600));
      setShakePhase(res.success ? "success" : "fail");
      const outcome =
        res.result === "already_owned"
          ? "already_owned"
          : res.success
            ? "captured"
            : "miss";

      setResult({
        success: res.success,
        message: res.message,
        shiny: res.became_shiny,
        outcome,
      });
      setPhase("result");

      if (res.success) {
        triggerCelebration();
        toast.success(res.message);
      } else if (outcome === "miss") {
        toast.error(res.message);
      } else {
        toast.info(res.message);
      }
    } catch (e) {
      clearInterval(progressInterval);
      const msg = e instanceof Error ? e.message : "Falha na captura";
      if (msg.includes("no_normal_biscuits")) toast.error("Sem biscoitos normais!");
      else if (msg.includes("no_premium_biscuits")) toast.error("Sem biscoitos premium!");
      else toast.error(msg);
      backToChoose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === "intro" ? 1 : 0.65 }}
      />

      {phase === "intro" && (
        <motion.div
          className="absolute inset-0 bg-white z-10"
          initial={{ opacity: 1 }}
          animate={{ opacity: [1, 1, 0] }}
          transition={{ duration: 0.8, times: [0, 0.3, 1] }}
          onAnimationComplete={() => setPhase("choose")}
        />
      )}

      <div className="relative z-20 flex items-end sm:items-center justify-center min-h-full p-4">
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-md"
        >
          <div className="rounded-3xl overflow-hidden border-4 border-[hsl(0_72%_42%)] shadow-2xl">
            <div className="bg-gradient-to-b from-sky-400 to-sky-600 px-4 py-3 flex justify-between items-center">
              <span className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <Zap className="h-3 w-3" /> Encontro selvagem
              </span>
              <button type="button" onClick={onClose} className="text-white/90 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-card p-5">
              <div className="flex flex-col items-center py-2">
                <motion.div
                  animate={
                    phase === "throwing"
                      ? { x: [0, -6, 6, -4, 4, 0], scale: [1, 1.05, 1] }
                      : { y: [0, -4, 0] }
                  }
                  transition={{
                    repeat: phase === "throwing" ? Infinity : Infinity,
                    duration: phase === "throwing" ? 0.4 : 2,
                  }}
                >
                  <DogSprite
                    dog={dog}
                    visibility="captured"
                    size="xl"
                    shiny={encounter.is_shiny}
                  />
                </motion.div>
                <h2 className="font-heading text-2xl font-bold mt-3">{dog.name}</h2>
                <p className={`text-sm font-semibold ${RARITY_CLASS[dog.rarity]}`}>
                  {RARITY_LABELS[dog.rarity]}
                </p>
                <p className="text-xs text-muted-foreground mt-1 text-center max-w-xs">
                  {PERSONALITY_LABELS[dog.personality]} · {dog.breed}
                  {dog.age_years != null && ` · ${dog.age_years}a`}
                </p>
              </div>

              <AnimatePresence mode="wait">
                {phase === "choose" && !encounter.owned && (
                  <motion.div
                    key="choose"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3 mt-4"
                  >
                    <p className="text-sm text-center text-muted-foreground">
                      O que você vai usar?
                    </p>
                    <Button
                      variant="secondary"
                      className="w-full justify-between h-auto py-3"
                      onClick={() => throwBiscuit("normal")}
                      disabled={normalLeft < 1}
                    >
                      <span className="flex items-center gap-2">
                        <img src={biscuitImg} alt="" className="h-7 w-7" />
                        Biscoito Normal
                        <span className="text-xs text-muted-foreground">({normalLeft})</span>
                      </span>
                      <span className="font-bold text-primary tabular-nums">
                        {Math.round(encounter.catch_rates.normal * 100)}%
                      </span>
                    </Button>
                    <Button
                      variant="hero"
                      className="w-full justify-between h-auto py-3"
                      onClick={() => throwBiscuit("premium")}
                      disabled={premiumLeft < 1}
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        <Cookie className="h-4 w-4" />
                        Biscoito Premium
                        <span className="text-xs opacity-80">({premiumLeft})</span>
                      </span>
                      <span className="font-bold tabular-nums">
                        {Math.round(encounter.catch_rates.premium * 100)}%
                      </span>
                    </Button>
                    {!hasAnyBiscuit && (
                      <p className="text-xs text-center text-destructive">
                        Sem biscoitos! Volte amanhã ou feche para explorar.
                      </p>
                    )}
                  </motion.div>
                )}

                {encounter.owned && phase === "choose" && (
                  <p className="text-center text-sm text-muted-foreground py-6">
                    Você já capturou {dog.name}. Novos escaneios contam para evolução na DogDex!
                  </p>
                )}

                {phase === "throwing" && (
                  <motion.div key="throw" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <CaptureShake
                      phase={shakePhase}
                      progress={progress}
                      catchRate={selectedRate}
                      biscuitType={biscuitType}
                    />
                  </motion.div>
                )}

                {phase === "result" && result && (
                  <motion.div
                    key="result"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`text-center py-6 rounded-2xl mt-4 ${
                      result.success
                        ? "bg-primary/15 ring-2 ring-primary/30"
                        : "bg-destructive/10 ring-2 ring-destructive/20"
                    }`}
                  >
                    <p className="font-heading text-2xl font-bold">
                      {result.success ? "Gotcha!" : "Ah, não!"}
                    </p>
                    <p className="text-sm mt-2 px-4">{result.message}</p>
                    {result.shiny && (
                      <p className="text-shiny font-bold mt-3 flex items-center justify-center gap-1">
                        <Sparkles className="h-5 w-5 animate-pulse" /> Shiny!
                      </p>
                    )}
                    <div className="flex flex-col gap-2 mt-5 px-4">
                      {result.success || result.outcome === "already_owned" ? (
                        <Button variant="hero" onClick={onClose}>
                          Continuar explorando
                        </Button>
                      ) : (
                        <>
                          {hasAnyBiscuit ? (
                            <Button variant="hero" onClick={backToChoose}>
                              Tentar de novo
                            </Button>
                          ) : (
                            <p className="text-xs text-muted-foreground mb-1">
                              Você ficou sem biscoitos para este encontro.
                            </p>
                          )}
                          <Button variant="outline" onClick={onClose}>
                            Desistir e fechar
                          </Button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      {phase === "result" && result?.success && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          {[...Array(12)].map((_, i) => (
            <motion.span
              key={i}
              className="absolute text-2xl"
              initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
              animate={{
                opacity: 0,
                scale: 1.5,
                x: Math.cos((i / 12) * Math.PI * 2) * 120,
                y: Math.sin((i / 12) * Math.PI * 2) * 120,
              }}
              transition={{ duration: 0.8 }}
            >
              ✨
            </motion.span>
          ))}
        </div>
      )}
    </div>
  );
}
