import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCaptureHistory } from "@/hooks/useGameData";
import type { Dog, DogQRCode, UserDogEntry } from "@/types/database";
import { PERSONALITY_LABELS, RARITY_CLASS, RARITY_LABELS } from "@/lib/rarity";
import { GAME_RULES } from "@/lib/gameEngine";
import { DogSprite } from "./DogSprite";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { dogService } from "@/services/dogService";
import { useUserRole } from "@/hooks/useUserRole";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";

const STAGE_NAMES = ["—", "Filhote", "Adulto", "Lendário"];

export function DogDetailModal({
  open,
  onOpenChange,
  dog,
  entry,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  dog: Dog;
  entry: UserDogEntry;
}) {
  const { data: history } = useCaptureHistory(dog.id);
  const { isAdmin } = useUserRole();
  const [qr, setQr] = useState<DogQRCode | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const evoProgress = Math.min(
    100,
    (entry.scan_count / GAME_RULES.evolutionScans) * 100,
  );

  useEffect(() => {
    if (!open || !isAdmin) return;

    let mounted = true;
    (async () => {
      try {
        const primary = await dogService.getPrimaryQRCode(dog.id);
        if (!mounted) return;
        setQr(primary);

        if (primary?.token) {
          const dataUrl = await QRCode.toDataURL(primary.token, {
            width: 280,
            margin: 1,
          });
          if (mounted) setQrDataUrl(dataUrl);
        } else {
          setQrDataUrl("");
        }
      } catch {
        if (mounted) {
          setQr(null);
          setQrDataUrl("");
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, isAdmin, dog.id]);

  function handleExportQr() {
    if (!qrDataUrl || !qr) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `qrcode-${dog.slug || dog.name.toLowerCase()}.png`;
    link.click();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto p-0 gap-0 border-4 border-[hsl(0_72%_42%)]">
        <div className="bg-gradient-to-b from-sky-500/20 to-transparent p-6 pb-4">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2 text-xl">
              <span className="text-muted-foreground font-mono text-sm">
                #{String(dog.dex_number).padStart(3, "0")}
              </span>
              {dog.name}
              {entry.is_shiny && <Sparkles className="h-5 w-5 text-shiny" />}
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center mt-4">
            <div
              className={`rounded-3xl p-8 ${
                entry.is_shiny ? "bg-gradient-accent shadow-hover" : "bg-card border shadow-card"
              }`}
            >
              <DogSprite dog={dog} visibility="captured" size="xl" shiny={entry.is_shiny} />
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{dog.description}</p>

          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              ["Raça", dog.breed],
              ["Idade", dog.age_years != null ? `${dog.age_years} anos` : "—"],
              ["Personalidade", PERSONALITY_LABELS[dog.personality]],
              ["Raridade", RARITY_LABELS[dog.rarity]],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-muted/50 p-3 border">
                <div className="text-[10px] uppercase text-muted-foreground font-semibold">
                  {label}
                </div>
                <div
                  className={`font-medium mt-0.5 ${
                    label === "Raridade" ? RARITY_CLASS[dog.rarity] : ""
                  }`}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border p-3 bg-muted/30">
            <div className="flex items-center justify-between text-sm font-medium mb-2">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                Evolução
              </span>
              <span>
                {STAGE_NAMES[entry.evolution_stage] ?? `Estágio ${entry.evolution_stage}`}
              </span>
            </div>
            <Progress value={evoProgress} className="h-2" />
            <p className="text-[10px] text-muted-foreground mt-1">
              {entry.scan_count}/{GAME_RULES.evolutionScans} escaneios para próximo estágio
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {entry.is_shiny && (
              <Badge className="bg-accent text-accent-foreground">✨ Shiny</Badge>
            )}
            <Badge variant="outline">{entry.scan_count} escaneios</Badge>
          </div>

          {entry.captured_at && (
            <p className="text-xs text-muted-foreground">
              Primeira captura:{" "}
              {format(new Date(entry.captured_at), "dd MMM yyyy · HH:mm", { locale: ptBR })}
            </p>
          )}

          {history && history.length > 0 && (
            <div className="border-t pt-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                Histórico de captura
              </p>
              <ul className="space-y-1.5 max-h-36 overflow-y-auto">
                {history.map((h) => (
                  <li
                    key={h.id}
                    className="flex justify-between text-xs rounded-lg bg-muted/40 px-2 py-1.5"
                  >
                    <span>
                      {h.biscuit_type === "premium" ? "⭐ Premium" : "🍪 Normal"} —{" "}
                      {h.result === "captured" ? (
                        <span className="text-primary font-semibold">Sucesso</span>
                      ) : (
                        <span className="text-destructive">Falhou</span>
                      )}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {Math.round(Number(h.final_catch_rate) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isAdmin && (
            <div className="border-t pt-3 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                QR Code (Admin)
              </p>

              {qr && qrDataUrl ? (
                <div className="rounded-xl border p-3 bg-muted/20 space-y-3">
                  <div className="flex justify-center">
                    <img
                      src={qrDataUrl}
                      alt={`QR Code de ${dog.name}`}
                      className="h-40 w-40 rounded border bg-white p-2"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground break-all">
                    Token: {qr.token}
                  </p>
                  <Button type="button" className="w-full" onClick={handleExportQr}>
                    Exportar QR Code
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Nenhum QR code ativo para este cachorro.
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
