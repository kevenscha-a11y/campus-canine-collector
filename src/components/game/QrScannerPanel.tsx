import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, type CameraDevice } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, RefreshCw, Keyboard } from "lucide-react";
import { useGameActions } from "@/hooks/useGameData";
import type { EncounterData } from "@/types/database";
import { EncounterScreen } from "./EncounterScreen";
import { toast } from "sonner";
import scannerImg from "@/assets/scanner.png";

const SCANNER_ID = "qr-reader-region";

const SCANNER_CONFIG = {
  fps: 10,
  qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
    const edge = Math.min(viewfinderWidth, viewfinderHeight);
    const size = Math.floor(edge * 0.72);
    return { width: size, height: size };
  },
};

function pickRearCamera(cameras: CameraDevice[]): string | undefined {
  if (!cameras.length) return undefined;

  const byLabel = cameras.find((c) =>
    /rear|back|environment|traseira|trasera|trás|facing back/i.test(c.label),
  );
  if (byLabel?.id) return byLabel.id;

  if (cameras.length >= 2) return cameras[cameras.length - 1].id;

  return cameras[0].id;
}

function buildCameraAttempts(cameras: CameraDevice[]): Array<string | MediaTrackConstraints> {
  const attempts: Array<string | MediaTrackConstraints> = [];
  const seen = new Set<string>();

  const add = (config: string | MediaTrackConstraints) => {
    const key = typeof config === "string" ? config : JSON.stringify(config);
    if (!seen.has(key)) {
      seen.add(key);
      attempts.push(config);
    }
  };

  const rearId = pickRearCamera(cameras);
  if (rearId) add(rearId);

  for (const cam of cameras) add(cam.id);

  add({ facingMode: "environment" });
  add({ facingMode: "user" });

  return attempts;
}

function friendlyCameraError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/NotReadableError|Could not start video source/i.test(msg)) {
    return "Câmera ocupada ou indisponível. Feche outros apps que usam a câmera e tente de novo.";
  }
  if (/NotAllowedError|Permission/i.test(msg)) {
    return "Permissão da câmera negada. Autorize o acesso nas configurações do navegador.";
  }
  if (/NotFoundError|no camera/i.test(msg)) {
    return "Nenhuma câmera encontrada neste dispositivo.";
  }
  if (/OverconstrainedError|environment/i.test(msg)) {
    return "Câmera traseira não disponível. Tentando câmera alternativa…";
  }
  return msg || "Não foi possível acessar a câmera.";
}

