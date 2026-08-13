import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  CloudRain,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  Thermometer,
  Wind,
  Wrench,
} from "lucide-react";
import type { Driver, Race } from "@/lib/mock-data";
import type { RaceDetail } from "@/lib/f1-extra.server";
import { buildReplay, weatherAtLap } from "@/lib/replay";
import { EVENT_STYLE } from "@/lib/race-events";
import { ReplayTrackMap } from "./ReplayTrackMap";
import { useRaceWeather, weatherSessionsOf } from "@/lib/weather-data";

const SPEEDS = [1, 2, 5, 10] as const;
const LAP_MS = 2200; // one replay lap at 1x

const COMPOUND_COLOR: Record<string, string> = {
  SOFT: "var(--track-red)",
  MEDIUM: "var(--track-yellow)",
  HARD: "var(--foreground)",
  INTERMEDIATE: "var(--track-green)",
  WET: "var(--tyre-wet)",
};

interface Props {
  race: Race;
  circuitId: string;
  circuitLaps: number;
  drsZones: number;
  detail?: RaceDetail;
  driversById: Record<string, Driver>;
  driversByNumber: Record<number, Driver>;
  teamFor: (d: Driver) => { name: string; color: string };
}

/**
 * Interactive race replay — scrub or play a completed race lap by lap with a
 * live leaderboard, tyre state, pit window, race control feed and evolving
 * weather. Reconstructed from results data, never from race footage.
 */
