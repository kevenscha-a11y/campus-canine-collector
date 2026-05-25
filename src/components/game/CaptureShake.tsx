import { motion } from "framer-motion";
import biscuitImg from "@/assets/biscuit.png";

export function CaptureShake({
  phase,
  progress,
  catchRate,
  biscuitType,
}: {
  phase: "throw" | "shake" | "success" | "fail";
  progress: number;
  catchRate: number;
  biscuitType: "normal" | "premium";
}) {
  const shakeCount = phase === "shake" ? Math.min(3, Math.floor(progress / 33) + 1) : 0;

  return (
    <div className="space-y-4 py-2">
      <div className="relative h-28 flex items-center justify-center">
        <motion.div
          className="absolute w-20 h-20 rounded-full border-4 border-primary/40 bg-primary/5"
          animate={
            phase === "shake"
              ? { rotate: [0, -8, 8, -8, 8, 0], scale: [1, 1.05, 1] }
              : phase === "success"
                ? { scale: [1, 1.2, 0], opacity: [1, 1, 0] }
                : {}
          }
          transition={{ duration: 0.5, repeat: phase === "shake" ? shakeCount : 0 }}
        />
        <motion.img
          src={biscuitImg}
          alt=""
          className={`h-14 w-14 object-contain z-10 ${biscuitType === "premium" ? "drop-shadow-[0_0_8px_hsl(var(--shiny))]" : ""}`}
          initial={{ y: -40, opacity: 0 }}
          animate={
            phase === "throw"
              ? { y: 0, opacity: 1 }
              : phase === "shake"
                ? { rotate: [0, 10, -10, 0] }
                : { scale: phase === "success" ? 1.3 : 0.8, opacity: phase === "fail" ? 0.5 : 1 }
          }
          transition={{ duration: 0.35 }}
        />
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs font-medium">
          <span>
            {phase === "throw" && "Lançando biscoito..."}
            {phase === "shake" && `Tentativa ${shakeCount}/3`}
            {phase === "success" && "Capturado!"}
            {phase === "fail" && "Escapou!"}
          </span>
          <span className="tabular-nums text-primary">{Math.round(catchRate * 100)}%</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden border">
          <motion.div
            className={`h-full rounded-full ${phase === "fail" ? "bg-destructive" : "bg-primary"}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.15 }}
          />
        </div>
      </div>
    </div>
  );
}
