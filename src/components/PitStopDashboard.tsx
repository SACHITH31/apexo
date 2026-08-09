import { useMemo } from "react";
import { Wrench } from "lucide-react";
import type { PitStopRecord } from "@/lib/f1-extra.server";
import type { Driver, Team } from "@/lib/mock-data";
import { AnimatedNumber } from "./AnimatedNumber";

/**
 * Pit Stop Dashboard — fastest stop, crew ranking and a lap-by-lap timeline.
 */
export function PitStopDashboard({
  pitStops,
  driversById,
  teamFor,
}: {
  pitStops: PitStopRecord[];
  driversById: Record<string, Driver>;
  teamFor: (driver: Driver) => Team;
}) {
  const model = useMemo(() => {
    const valid = pitStops.filter((p) => p.duration > 0 && p.duration < 120);
    const best = new Map<string, PitStopRecord>();
    const totals = new Map<string, { sum: number; n: number }>();
    for (const p of valid) {
      const cur = best.get(p.driverId);
      if (!cur || p.duration < cur.duration) best.set(p.driverId, p);
      const t = totals.get(p.driverId) ?? { sum: 0, n: 0 };
      t.sum += p.duration;
      t.n += 1;
      totals.set(p.driverId, t);
    }
    const ranking = [...best.values()]
      .sort((a, b) => a.duration - b.duration)
      .map((p) => {
        const t = totals.get(p.driverId)!;
        return { ...p, avg: t.sum / t.n, stops: t.n };
      });
    const fastest = ranking[0];
    const avg = valid.length ? valid.reduce((a, b) => a + b.duration, 0) / valid.length : 0;
    const maxLap = Math.max(1, ...valid.map((p) => p.lap));
    return { valid, ranking, fastest, avg, maxLap, count: valid.length };
  }, [pitStops]);

  if (!model.count) return null;

  const slowest = model.ranking.at(-1)!.duration;

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="Fastest stop"
          value={model.fastest.duration}
          decimals={2}
          suffix="s"
          sub={`${driversById[model.fastest.driverId]?.lastName ?? model.fastest.driverId} · Lap ${model.fastest.lap}`}
          highlight
        />
        <Stat label="Field average" value={model.avg} decimals={2} suffix="s" sub="All classified stops" />
        <Stat label="Total stops" value={model.count} sub="Across the field" />
      </div>

      <div className="relative overflow-hidden glass rounded-2xl p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px accent-line opacity-60" />
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          <Wrench className="h-3 w-3" /> Crew ranking
        </div>
        <ol className="mt-4 space-y-2">
          {model.ranking.map((p, i) => {
            const d = driversById[p.driverId];
            const t = d ? teamFor(d) : undefined;
            const pct = (p.duration / slowest) * 100;
            return (
              <li key={p.driverId} className="flex items-center gap-3">
                <span className="w-6 font-timing tabular-nums text-sm text-muted-foreground">{i + 1}</span>
                <span className="w-24 shrink-0">
                  <span className="font-display text-base leading-none" style={{ color: t?.color }}>
                    {d?.code ?? p.driverId}
                  </span>
                  <span className="block text-[10px] uppercase tracking-widest text-muted-foreground truncate">
                    {t?.name ?? "—"}
                  </span>
                </span>
                <span className="flex-1 h-2 rounded-full bg-surface/70 overflow-hidden">
                  <span
                    className="block h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{
                      width: `${pct}%`,
                      background: t?.color ?? "var(--accent)",
                      boxShadow: i === 0 ? `0 0 14px ${t?.color ?? "var(--accent)"}66` : undefined,
                    }}
                  />
                </span>
                <span className="w-28 text-right">
                  <span className="font-timing tabular-nums text-sm">{p.duration.toFixed(2)}s</span>
                  <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">
                    avg {p.avg.toFixed(2)}s · {p.stops} stop{p.stops > 1 ? "s" : ""}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="relative overflow-hidden glass rounded-2xl p-5 sm:p-6">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Stop timeline</div>
        <div className="relative mt-6 h-16 rounded-xl border border-border bg-surface/40">
          {model.valid.map((p, i) => {
            const d = driversById[p.driverId];
            const t = d ? teamFor(d) : undefined;
            return (
              <span
                key={`${p.driverId}-${p.stop}-${i}`}
                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-background"
                style={{ left: `${(p.lap / model.maxLap) * 100}%`, background: t?.color ?? "var(--accent)" }}
                title={`${d?.code ?? p.driverId} · lap ${p.lap} · ${p.duration.toFixed(2)}s`}
              />
            );
          })}
          <span className="absolute -bottom-5 left-0 text-[10px] uppercase tracking-widest text-muted-foreground">Lap 1</span>
          <span className="absolute -bottom-5 right-0 text-[10px] uppercase tracking-widest text-muted-foreground">
            Lap {model.maxLap}
          </span>
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  decimals = 0,
  suffix = "",
  sub,
  highlight,
}: {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "rounded-2xl border p-4 " + (highlight ? "carbon-texture border-accent/40" : "border-border bg-surface/40")
      }
    >
      <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
      <div
        className={"mt-1 font-timing tabular-nums text-3xl leading-tight " + (highlight ? "text-gradient-accent" : "")}
      >
        <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
      </div>
      {sub && <div className="text-xs text-muted-foreground truncate">{sub}</div>}
    </div>
  );
}
