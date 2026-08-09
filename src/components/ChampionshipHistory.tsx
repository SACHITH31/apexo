import { Trophy } from "lucide-react";

/**
 * Animated constructors' championship history. Renders the title-winning
 * seasons as a horizontally scrollable, decade-grouped timeline.
 */
export function ChampionshipHistory({
  years,
  accent,
  teamName,
}: {
  years: number[];
  accent: string;
  teamName: string;
}) {
  if (!years.length) {
    return (
      <div className="rounded-2xl border border-border bg-surface/40 p-6">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Championship history</div>
        <p className="mt-2 text-sm text-muted-foreground">
          {teamName} is still chasing a first Constructors' Championship.
        </p>
      </div>
    );
  }

  const sorted = [...years].sort((a, b) => a - b);

  return (
    <div className="relative overflow-hidden rounded-2xl glass p-6 hover-lift">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px accent-line opacity-60" />
      <div className="flex flex-wrap items-baseline gap-3">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          <Trophy className="h-3 w-3" /> Championship history
        </div>
        <div className="ml-auto font-timing tabular-nums text-2xl" style={{ color: accent }}>
          {sorted.length}
          <span className="ml-1 text-[10px] uppercase tracking-widest text-muted-foreground">titles</span>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto pb-2">
        <ol className="relative flex min-w-max items-end gap-3" aria-label={`${teamName} constructors' titles`}>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-6 h-px"
            style={{ background: `linear-gradient(to right, transparent, ${accent}, transparent)` }}
          />
          {sorted.map((y, i) => (
            <li
              key={y}
              className="relative animate-slide-up"
              style={{ animationDelay: `${Math.min(i * 45, 520)}ms` }}
            >
              <div
                className="rounded-lg border px-3 py-2 text-center carbon-texture"
                style={{ borderColor: `${accent}66` }}
              >
                <div className="font-timing tabular-nums text-lg leading-none">{y}</div>
              </div>
              <span
                aria-hidden
                className="mx-auto mt-1.5 block h-2 w-2 rounded-full"
                style={{ background: accent }}
              />
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        First {sorted[0]} · Latest {sorted[sorted.length - 1]}
      </div>
    </div>
  );
}
