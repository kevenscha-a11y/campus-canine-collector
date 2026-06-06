import { useState, useEffect } from "react";
import { dogService } from "@/services/dogService";
import type { Dog, DogQRCode } from "@/types/database";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Trash2, QrCode, Plus } from "lucide-react";

interface AdminQRManagementProps {
  dog: Dog;
  onRefresh?: () => void;
}

export function AdminQRManagement({ dog, onRefresh }: AdminQRManagementProps) {
  const [qrCodes, setQRCodes] = useState<DogQRCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newLocationHint, setNewLocationHint] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    if (isDialogOpen) {
      loadQRCodes();
    }
  }, [isDialogOpen]);

  async function loadQRCodes() {
    setLoading(true);
    setError(null);
    try {
      const data = await dogService.getDogQRCodes(dog.id);
      setQRCodes(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro ao carregar QR codes";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateQRCode() {
    setError(null);
    try {
      await dogService.createQRCode({
        dog_id: dog.id,
        label: newLabel || undefined,
        location_hint: newLocationHint || undefined,
      });
      setNewLabel("");
      setNewLocationHint("");
      await loadQRCodes();
      onRefresh?.();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro ao criar QR code";
      setError(message);
    }
  }

  async function handleDeleteQRCode(id: string) {
    if (!confirm("Tem certeza que deseja deletar este QR code?")) return;

    try {
      await dogService.deactivateQRCode(id);
      await loadQRCodes();
      onRefresh?.();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro ao deletar QR code";
      setError(message);
    }
  }

  function copyToClipboard(token: string) {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <QrCode className="h-4 w-4" />
          QR Codes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            QR Codes para {dog.emoji} {dog.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Form para criar novo QR code */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 font-semibold">Gerar Novo QR Code</h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Label (opcional)</Label>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Ex: Parque Central"
                />
              </div>
              <div className="space-y-2">
                <Label>Dica de Localização (opcional)</Label>
                <Input
                  value={newLocationHint}
                  onChange={(e) => setNewLocationHint(e.target.value)}
                  placeholder="Ex: Próximo à fonte"
                />
              </div>
              <Button
                onClick={handleCreateQRCode}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                Gerar QR Code
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Lista de QR codes */}
          {loading ? (
            <div className="py-4 text-center">Carregando...</div>
          ) : qrCodes.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              Nenhum QR code gerado ainda
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qrCodes.map((qr) => (
                    <TableRow key={qr.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-gray-100 px-2 py-1 text-xs font-mono">
                            {qr.token.substring(0, 8)}...
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(qr.token)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          {copiedToken === qr.token && (
                            <span className="text-xs text-green-600">
                              Copiado!
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{qr.label || "-"}</TableCell>
                      <TableCell>{qr.location_hint || "-"}</TableCell>
                      <TableCell>
                        {qr.is_active ? (
                          <span className="text-xs font-medium text-green-700">
                            Ativo
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-red-700">
                            Inativo
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteQRCode(qr.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