function isSecureContext(): boolean {
  return (
    window.location.protocol === "https:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

export function QrScannerPanel() {
  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [encounter, setEncounter] = useState<EncounterData | null>(null);
  const [lastToken, setLastToken] = useState<string | null>(null);
  const { resolveQr } = useGameActions();
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, []);

  function ensureScannerElement(): HTMLElement | null {
    let el = document.getElementById(SCANNER_ID);
    if (!el && containerRef.current) {
      el = document.createElement("div");
      el.id = SCANNER_ID;
      el.className = "w-full h-full";
      containerRef.current.prepend(el);
    }
    return el;
  }

  async function openEncounter(token: string) {
    const normalized = token.trim().toUpperCase();
    if (!normalized.startsWith("CAMPUS-")) {
      toast.error("Use um código CAMPUS-001 … CAMPUS-012");
      return;
    }
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const data = await resolveQr(normalized);
      setLastToken(normalized);
      setEncounter(data);
      if (scanning) {
        await scannerRef.current?.pause?.();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "QR inválido");
      if (scanning) {
        await scannerRef.current?.resume?.();
      }
    } finally {
      busyRef.current = false;
    }
  }

  async function tryStartWithConfig(
    scanner: Html5Qrcode,
    config: string | MediaTrackConstraints,
  ): Promise<boolean> {
    try {
      await scanner.start(
        config,
        SCANNER_CONFIG,
        (decoded) => openEncounter(decoded),
        () => {},
      );
      return true;
    } catch {
      try {
        await scanner.stop();
      } catch {
        /* scanner pode não ter iniciado */
      }
      return false;
    }
  }

  async function startScanner() {
    setError(null);

    if (!isSecureContext()) {
      setError("A câmera requer HTTPS ou acesso local (localhost).");
      return;
    }

    if (!ensureScannerElement()) {
      setError("Contentor da câmera não encontrado.");
      return;
    }

    setStarting(true);

    try {
      await stopScanner();

      const scanner = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = scanner;

      let cameras: CameraDevice[] = [];
      try {
        cameras = await Html5Qrcode.getCameras();
      } catch {
        cameras = [];
      }

      const attempts = buildCameraAttempts(cameras);
      let started = false;
      let lastError: unknown = null;

      for (const config of attempts) {
        const ok = await tryStartWithConfig(scanner, config);
        if (ok) {
          started = true;
          break;
        }
        lastError = new Error(`Falha com config: ${typeof config === "string" ? config : "constraints"}`);
      }

      if (!started) {
        throw lastError ?? new Error("Nenhuma câmera disponível.");
      }

      setScanning(true);
    } catch (e) {
      const message = friendlyCameraError(e);
      setError(message);
      console.error("Scanner error:", e);
      scannerRef.current = null;
    } finally {
      setStarting(false);
    }
  }

  async function stopScanner() {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === 2 /* SCANNING */) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      }
    } catch (err) {
      console.error("Error stopping scanner:", err);
    }
    scannerRef.current = null;
    setScanning(false);
  }

  function closeEncounter() {
    setEncounter(null);
    setLastToken(null);
    if (scanning) {
      scannerRef.current?.resume?.().catch(() => {});
    }
  }

  return (
    <div className="h-full w-full flex flex-col gap-2 min-h-0">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-foreground">
          <QrCode className="h-5 w-5" />
          <span className="font-semibold text-sm">Scanner</span>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowManual((s) => !s)}
            aria-label="Digitar código"
            className="h-8 w-8 p-0"
          >
            <Keyboard className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => (scanning ? stopScanner() : startScanner())}
            disabled={starting}
            className="text-xs sm:text-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${starting ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">
              {starting ? "Abrindo..." : scanning ? "Parar" : "Câmera"}
            </span>
            <span className="sm:hidden">{starting ? "..." : scanning ? "Parar" : "QR"}</span>
          </Button>
        </div>
      </div>

      {showManual && (
        <div className="flex gap-1 sm:gap-2 shrink-0">
          <Input
            placeholder="CAMPUS-001"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value.toUpperCase())}
            className="font-mono text-xs sm:text-sm h-8 sm:h-10"
          />
          <Button
            variant="hero"
            onClick={() => openEncounter(manualToken)}
            className="text-xs sm:text-sm"
          >
            Ir
          </Button>
        </div>
      )}

      <div
        ref={containerRef}
        className="relative flex-1 min-h-0 w-full rounded-lg overflow-hidden border border-white/20 bg-black"
      >
        <div id={SCANNER_ID} className="w-full h-full" />

        {!scanning && !error && (
          <button
            type="button"
            onClick={() => startScanner()}
            disabled={starting}
            className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center gap-2 z-10 bg-black/60 backdrop-blur-sm cursor-pointer"
          >
            <img src={scannerImg} alt="" className="h-16 w-16 object-contain opacity-80" />
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xs leading-tight">
              Toque aqui para ativar a câmera e aponte para o QR da coleira.
            </p>
          </button>
        )}

        {error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-black/80 text-center">
            <div className="text-xs sm:text-sm text-red-400 space-y-2">
              <p className="font-semibold">Erro na câmera</p>
              <p className="text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null);
                  startScanner();
                }}
                className="text-xs mt-2"
              >
                Tentar novamente
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="text-[10px] sm:text-xs text-center text-muted-foreground shrink-0">
        Teste:{" "}
        <button
          type="button"
          className="text-primary underline hover:opacity-80"
          onClick={() => openEncounter("CAMPUS-001")}
        >
          CAMPUS-001
        </button>
      </p>

      {encounter && lastToken && (
        <EncounterScreen encounter={encounter} qrToken={lastToken} onClose={closeEncounter} />
      )}
    </div>
  );
}
