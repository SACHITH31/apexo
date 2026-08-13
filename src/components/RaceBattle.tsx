import { useMemo } from "react";
import type { ReplayModel } from "@/lib/replay";
import { battleGaps } from "@/lib/race-insights";
import type { Driver } from "@/lib/mock-data";

interface Props {
  model: ReplayModel;
  a: string;
  b: string;
  currentLap: number;
  driversById: Record<string, Driver>;
  colorOf: (driverId: string) => string;
  onChange: (which: "a" | "b", driverId: string) => void;
  candidates: string[];
}

/**
 * Driver battle visualizer — gap evolution, position swaps and overtakes
 * between any two entrants, derived from the replay model.
 */
export function RaceBattle({ model, a, b, currentLap, driversById, colorOf, onChange, candidates }: Props) {
  const rows = useMemo(() => battleGaps(model, a, b), [model, a, b]);

  const stats = useMemo(() => {
    let swaps = 0;
    let lead = 0;
    for (let i = 0; i < rows.length; i++) {
      const aheadA = rows[i].aPos < rows[i].bPos;
      if (aheadA) lead += 1;
      if (i > 0 && aheadA !== rows[i - 1].aPos < rows[i - 1].bPos) swaps += 1;
    }
    const closest = rows.reduce((m, r) => Math.min(m, Math.abs(r.gap)), Infinity);
    return { swaps, lead, closest: Number.isFinite(closest) ? closest : 0 };
  }, [rows]);

  const max = Math.max(2, ...rows.map((r) => Math.abs(r.gap)));
  const w = 300;
  const h = 90;
  const points = rows
    .map((r, i) => {
      const x = rows.length > 1 ? (i / (rows.length - 1)) * w : 0;
      const y = h / 2 - (r.gap / max) * (h / 2 - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const cursorX = rows.length > 1 ? (Math.min(rows.length - 1, currentLap - 1) / (rows.length - 1)) * w : 0;
  const now = rows.find((r) => r.lap === currentLap) ?? rows[rows.length - 1];

  return (
    <div className="min-w-0 glass rounded-2xl p-5">
      <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        Battle mode
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {(["a", "b"] as const).map((which) => (
          <select
            key={which}
            value={which === "a" ? a : b}
            onChange={(e) => onChange(which, e.target.value)}
            aria-label={which === "a" ? "First driver" : "Second driver"}
            className="min-w-0 flex-1 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs"
          >
            {candidates.map((id) => (
              <option key={id} value={id}>
                {driversById[id]?.lastName ?? id}
              </option>
            ))}
          </select>
        ))}
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 w-full" role="img" aria-label="Gap evolution between the two drivers">
        <line x1={0} y1={h / 2} x2={w} y2={h / 2} stroke="currentColor" className="text-muted-foreground" opacity={0.3} strokeDasharray="3 4" />
        {points && <polyline points={points} fill="none" stroke={colorOf(a)} strokeWidth={1.8} strokeLinejoin="round" />}
        <line x1={cursorX} y1={0} x2={cursorX} y2={h} stroke="var(--accent)" strokeWidth={1} opacity={0.8} />
      </svg>

      <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <Stat label="Gap now" value={now ? `${Math.abs(now.gap).toFixed(1)}s` : "—"} />
        <Stat label="Closest" value={`${stats.closest.toFixed(1)}s`} />
        <Stat label="Swaps" value={String(stats.swaps)} />
        <Stat label={`${driversById[a]?.code ?? "A"} ahead`} value={`${stats.lead} laps`} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-surface/40 px-2 py-1.5">
      <div className="truncate text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-timing tabular-nums text-sm">{value}</div>
    </div>
  );
}
