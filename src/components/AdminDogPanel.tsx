import { useState, useEffect } from "react";
import { dogService } from "@/services/dogService";
import { AdminQRManagement } from "@/components/AdminQRManagement";
import type { Dog, Personality, Rarity } from "@/types/database";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Edit2, Plus } from "lucide-react";

interface DogFormData {
  dex_number: string;
  name: string;
  slug: string;
  breed: string;
  age_years: string;
  description: string;
  personality: Personality;
  rarity: Rarity;
  emoji: string;
  max_evolution_stage: string;
}

const PERSONALITIES: Personality[] = [
  "playful",
  "calm",
  "shy",
  "bold",
  "curious",
  "lazy",
  "energetic",
];

const PERSONALITY_LABELS_PT: Record<Personality, string> = {
  playful: "Brincalhão",
  calm: "Calmo",
  shy: "Tímido",
  bold: "Corajoso",
  curious: "Curioso",
  lazy: "Preguiçoso",
  energetic: "Energético",
};

const RARITIES: Rarity[] = ["common", "rare", "epic", "legendary"];

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function AdminDogPanel({ editDogId, createMode, onClose }: { editDogId?: string | null; createMode?: boolean; onClose?: () => void }) {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingDog, setEditingDog] = useState<Dog | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<DogFormData>({
    dex_number: "",
    name: "",
    slug: "",
    breed: "",
    age_years: "",
    description: "",
    personality: "playful",
    rarity: "common",
    emoji: "🐕",
    max_evolution_stage: "3",
  });
  const [spriteFile, setSpriteFile] = useState<File | null>(null);
  const [spritePreview, setSpritePreview] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Carregar dogs ao montar o componente
  useEffect(() => {
    loadDogs();
  }, []);

  // Se editDogId for passado via query param, abrir modal de edição
  useEffect(() => {
    if (!editDogId) return;
    (async () => {
      try {
        // aguarda dogs carregarem
        if (loading) return;
        let dog = dogs.find((d) => d.id === editDogId) ?? null;
        if (!dog) {
          dog = await dogService.getDog(editDogId);
        }
        if (dog) openEditDialog(dog);
      } catch (e) {
        /* ignore */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editDogId, loading]);

  // Se createMode estiver true, abrir modal de criação
  useEffect(() => {
    if (!createMode) return;
    if (loading) return;
    openCreateDialog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createMode, loading]);

  // notifica quando o modal fechar
  useEffect(() => {
    if (!isDialogOpen) {
      onClose?.();
    }
  }, [isDialogOpen, onClose]);

  async function loadDogs() {
    setLoading(true);
    setError(null);
    try {
      const data = await dogService.listAllDogs();
      setDogs(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro ao carregar dogs";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function getNextDexNumber(): Promise<number> {
    const activeDogs = await dogService.listDogs();
    return activeDogs.length
      ? Math.max(...activeDogs.map((dog) => dog.dex_number)) + 1
      : 1;
  }

  async function openCreateDialog() {
    const nextDex = await getNextDexNumber();

    setEditingDog(null);
    setFormData({
      dex_number: String(nextDex),
      name: "",
      slug: "",
      breed: "",
      age_years: "",
      description: "",
      personality: "playful",
      rarity: "common",
      emoji: "🐕",
      max_evolution_stage: "3",
    });
    setSpriteFile(null);
    setSpritePreview("");
    setIsDialogOpen(true);
  }

  function openEditDialog(dog: Dog) {
    setEditingDog(dog);
    setFormData({
      dex_number: dog.dex_number.toString(),
      name: dog.name,
      slug: dog.slug,
      breed: dog.breed,
      age_years: dog.age_years?.toString() || "",
      description: dog.description,
      personality: dog.personality,
      rarity: dog.rarity,
      emoji: dog.emoji,
      max_evolution_stage: dog.max_evolution_stage.toString(),
    });
    setSpriteFile(null);
    setSpritePreview(dog.sprite_url || "");
    setIsDialogOpen(true);
  }

  async function uploadSprite(file: File, slug: string): Promise<string> {
    const safeSlug = slug || `dog-${Date.now()}`;
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `dogs/${safeSlug}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("dog-sprites")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      throw new Error(`Falha no upload do sprite: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from("dog-sprites").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const slug = slugify(formData.name);
      let spriteUrl: string | null = spritePreview || null;
      const dexNumber = editingDog ? parseInt(formData.dex_number) : await getNextDexNumber();

      if (spriteFile) {
        spriteUrl = await uploadSprite(spriteFile, slug);
      }

      const input = {
        dex_number: dexNumber,
        name: formData.name,
        slug,
        breed: formData.breed,
        age_years: formData.age_years ? parseFloat(formData.age_years) : null,
        description: formData.description,
        personality: formData.personality,
        rarity: formData.rarity,
        emoji: formData.emoji,
        sprite_url: spriteUrl,
        silhouette_url: null,
        large_image_url: null,
        max_evolution_stage: parseInt(formData.max_evolution_stage),
      };

      if (editingDog) {
        await dogService.updateDog({ id: editingDog.id, ...input });
      } else {
        const createdDog = await dogService.createDog(input);
        await dogService.createQRCode({
          dog_id: createdDog.id,
          label: `${createdDog.name} - coleira`,
          location_hint: "Campus",
        });
      }

      await loadDogs();
      setIsDialogOpen(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro ao salvar dog";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja deletar este dog?")) return;

    try {
      await dogService.deleteDogAndResequence(id);
      await loadDogs();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro ao deletar dog";
      setError(message);
    }
  }

  if (loading) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div className="w-full space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gerenciar Dogs</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Dog
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingDog ? "Editar Dog" : "Criar Novo Dog"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número da Pokédex *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.dex_number}
                    readOnly
                    disabled
                    placeholder="Automático"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Emoji *</Label>
                  <Input
                    value={formData.emoji}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emoji: e.target.value,
                      })
                    }
                    placeholder="🐕"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: slugify(e.target.value),
                    })
                  }
                  placeholder="Nome do dog"
                />
              </div>

              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input
                  value={formData.slug}
                  readOnly
                  disabled
                  placeholder="nome-do-dog"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Raça *</Label>
                  <Input
                    value={formData.breed}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        breed: e.target.value,
                      })
                    }
                    placeholder="Ex: Labrador"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Idade (anos)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.age_years}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        age_years: e.target.value,
                      })
                    }
                    placeholder="Ex: 2.5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Descrição do dog"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Personalidade *</Label>
                  <Select
                    value={formData.personality}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        personality: value as Personality,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERSONALITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PERSONALITY_LABELS_PT[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Raridade *</Label>
                  <Select
                    value={formData.rarity}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        rarity: value as Rarity,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RARITIES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Evolution Stage</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.max_evolution_stage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_evolution_stage: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sprite do Pokédog (arquivo de imagem)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSpriteFile(file);
                    if (file) {
                      setSpritePreview(URL.createObjectURL(file));
                    }
                  }}
                />
                {spritePreview && (
                  <div className="rounded border p-2 w-fit">
                    <img src={spritePreview} alt="Preview do sprite" className="h-20 w-20 object-contain" />
                  </div>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {editingDog ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabela de Dogs */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Raça</TableHead>
              <TableHead>Personalidade</TableHead>
              <TableHead>Raridade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dogs.map((dog) => (
              <TableRow key={dog.id}>
                <TableCell className="font-mono">{dog.dex_number}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{dog.emoji}</span>
                    <span className="font-medium">{dog.name}</span>
                  </div>
                </TableCell>
                <TableCell>{dog.breed}</TableCell>
                <TableCell capitalize>
                  {dog.personality.charAt(0).toUpperCase() +
                    dog.personality.slice(1)}
                </TableCell>
                <TableCell>
                  {dog.rarity.charAt(0).toUpperCase() + dog.rarity.slice(1)}
                </TableCell>
                <TableCell>
                  {dog.is_active ? (
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
                  <div className="flex justify-end gap-2">
                    <AdminQRManagement dog={dog} onRefresh={loadDogs} />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(dog)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(dog.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
