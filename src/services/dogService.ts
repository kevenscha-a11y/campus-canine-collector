import { supabase } from "@/lib/supabase";
import type { Dog, DogQRCode, Personality, Rarity } from "@/types/database";

export interface CreateDogInput {
  dex_number: number;
  name: string;
  slug: string;
  breed: string;
  age_years?: number | null;
  description: string;
  personality: Personality;
  rarity: Rarity;
  emoji: string;
  sprite_url?: string | null;
  silhouette_url?: string | null;
  large_image_url?: string | null;
  max_evolution_stage?: number;
}

export interface UpdateDogInput extends Partial<CreateDogInput> {
  id: string;
}

export interface CreateQRCodeInput {
  dog_id: string;
  token?: string;
  label?: string | null;
  location_hint?: string | null;
}

class DogService {
  private async resequenceDexNumbersClientSide(): Promise<void> {
    const { data, error } = await supabase
      .from("dogs")
      .select("id, dex_number, created_at")
      .eq("is_active", true)
      .order("dex_number", { ascending: true });

    if (error) throw error;
    const rows = (data ?? []) as Array<{ id: string; dex_number: number; created_at: string }>;
    if (!rows.length) return;

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const { error: tempError } = await supabase
        .from("dogs")
        .update({ dex_number: 10000 + index + 1 })
        .eq("id", row.id);

      if (tempError) throw tempError;
    }

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const { error: updateError } = await supabase
        .from("dogs")
        .update({ dex_number: index + 1 })
        .eq("id", row.id);

      if (updateError) throw updateError;
    }
  }

  /**
   * Lista todos os dogs ativos
   */
  async listDogs(): Promise<Dog[]> {
    const { data, error } = await supabase
      .from("dogs")
      .select("*")
      .eq("is_active", true)
      .order("dex_number", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Lista todos os dogs (incluindo inativos) - apenas para admin
   */
  async listAllDogs(): Promise<Dog[]> {
    const { data, error } = await supabase
      .from("dogs")
      .select("*")
      .order("dex_number", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Obtém um dog específico
   */
  async getDog(id: string): Promise<Dog | null> {
    const { data, error } = await supabase
      .from("dogs")
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code === "PGRST116") {
      return null; // Não encontrado
    }
    if (error) throw error;
    return data || null;
  }

  /**
   * Obtém um dog pelo slug
   */
  async getDogBySlug(slug: string): Promise<Dog | null> {
    const { data, error } = await supabase
      .from("dogs")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error && error.code === "PGRST116") {
      return null;
    }
    if (error) throw error;
    return data || null;
  }

  /**
   * Cria um novo dog - apenas admin
   */
  async createDog(input: CreateDogInput): Promise<Dog> {
    const { data, error } = await supabase
      .from("dogs")
      .insert({
        dex_number: input.dex_number,
        name: input.name,
        slug: input.slug,
        breed: input.breed,
        age_years: input.age_years || null,
        description: input.description,
        personality: input.personality,
        rarity: input.rarity,
        emoji: input.emoji,
        sprite_url: input.sprite_url || null,
        silhouette_url: input.silhouette_url || null,
        large_image_url: input.large_image_url || null,
        max_evolution_stage: input.max_evolution_stage || 3,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Atualiza um dog - apenas admin
   */
  async updateDog(input: UpdateDogInput): Promise<Dog> {
    const { id, ...updateData } = input;
    const { data, error } = await supabase
      .from("dogs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Deleta um dog - apenas admin
   */
  async deactivateDog(id: string): Promise<void> {
    const { error } = await supabase
      .from("dogs")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  async deleteDogAndResequence(id: string): Promise<void> {
    const { data, error } = await supabase.rpc("admin_delete_dog_and_resequence", {
      p_dog_id: id,
    });

    if (error) {
      const message = error.message?.toLowerCase?.() ?? "";
      const isMissingRpc =
        error.code === "PGRST202" ||
        message.includes("function") ||
        message.includes("admin_delete_dog_and_resequence");

      if (isMissingRpc) {
        throw new Error(
          "Função SQL de exclusão não encontrada. Aplique a migration 20260525130000_delete_dog_resequence.sql no Supabase.",
        );
      }

      if (message.includes("forbidden")) {
        throw new Error("Apenas admin pode excluir cachorro.");
      }

      throw new Error(error.message || "Falha ao excluir cachorro.");
    }
    if (!data) {
      throw new Error("Dog não encontrado ou já inativo.");
    }
  }

  /**
   * Ativa um dog previamente desativado - apenas admin
   */
  async activateDog(id: string): Promise<void> {
    const { error } = await supabase
      .from("dogs")
      .update({ is_active: true })
      .eq("id", id);

    if (error) throw error;
  }

  /**
   * Cria um QR code para um dog
   */
  async createQRCode(input: CreateQRCodeInput): Promise<DogQRCode> {
    const token = input.token || this.generateToken();

    const { data, error } = await supabase
      .from("dog_qr_codes")
      .insert({
        dog_id: input.dog_id,
        token,
        label: input.label || null,
        location_hint: input.location_hint || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Lista QR codes de um dog
   */
  async getDogQRCodes(dog_id: string): Promise<DogQRCode[]> {
    const { data, error } = await supabase
      .from("dog_qr_codes")
      .select("*")
      .eq("dog_id", dog_id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getPrimaryQRCode(dog_id: string): Promise<DogQRCode | null> {
    const list = await this.getDogQRCodes(dog_id);
    if (!list.length) return null;
    const active = list.find((item) => item.is_active);
    return active ?? list[0] ?? null;
  }

  /**
   * Desativa um QR code
   */
  async deactivateQRCode(id: string): Promise<void> {
    const { error } = await supabase
      .from("dog_qr_codes")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw error;
  }

  /**
   * Ativa um QR code
   */
  async activateQRCode(id: string): Promise<void> {
    const { error } = await supabase
      .from("dog_qr_codes")
      .update({ is_active: true })
      .eq("id", id);

    if (error) throw error;
  }

  /**
   * Gera um token único para QR code
   */
  private generateToken(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "";
    for (let i = 0; i < 16; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }
}

export const dogService = new DogService();
