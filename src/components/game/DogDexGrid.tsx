import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDogDexEntries, useDogDexStats } from "@/hooks/useGameData";
import type { Dog, UserDogEntry } from "@/types/database";
import { DogDetailModal } from "./DogDetailModal";
import { DogSprite, getDexVisibility } from "./DogSprite";
import { PokedexShell } from "./PokedexShell";
import { Sparkles, Lock } from "lucide-react";

type Filter = "all" | "captured" | "unknown";

export function DogDexGrid() {
  const { data: rows, isLoading } = useDogDexEntries();
  const { data: stats } = useDogDexStats();
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<{ dog: Dog; entry: UserDogEntry } | null>(null);

  const filtered = useMemo(() => {
    if (!rows) return [];
    return rows.filter(({ entry }) => {
      const captured = entry?.is_captured ?? false;
      const seen = !!(entry?.first_seen_at || entry?.last_encounter_at);
      if (filter === "captured") return captured;
      if (filter === "unknown") return !captured;
      return true;
    }).map(({ dog, entry }) => {
      const captured = entry?.is_captured ?? false;
      const seen = !!(entry?.first_seen_at || entry?.last_encounter_at);
      return { dog, entry, captured, seen, visibility: getDexVisibility(captured, seen) };
    });
  }, [rows, filter]);

  const header = (
    <div className="px-3 py-2 space-y-2 shrink-0 bg-[hsl(80_20%_82%)] border-b border-[hsl(145_20%_70%)]">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[10px] uppercase font-bold text-[hsl(145_40%_25%)]">Coleção</p>
          <p className="text-lg font-heading font-bold tabular-nums text-[hsl(220_25%_15%)]">
            {stats?.total_captured ?? 0}
            <span className="text-sm text-muted-foreground font-normal">
              /{stats?.catalog_total ?? 12}
            </span>
          </p>
        </div>
        <div className="text-right text-[10px] text-muted-foreground space-y-0.5">
          <p>{Math.round(stats?.completion_percent ?? 0)}% completo</p>
          <p>{stats?.total_shiny ?? 0} ✨ shiny</p>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-[hsl(145_15%_75%)] overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${stats?.completion_percent ?? 0}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>
      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList className="w-full grid grid-cols-3 h-8">
          <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
          <TabsTrigger value="captured" className="text-xs">Capturados</TabsTrigger>
          <TabsTrigger value="unknown" className="text-xs">Ocultos</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );

  if (isLoading) {
    return (
      <PokedexShell>
        <div className="p-6 text-sm text-muted-foreground animate-pulse text-center">
          Carregando registros...
        </div>
      </PokedexShell>
    );
  }

  return (
    <>
      <PokedexShell header={header}>
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-2">
          <div className="grid grid-cols-3 gap-2">
            {filtered.map(({ dog, entry, captured, visibility }, i) => (
              <motion.button
                key={dog.id}
                type="button"
                disabled={!captured || !entry}
                onClick={() => captured && entry && setSelected({ dog, entry })}
                className={`relative rounded-xl p-2 flex flex-col items-center gap-0.5 border-2 text-center min-h-[88px] ${
                  captured
                    ? "bg-white border-primary/40 hover:border-primary cursor-pointer shadow-sm"
                    : visibility === "seen"
                      ? "bg-white/60 border-dashed border-muted-foreground/30 cursor-default"
                      : "bg-[hsl(220_15%_20%)] border-[hsl(220_15%_30%)] cursor-default"
                }`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.015 }}
              >
                <DogSprite dog={dog} visibility={visibility} size="sm" shiny={entry?.is_shiny} />
                <span
                  className={`text-[9px] font-mono mt-0.5 ${
                    captured || visibility === "seen"
                      ? "text-muted-foreground"
                      : "text-white/40"
                  }`}
                >
                  #{String(dog.dex_number).padStart(3, "0")}
                </span>
                <span
                  className={`text-[10px] font-bold leading-tight ${
                    captured
                      ? "text-foreground"
                      : visibility === "seen"
                        ? "text-muted-foreground tracking-wider"
                        : "text-white/50 tracking-[0.2em]"
                  }`}
                >
                  {captured ? dog.name : "?????"}
                </span>
                {!captured && (
                  <Lock className="h-2.5 w-2.5 absolute top-1 right-1 text-muted-foreground/50" />
                )}
                {entry?.is_shiny && captured && (
                  <Sparkles className="absolute top-1 left-1 h-3 w-3 text-shiny" />
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </PokedexShell>

      {selected && (
        <DogDetailModal
          open={!!selected}
          onOpenChange={(o) => !o && setSelected(null)}
          dog={selected.dog}
          entry={selected.entry}
        />
      )}
    </>
  );
}
