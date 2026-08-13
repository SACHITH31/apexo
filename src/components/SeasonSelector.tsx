import { useMemo, useState } from "react";
import { CalendarRange, ChevronDown } from "lucide-react";
import { currentSeason, useAvailableSeasons, useSeasonSelection } from "@/lib/season";

/**
 * Season switcher — any season from 1950 to the current year. Historical
 * seasons render exactly like the live one, just without live states.
 */
export function SeasonSelector({ className = "" }: { className?: string }) {
  const { season, setSeason, isCurrent } = useSeasonSelection();
  const seasons = useAvailableSeasons();
  const [open, setOpen] = useState(false);

  const decades = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const y of seasons) {
      const key = `${y.slice(0, 3)}0s`;
      const list = groups.get(key) ?? [];
      list.push(y);
      groups.set(key, list);
    }
    return [...groups.entries()];
  }, [seasons]);

  return (
    <div className={"relative min-w-0 " + className}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full border border-accent/50 bg-accent/10 px-3 py-1.5 text-[11px] uppercase tracking-widest text-accent-glow hover-lift"
      >
        <CalendarRange className="h-3.5 w-3.5" />
        <span className="font-timing tabular-nums">{season}</span>
        {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" />}
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close season picker"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 max-h-80 w-64 overflow-y-auto rounded-2xl glass-elevated p-3 animate-scale-in">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Season</span>
              <button
                type="button"
                onClick={() => { setSeason(currentSeason()); setOpen(false); }}
                className="text-[10px] uppercase tracking-widest text-accent"
              >
                Current
              </button>
            </div>
            {decades.map(([decade, years]) => (
              <div key={decade} className="mb-2">
                <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{decade}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {years.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => { setSeason(y); setOpen(false); }}
                      className={
                        "rounded-full border px-2 py-1 font-timing tabular-nums text-xs transition-colors " +
                        (y === season
                          ? "border-accent/60 bg-accent/15 text-accent-glow"
                          : "border-border text-muted-foreground hover:text-foreground")
                      }
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