export function RaceReplay({
  race,
  circuitId,
  circuitLaps,
  drsZones,
  detail,
  driversById,
  driversByNumber,
  teamFor,
}: Props) {
  const model = useMemo(
    () => buildReplay(detail, { circuitLaps, driversByNumber }),
    [detail, circuitLaps, driversByNumber],
  );

  const [progress, setProgress] = useState(1); // continuous lap position
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(2);
  const raf = useRef<number | null>(null);
  const last = useRef<number>(0);

  const total = model.totalLaps;

  useEffect(() => {
    if (!playing || !total) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    last.current = performance.now();
    const tick = (now: number) => {
      const dt = now - last.current;
      last.current = now;
      setProgress((p) => {
        const next = p + (dt / LAP_MS) * speed * (reduced ? 2 : 1);
        if (next >= total) {
          setPlaying(false);
          return total;
        }
        return next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [playing, speed, total]);

  const lapIndex = Math.max(1, Math.min(total, Math.floor(progress)));
  const state = model.laps[lapIndex - 1];
  const lapProgress = progress - Math.floor(progress);

  const weather = useRaceWeather(circuitId, weatherSessionsOf(race));
  const baseWeather = weather.data?.sessions.find((s) => s.key === "race");
  const wx = weatherAtLap(lapIndex, total, baseWeather as never);

  const keyMoments = useMemo(
    () =>
      model.events
        .filter((e) => ["start", "sc", "vsc", "red", "penalty", "fastest-lap", "chequered"].includes(e.kind))
        .slice(0, 14),
    [model.events],
  );

  const jump = useCallback((lap: number) => {
    setProgress(Math.max(1, lap));
  }, []);

  if (!model.available || !state) {
    return (
      <div className="glass rounded-2xl p-6 text-sm text-muted-foreground">
        Replay becomes available once classified results are published for this race.
      </div>
    );
  }

  const leader = state.order[0];
  const leaderDriver = leader ? driversById[leader.driverId] : undefined;
  const leaderColor = leaderDriver ? teamFor(leaderDriver).color : undefined;
  const feed = model.events.filter((e) => (e.lap ?? 1) <= lapIndex).slice(-6).reverse();

  return (
    <section className="space-y-4">
      <div className="glass rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Race replay</div>
          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
            Reconstructed
          </span>
          <div className="ml-auto font-timing tabular-nums text-2xl">
            L{String(lapIndex).padStart(2, "0")}
            <span className="text-muted-foreground text-base">/{total}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (progress >= total) setProgress(1);
              setPlaying((p) => !p);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[11px] uppercase tracking-widest text-accent-foreground hover-lift"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {playing ? "Pause" : "Play"}
          </button>
          <button type="button" onClick={() => jump(lapIndex - 1)} className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground" aria-label="Previous lap">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => jump(lapIndex + 1)} className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground" aria-label="Next lap">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => { setPlaying(false); setProgress(1); }} className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground" aria-label="Restart">
            <RotateCcw className="h-4 w-4" />
          </button>
          <div className="ml-auto flex items-center gap-1">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={
                  "rounded-full px-2.5 py-1 text-[10px] uppercase tracking-widest border transition-colors " +
                  (speed === s
                    ? "border-accent/60 bg-accent/15 text-accent-glow"
                    : "border-border text-muted-foreground hover:text-foreground")
                }
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        <input
          type="range"
          min={1}
          max={total}
          step={0.05}
          value={progress}
          onChange={(e) => { setPlaying(false); setProgress(Number(e.target.value)); }}
          aria-label="Scrub race lap"
          className="mt-4 w-full accent-[var(--accent)]"
        />

        {keyMoments.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
            {keyMoments.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => { setPlaying(false); jump(e.lap ?? 1); }}
                className="shrink-0 rounded-full border border-border bg-surface/50 px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
                style={{ borderColor: EVENT_STYLE[e.kind].color }}
              >
                L{e.lap ?? 1} · {EVENT_STYLE[e.kind].label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReplayTrackMap
          circuitId={circuitId}
          lap={lapIndex}
          totalLaps={total}
          lapProgress={lapProgress}
          trackStatus={state.trackStatus}
          drsZones={drsZones}
          leaderColor={leaderColor}
        />

        <div className="min-w-0 glass rounded-2xl p-5 sm:p-6">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Live order</div>
          <ol className="mt-3 max-h-[22rem] overflow-y-auto pr-1 space-y-1">
            {state.order.map((o) => {
              const d = driversById[o.driverId];
              if (!d) return null;
              const t = teamFor(d);
              return (
                <li key={o.driverId}>
                  <Link
                    to="/drivers/$driverId"
                    params={{ driverId: o.driverId }}
                    className={
                      "flex min-w-0 items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 hover:border-accent/40 hover:bg-surface/60 transition-colors " +
                      (o.retired ? "opacity-45" : "")
                    }
                  >
                    <span className="w-6 shrink-0 font-timing tabular-nums text-sm text-muted-foreground">
                      {o.retired ? "—" : o.position}
                    </span>
                    <span className="h-4 w-1 shrink-0 rounded-full" style={{ background: t.color }} />
                    <span className="min-w-0 flex-1 truncate text-sm">{d.lastName}</span>
                    {!o.retired && (
                      <span
                        className="shrink-0 rounded-full border px-1.5 text-[9px] uppercase tracking-widest"
                        style={{ borderColor: COMPOUND_COLOR[o.compound] ?? "var(--border)", color: COMPOUND_COLOR[o.compound] ?? undefined }}
                      >
                        {o.compound.slice(0, 1)}
                        {o.tyreAge}
                      </span>
                    )}
                    {o.pitting && <Wrench className="h-3 w-3 shrink-0 text-accent" />}
                    <span className="w-14 shrink-0 text-right font-timing tabular-nums text-xs text-muted-foreground">
                      {o.retired ? "DNF" : o.position === 1 ? "Leader" : `+${o.gapSec.toFixed(1)}`}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Panel title="Tyre state">
          <ul className="space-y-2">
            {state.order.filter((o) => !o.retired).slice(0, 6).map((o) => {
              const d = driversById[o.driverId];
              return (
                <li key={o.driverId} className="min-w-0">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate">{d?.lastName ?? o.driverId}</span>
                    <span className="font-timing tabular-nums text-muted-foreground">{o.tyreLifePct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-surface overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${o.tyreLifePct}%`, background: COMPOUND_COLOR[o.compound] ?? "var(--accent)" }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Pit window">
          <div className="font-timing tabular-nums text-3xl">
            {model.pitStops.filter((p) => p.lap <= lapIndex).length}
            <span className="text-sm text-muted-foreground"> stops</span>
          </div>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {model.pitStops
              .filter((p) => p.lap <= lapIndex)
              .slice(-4)
              .reverse()
              .map((p, i) => (
                <li key={`${p.driverId}-${p.stop}-${i}`} className="flex justify-between gap-2">
                  <span className="truncate">L{p.lap} {driversById[p.driverId]?.lastName ?? p.driverId}</span>
                  <span className="font-timing tabular-nums">{p.duration.toFixed(2)}s</span>
                </li>
              ))}
            {!model.pitStops.some((p) => p.lap <= lapIndex) && <li>No stops yet.</li>}
          </ul>
        </Panel>

        <Panel title="Conditions">
          {wx ? (
            <div className="space-y-2 text-xs">
              <div className="font-display text-2xl">{wx.label}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Thermometer className="h-3 w-3" /> Air {wx.airTempC}°C · Track {wx.trackTempC}°C</div>
              <div className="flex items-center gap-2 text-muted-foreground"><CloudRain className="h-3 w-3" /> Rain {wx.rainChance}% · Humidity {wx.humidity}%</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Wind className="h-3 w-3" /> Wind {wx.windKph} km/h</div>
              {wx.dryLine && <div className="text-accent">Dry line forming</div>}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Conditions unavailable for this race.</p>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Race control feed">
          <ul className="space-y-2">
            {feed.map((e) => (
              <li key={e.id} className="flex min-w-0 gap-2 text-xs">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: EVENT_STYLE[e.kind].color }} />
                <div className="min-w-0">
                  <div className="uppercase tracking-widest text-[10px] text-muted-foreground">L{e.lap ?? 1} · {EVENT_STYLE[e.kind].label}</div>
                  <div className="truncate">{e.message || e.title}</div>
                </div>
              </li>
            ))}
            {!feed.length && <li className="text-xs text-muted-foreground">Awaiting race control.</li>}
          </ul>
        </Panel>

        <Panel title="Points projection">
          <ul className="space-y-1">
            {state.order.filter((o) => !o.retired && o.position <= 10).map((o) => {
              const d = driversById[o.driverId];
              return (
                <li key={o.driverId} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate">P{o.position} {d?.lastName ?? o.driverId}</span>
                  <span className="font-timing tabular-nums text-accent-glow">+{state.driverPoints[o.driverId] ?? 0}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            <Gauge className="h-3 w-3" /> {state.safetyCars} SC/VSC · {state.redFlags} red
          </div>
        </Panel>
      </div>
    </section>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 glass rounded-2xl p-5">
      <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
