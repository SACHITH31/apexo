import { useMemo, useState } from "react";
import {
  AlertTriangle, CheckeredIcon, Flag, Gauge, Radio, ShieldAlert, Timer, TriangleAlert, Wrench, Zap,
} from "./RaceControlIcons";
import { EVENT_STYLE, type RaceEvent, type RaceEventKind } from "@/lib/race-events";
import type { Driver, Team } from "@/lib/mock-data";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "./Skeletons";

const ICONS: Record<RaceEventKind, typeof Flag> = {
  start: Zap,
  green: Flag,
  yellow: TriangleAlert,
  "double-yellow": AlertTriangle,
  red: ShieldAlert,
  sc: ShieldAlert,
  vsc: Gauge,
  chequered: CheckeredIcon,
  penalty: AlertTriangle,
  "track-limits": Flag,
  drs: Zap,
  pit: Wrench,
  "fastest-lap": Timer,
  result: Flag,
  info: Radio,
};

/** Toggleable event groups — multi-select, so the story scroll stays intact. */
const GROUPS: { id: string; label: string; kinds: RaceEventKind[] }[] = [
  { id: "flags", label: "Flags", kinds: ["green", "yellow", "double-yellow", "chequered", "start"] },
  { id: "sc", label: "Safety car", kinds: ["sc", "vsc"] },
  { id: "red", label: "Red flag", kinds: ["red"] },
  { id: "penalty", label: "Penalties", kinds: ["penalty", "track-limits"] },
  { id: "pit", label: "Pit stops", kinds: ["pit"] },
  { id: "pace", label: "Pace & DRS", kinds: ["fastest-lap", "drs"] },
  { id: "info", label: "Info", kinds: ["info", "result"] },
];

const ALL_IDS = GROUPS.map((g) => g.id);


export function RaceControlTimelineSkeleton() {
  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <Skeleton className="h-3 w-40" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Race Control Timeline — the race told as a chronological story.
 * Events group by lap so scrolling reads like a race report.
 */
export function RaceControlTimeline({
  events,
  source,
  driversById,
  driversByNumber,
  teamFor,
}: {
  events: RaceEvent[];
  source: "live" | "derived" | "none";
  driversById: Record<string, Driver>;
  driversByNumber: Record<number, Driver>;
  teamFor: (driver: Driver) => Team;
}) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  const groups = useMemo(() => {
    const active = FILTERS.find((f) => f.id === filter);
    const list = active?.kinds ? events.filter((e) => active.kinds!.includes(e.kind)) : events;
    const byLap = new Map<number, RaceEvent[]>();
    for (const e of list) {
      const lap = e.lap ?? 0;
      if (!byLap.has(lap)) byLap.set(lap, []);
      byLap.get(lap)!.push(e);
    }
    return [...byLap.entries()].sort((a, b) => a[0] - b[0]);
  }, [events, filter]);

  if (!events.length) {
    return (
      <EmptyState
        title="No race control feed yet"
        description="Race control messages appear here once the session gets underway."
      />
    );
  }

  return (
    <div className="relative overflow-hidden glass rounded-2xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px accent-line opacity-60" />
      <div className="flex flex-wrap items-center gap-2 p-5 pb-3">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground mr-auto">
          <Radio className="h-3 w-3" /> Race control
          <span className="rounded-full border border-border px-2 py-0.5 tracking-widest">
            {source === "live" ? "Live feed" : "Reconstructed"}
          </span>
        </div>
        <div className="flex gap-1.5" role="tablist" aria-label="Filter race control events">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={
                "rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors min-h-9 " +
                (filter === f.id
                  ? "border-accent/60 bg-accent/10 text-accent-glow"
                  : "border-border bg-surface/50 text-muted-foreground hover:text-foreground hover:border-accent/40")
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <ol className="relative px-5 pb-6">
        <span
          aria-hidden
          className="absolute left-[38px] top-2 bottom-6 w-px bg-gradient-to-b from-border via-border to-transparent"
        />
        {groups.map(([lap, items]) => (
          <li key={lap} className="relative">
            <div className="sticky top-16 z-10 -mx-5 px-5 py-2 backdrop-blur-sm">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                {lap > 0 ? `Lap ${lap}` : "Pre-race"}
              </span>
            </div>
            <ul className="space-y-2.5 pb-2">
              {items.map((e) => {
                const style = EVENT_STYLE[e.kind];
                const Icon = ICONS[e.kind];
                const driver =
                  (e.driverId ? driversById[e.driverId] : undefined) ??
                  (e.driverNumber ? driversByNumber[e.driverNumber] : undefined);
                const team = driver ? teamFor(driver) : undefined;
                const color = team?.color ?? style.color;
                return (
                  <li
                    key={e.id}
                    className="group relative flex gap-3.5 rounded-xl border border-border bg-surface/40 p-3.5 hover-lift"
                    style={{ borderLeftColor: color, borderLeftWidth: 2 }}
                  >
                    <span
                      aria-hidden
                      className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border"
                      style={{
                        borderColor: color,
                        background: `color-mix(in oklab, ${color} 16%, transparent)`,
                        color,
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-display text-lg leading-tight" style={{ color }}>
                          {style.label}
                        </span>
                        {driver && (
                          <span className="text-xs uppercase tracking-widest text-muted-foreground">
                            {driver.code} · {team?.name}
                          </span>
                        )}
                        {e.time && (
                          <span className="ml-auto font-timing tabular-nums text-xs text-muted-foreground">
                            {e.time.slice(11, 19)}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground break-words">{e.message}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
