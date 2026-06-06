import type { ReactNode } from "react";

export function PokedexShell({
  children,
  header,
  footer,
}: {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex flex-col h-full min-h-0 rounded-2xl overflow-hidden border-4 border-[hsl(0_72%_42%)] shadow-[inset_0_0_0_3px_hsl(0_60%_30%),0_8px_24px_rgba(0,0,0,0.15)] bg-[hsl(145_40%_18%)]">
      <div className="h-2 bg-[hsl(0_72%_48%)] shrink-0" />
      <div className="px-3 py-2 flex items-center justify-between gap-2 bg-[hsl(145_45%_22%)] border-b-2 border-[hsl(0_60%_30%)] shrink-0">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-inner" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-inner" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-inner" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[hsl(80_30%_85%)]">
          DogDex
        </span>
        <div className="w-8 h-8 rounded-full border-4 border-[hsl(195_80%_55%)] bg-[hsl(195_70%_40%)] shadow-[inset_0_0_8px_rgba(255,255,255,0.4)]" />
      </div>
      {header}
      <div className="flex-1 min-h-0 bg-[hsl(80_25%_88%)] m-2 rounded-lg border-2 border-[hsl(145_30%_25%)] overflow-hidden flex flex-col">
        {children}
      </div>
      {footer}
      <div className="h-3 bg-[hsl(0_72%_42%)] shrink-0" />
    </div>
  );
}
