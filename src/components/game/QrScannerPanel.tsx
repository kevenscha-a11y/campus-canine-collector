import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, RefreshCw, Keyboard } from "lucide-react";
import { useGameActions } from "@/hooks/useGameData";
import type { EncounterData } from "@/types/database";
import { EncounterScreen } from "./EncounterScreen";
import { toast } from "sonner";
import scannerImg from "@/assets/scanner.png";

const SCANNER_ID = "qr-reader-region";

export function QrScannerPanel() {
  const [scanning, setScanning] = useState(false);
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
    // Attempt to auto-start camera on mount (prefer rear camera)
    (async () => {
      try {
        await attemptAutoStart();
      } catch (e) {
        console.debug("Auto-start failed", e);
      }
    })();

    return () => {
      scannerRef.current?.stop?.().catch(() => {});
    };
  }, []);

  async function attemptAutoStart() {
    // Only try in secure contexts
    if (
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      return;
    }

    try {
      const cams = await Html5Qrcode.getCameras();
      const preferred =
        cams.find((c) => /rear|back|environment|traseira|trasera/i.test(c.label)) || cams[0];
      if (preferred && preferred.id) {
        await startScanner(preferred.id);
        return;
      }
    } catch (e) {
      // ignore and fallback to facingMode
    }

    await startScanner();
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
  async function startScanner(preferredCameraId?: string) {
    setError(null);

    if (
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      setError("A câmera requer HTTPS ou acesso local (localhost).");
      return;
    }

    if (!containerRef.current) {
      setError("Contentor da câmera não encontrado.");
      return;
    }

    try {
      // clear any previous content
      containerRef.current.innerHTML = "";

      if (!scannerRef.current) scannerRef.current = new Html5Qrcode(SCANNER_ID);

      let cameraConfig: string | MediaTrackConstraints = { facingMode: "environment" };
      if (preferredCameraId) cameraConfig = preferredCameraId;

      await scannerRef.current.start(
        cameraConfig,
        { fps: 12, qrbox: { width: 250, height: 250 } },
        (decoded) => openEncounter(decoded),
        (err) => {
          // ignore per-frame decode errors
        }
      );

      setScanning(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Não foi possível acessar a câmera.";
      setError(message);
      console.error("Scanner error:", e);
    }
  }

  async function stopScanner() {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      }
    } catch (err) {
      console.error("Error stopping scanner:", err);
    }
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
      {/* Controls */}
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
            onClick={scanning ? stopScanner : startScanner}
            className="text-xs sm:text-sm"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">{scanning ? "Parar" : "Câmera"}</span>
            <span className="sm:hidden">{scanning ? "Parar" : "QR"}</span>
          </Button>
        </div>
      </div>

      {/* Manual input */}
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

      {/* Camera container - fills remaining space */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-0 w-full rounded-lg overflow-hidden border border-white/20 bg-black"
      >
        {/* Scanner element will be rendered here by Html5QrcodeScanner */}
        <div id={SCANNER_ID} className="w-full h-full" />

        {/* Placeholder when not scanning */}
        {!scanning && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center gap-2 z-10 bg-black/60 backdrop-blur-sm">
            <img src={scannerImg} alt="" className="h-16 w-16 object-contain opacity-80" />
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xs leading-tight">
              Clique no botão para ativar a câmera e aponte para o QR da coleira.
            </p>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-black/80 text-center">
            <div className="text-xs sm:text-sm text-red-400 space-y-2">
              <p className="font-semibold">Erro na câmera</p>
              <p className="text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setError(null)}
                className="text-xs mt-2"
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Helper text */}
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

      {/* Encounter screen */}
      {encounter && lastToken && (
        <EncounterScreen encounter={encounter} qrToken={lastToken} onClose={closeEncounter} />
      )}
    </div>
  );
}
