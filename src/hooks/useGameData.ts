import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { gameService } from "@/services/gameService";
import type { BiscuitType, CaptureResult, EncounterData } from "@/types/database";

export function useBiscuitWallet() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["biscuit-wallet", user?.id],
    enabled: !!user,
    queryFn: () => gameService.syncWallet(user!.id),
    refetchInterval: 60_000,
  });
}

export function useDogDexStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["dogdex-stats", user?.id],
    enabled: !!user,
    queryFn: () => gameService.getStats(user!.id),
  });
}

export function useDogDexEntries() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["dogdex-entries", user?.id],
    enabled: !!user,
    queryFn: () => gameService.getDexRows(user!.id),
  });
}

export function useCaptureHistory(dogId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["capture-history", user?.id, dogId],
    enabled: !!user && !!dogId,
    queryFn: () => gameService.getCaptureHistory(user!.id, dogId!),
  });
}

export function useGameActions() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const invalidate = () => {
    const id = user?.id;
    queryClient.invalidateQueries({ queryKey: ["biscuit-wallet", id] });
    queryClient.invalidateQueries({ queryKey: ["dogdex-stats", id] });
    queryClient.invalidateQueries({ queryKey: ["dogdex-entries", id] });
    queryClient.invalidateQueries({ queryKey: ["capture-history"] });
  };

  const resolveQr = async (token: string) => {
    const data = await gameService.resolveQr(user!.id, token);
    invalidate();
    return data as EncounterData;
  };

  const attemptCapture = async (token: string, biscuitType: BiscuitType) => {
    const data = await gameService.attemptCapture(user!.id, token, biscuitType);
    invalidate();
    return data as CaptureResult;
  };

  return { resolveQr, attemptCapture, invalidate };
}
