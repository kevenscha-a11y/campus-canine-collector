import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Card } from "@/components/ui/card";
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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [encounter, setEncounter] = useState<EncounterData | null>(null);
  const [lastToken, setLastToken] = useState<string | null>(null);
  const { resolveQr } = useGameActions();
  const busyRef = useRef(false);
  const [cameraDebug, setCameraDebug] = useState<string | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (!scanning || !scannerContainerRef.current) return;
    const container = scannerContainerRef.current;
    const checkSize = () => {
      const { width, height } = container.getBoundingClientRect();
      const debug = `Scanner container: ${width}x${height}px`;
      console.debug(debug);
      setCameraDebug((prev) => (prev ? prev + "\n" + debug : debug));
    };
    checkSize();
    const timer = setTimeout(checkSize, 500);
    return () => clearTimeout(timer);
  }, [scanning]);

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
      if (scanning) await scannerRef.current?.pause(true).catch(() => {});
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "QR inválido");
      if (scanning) await scannerRef.current?.resume().catch(() => {});
    } finally {
      busyRef.current = false;
    }
  }

  async function startScanner() {
    setError(null);
    // Require secure context when opened from mobile over network
    if (
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      setError(
        "Acesso à câmera pode requerer HTTPS ou localhost. Abra o site via https ou em localhost."
      );
      return;
    }
    try {
      if (!scannerRef.current) scannerRef.current = new Html5Qrcode(SCANNER_ID);
      // Prefer enumerating cameras and selecting a rear camera on mobile devices.
      // Fall back to a facingMode preference if enumeration isn't available.
      let cameraConfig: string | { facingMode: string } = {
        facingMode: "environment",
      };
      try {
        const cams = await Html5Qrcode.getCameras();
        if (cams && cams.length > 0) {
          const preferred =
            cams.find((c) => /rear|back|environment|traseira|trasera/i.test(c.label)) ||
            cams[0];
          cameraConfig = preferred.id;
        }
      } catch {
        // If camera enumeration fails, keep facingMode fallback above.
      }

      await scannerRef.current.start(
        cameraConfig,
        { fps: 12, qrbox: { width: 240, height: 240 } },
        (decoded) => openEncounter(decoded),
        () => {},
      );
      // Try to capture running track settings for debug (helps diagnose black screen)
      try {
        const s = scannerRef.current.getRunningTrackSettings();
        const c = scannerRef.current.getRunningTrackCapabilities();
        const info = { settings: s, capabilities: c };
        console.debug("QR camera info:", info);
        const debugText = `Camera iniciada\nResolução: ${s.width}x${s.height}\nFrameRate: ${s.frameRate}fps\nDeviceId: ${s.deviceId?.slice(0, 8)}...`;
        setCameraDebug(debugText);
      } catch (err) {
        console.debug("Unable to read running track settings", err);
      }
      setScanning(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível acessar a câmera.",
      );
    }
  }

  async function stopScanner() {
    try {
      await scannerRef.current?.stop();
    } catch {
      /* ignore */
    }
    setScanning(false);
  }

  function closeEncounter() {
    setEncounter(null);
    setLastToken(null);
    if (scanning) scannerRef.current?.resume().catch(() => {});
  }

  return (
    <div className="h-full w-full flex flex-col gap-3 min-h-0">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-foreground">
          <QrCode className="h-5 w-5" />
          <span className="font-semibold">Scanner</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowManual((s) => !s)}
            aria-label="Digitar código"
          >
            <Keyboard className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={scanning ? stopScanner : startScanner}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            {scanning ? "Parar" : "Câmera"}
          </Button>
        </div>
      </div>

      {showManual && (
        <div className="flex gap-2 shrink-0">
          <Input
            placeholder="CAMPUS-001"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value.toUpperCase())}
            className="font-mono text-sm"
          />
          <Button variant="hero" onClick={() => openEncounter(manualToken)}>
            Ir
          </Button>
        </div>
      )}

      <Card className={`relative flex-1 min-h-[200px] overflow-hidden border-white/70 shadow-soft ${
        scanning ? "bg-transparent" : "bg-black/90"
      }`}>
        {!scanning && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-3 z-10 bg-card/90">
            <img src={scannerImg} alt="" className="h-20 w-20 object-contain opacity-90" />
            <p className="text-sm text-muted-foreground max-w-xs">
              Aponte para o QR da coleira ou digite o código manualmente.
            </p>
            <Button variant="hero" size="lg" onClick={startScanner}>
              Ativar câmera
            </Button>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-6 bg-card text-center text-sm text-muted-foreground">
            {error}
          </div>
        )}
        {scanning && (
          <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
            <div className="w-56 h-56 border-2 border-primary rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] scan-corner-pulse" />
          </div>
        )}
        <div
          ref={scannerContainerRef}
          id={SCANNER_ID}
          className={`w-full h-full min-h-[220px] ${scanning ? "" : "hidden"}`}
          style={{
            backgroundColor: scanning ? "#000" : "transparent",
          }}
        />
      </Card>

      {cameraDebug && (
        <pre className="fixed left-2 bottom-2 z-50 max-w-xs max-h-56 overflow-auto text-xs p-2 bg-black/80 text-white rounded">
          {cameraDebug}
        </pre>
      )}

      <p className="text-[10px] text-center text-muted-foreground shrink-0">
        Dica: teste com <button type="button" className="text-primary underline" onClick={() => openEncounter("CAMPUS-001")}>CAMPUS-001</button>
      </p>

      {encounter && lastToken && (
        <EncounterScreen encounter={encounter} qrToken={lastToken} onClose={closeEncounter} />
      )}
    </div>
  );
}
