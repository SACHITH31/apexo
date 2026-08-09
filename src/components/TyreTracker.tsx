import type { StintRecord } from "@/lib/f1-extra.server";
import type { Driver, Team } from "@/lib/mock-data";
import { Disc3 } from "lucide-react";

const COMPOUND: Record<string, { color: string; short: string; label: string }> = {
  SOFT: { color: "#E8002D", short: "S", label: "Soft" },
  MEDIUM: { color: "#FFD12E", short: "M", label: "Medium" },
  HARD: { color: "#F0F0F0", short: "H", label: "Hard" },
  INTERMEDIATE: { color: "#43B02A", short: "I", label: "Intermediate" },
  WET: { color: "#0067AD", short: "W", label: "Wet" },
  UNKNOWN: { color: "#8A8F98", short: "?", label: "Unknown" },
};

function lapsOf(s: StintRecord) {
  return Math.max(1, s.lapEnd - s.lapStart + 1);
}

function compoundOf(c?: string) {
  return COMPOUND[(c ?? "").toUpperCase()] ?? COMPOUND.UNKNOWN;
}

/** Rough degradation read: laps run versus the expected life of the compound. */
function degradation(compound: string, laps: number) {
  const life: Record<string, number> = { SOFT: 20, MEDIUM: 30, HARD: 42, INTERMEDIATE: 28, WET: 30, UNKNOWN: 30 };
  const pct = Math.min(100, Math.round((laps / (life[compound.toUpperCase()] ?? 30)) * 100));
  const state = pct >= 90 ? "Cliff" : pct >= 65 ? "Worn" : pct >= 35 ? "Working" : "Fresh";
  return { pct, state };
}

/**
 * Live Tyre Tracker — stint bars per driver with compound colours and a
 * degradation read for the current set.
 */
export function TyreTracker({
  stints,
  totalLaps,
  driversByNumber,
  teamFor,
}: {
  stints: StintRecord[];
  totalLaps: number;
  driversByNumber: Record<number, Driver>;
  teamFor: (driver: Driver) => Team;
}) {
  if (!stints.length) return null;

  const byDriver = new Map<number, StintRecord[]>();
  for (const s of stints) {
    if (!byDriver.has(s.driverNumber)) byDriver.set(s.driverNumber, []);
    byDriver.get(s.driverNumber)!.push(s);
  }

  const laps = Math.max(totalLaps, ...stints.map((s) => s.lapEnd), 1);
  const rows = [...byDriver.entries()]
    .map(([number, list]) => ({
      number,
      driver: driversByNumber[number],
      stints: [...list].sort((a, b) => a.lapStart - b.lapStart),
    }))
    .sort((a, b) => (b.stints.at(-1)?.lapEnd ?? 0) - (a.stints.at(-1)?.lapEnd ?? 0));

  return (
    <section className="relative overflow-hidden glass rounded-2xl p-5 sm:p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px accent-line opacity-60" />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        <Disc3 className="h-3 w-3" /> Tyre tracker
        <div className="ml-auto flex flex-wrap gap-2">
          {["SOFT", "MEDIUM", "HARD", "INTERMEDIATE", "WET"].map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5 normal-case tracking-normal text-[11px]">
              <span
                className="grid h-4 w-4 place-items-center rounded-full border text-[8px] font-bold"
                style={{ borderColor: COMPOUND[c].color, color: COMPOUND[c].color }}
              >
                {COMPOUND[c].short}
              </span>
              {COMPOUND[c].label}
            </span>
          ))}
        </div>
      </div>

      <ul className="mt-4 space-y-2.5">
        {rows.map(({ number, driver, stints: list }) => {
          const team = driver ? teamFor(driver) : undefined;
          const current = list.at(-1)!;
          const deg = degradation(current.compound, lapsOf(current));
          return (
            <li key={number} className="flex items-center gap-3">
              <div className="w-24 shrink-0">
                <div className="font-display text-base leading-none" style={{ color: team?.color }}>
                  {driver?.code ?? `#${number}`}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">
                  {team?.name ?? "—"}
                </div>
              </div>

              <div className="relative flex-1 h-7 rounded-lg bg-surface/70 overflow-hidden border border-border">
                {list.map((s, i) => {
                  const left = ((s.lapStart - 1) / laps) * 100;
                  const width = (lapsOf(s) / laps) * 100;
                  const c = compoundOf(s.compound);
                  return (
                    <div
                      key={i}
                      className="absolute inset-y-0 flex items-center justify-center border-r border-background/60"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        background: `linear-gradient(180deg, ${c.color}59, ${c.color}26)`,
                      }}
                      title={`${c.label} · laps ${s.lapStart}-${s.lapEnd}`}
                    >
                      <span className="font-timing text-[10px] tabular-nums" style={{ color: c.color }}>
                        {c.short}
                        {width > 12 ? ` ${lapsOf(s)}` : ""}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="w-24 shrink-0 text-right">
                <div
                  className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: deg.pct >= 90 ? "var(--accent)" : undefined }}
                >
                  {deg.state}
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-surface overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width] duration-700"
                    style={{ width: `${deg.pct}%`, background: compoundOf(current.compound).color }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
