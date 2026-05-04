import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Settings, BookOpen, RefreshCw } from "lucide-react";

function useUserMedia(constraints: MediaStreamConstraints) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function start() {
      try {
        const s = await navigator.mediaDevices.getUserMedia(constraints);
        if (!active) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(s);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Não foi possível acessar a câmera.";
        setError(message);
      }
    }

    start();

    return () => {
      active = false;
      setStream((prev) => {
        prev?.getTracks().forEach((t) => t.stop());
        return null;
      });
    };
  }, [constraints]);

  return { stream, error };
}

function CameraPanel() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const constraints = useMemo<MediaStreamConstraints>(
    () => ({
      video: { facingMode: "environment" },
      audio: false,
    }),
    [],
  );

  const { stream, error } = useUserMedia(constraints);

  useEffect(() => {
    if (!videoRef.current) return;
    if (!stream) return;
    videoRef.current.srcObject = stream;
  }, [stream]);

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    setPhotoUrl(canvas.toDataURL("image/jpeg", 0.9));
  }

  return (
    <div className="h-full w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-foreground">
          <Camera className="h-5 w-5" />
          <span className="font-semibold">Captura</span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="shadow-card"
          onClick={() => setPhotoUrl(null)}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Limpar
        </Button>
      </div>

      <Card className="relative flex-1 overflow-hidden border-white/70 shadow-soft bg-card/90 backdrop-blur-sm">
        <div className="absolute inset-0 bg-muted/30" />
        {error ? (
          <div className="relative z-10 h-full w-full flex items-center justify-center p-6 text-center">
            <div className="max-w-md">
              <div className="text-lg font-heading font-semibold mb-2">
                Permissão da câmera
              </div>
              <div className="text-sm text-muted-foreground">
                {error}
                <br />
                Libere a permissão do navegador e recarregue a página.
              </div>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="relative z-10 h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-20 bg-gradient-to-b from-black/35 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 bg-gradient-to-t from-black/45 to-transparent" />
            <canvas ref={canvasRef} className="hidden" />
          </>
        )}
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="hero"
          className="w-full shadow-hover"
          size="lg"
          onClick={capture}
          disabled={!stream || !!error}
        >
          Capturar doguinho
        </Button>
      </div>

      {photoUrl ? (
        <Card className="p-3 border-white/70 shadow-card bg-card/90">
          <div className="text-sm font-semibold mb-2">Última captura</div>
          <img
            src={photoUrl}
            alt="Captura"
            className="w-full rounded-md border object-cover"
          />
        </Card>
      ) : null}
    </div>
  );
}

function SettingsPanel() {
  return (
    <div className="h-full w-full flex flex-col gap-4">
      <div className="flex items-center gap-2 text-foreground">
        <Settings className="h-5 w-5" />
        <span className="font-semibold">Configurações</span>
      </div>
      <Card className="p-5 border-white/70 shadow-card bg-card/90">
        <div className="text-sm text-muted-foreground mb-4">
          Ajuste sua experiência de captura.
        </div>
        <div className="space-y-3">
          <div className="rounded-xl bg-muted/60 border p-3">
            <div className="font-medium text-sm">Notificações</div>
            <div className="text-xs text-muted-foreground mt-1">
              Receba alertas de novos doguinhos no campus.
            </div>
          </div>
          <div className="rounded-xl bg-muted/60 border p-3">
            <div className="font-medium text-sm">Permissões</div>
            <div className="text-xs text-muted-foreground mt-1">
              Controle acesso à câmera e localização.
            </div>
          </div>
          <div className="rounded-xl bg-muted/60 border p-3">
            <div className="font-medium text-sm">Tema</div>
            <div className="text-xs text-muted-foreground mt-1">
              Verde DogDex com visual clean e legível.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function DogDexPanel() {
  return (
    <div className="h-full w-full flex flex-col gap-4">
      <div className="flex items-center gap-2 text-foreground">
        <BookOpen className="h-5 w-5" />
        <span className="font-semibold">DogDex</span>
      </div>
      <Card className="p-5 border-white/70 shadow-card bg-card/90">
        <div className="text-sm text-muted-foreground mb-4">
          Sua coleção de doguinhos capturados.
        </div>
        <div className="grid grid-cols-2 gap-3">
          {["Tobby", "Mel", "Thor", "Nina"].map((name) => (
            <div
              key={name}
              className="rounded-xl border bg-muted/50 p-3 shadow-card transition-transform hover:-translate-y-0.5"
            >
              <div className="text-sm font-semibold">{name}</div>
              <div className="text-xs text-muted-foreground">Registrado</div>
            </div>
          ))}
        </div>
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
    <div className="h-full w-full border-x border-white/30 bg-card/55 backdrop-blur-md shadow-soft p-4 pt-16 pb-6 flex flex-col">
      <div className="mb-4 px-1">
        <div className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
          {badge}
        </div>
        <h1 className="font-heading text-2xl mt-3 text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

const Main = () => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeScreen, setActiveScreen] = useState(1);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // começa no painel central (câmera)
    el.scrollLeft = el.clientWidth;
  }, []);

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    const screen = Math.round(el.scrollLeft / el.clientWidth);
    const clamped = Math.max(0, Math.min(2, screen));
    if (clamped !== activeScreen) {
      setActiveScreen(clamped);
    }
  }

  const currentLabel =
    activeScreen === 0 ? "Configurações" : activeScreen === 1 ? "Câmera" : "DogDex";

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden bg-background">
      <div className="absolute inset-0 gradient-warm" />
      <div className="pointer-events-none absolute top-16 right-8 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-16 left-8 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-[92vw] max-w-sm rounded-full border border-white/80 bg-card/85 backdrop-blur px-3 py-1.5 shadow-card">
        <div className="flex items-center justify-center gap-2 text-[11px]">
          <span
            className={`font-medium ${activeScreen === 0 ? "text-foreground" : "text-muted-foreground"}`}
          >
            Config
          </span>
          <span className="text-muted-foreground">•</span>
          <span
            className={`font-medium ${activeScreen === 1 ? "text-foreground" : "text-muted-foreground"}`}
          >
            Câmera
          </span>
          <span className="text-muted-foreground">•</span>
          <span
            className={`font-medium ${activeScreen === 2 ? "text-foreground" : "text-muted-foreground"}`}
          >
            DogDex
          </span>
        </div>
      </div>

      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="no-scrollbar relative z-20 h-full w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth flex touch-pan-x"
      >
        <section className="snap-start shrink-0 w-screen h-[100dvh]">
          <PanelShell
            badge="Tela lateral"
            title="Configurações"
            subtitle="Ajuste permissões, notificações e preferências."
          >
            <SettingsPanel />
          </PanelShell>
        </section>

        <section className="snap-start shrink-0 w-screen h-[100dvh]">
          <PanelShell
            badge="Tela principal"
            title="Capturar doguinhos"
            subtitle="Aponte a câmera para registrar novos amigos do campus."
          >
            <CameraPanel />
          </PanelShell>
        </section>

        <section className="snap-start shrink-0 w-screen h-[100dvh]">
          <PanelShell
            badge="Tela lateral"
            title="DogDex"
            subtitle="Acompanhe sua coleção e progresso de capturas."
          >
            <DogDexPanel />
          </PanelShell>
        </section>
      </div>
    </div>
  );
};

export default Main;

