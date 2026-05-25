import type { Dog } from "@/types/database";

export type DexVisibility = "unknown" | "seen" | "captured";

export function getDexVisibility(
  captured: boolean,
  seen: boolean,
): DexVisibility {
  if (captured) return "captured";
  if (seen) return "seen";
  return "unknown";
}

export function DogSprite({
  dog,
  visibility,
  size = "md",
  shiny = false,
}: {
  dog: Pick<Dog, "emoji">;
  visibility: DexVisibility;
  size?: "sm" | "md" | "lg" | "xl";
  shiny?: boolean;
}) {
  const sizeClass = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl",
    xl: "text-8xl",
  }[size];

  if (visibility === "unknown") {
    return (
      <div
        className={`${sizeClass} relative flex items-center justify-center select-none`}
        aria-hidden
      >
        <span className="opacity-[0.12] grayscale brightness-0 contrast-200 scale-110">
          {dog.emoji}
        </span>
        <span className="absolute inset-0 flex items-center justify-center text-foreground/25 font-bold text-lg">
          ?
        </span>
      </div>
    );
  }

  if (visibility === "seen") {
    return (
      <span
        className={`${sizeClass} opacity-40 grayscale-[0.6] blur-[0.5px] select-none`}
        aria-hidden
      >
        {dog.emoji}
      </span>
    );
  }

  return (
    <span
      className={`${sizeClass} ${shiny ? "drop-shadow-[0_0_12px_hsl(var(--shiny))] animate-pulse" : ""}`}
    >
      {dog.emoji}
    </span>
  );
}
