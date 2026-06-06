import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, Settings } from "lucide-react";
import { BiscuitHUD } from "@/components/game/BiscuitHUD";
import { DogDexGrid } from "@/components/game/DogDexGrid";
import { QrScannerPanel } from "@/components/game/QrScannerPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useDogDexStats } from "@/hooks/useGameData";
import { GameProvider } from "@/contexts/GameContext";

function SettingsPanel() {
  const { user, signOut } = useAuth();
  const { data: stats } = useDogDexStats();

  return (
    <div className="h-full w-full flex flex-col gap-4">
      <div className="flex items-center gap-2 text-foreground">
        <Settings className="h-5 w-5" />
        <span className="font-semibold">Configurações</span>
      </div>
      <Card className="p-5 border-white/70 shadow-card bg-card/90 space-y-3">
        <div className="rounded-xl bg-muted/60 border p-3">
          <div className="font-medium text-sm">Treinador</div>
          <div className="text-xs text-muted-foreground mt-1">{user?.email}</div>
        </div>
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-3">
          <div className="font-medium text-sm">Progresso global</div>
          <div className="text-2xl font-heading font-bold text-primary tabular-nums mt-1">
            {stats?.completion_percent ?? 0}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {stats?.total_captured ?? 0} capturados · {stats?.total_discovered ?? 0} descobertos
          </div>
        </div>
        <div className="rounded-xl bg-muted/60 border p-3 text-xs text-muted-foreground">
          Biscoitos normais renovam todo dia. Premium ganha carga semanal. Use no encontro após escanear o QR.
        </div>
        <Button variant="outline" className="w-full" onClick={() => signOut()}>
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
        <Button variant="ghost" className="w-full" asChild>
          <Link to="/">Site</Link>
        </Button>
      </Card>
    </div>
  );
}

function PanelShell({
  title,
  subtitle,
  badge,
  children,
}: {
  title: string;
  subtitle: string;
  badge: string;
  children: ReactNode;
}) {
  return (
    <div className="h-full w-full border-x border-white/30 bg-card/55 backdrop-blur-md shadow-soft px-3 sm:px-4 pt-20 sm:pt-24 pb-4 sm:pb-6 flex flex-col">
      <div className="mb-2 sm:mb-3 px-1 shrink-0">
        <div className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-medium">
          {badge}
        </div>
        <h1 className="font-heading text-lg sm:text-2xl mt-1.5 sm:mt-2 text-foreground">{title}</h1>
        <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{subtitle}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

function MainContent() {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeScreen, setActiveScreen] = useState(1);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollLeft = el.clientWidth;
  }, []);

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    setActiveScreen(Math.max(0, Math.min(2, Math.round(el.scrollLeft / el.clientWidth))));
  }

  const labels = ["Config", "Scanner", "DogDex"] as const;

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden bg-background">
      <div className="absolute inset-0 gradient-warm" />
      <div className="pointer-events-none absolute top-20 right-6 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 left-6 h-56 w-56 rounded-full bg-secondary/10 blur-3xl" />

      <div className="absolute top-3 left-0 right-0 z-30 flex flex-col items-center gap-2 px-3">
        <BiscuitHUD />
        <div className="w-full max-w-xs rounded-full border border-white/80 bg-card/90 backdrop-blur px-4 py-1.5 shadow-card">
          <div className="flex justify-center gap-3 text-[11px]">
            {labels.map((label, i) => (
              <span
                key={label}
                className={
                  activeScreen === i
                    ? "font-bold text-foreground"
                    : "text-muted-foreground"
                }
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="no-scrollbar relative z-20 h-full w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth flex"
      >
        <section className="snap-start shrink-0 w-screen h-[100dvh]">
          <PanelShell badge="Conta" title="Configurações" subtitle="Perfil e progresso da coleção.">
            <SettingsPanel />
          </PanelShell>
        </section>

        <section className="snap-start shrink-0 w-screen h-[100dvh]">
          <PanelShell
            badge="Captura"
            title="Encontros"
            subtitle="Escaneie a coleira — a tela de batalha abre sozinha."
          >
            <QrScannerPanel />
          </PanelShell>
        </section>

        <section className="snap-start shrink-0 w-screen h-[100dvh]">
          <PanelShell badge="Coleção" title="DogDex" subtitle="Registre, capture e evolua cada doguinho.">
            <DogDexGrid />
          </PanelShell>
        </section>
      </div>
    </div>
  );
}

const Main = () => (
  <GameProvider>
    <MainContent />
  </GameProvider>
);

export default Main;
